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
import { normalizeMetadata } from "@/lib/utils";

// Schema for answer submission
const answerSchema = z.object({
  questionId: z.string(),
  selectedOptions: z.array(z.string()).optional(),
  textAnswer: z.string().optional(),
  jsonData: z.record(z.string()).optional().nullable(), // Added for MATCHING and other complex types
});

// Schema for quiz attempt submission
const submitAttemptSchema = z.object({
  attemptId: z.string(),
  answers: z.array(answerSchema)
});

// Định nghĩa interface để tránh lỗi type
interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
  [key: string]: any;
}

interface Question {
  id: string;
  type: string;
  points?: number;
  metadata?: any;
  options: QuestionOption[];
  [key: string]: any;
}

/**
 * POST handler for submitting a quiz attempt
 * Required authentication: Yes - User must be logged in
 * Permission: User must have created the attempt
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
    const userId = session.user.id;
    
    // Validate submission data
    const body = await request.json();
    const validationResult = submitAttemptSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid submission data",
        formatZodError(validationResult.error)
      );
    }
    
    const { attemptId, answers } = validationResult.data;
    
    // Find the attempt and verify it belongs to the current user
    const attempt = await db.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: userId,
        quizId: quizId,
        completedAt: null // Must be incomplete
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true
              }
            }
          }
        }
      }
    });
    
    if (!attempt) {
      return createNotFoundError("Attempt not found or already completed");
    }
    
    // Calculate time spent
    const now = new Date();
    const startedAt = attempt.startedAt || now;
    const timeSpent = Math.round((now.getTime() - startedAt.getTime()) / 1000); // in seconds
    
    // Process answers and calculate score
    let totalScore = 0;
    let totalPoints = 0;
    
    // Map of questionId to questionDetails for easy lookup
    const questionMap = new Map<string, Question>();
    attempt.quiz.questions.forEach(q => {
      questionMap.set(q.id, q as Question);
      totalPoints += (q.points as number) || 1; // Default to 1 point if not specified
    });
    
    // Process each answer
    const processedAnswers = [];
    
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      
      if (!question) continue; // Skip if question not found
      
      const questionPoints = question.points || 1; // Default to 1 point for the question
      let isCorrectForQuestion: boolean | null = false; // Overall correctness for the question
      let scoreForQuestion: number | null = 0; // Score obtained for this question
      
      // Ensure answer.selectedOptions is an array even if undefined in payload
      const currentSelectedOptions = Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [];

      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        const metadata = normalizeMetadata(question.metadata) || {};
        const allowMultiple = metadata.allowMultiple || metadata.allowMultipleAnswers || false;
        const correctOptions = question.options.filter(o => o.isCorrect);
        const correctOptionIds = correctOptions.map(o => o.id);
        
        if (allowMultiple) {
          const selectedCorrectCount = currentSelectedOptions.filter(id => 
            correctOptionIds.includes(id)).length;
          const selectedIncorrectCount = currentSelectedOptions.filter(id => 
            !correctOptionIds.includes(id)).length;
          
          isCorrectForQuestion = selectedCorrectCount === correctOptionIds.length && selectedIncorrectCount === 0;
          
          const allowPartialCredit = metadata.allowPartialCredit !== false; 
          
          if (isCorrectForQuestion) {
            scoreForQuestion = questionPoints;
          } else if (allowPartialCredit) {
            let partialScore = (selectedCorrectCount / correctOptionIds.length) * questionPoints;
            if (selectedIncorrectCount > 0) {
              const penaltyPercentage = metadata.penaltyPercentage !== undefined ? metadata.penaltyPercentage : 0.25; // Default 25% penalty per incorrect
              const penalty = (selectedIncorrectCount * penaltyPercentage / question.options.length) * questionPoints;
              partialScore = Math.max(0, partialScore - penalty);
            }
            scoreForQuestion = Math.round(partialScore * 100) / 100; // Round to 2 decimal places
          } else {
            scoreForQuestion = 0;
          }
        } else {
          if (currentSelectedOptions.length === 1) {
            isCorrectForQuestion = correctOptionIds.includes(currentSelectedOptions[0]);
            scoreForQuestion = isCorrectForQuestion ? questionPoints : 0;
          } else {
            isCorrectForQuestion = false;
            scoreForQuestion = 0;
          }
        }
      } else if (question.type === "SHORT_ANSWER") {
        if (answer.textAnswer && question.options.length > 0) {
          const metadata = normalizeMetadata(question.metadata) || {};
          const caseSensitive = metadata.caseSensitive || false;
          const correctAnswersFromOptions = question.options
            .filter((o: QuestionOption) => o.isCorrect)
            .map((o: QuestionOption) => o.content);
          
          if (caseSensitive) {
            isCorrectForQuestion = correctAnswersFromOptions.includes(answer.textAnswer);
          } else {
            isCorrectForQuestion = correctAnswersFromOptions.some((correctOpt: string) => 
              correctOpt.toLowerCase() === (answer.textAnswer || '').toLowerCase()
            );
          }
          scoreForQuestion = isCorrectForQuestion ? questionPoints : 0;
        } else {
          isCorrectForQuestion = false;
          scoreForQuestion = 0;
        }
      } else if (question.type === "MATCHING") {
        const premises = question.options.filter(opt => opt.group === 'premise');
        const studentMatches = answer.jsonData || {};
        let correctMatchCount = 0;

        if (premises.length > 0) {
          for (const premise of premises) {
            if (premise.matchId && studentMatches[premise.id] === premise.matchId) {
              correctMatchCount++;
            }
          }
          scoreForQuestion = (correctMatchCount / premises.length) * questionPoints;
          scoreForQuestion = Math.round(scoreForQuestion * 100) / 100; // Round to 2 decimal places
          isCorrectForQuestion = correctMatchCount === premises.length;
        } else {
          scoreForQuestion = 0;
          isCorrectForQuestion = false;
        }
      } else if (question.type === "ESSAY" || question.type === "CODE" || question.type === "FILL_BLANK") {
        // For other question types (ESSAY, CODE, FILL_BLANK), manual grading or different logic
        scoreForQuestion = null; 
        isCorrectForQuestion = null;
      }
      
      const answerData = {
          attemptId: attempt.id,
          questionId: question.id,
          selectedOption: currentSelectedOptions[0] || null,
          selectedOptionIds: currentSelectedOptions,
          textAnswer: answer.textAnswer || null,
          jsonData: answer.jsonData || null, // Save jsonData
          isCorrect: isCorrectForQuestion,
          score: scoreForQuestion
      };

      const answerRecord = await db.answer.create({
        data: answerData
      });
      
      processedAnswers.push(answerRecord);
      
      // Add to total score if this answer was auto-graded
      if (scoreForQuestion !== null) {
        totalScore += scoreForQuestion;
      }
    }
    
    // Calculate score percentage based on total points
    let scorePercentage = 0;
    if (totalPoints > 0) {
      scorePercentage = Math.round((totalScore / totalPoints) * 100);
    }
    
    // Update the attempt to mark it as completed
    const completedAttempt = await db.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: now,
        timeSpent,
        score: scorePercentage,
      }
    });
    
    // Return the submission result
    return createSuccessResponse({
      message: "Quiz submitted successfully",
      data: {
        attemptId: completedAttempt.id,
        score: completedAttempt.score,
        timeSpent: completedAttempt.timeSpent,
        completedAt: completedAttempt.completedAt,
        needsManualGrading: processedAnswers.some(a => a.score === null)
      }
    });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to submit quiz attempt"));
  }
} 