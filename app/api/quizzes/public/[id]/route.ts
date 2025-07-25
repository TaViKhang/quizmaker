import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { QuestionType } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";

/**
 * GET handler for accessing a public quiz directly by its ID
 * Required authentication: Yes - All users must be logged in
 * Permission: Any authenticated user can access public quizzes
 */
export async function GET(
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
        isPublic: true, // Ensure it's a public quiz
        isPublished: true, // Ensure it's published
        isActive: true // Ensure it's active
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            content: true,
            type: true,
            points: true,
            order: true,
            mediaUrl: true,
            mediaType: true,
            category: true,
            options: {
              select: {
                id: true,
                content: true,
                order: true,
                matchId: true,
                group: true,
                position: true,
                // Don't include isCorrect for security
              },
              orderBy: { order: 'asc' },
            }
          }
        },
        _count: {
          select: {
            questions: true,
          }
        },
        attempts: {
          where: {
            userId: session.user.id
          },
          orderBy: {
            startedAt: 'desc'
          },
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
            score: true,
            timeSpent: true,
          },
          take: 5 // Only return the most recent 5 attempts
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
    
    // Get attempt count for the quiz
    const attemptCount = await db.quizAttempt.count({
      where: {
        quizId: quiz.id,
        userId: session.user.id
      }
    });
    
    // Check if student has remaining attempts
    if (quiz.maxAttempts && attemptCount >= quiz.maxAttempts) {
      return createErrorResponse(
        "MAX_ATTEMPTS_REACHED",
        "You have reached the maximum number of attempts for this quiz"
      );
    }
    
    // If shuffleQuestions is true, randomize the questions order
    let finalQuizData = { ...quiz };
    
    if (quiz.shuffleQuestions && quiz.questions) {
      const shuffledQuestions = [...quiz.questions].sort(() => Math.random() - 0.5);
      
      // For each question, randomize options if appropriate for the question type
      const questionsWithShuffledOptions = shuffledQuestions.map(question => {
        // Don't shuffle options for certain question types where order matters
        if (
          question.type !== QuestionType.FILL_BLANK && 
          question.type !== QuestionType.MATCHING
        ) {
          return {
            ...question,
            options: [...question.options].sort(() => Math.random() - 0.5)
          };
        }
        return question;
      });
      
      finalQuizData = {
        ...finalQuizData,
        questions: questionsWithShuffledOptions
      };
    }
    
    // Add additional properties to the response
    const enrichedQuizData = {
      ...finalQuizData,
      userAttemptCount: attemptCount,
      attemptsRemaining: finalQuizData.maxAttempts 
        ? Math.max(0, finalQuizData.maxAttempts - attemptCount)
        : null
    };
    
    return createSuccessResponse(enrichedQuizData);
    
  } catch (error) {
    console.error("Error fetching public quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 