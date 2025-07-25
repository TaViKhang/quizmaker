import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { ApiError, createApiResponse } from "@/app/api/utils/api-response";

/**
 * GET /api/attempts/[id]/details
 * Get detailed information about a quiz attempt, including questions and answers
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, "Authentication required");
    }

    const attemptId = params.id;
    if (!attemptId) {
      throw new ApiError(400, "Attempt ID is required");
    }

    // Get attempt with related data
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            questions: {
              include: {
                options: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    // Check if the user is authorized to view this attempt
    const isOwner = attempt.userId === session.user.id;
    const isTeacher = session.user.role === "TEACHER";

    if (!isOwner && !isTeacher) {
      throw new ApiError(403, "You don't have permission to view this attempt");
    }

    // Calculate time taken
    let timeTakenMinutes = null;
    if (attempt.startedAt && attempt.completedAt) {
      const diffMs = attempt.completedAt.getTime() - attempt.startedAt.getTime();
      timeTakenMinutes = Math.round(diffMs / 60000); // Convert milliseconds to minutes
    }

    // Format response data
    const detailedResult = {
      attempt: {
        id: attempt.id,
        completedAt: attempt.completedAt?.toISOString(),
        startedAt: attempt.startedAt?.toISOString(),
        score: attempt.score || 0,
        timeTakenMinutes,
      },
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        totalQuestions: attempt.quiz.questions.length,
        maxScore: attempt.quiz.questions.length, // Assuming 1 point per question
        class: attempt.quiz.class,
      },
      questions: attempt.quiz.questions.map(question => ({
        id: question.id,
        text: question.content,
        type: question.type,
        explanation: question.explanation,
        options: question.options.map(option => ({
          id: option.id,
          text: option.content,
          isCorrect: option.isCorrect,
        })),
      })),
      userAnswers: attempt.answers.map(answer => ({
        id: answer.id,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOption,
        isCorrect: answer.isCorrect || false,
        feedback: answer.feedback,
      })),
    };

    return createApiResponse(detailedResult);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error fetching attempt details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 