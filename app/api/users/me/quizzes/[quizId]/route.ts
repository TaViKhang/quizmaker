import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    // Get auth session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const awaitedParams = await params; // Await params
    const quizId = awaitedParams.quizId;

    // Fetch the quiz with relationships
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        OR: [
          { isPublic: true }, // Public quizzes
          { class: { students: { some: { studentId: userId } } } }, // Enrolled private quizzes
        ],
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          }
        },
        attempts: {
          where: {
            userId
          },
          orderBy: {
            startedAt: "desc"
          }
        },
        author: {
          select: {
            id: true,
            name: true
          }
        },
        // Get just the count of questions
        _count: {
          select: {
            questions: true
          }
        }
      }
    });

    // If quiz not found or user doesn't have access
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found or you don't have access" },
        { status: 404 }
      );
    }

    // Get current date to determine status
    const now = new Date();
    
    // Calculate quiz status based on dates and attempts
    let status: "upcoming" | "ongoing" | "completed" | "expired" = "ongoing";
    const startDate = quiz.startDate;
    const endDate = quiz.endDate;
    const isStarted = !startDate || startDate <= now;
    const isEnded = endDate && endDate < now;
    const hasAttempts = quiz.attempts.length > 0;
    const hasCompletedAttempt = quiz.attempts.some(a => a.completedAt !== null);
    
    if (!isStarted) {
      status = "upcoming";
    } else if (isEnded) {
      status = hasCompletedAttempt ? "completed" : "expired";
    } else if (hasCompletedAttempt) {
      status = "completed";
    } else {
      status = "ongoing";
    }
    
    // Calculate highest score from attempts
    let highestScore = null;
    let bestAttemptId = null;
    
    if (quiz.attempts.length > 0) {
      const completedAttempts = quiz.attempts.filter(a => a.completedAt !== null && a.score !== null);
      if (completedAttempts.length > 0) {
        // Find the attempt with the highest score
        const bestAttempt = completedAttempts.reduce((best, current) => {
          if (!best || (current.score || 0) > (best.score || 0)) {
            return current;
          }
          return best;
        }, completedAttempts[0]);
        
        highestScore = bestAttempt.score;
        bestAttemptId = bestAttempt.id;
      }
    }
    
    // Check if quiz is locked (formal quiz check)
    const userWithRoles = session.user as any;
    const isFormal = quiz.tags?.includes("formal") || false;
    const isLocked = 
      (isFormal && !userWithRoles.formalStudent) ||
      (quiz.maxAttempts !== null && quiz.attempts.length >= quiz.maxAttempts && !hasCompletedAttempt);
    
    // Generate lock reason
    let lockReason = "";
    if (isLocked) {
      if (isFormal && !userWithRoles.formalStudent) {
        lockReason = "This quiz is only available to formal class students";
      } else if (quiz.maxAttempts !== null && quiz.attempts.length >= quiz.maxAttempts) {
        lockReason = "You have reached the maximum number of attempts";
      }
    }

    // Latest attempt details
    const latestAttempt = quiz.attempts[0] || null;
    
    // Format the quiz data for the response
    const formattedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      classId: quiz.classId,
      className: quiz.class?.name || null,
      teacherName: quiz.author?.name || null,
      subject: quiz.class?.subject || null,
      startDate: quiz.startDate?.toISOString() || null,
      endDate: quiz.endDate?.toISOString() || null,
      durationMinutes: quiz.timeLimit,
      totalQuestions: quiz._count.questions,
      status,
      isLocked,
      lockReason,
      isFormal,
      attemptLimit: quiz.maxAttempts,
      currentAttempts: quiz.attempts.length,
      highestScore,
      bestAttemptId,
      latestAttemptId: latestAttempt?.id || null,
      isLatestAttemptComplete: latestAttempt?.completedAt !== null || false,
      instructions: quiz.description || null, // Using description as instructions since instructions field doesn't exist
      // Add any other fields needed for the quiz details page
    };

    return NextResponse.json({
      success: true,
      data: formattedQuiz
    });
    
  } catch (error) {
    console.error("[API] Error fetching quiz details:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch quiz details" },
      { status: 500 }
    );
  }
} 