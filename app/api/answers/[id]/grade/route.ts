import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";

// Schema for manual grading submission
const GradeSubmissionSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0),
  feedback: z.string().optional(),
});

/**
 * POST /api/answers/[id]/grade
 * Manually grade an answer
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, message: "Teacher authentication required" },
        { status: 401 }
      );
    }

    // Get answer ID from params
    const answerId = params.id;

    // Parse request body
    const body = await req.json();
    const validatedData = GradeSubmissionSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid grading data", 
          errors: validatedData.error.format() 
        },
        { status: 400 }
      );
    }

    const { isCorrect, score, feedback } = validatedData.data;

    // Check if the answer exists and belongs to a quiz created by this teacher
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        question: {
          quiz: {
            authorId: session.user.id,
          },
        },
      },
      include: {
        question: {
          select: {
            id: true,
            quizId: true,
            points: true,
          },
        },
        attempt: {
          select: {
            id: true,
            userId: true,
            quizId: true,
            completedAt: true,
            score: true,
          },
        },
      },
    });

    if (!answer) {
      return NextResponse.json(
        { success: false, message: "Answer not found or you don't have permission to grade it" },
        { status: 404 }
      );
    }

    // Update the answer with the grading result
    const updatedAnswer = await prisma.answer.update({
      where: {
        id: answerId,
      },
      data: {
        isCorrect,
        score,
        feedback,
      },
    });

    // Check if all answers for this attempt now have scores
    const attemptId = answer.attemptId;
    const attempt = answer.attempt;
    
    // Recalculate the quiz score if all answers are graded
    const allAnswers = await prisma.answer.findMany({
      where: {
        attemptId: attemptId,
      },
      include: {
        question: {
          select: {
            points: true,
          },
        },
      },
    });
    
    // Check if all answers have been graded
    const allGraded = allAnswers.every(a => a.score !== null);
    
    if (allGraded) {
      // Calculate the total points and earned points
      const totalPoints = allAnswers.reduce((sum, answer) => 
        sum + (answer.question.points || 1), 0);
      
      const earnedPoints = allAnswers.reduce((sum, answer) => 
        sum + (answer.score || 0), 0);
      
      // Calculate percentage score
      const scorePercentage = totalPoints > 0 
        ? Math.round((earnedPoints / totalPoints) * 100) 
        : 0;
      
      // Update the attempt with the final score
      await prisma.quizAttempt.update({
        where: {
          id: attemptId,
        },
        data: {
          score: scorePercentage,
        },
      });
      
      // Create a notification for the student
      await prisma.notification.create({
        data: {
          userId: attempt.userId,
          title: "Quiz Fully Graded",
          message: `Your quiz attempt has been fully graded with a score of ${scorePercentage}%.`,
          category: NotificationType.QUIZ_GRADED,
          resourceId: attemptId,
          resourceType: "quiz_attempt",
        },
      });
    }

    // Revalidate the quiz attempt page
    revalidatePath(`/dashboard/teacher/grading/${attemptId}`);
    revalidatePath(`/dashboard/student/quizzes/results/${attemptId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedAnswer.id,
        isCorrect,
        score,
        allGraded,
      },
    });
  } catch (error) {
    console.error("[API] Error grading answer:", error);
    return NextResponse.json(
      { success: false, message: "Failed to grade answer" },
      { status: 500 }
    );
  }
} 