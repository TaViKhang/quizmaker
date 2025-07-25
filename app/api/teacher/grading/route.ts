import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role, Answer } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

// Validation schema for grading essay questions
const gradeEssaySchema = z.object({
  answerId: z.string().min(1, "Answer ID is required"),
  score: z.number().min(0, "Score cannot be negative"),
  feedback: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Verify the user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json(
        { error: "Only teachers can grade submissions" },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = gradeEssaySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation error", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { answerId, score, feedback } = validationResult.data;
    
    // Find the answer to verify it exists and the quiz is owned by this teacher
    const answer = await db.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          select: {
            quizId: true,
            points: true,
          }
        },
        attempt: {
          select: {
            quizId: true,
            userId: true,
          }
        }
      }
    });
    
    if (!answer) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }
    
    // Verify the teacher has permission to grade this quiz
    const quiz = await db.quiz.findUnique({
      where: { id: answer.attempt.quizId },
      select: { authorId: true }
    });
    
    if (!quiz || quiz.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to grade this quiz" },
        { status: 403 }
      );
    }
    
    // Ensure score doesn't exceed max points for the question
    const maxPoints = answer.question.points;
    const finalScore = Math.min(score, maxPoints);
    
    // Update the answer with the grade and feedback
    const updatedAnswer = await db.answer.update({
      where: { id: answerId },
      data: {
        score: finalScore,
        feedback: feedback || null,
        isCorrect: finalScore > 0, // If any points were awarded, consider it correct
      }
    });
    
    // Check if all answers for this attempt are now graded
    const ungradedAnswers = await db.answer.count({
      where: {
        attemptId: answer.attemptId,
        score: null
      }
    });
    
    // If all answers are now graded, calculate and update the attempt's total score
    if (ungradedAnswers === 0) {
      // Get all answers for this attempt
      const allAnswers = await db.answer.findMany({
        where: { attemptId: answer.attemptId },
        include: {
          question: {
            select: { points: true }
          }
        }
      });
      
      // Calculate total score and max possible score
      let totalScore = 0;
      let maxPossibleScore = 0;
      
      allAnswers.forEach((answer: Answer & { question: { points: number } }) => {
        totalScore += answer.score || 0;
        maxPossibleScore += answer.question.points;
      });
      
      // Calculate percentage score
      const percentageScore = maxPossibleScore > 0 
        ? (totalScore / maxPossibleScore) * 100 
        : 0;
      
      // Update the attempt with the final score
      await db.quizAttempt.update({
        where: { id: answer.attemptId },
        data: {
          score: percentageScore,
          completedAt: new Date()
        }
      });
      
      // Create a notification for the student
      await db.notification.create({
        data: {
          userId: answer.attempt.userId,
          title: "Quiz Graded",
          message: `Your quiz has been graded by your teacher.`,
          category: "QUIZ_GRADED",
          resourceId: answer.attempt.quizId,
          resourceType: "quiz"
        }
      });
    }
    
    return NextResponse.json(
      { success: true, answer: updatedAnswer },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error grading essay:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 