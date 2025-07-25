import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, Prisma } from "@prisma/client";
import { 
  createPaginatedResponse, 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createServerError
} from "@/lib/api-response";

// Schema for query parameters
const queryParamsSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest", "popularity"]).optional().default("newest"),
});

/**
 * GET handler for fetching public quizzes
 * This endpoint requires authentication
 */
export async function GET(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const validation = queryParamsSchema.safeParse(Object.fromEntries(searchParams));
    if (!validation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Invalid query parameters", validation.error.format());
    }
    
    const { page, limit, category, search, sort } = validation.data;
    const skip = (page - 1) * limit;

    // Base query - only public quizzes that are active and published
    const baseQuery = {
      where: {
        isPublic: true,
        isActive: true,
        isPublished: true,
        ...(category && { category }),
        ...(search && {
          OR: [
            { 
              title: { 
                contains: search, 
                mode: "insensitive" 
              } 
            },
            { 
              description: { 
                contains: search, 
                mode: "insensitive" 
              } 
            },
            { 
              tags: { 
                has: search 
              } 
            }
          ]
        })
      },
      skip,
      take: limit,
      orderBy: sort === "newest" 
        ? { createdAt: "desc" as const } 
        : sort === "oldest" 
          ? { createdAt: "asc" as const } 
          : { attempts: { _count: "desc" as const } },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        publicAccessCode: true,
        timeLimit: true,
        shuffleQuestions: true,
        showResults: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      }
    } satisfies Prisma.QuizFindManyArgs;

    // Get the quizzes and total count
    const [quizzes, totalCount] = await Promise.all([
      db.quiz.findMany(baseQuery),
      db.quiz.count({ where: baseQuery.where })
    ]);

    // Transform the quiz objects for API response
    const formattedQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      tags: quiz.tags,
      timeLimit: quiz.timeLimit,
      maxAttempts: quiz._count.attempts,
      passingScore: null,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      author: quiz.author,
      questionsCount: quiz._count.questions,
      attemptsCount: quiz._count.attempts,
    }));

    return createPaginatedResponse(
      formattedQuizzes,
      totalCount,
        page,
        limit,
      {
        hasMore: skip + quizzes.length < totalCount,
        message: "Quizzes retrieved successfully"
      }
    );
  } catch (error) {
    console.error("Error fetching public quizzes:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to fetch public quizzes"));
  }
}

/**
 * POST handler for making a quiz public
 * Only accessible to quiz owners (teachers)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can make quizzes public
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can make quizzes public");
    }

    const data = await request.json();
    
    // Schema validation for making a quiz public
    const makePublicSchema = z.object({
      quizId: z.string().cuid("Invalid quiz ID"),
      isPublic: z.boolean().default(true)
    });
    
    // Validate data
    const validation = makePublicSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Invalid data", validation.error.format());
    }
    
    const { quizId, isPublic } = validation.data;
    
    // Check if the quiz exists and belongs to the current user
    const quiz = await db.quiz.findUnique({
      where: {
        id: quizId,
        authorId: session.user.id
      }
    });
    
    if (!quiz) {
      return createErrorResponse("NOT_FOUND", "Quiz not found or you don't have permission to modify it");
    }
    
    // Generate a unique access code if making public
    let publicAccessCode = null;
    if (isPublic) {
      // Generate a random 8-character alphanumeric code
      publicAccessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Make sure it's unique
      const existingQuiz = await db.quiz.findUnique({
        where: { publicAccessCode }
      });
      
      if (existingQuiz) {
        // If code already exists, generate a new one (unlikely but possible)
        publicAccessCode = Math.random().toString(36).substring(2, 10).toUpperCase() + 
                          Math.random().toString(36).substring(2, 4).toUpperCase();
      }
    }
    
    // Update the quiz
    const updatedQuiz = await db.quiz.update({
      where: { id: quizId },
      data: {
        isPublic,
        publicAccessCode: isPublic ? publicAccessCode : null
      },
      select: {
        id: true,
        title: true,
        isPublic: true,
        publicAccessCode: true
      }
    });
    
    // Log the activity
    await db.activityLog.create({
      data: {
        action: isPublic ? "QUIZ_MADE_PUBLIC" : "QUIZ_MADE_PRIVATE",
        resourceId: quizId,
        resourceType: "QUIZ",
        userId: session.user.id,
        details: { publicAccessCode }
      }
    });
    
    return createSuccessResponse(updatedQuiz);
  } catch (error) {
    console.error("Error making quiz public:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to update quiz visibility"));
  }
}

function formatZodError(error: z.ZodError) {
  return error.format();
} 