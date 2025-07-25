import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";

/**
 * POST handler for creating an attempt for a public quiz
 * Required authentication: Yes - All users must be logged in
 * Permission: Any authenticated user can attempt public quizzes
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const quizId = params.id;
    
    // Find the quiz by ID
    const quiz = await db.quiz.findFirst({
      where: { 
        id: quizId,
        isPublic: true,
        isPublished: true,
        isActive: true
      },
      include: {
        questions: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (!quiz) {
      return createNotFoundError("Quiz not found or not available");
    }
    
    // Check if quiz is within the available time frame
    const now = new Date();
    if (
      (quiz.startDate && new Date(quiz.startDate) > now) ||
      (quiz.endDate && new Date(quiz.endDate) < now)
    ) {
      return createErrorResponse(
        "QUIZ_NOT_AVAILABLE",
        "This quiz is not available at this time"
      );
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
        return createErrorResponse(
          "MAX_ATTEMPTS_REACHED",
          "You have reached the maximum number of attempts for this quiz"
        );
      }
    }
    
    // Check if user has an incomplete attempt for this quiz
    const incompleteAttempt = await db.quizAttempt.findFirst({
      where: {
        quizId: quiz.id,
        userId: session.user.id,
        completedAt: null
      }
    });
    
    if (incompleteAttempt) {
      // Return the existing incomplete attempt
      return createSuccessResponse({
        message: "You have an existing incomplete attempt",
        attempt: incompleteAttempt
      });
    }
    
    // Create a new attempt
    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: session.user.id,
        startedAt: now,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      }
    });
    
    return createSuccessResponse({
      message: "Quiz attempt created successfully",
      attempt
    });
  } catch (error) {
    console.error("Error creating quiz attempt:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to create quiz attempt"));
  }
} 