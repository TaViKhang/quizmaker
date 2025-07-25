import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createNotFoundError,
  createServerError,
  formatZodError
} from "@/lib/api-response";
import { headers } from "next/headers";
import { QuestionType } from "@prisma/client";

interface Answer {
  questionId: string;
  selectedOption?: string;
  textAnswer?: string;
}

interface ProcessedAnswer {
  questionId: string;
  selectedOption: string | undefined;
  textAnswer: string | undefined;
  isCorrect: boolean | null;
  score: number | null;
}

interface FillBlankAnswer {
  [key: string]: string;
}

// Định nghĩa kiểu cho option
interface QuestionOption {
  id: string;
  isCorrect: boolean;
}

// Schema for submit answer request
const submitAnswerSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().cuid("Invalid question ID"),
      selectedOptionId: z.string().optional(),
      textAnswer: z.string().optional(),
    })
  ),
  timeSpent: z.number().int().min(0).optional(),
  userAgent: z.string().optional(),
});

/**
 * POST handler for submitting answers to a public quiz by its access code
 * Required authentication: Yes - All users must be logged in
 * Permission: Any authenticated user can submit answers to public quizzes
 */
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const publicAccessCode = params.code;
    const userId = session.user.id;
    
    // Find the quiz by its public access code
    const quiz = await db.quiz.findUnique({
      where: { 
        publicAccessCode,
        isPublic: true, // Ensure it's a public quiz
        isPublished: true, // Ensure it's published
        isActive: true // Ensure it's active
      },
      include: {
        questions: {
          select: {
            id: true,
            type: true,
            points: true,
            options: {
              select: {
                id: true,
                isCorrect: true
              }
            }
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
    
    // Check if user has reached max attempts
    if (quiz.maxAttempts) {
      const attemptCount = await db.quizAttempt.count({
        where: {
          quizId: quiz.id,
          userId
        }
      });
      
      if (attemptCount >= quiz.maxAttempts) {
        return createErrorResponse(
          "MAX_ATTEMPTS_REACHED",
          "You have reached the maximum number of attempts for this quiz"
        );
      }
    }
    
    // Validate the submission data
    const body = await request.json();
    const validationResult = submitAnswerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid submission data",
        formatZodError(validationResult.error)
      );
    }
    
    const submissionData = validationResult.data;
    
    // Create an attempt
    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId,
        completedAt: new Date(),
        timeSpent: submissionData.timeSpent,
        userAgent: submissionData.userAgent,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      }
    });
    
    // Process each answer and calculate score
    let totalScore = 0;
    let totalPoints = 0;
    
    // Map of questionId to questionDetails for easy lookup
    const questionMap = new Map();
    quiz.questions.forEach(q => {
      questionMap.set(q.id, q);
      totalPoints += q.points || 1; // Default to 1 point if not specified
    });
    
    // Process and store each answer
    const answerPromises = submissionData.answers.map(async (answer) => {
      // Skip if question doesn't exist in this quiz
      if (!questionMap.has(answer.questionId)) {
        return null;
      }
      
      const question = questionMap.get(answer.questionId);
      let isCorrect: boolean | null = false;
      let score: number | null = 0;
      
      // Calculate score based on question type
      switch (question.type) {
        case "MULTIPLE_CHOICE":
        case "TRUE_FALSE":
          // For multiple choice, check if selected option is correct
          if (answer.selectedOptionId) {
            const correctOption = question.options.find(
              (opt: QuestionOption) => opt.id === answer.selectedOptionId && opt.isCorrect
            );
            isCorrect = !!correctOption;
            score = isCorrect ? (question.points || 1) : 0;
          }
          break;
          
        case "SHORT_ANSWER":
        case "FILL_BLANK":
          // For these types, teachers will need to review manually
          // For now, mark as pending review
          isCorrect = null;
          score = null;
          break;
          
        case "ESSAY":
        case "CODE":
        case "FILE_UPLOAD":
          // These require manual grading
          isCorrect = null;
          score = null;
          break;
          
        case "MATCHING":
          // For matching, check if all matchIds are correct
          // This would need more complex logic depending on how matching is implemented
          // For now, mark as pending review
          isCorrect = null;
          score = null;
          break;
          
        default:
          isCorrect = null;
          score = null;
      }
      
      // If score is calculated, add to total
      if (score !== null) {
        totalScore += score;
      }
      
      // Save the answer
      return db.answer.create({
        data: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOption: answer.selectedOptionId,
          textAnswer: answer.textAnswer,
          isCorrect,
          score
        }
      });
    });
    
    await Promise.all(answerPromises);
    
    // Calculate percentage score
    let percentageScore = null;
    if (totalPoints > 0) {
      percentageScore = (totalScore / totalPoints) * 100;
    }
    
    // Update the attempt with the calculated score
    const updatedAttempt = await db.quizAttempt.update({
      where: { id: attempt.id },
      data: { score: percentageScore },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            showResults: true
          }
        }
      }
    });
    
    // Determine if the student passed
    const isPassed = quiz.passingScore !== null && percentageScore !== null 
      ? percentageScore >= quiz.passingScore 
      : null;
    
    // Only return the score if showResults is true
    const responseData = {
      attemptId: updatedAttempt.id,
      quizId: quiz.id,
      title: updatedAttempt.quiz.title,
      showResults: updatedAttempt.quiz.showResults,
      ...(updatedAttempt.quiz.showResults && {
        score: percentageScore,
        isPassed,
        passingScore: quiz.passingScore
      })
    };
    
    return createSuccessResponse(responseData);
    
  } catch (error) {
    console.error("Error submitting public quiz answers:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 