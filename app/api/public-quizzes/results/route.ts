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

// Schema for fetching attempt results
const resultsSchema = z.object({
  attemptId: z.string().cuid("Invalid attempt ID")
});

/**
 * POST handler for fetching results of a public quiz attempt
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
    const validation = resultsSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Invalid data", validation.error.format());
    }
    
    const { attemptId } = validation.data;
    
    // Find the quiz attempt
    const attempt = await db.quizAttempt.findUnique({
      where: {
        id: attemptId,
        userId: session.user.id // Ensure the attempt belongs to the current user
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            showResults: true,
            passingScore: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        answers: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        }
      }
    });
    
    if (!attempt) {
      return createErrorResponse("NOT_FOUND", "Attempt not found or you don't have permission to view it");
    }
    
    // Check if the quiz allows showing results
    if (!attempt.quiz.showResults) {
      // If results are not to be shown, return limited information
      return createSuccessResponse({
        attemptId: attempt.id,
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt,
        passingScore: attempt.quiz.passingScore,
        quiz: {
          id: attempt.quiz.id,
          title: attempt.quiz.title,
          author: attempt.quiz.author
        },
        message: "Detailed results are not available for this quiz"
      });
    }
    
    // Process the answers to include question and correct option details
    const processedAnswers = attempt.answers.map(answer => {
      const { question, ...answerData } = answer;
      
      // Get the correct options for this question
      const correctOptions = question.options
        .filter(o => o.isCorrect)
        .map(o => ({
          id: o.id,
          content: o.content,
          ...(o.matchId && { matchId: o.matchId }),
          ...(o.position && { position: o.position })
        }));
      
      // Get the selected option details (if any)
      let selectedOptionDetails = null;
      if (answer.selectedOption) {
        const option = question.options.find(o => o.id === answer.selectedOption);
        if (option) {
          selectedOptionDetails = {
            id: option.id,
            content: option.content
          };
        }
      }
      
      return {
        ...answerData,
        question: {
          id: question.id,
          content: question.content,
          type: question.type,
          points: question.points,
          explanation: question.explanation
        },
        correctOptions,
        selectedOptionDetails
      };
    });
    
    // Determine if the user passed (if there's a passing score)
    let passed = null;
    if (attempt.quiz.passingScore !== null && attempt.score !== null) {
      passed = attempt.score >= attempt.quiz.passingScore;
    }
    
    return createSuccessResponse({
      attemptId: attempt.id,
      score: attempt.score,
      passed,
      passingScore: attempt.quiz.passingScore,
      timeSpent: attempt.timeSpent,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        author: attempt.quiz.author
      },
      answers: processedAnswers
    });
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to fetch quiz results"));
  }
} 