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
  createServerError
} from "@/lib/api-response";
import { normalizeMetadata } from "@/lib/utils";

// Schema for submitting a quiz answer
const submitAnswerSchema = z.object({
  attemptId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOption: z.string().optional(),
      textAnswer: z.string().optional()
    })
  )
});

/**
 * POST handler for submitting answers for a public quiz
 * Required authentication: Yes - All users must be logged in
 * Permission: Any authenticated user can submit answers to their own attempts
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
    const data = await request.json();
    
    // Validate request data
    const validation = submitAnswerSchema.safeParse(data);
    if (!validation.success) {
      return createErrorResponse("VALIDATION_ERROR", "Invalid data", validation.error.format());
    }
    
    const { attemptId, answers } = validation.data;
    
    // Verify that the attempt exists, belongs to the user, and is for the specified quiz
    const attempt = await db.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: session.user.id,
        quizId,
        completedAt: null // Make sure the attempt is not already completed
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
    
    // Process each answer
    const answerResults = [];
    
    for (const answer of answers) {
      // Find the question in the quiz
      const question = attempt.quiz.questions.find(q => q.id === answer.questionId);
      
      if (!question) {
        return createErrorResponse("INVALID_QUESTION", `Question ${answer.questionId} is not part of this quiz`);
      }
      
      // Check if an answer already exists for this question in this attempt
      const existingAnswer = await db.answer.findFirst({
        where: {
          attemptId,
          questionId: answer.questionId
        }
      });
      
      // Create or update the answer
      let answerResult;
      
      if (existingAnswer) {
        // Update existing answer
        answerResult = await db.answer.update({
          where: { id: existingAnswer.id },
          data: {
            selectedOption: answer.selectedOption,
            textAnswer: answer.textAnswer
          }
        });
      } else {
        // Create new answer
        answerResult = await db.answer.create({
          data: {
            attemptId,
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            textAnswer: answer.textAnswer
          }
        });
      }
      
      // Auto-grade the answer if possible
      let isGraded = false;

      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        // For multiple choice questions
        if (answer.selectedOption) {
          // Find the selected option
          const selectedOption = question.options.find(o => o.id === answer.selectedOption);
          
          if (selectedOption) {
            const currentScore = selectedOption.isCorrect ? question.points : 0;
            // Update the answer with the auto-grading result
            await db.answer.update({
              where: { id: answerResult.id },
              data: {
                isCorrect: selectedOption.isCorrect,
                score: currentScore
              }
            });
            
            // Update the answer result object
            answerResult.isCorrect = selectedOption.isCorrect;
            answerResult.score = currentScore;
            isGraded = true;
          }
        }
      } else if (question.type === "SHORT_ANSWER") {
        if (answer.textAnswer && question.options && question.options.length > 0) {
          const metadata = normalizeMetadata(question.metadata);
          const caseSensitive = metadata?.caseSensitive || false;

          const correctAnswersFromOptions = question.options
            .filter(o => o.isCorrect)
            .map(o => o.content);

          let isCorrectShortAnswer = false;
          if (caseSensitive) {
            isCorrectShortAnswer = correctAnswersFromOptions.includes(answer.textAnswer);
          } else {
            isCorrectShortAnswer = correctAnswersFromOptions.some((correctOpt: string) => 
              correctOpt.toLowerCase() === (answer.textAnswer || '').toLowerCase()
            );
          }
          const currentScore = isCorrectShortAnswer ? question.points : 0;

          await db.answer.update({
            where: { id: answerResult.id },
            data: {
              isCorrect: isCorrectShortAnswer,
              score: currentScore
            }
          });
          answerResult.isCorrect = isCorrectShortAnswer;
          answerResult.score = currentScore;
          isGraded = true;
        } else {
           // No text answer or no correct options defined, mark as incorrect or pending
           await db.answer.update({
            where: { id: answerResult.id },
            data: {
              isCorrect: false, // Or null if it should be manually graded
              score: 0 // Or null
            }
          });
          answerResult.isCorrect = false;
          answerResult.score = 0;
          isGraded = true; // Considered graded (as incorrect) even if no answer provided
        }
      }
      
      // If not auto-graded by the above specific types, mark as null for manual review
      if (!isGraded) {
        await db.answer.update({
          where: { id: answerResult.id },
          data: {
            isCorrect: null,
            score: null
          }
        });
        answerResult.isCorrect = null;
        answerResult.score = null;
      }

      answerResults.push(answerResult);
    }
    
    // Update the attempt's completion status if all questions are answered
    const allQuestionsAnswered = await checkAllQuestionsAnswered(attemptId, attempt.quiz.questions.length);
    
    if (allQuestionsAnswered) {
      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
      
      // Complete the attempt
      await db.quizAttempt.update({
        where: { id: attemptId },
        data: {
          completedAt: new Date(),
          timeSpent
        }
      });
      
      // Calculate the score
      await calculateScore(attemptId);
    }
    
    return createSuccessResponse({
      message: "Answers submitted successfully",
      answers: answerResults,
      completed: allQuestionsAnswered
    });
  } catch (error) {
    console.error("Error submitting quiz answers:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to submit answers"));
  }
}

/**
 * Helper function to check if all questions have been answered
 */
async function checkAllQuestionsAnswered(attemptId: string, totalQuestions: number): Promise<boolean> {
  const answeredCount = await db.answer.count({
    where: { attemptId }
  });
  
  return answeredCount >= totalQuestions;
}

/**
 * Helper function to calculate the quiz score
 */
async function calculateScore(attemptId: string): Promise<void> {
  // Get the attempt with all answers and the quiz
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      quiz: {
        include: {
          questions: true
        }
      }
    }
  });
  
  if (!attempt) return;
  
  // Calculate the total possible points
  const totalPoints = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);
  
  // Calculate the score from auto-graded answers
  const autoGradedScore = attempt.answers.reduce((sum, a) => {
    return sum + (a.score || 0);
  }, 0);
  
  // Count auto-graded and non-auto-graded answers
  const autoGradedCount = attempt.answers.filter(a => a.isCorrect !== null).length;
  const nonAutoGradedCount = attempt.answers.filter(a => a.isCorrect === null).length;
  
  // Calculate the final score percentage
  let percentageScore = 0;
  
  if (totalPoints > 0) {
    // If all questions are auto-graded
    if (nonAutoGradedCount === 0) {
      percentageScore = (autoGradedScore / totalPoints) * 100;
    } else {
      // If some questions need manual grading, mark the score as negative
      // This is a convention used to indicate that manual grading is needed
      const gradedPoints = attempt.quiz.questions
        .filter(q => attempt.answers.some(a => a.questionId === q.id && a.isCorrect !== null))
        .reduce((sum, q) => sum + q.points, 0);
      
      if (gradedPoints > 0) {
        percentageScore = (autoGradedScore / gradedPoints) * 100;
      }
      
      // Mark with negative sign to indicate manual grading needed
      percentageScore = -Math.abs(percentageScore);
    }
  }
  
  // Update the attempt with the calculated score
  await db.quizAttempt.update({
    where: { id: attemptId },
    data: { score: percentageScore }
  });
} 