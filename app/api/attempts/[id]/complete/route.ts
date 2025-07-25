import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@prisma/client";
import { normalizeMetadata } from '@/lib/utils';
import { gradeMultipleChoiceAnswer, gradeMatchingQuestion, gradeFillBlankQuestion } from '@/lib/answer-grading';
import { normalizeQuestion } from '@/lib/question-utils';

interface ExtendedAnswer {
  id: string;
  questionId: string;
  attemptId: string;
  selectedOption: string | null;
  selectedOptionIds: string[];
  textAnswer: string | null;
  isCorrect: boolean | null;
  score: number | null;
  feedback: string | null;
}

interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
  [key: string]: any;
}

/**
 * POST /api/attempts/[id]/complete
 * Complete a quiz attempt and calculate score
 * @param request
 * @param params.id - The attempt ID
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const attemptId = params.id;
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
        userId: session.user.id,
        completedAt: null // Only complete if not already completed
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
        },
        answers: true
      }
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Attempt not found or already completed" },
        { status: 404 }
      );
    }

    // Get the current time for completion timestamp
    const now = new Date();
    const startTime = attempt.startedAt;
    const timeSpent = Math.round((now.getTime() - startTime.getTime()) / 1000); // In seconds

    // Grade answers and calculate total score
    let totalScore = 0;
    let totalPossibleScore = 0;
    let gradedAnswers = 0;
    let questionsWithAnswers = 0;

    // Create a map for questions for easy lookup
    const questionsMap = new Map();
    attempt.quiz.questions.forEach(q => questionsMap.set(q.id, q));

    // Grade all answers
    for (const answer of attempt.answers as ExtendedAnswer[]) {
      const question = questionsMap.get(answer.questionId);
      if (!question) continue;

      questionsWithAnswers++;
      const points = question.points || 1;
      totalPossibleScore += points;

      // Skip if already graded
      if (answer.isCorrect !== null && answer.score !== null) {
        gradedAnswers++;
        if (answer.score !== null) {
          totalScore += answer.score;
        }
        continue;
      }

      // Auto-grade based on question type
      let isCorrect: boolean | null = null;
      let score: number | null = null;

      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
        case QuestionType.TRUE_FALSE:
          // Use selectedOptionIds if available, otherwise try to parse from textAnswer for legacy support
          let selectedOptionIds = answer.selectedOptionIds || [];
          if (selectedOptionIds.length === 0 && answer.selectedOption) {
            // Legacy support - convert single selectedOption to array
            selectedOptionIds = [answer.selectedOption];
          }

          // Get metadata to determine if multiple selections are allowed
          const metadata = normalizeMetadata(question.metadata) || {};
          const allowMultiple = metadata.allowMultiple || metadata.allowMultipleAnswers || false;
          const allowPartialCredit = metadata.allowPartialCredit !== false; // Default to true

          // Get correct options
          const correctOptions = question.options.filter((o: QuestionOption) => o.isCorrect);
          const correctOptionIds = correctOptions.map((o: QuestionOption) => o.id);

          // Use gradeMultipleChoiceAnswer function from lib/answer-grading.ts
          const gradingResult = gradeMultipleChoiceAnswer(
            selectedOptionIds,
            correctOptionIds,
            points,
            allowMultiple,
            allowPartialCredit,
            question.options.length
          );

          isCorrect = gradingResult.isCorrect;
          score = gradingResult.score;
          break;

        case QuestionType.SHORT_ANSWER:
          // Short answer requires exact match with correct options
          if (answer.textAnswer && question.options.length > 0) {
            const metadata = normalizeMetadata(question.metadata) || {};
            const caseSensitive = metadata.caseSensitive || false;
            
            // Get correct answers from options
            const correctAnswers = question.options
              .filter((o: QuestionOption) => o.isCorrect)
              .map((o: QuestionOption) => o.content);
            
            if (caseSensitive) {
              isCorrect = correctAnswers.includes(answer.textAnswer);
            } else {
              isCorrect = correctAnswers.some((a: string) => 
                a.toLowerCase() === (answer.textAnswer || '').toLowerCase()
              );
            }
            
            score = isCorrect ? points : 0;
          } else {
            isCorrect = false;
            score = 0;
          }
          break;

        case QuestionType.MATCHING:
          if (answer.textAnswer) {
            try {
              const normalizedAnswerForMatching = {
                questionId: answer.questionId,
                selectedOptions: [],
                textAnswer: "",
                jsonData: answer.textAnswer
              };
              const matchingGradingResult = gradeMatchingQuestion(
                normalizeQuestion(question),
                normalizedAnswerForMatching
              );
              isCorrect = matchingGradingResult.isCorrect;
              score = matchingGradingResult.score;
              if (matchingGradingResult.feedback) {
                await prisma.answer.update({
                  where: { id: answer.id },
                  data: { feedback: matchingGradingResult.feedback }
                });
              }
            } catch (error) {
              console.error("Error grading matching question:", error);
              isCorrect = null;
              score = null;
            }
          } else {
            isCorrect = false;
            score = 0;
          }
          break;

        case QuestionType.FILL_BLANK:
          if (answer.textAnswer) {
            try {
              const normalizedAnswerForFillBlank = {
                questionId: answer.questionId,
                selectedOptions: [],
                textAnswer: "",
                jsonData: answer.textAnswer
              };
              const fillBlankGradingResult = gradeFillBlankQuestion(
                normalizeQuestion(question),
                normalizedAnswerForFillBlank
              );
              isCorrect = fillBlankGradingResult.isCorrect;
              score = fillBlankGradingResult.score;
              if (fillBlankGradingResult.feedback) {
                await prisma.answer.update({
                  where: { id: answer.id },
                  data: { feedback: fillBlankGradingResult.feedback }
                });
              }
            } catch (error) {
              console.error("Error grading fill_blank question:", error);
              isCorrect = null;
              score = null;
            }
          } else {
            isCorrect = false;
            score = 0;
          }
          break;

        case QuestionType.CODE:
        case QuestionType.ESSAY:
          isCorrect = null;
          score = null;
          break;

        default:
          isCorrect = null;
          score = null;
      }

      // Update answer with grading results if it was auto-graded
      if (isCorrect !== null && score !== null) {
        await prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect, score }
        });
        gradedAnswers++;
        totalScore += score;
      }
    }

    // Calculate final score as a percentage
    const finalScore = totalPossibleScore > 0 
      ? Math.round((totalScore / totalPossibleScore) * 100) 
      : 0;

    // Update the attempt to mark it as completed
    const completedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: now,
        score: finalScore,
        timeSpent: timeSpent
      }
    });

    // Return the completion data
    return NextResponse.json({
      success: true,
      data: {
        id: completedAttempt.id,
        score: completedAttempt.score,
        timeSpent: completedAttempt.timeSpent,
        completedAt: completedAttempt.completedAt,
        totalQuestions: attempt.quiz.questions.length,
        answeredQuestions: questionsWithAnswers,
        gradedQuestions: gradedAnswers,
        needsManualGrading: questionsWithAnswers > gradedAnswers
      }
    });
  } catch (error) {
    console.error("Error completing attempt:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Error completing attempt", 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 