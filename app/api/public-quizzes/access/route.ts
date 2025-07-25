import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createServerError
} from "@/lib/api-response";

// Schema for accessing a public quiz
const accessQuizSchema = z.union([
  z.object({
    accessCode: z.string().min(1, "Access code is required")
  }),
  z.object({
    code: z.string().min(1, "Access code is required")
  })
]);

/**
 * POST handler for accessing a public quiz using an access code
 * This endpoint requires authentication
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const data = await request.json();
    
    // Validate request data
    const validation = accessQuizSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Invalid data", validation.error.format());
    }
    
    // Extract access code from either field
    const accessCode = 'accessCode' in validation.data 
      ? validation.data.accessCode 
      : validation.data.code;
    
    // Check if the quiz exists
    const quiz = await db.quiz.findFirst({
      where: {
        publicAccessCode: accessCode,
        isPublic: true,
        isActive: true,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimit: true,
        shuffleQuestions: true,
        showResults: true,
        startDate: true,
        endDate: true,
        maxAttempts: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            questions: true
          }
        }
      }
    });
    
    if (!quiz) {
      return createErrorResponse("NOT_FOUND", "Quiz not found or access code is invalid");
    }
    
    // Check if the quiz is within its available date range
    const now = new Date();
    
    if (quiz.startDate && new Date(quiz.startDate) > now) {
      return createErrorResponse("FORBIDDEN", "This quiz is not yet available");
    }
    
    if (quiz.endDate && new Date(quiz.endDate) < now) {
      return createErrorResponse("FORBIDDEN", "This quiz is no longer available");
    }
    
    // Check if user has reached the maximum number of attempts
    if (quiz.maxAttempts) {
      const attemptCount = await db.quizAttempt.count({
        where: {
          quizId: quiz.id,
          userId: session.user.id
        }
      });
      
      if (attemptCount >= quiz.maxAttempts) {
        return createErrorResponse("FORBIDDEN", "You have reached the maximum number of attempts for this quiz");
      }
    }
    
    return createSuccessResponse({
      quiz
    });
  } catch (error) {
    console.error("Error accessing public quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to access quiz"));
  }
} 