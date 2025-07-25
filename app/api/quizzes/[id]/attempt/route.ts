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
import { QuestionType } from "@prisma/client";

/**
 * POST handler for creating an attempt for a quiz
 * Required authentication: Yes - All users must be logged in
 * Permission: Student must have access to the quiz
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
    
    const awaitedParams = await params; // Await params
    const quizId = awaitedParams.id;
    const userId = session.user.id;
    
    // Find the quiz by ID with appropriate access checks
    const quiz = await db.quiz.findFirst({
      where: { 
        id: quizId,
        OR: [
          // Quiz is public
          { isPublic: true },
          // Quiz is in a class where user is enrolled
          {
            class: {
              students: {
                some: {
                  studentId: userId
                }
              }
            }
          }
        ],
        isPublished: true,
        isActive: true
      },
      include: {
        questions: {
          select: {
            id: true,
            content: true,
            type: true,
            points: true,
            order: true,
            mediaType: true,
            mediaUrl: true,
            explanation: true,
            options: {
              select: {
                id: true,
                content: true,
                order: true,
                // Don't expose isCorrect to prevent cheating
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    if (!quiz) {
      return createNotFoundError("Quiz not found or you don't have access to it");
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
          userId: userId
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
        userId: userId,
        completedAt: null
      }
    });
    
    if (incompleteAttempt) {
      // Return existing attempt with quiz data
      return createSuccessResponse({
        message: "You have an existing incomplete attempt",
        data: {
          attemptId: incompleteAttempt.id,
          quiz: transformQuizForAttempt(quiz)
        }
      });
    }
    
    // Create a new attempt
    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: userId,
        startedAt: now,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      }
    });
    
    return createSuccessResponse({
      message: "Quiz attempt created successfully",
      data: {
        attemptId: attempt.id,
        quiz: transformQuizForAttempt(quiz)
      }
    });
  } catch (error) {
    console.error("Error creating quiz attempt:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to create quiz attempt"));
  }
}

/**
 * Transform quiz data to appropriate format for attempt
 */
function transformQuizForAttempt(quiz: any) {
  let questions = [...quiz.questions];
  
  // Shuffle questions if enabled
  if (quiz.shuffleQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }
  
  // Shuffle options for applicable question types
  if (quiz.shuffleOptions) {
    questions = questions.map(question => {
      if (
        question.type !== QuestionType.FILL_BLANK && 
        question.type !== QuestionType.MATCHING &&
        question.options
      ) {
        return {
          ...question,
          options: [...question.options].sort(() => Math.random() - 0.5)
        };
      }
      return question;
    });
  }
  
  // Return transformed quiz data
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    timeLimit: quiz.timeLimit,
    passingScore: quiz.passingScore,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    questions
  };
} 