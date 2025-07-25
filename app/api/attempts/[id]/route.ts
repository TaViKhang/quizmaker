import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttemptService } from "../../services/attempt-service";
import { 
  errorResponse, 
  handleZodError, 
  notFoundResponse,
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "../../utils/api-response";
import { UpdateAttemptSchema } from "../../schemas/attempt-schemas";
import { API_MESSAGES } from "../../utils/api-types";
import { QuestionType } from "@prisma/client";

const attemptService = new AttemptService();

// Define interfaces for our response objects
interface ProcessedAnswer {
  id: string;
  questionId: string;
  isCorrect?: boolean | null;
  score?: number | null;
  feedback?: string | null;
  selectedOption?: string | null;
  selectedOptions?: string[];
  textAnswer?: string | null;
  jsonData?: any;
}

interface ProcessedQuestion {
  id: string;
  content: string;
  type: QuestionType;
  points: number;
  order: number;
  explanation?: string | null;
  metadata?: any;
  options: any[];
  answer: ProcessedAnswer | null;
}

interface AttemptStats {
  totalQuestions: number;
  answeredQuestions: number;
  gradedQuestions: number;
  pendingGrading: number;
  totalPoints: number | null;
  earnedPoints: number | null;
  scorePercentage: number | null;
}

interface QuizInfo {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number | null;
  showResults: boolean;
  allowReview: boolean;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  class: {
    id: string;
    name: string;
  } | null;
  totalQuestions: number;
  totalPoints: number;
}

interface AttemptResponse {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  timeSpent: number | null;
  score: number | null;
  calculatedScore: number | null;
  isPassed: boolean | null;
  quiz: QuizInfo;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  questions: ProcessedQuestion[];
  stats: AttemptStats;
}

/**
 * GET /api/attempts/[id]
 * Get details of a specific quiz attempt
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const attemptId = params.id;
    
    // Get the user role to determine access level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    // Fetch the attempt with related data
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: {
                  select: {
                    id: true,
                    content: true,
                    order: true,
                    group: true,
                    position: true,
                    // Only include isCorrect if the attempt is completed or user is teacher
                    ...(user.role === "TEACHER" ? { isCorrect: true } : {})
                  }
                }
              },
              orderBy: {
                order: 'asc'
              }
            },
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            class: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        answers: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Attempt not found" },
        { status: 404 }
      );
    }

    // Check if the user has access to this attempt
    const isOwner = attempt.userId === userId;
    const isTeacher = user.role === "TEACHER" && attempt.quiz.authorId === userId;
    
    if (!isOwner && !isTeacher) {
      return NextResponse.json(
        { success: false, message: "You don't have access to this attempt" },
        { status: 403 }
      );
    }
    
    // Process the attempt data based on access level
    const processedQuestions = attempt.quiz.questions.map(question => {
      // Find the answer for this question
      const answer = attempt.answers.find(a => a.questionId === question.id);
      
      // Process answer data based on question type
      let processedAnswer: ProcessedAnswer | null = null;
      if (answer) {
        const answerData: ProcessedAnswer = {
          id: answer.id,
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          score: answer.score,
          feedback: answer.feedback
        };
        
        // Process different answer types
        switch (question.type) {
          case QuestionType.MULTIPLE_CHOICE:
          case QuestionType.TRUE_FALSE:
            answerData.selectedOption = answer.selectedOption;
            // Handle multiple selections stored in textAnswer
            if (answer.textAnswer && answer.textAnswer.startsWith('[')) {
              try {
                const additionalOptions = JSON.parse(answer.textAnswer);
                if (Array.isArray(additionalOptions)) {
                  answerData.selectedOptions = additionalOptions;
                  if (answer.selectedOption && !additionalOptions.includes(answer.selectedOption)) {
                    answerData.selectedOptions.unshift(answer.selectedOption);
                  }
                }
              } catch (e) {
                console.error("Error parsing multiple choice options:", e);
              }
            } else if (answer.selectedOption) {
              answerData.selectedOptions = [answer.selectedOption];
            } else {
              answerData.selectedOptions = [];
            }
            break;
            
          case QuestionType.SHORT_ANSWER:
          case QuestionType.ESSAY:
            answerData.textAnswer = answer.textAnswer;
            break;
            
          case QuestionType.MATCHING:
          case QuestionType.FILL_BLANK:
          case QuestionType.CODE:
            answerData.textAnswer = answer.textAnswer;
            if (answer.textAnswer) {
              try {
                answerData.jsonData = JSON.parse(answer.textAnswer);
              } catch (e) {
                console.error(`Error parsing ${question.type} answer:`, e);
              }
            }
            break;
        }
        
        processedAnswer = answerData;
      }
      
      // Return question with processed answer
      return {
        id: question.id,
        content: question.content,
        type: question.type,
        points: question.points,
        order: question.order,
        explanation: isOwner && attempt.completedAt ? question.explanation : undefined,
        metadata: question.metadata,
        options: question.options,
        answer: processedAnswer
      } as ProcessedQuestion;
    });
    
    // Calculate total score and percentage
    let totalPoints = 0;
    let earnedPoints = 0;
    let gradedQuestions = 0;
    let pendingGrading = 0;
    
    attempt.answers.forEach(answer => {
      const question = attempt.quiz.questions.find(q => q.id === answer.questionId);
      if (question) {
        const points = question.points || 1;
        totalPoints += points;
        
        if (answer.score !== null) {
          earnedPoints += answer.score;
          gradedQuestions++;
        } else {
          pendingGrading++;
        }
      }
    });
    
    const scorePercentage = totalPoints > 0 
      ? Math.round((earnedPoints / totalPoints) * 100) 
      : null;
    
    // Determine if the attempt is passed based on quiz passing score
    const isPassed = attempt.quiz.passingScore && scorePercentage !== null
      ? scorePercentage >= attempt.quiz.passingScore 
      : null;
    
    // Check if allowReview exists on the quiz object, default to true if not
    const allowReview = typeof (attempt.quiz as any).allowReview === 'boolean' 
      ? (attempt.quiz as any).allowReview 
      : true;
    
    // Format the response
    const response: AttemptResponse = {
      id: attempt.id,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
      score: attempt.score,
      calculatedScore: scorePercentage,
      isPassed,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        timeLimit: attempt.quiz.timeLimit,
        passingScore: attempt.quiz.passingScore,
        showResults: attempt.quiz.showResults,
        allowReview: allowReview,
        author: attempt.quiz.author,
        class: attempt.quiz.class,
        totalQuestions: attempt.quiz.questions.length,
        totalPoints
      },
      user: attempt.user,
      questions: processedQuestions,
      stats: {
        totalQuestions: attempt.quiz.questions.length,
        answeredQuestions: attempt.answers.length,
        gradedQuestions,
        pendingGrading,
        totalPoints,
        earnedPoints,
        scorePercentage
      }
    };
    
    // If the attempt is not completed and user is the owner, don't show correct answers
    if (!attempt.completedAt && isOwner) {
      response.questions = response.questions.map(q => ({
        ...q,
        explanation: undefined,
        answer: q.answer ? {
          ...q.answer,
          isCorrect: undefined,
          score: undefined,
          feedback: undefined
        } : null
      }));
    }
    
    // If the quiz doesn't show results and user is the owner, don't show scores
    if (!attempt.quiz.showResults && isOwner && !isTeacher) {
      response.score = null;
      response.calculatedScore = null;
      response.isPassed = null;
      response.stats = {
        totalQuestions: response.stats.totalQuestions,
        answeredQuestions: response.stats.answeredQuestions,
        pendingGrading: response.stats.pendingGrading,
        gradedQuestions: response.stats.gradedQuestions,
        totalPoints: null,
        earnedPoints: null,
        scorePercentage: null
      };
      
      response.questions = response.questions.map(q => ({
        ...q,
        explanation: undefined,
        answer: q.answer ? {
          ...q.answer,
          isCorrect: undefined,
          score: undefined,
          feedback: undefined
        } : null
      }));
    }

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("[API] Error getting attempt:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get attempt" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/attempts/[id]
 * Update an attempt
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Get attempt to check ownership
    const attempt = await attemptService.getAttemptById(params.id);
    
    if (!attempt) {
      return notFoundResponse("Attempt not found");
    }
    
    // Only allow the owner or a teacher to update the attempt
    const isOwner = attempt.userId === session.user.id;
    const isTeacher = session.user.role === "TEACHER";
    
    if (!isOwner && !isTeacher) {
      return errorResponse("You don't have permission to update this attempt", { 
        status: 403,
        code: "FORBIDDEN"
      });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = UpdateAttemptSchema.safeParse(body);
    
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Update attempt
    const updatedAttempt = await attemptService.updateAttempt(params.id, validationResult.data);

    return successResponse(updatedAttempt);
  } catch (error: any) {
    console.error("Error updating attempt:", error);
    
    if (error.name === "ZodError") {
      return handleZodError(error);
    }
    
    return serverErrorResponse("Failed to update attempt");
  }
}

/**
 * DELETE /api/attempts/[id]
 * Delete an attempt
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Get attempt to check ownership
    const attempt = await attemptService.getAttemptById(params.id);
    
    if (!attempt) {
      return notFoundResponse("Attempt not found");
    }
    
    // Only allow a teacher to delete attempts
    const isTeacher = session.user.role === "TEACHER";
    
    if (!isTeacher) {
      return errorResponse("Only teachers can delete attempts", { 
        status: 403,
        code: "FORBIDDEN" 
      });
    }

    // Delete attempt
    await prisma.quizAttempt.delete({
      where: { id: params.id },
    });

    return successResponse({ message: "Attempt deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting attempt:", error);
    return serverErrorResponse("Failed to delete attempt");
  }
} 