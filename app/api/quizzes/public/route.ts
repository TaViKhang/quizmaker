import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma, QuestionType } from "@prisma/client";
import { 
  createPaginatedResponse, 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createServerError,
  formatZodError
} from "@/lib/api-response";

/**
 * Schema for public quiz query parameters
 */
const publicQuizQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Parse URL search parameters for public quiz endpoints
 */
function parsePublicQuizQueryParams(searchParams: URLSearchParams) {
  return {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
    search: searchParams.get("search") || undefined,
    category: searchParams.get("category") || undefined,
    tags: searchParams.get("tags") ? searchParams.get("tags")!.split(",") : undefined,
    sortBy: (searchParams.get("sortBy") || "createdAt") as 'createdAt' | 'updatedAt' | 'title',
    sortOrder: (searchParams.get("sortOrder") || "desc") as 'asc' | 'desc',
  };
}

/**
 * GET handler for fetching public quizzes
 * This endpoint does not require authentication
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = parsePublicQuizQueryParams(searchParams);
    
    // Validate query parameters
    const validationResult = publicQuizQuerySchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        formatZodError(validationResult.error)
      );
    }
    
    // Build the where clause for public quizzes
    let where: Prisma.QuizWhereInput = {
      isPublic: true,
      isPublished: true,
      isActive: true,
    };
    
    // Apply search filter if provided
    if (queryParams.search) {
      where.OR = [
        { title: { contains: queryParams.search, mode: "insensitive" } },
        { description: { contains: queryParams.search, mode: "insensitive" } },
        { category: { contains: queryParams.search, mode: "insensitive" } },
      ];
    }
    
    // Apply category filter if provided
    if (queryParams.category) {
      where.category = queryParams.category;
    }
    
    // Apply tags filter if provided
    if (queryParams.tags && queryParams.tags.length > 0) {
      where.tags = {
        hasSome: queryParams.tags
      };
    }
    
    // Check if quiz is within the available time frame
    const now = new Date();
    where.OR = [
      {
        startDate: null,
        endDate: null
      },
      {
        startDate: null,
        endDate: { gte: now }
      },
      {
        startDate: { lte: now },
        endDate: null
      },
      {
        startDate: { lte: now },
        endDate: { gte: now }
      }
    ];
    
    // Calculate pagination parameters
    const offset = (queryParams.page - 1) * queryParams.limit;
    
    // Build the orderBy clause
    const orderBy: Prisma.QuizOrderByWithRelationInput = {
      [queryParams.sortBy]: queryParams.sortOrder,
    };
    
    // Count total quizzes for pagination
    const total = await db.quiz.count({ where });
    
    // Fetch public quizzes with pagination
    const publicQuizzes = await db.quiz.findMany({
      where,
      orderBy,
      skip: offset,
      take: queryParams.limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        timeLimit: true,
        maxAttempts: true,
        passingScore: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          }
        }
      },
    });
    
    // Transform the quiz objects for API response
    const formattedQuizzes = publicQuizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      tags: quiz.tags,
      timeLimit: quiz.timeLimit,
      maxAttempts: quiz.maxAttempts,
      passingScore: quiz.passingScore,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      author: {
        id: quiz.author.id,
        name: quiz.author.name,
        image: quiz.author.image,
      },
      questionsCount: quiz._count.questions,
      attemptsCount: quiz._count.attempts,
    }));
    
    // Return paginated response
    return createPaginatedResponse(
      formattedQuizzes,
      total,
      queryParams.page,
      queryParams.limit,
      {
        filters: {
          search: queryParams.search,
          category: queryParams.category,
          tags: queryParams.tags,
        }
      }
    );
    
  } catch (error) {
    console.error("Error fetching public quizzes:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 