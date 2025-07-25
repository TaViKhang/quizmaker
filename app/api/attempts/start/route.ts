import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get the quiz ID from the request body
    const body = await req.json();
    const { quizId, forceNew } = body;
    
    if (!quizId) {
      return NextResponse.json({ success: false, message: "Quiz ID is required" }, { status: 400 });
    }
    
    // Fetch the quiz to check if it's available
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        OR: [
          {
            class: {
              students: {
                some: {
                  studentId: userId
                }
              }
            }
          },
          { isPublic: true }
        ],
        // Quiz must be active and published
        isActive: true,
        isPublished: true
      },
      include: {
        attempts: {
          where: {
            userId
          },
          orderBy: {
            startedAt: 'desc'
          }
        }
      }
    });
    
    if (!quiz) {
      return NextResponse.json({ success: false, message: "Quiz not found or you don't have access" }, { status: 404 });
    }
    
    // Check if quiz is within available dates
    const now = new Date();
    
    if (quiz.startDate && quiz.startDate > now) {
      return NextResponse.json({ success: false, message: "This quiz is not available yet" }, { status: 400 });
    }
    
    if (quiz.endDate && quiz.endDate < now) {
      return NextResponse.json({ success: false, message: "This quiz has expired" }, { status: 400 });
    }
    
    // Check if maximum attempts reached
    if (quiz.maxAttempts && quiz.attempts.length >= quiz.maxAttempts) {
      return NextResponse.json({ 
        success: false, 
        message: "You have reached the maximum number of attempts for this quiz",
        data: {
          attemptsUsed: quiz.attempts.length,
          attemptsRemaining: 0,
          maxAttempts: quiz.maxAttempts
        }
      }, { status: 400 });
    }
    
    // Check if there's an incomplete attempt
    const incompleteAttempt = quiz.attempts.find(attempt => !attempt.completedAt);
    
    // If we found an incomplete attempt and user didn't request a new attempt, continue with existing
    if (incompleteAttempt && !forceNew) {
      return NextResponse.json({
        success: true,
        message: "Continuing existing attempt",
        data: {
          attemptId: incompleteAttempt.id,
          isNew: false,
          attemptNumber: quiz.attempts.length,
          maxAttempts: quiz.maxAttempts,
          attemptsUsed: quiz.attempts.length,
          attemptsRemaining: quiz.maxAttempts ? quiz.maxAttempts - quiz.attempts.length : null
        }
      });
    }
    
    // Create a new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        startedAt: now,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown"
      }
    });
    
    // Calculate attempts used and remaining
    const attemptsUsed = quiz.attempts.length + 1; // +1 for the new attempt we just created
    const attemptsRemaining = quiz.maxAttempts ? quiz.maxAttempts - attemptsUsed : null;
    
    return NextResponse.json({
      success: true,
      message: "Quiz attempt started successfully",
      data: {
        attemptId: attempt.id,
        isNew: true,
        attemptNumber: attemptsUsed,
        maxAttempts: quiz.maxAttempts,
        attemptsUsed: attemptsUsed,
        attemptsRemaining: attemptsRemaining
      }
    });
    
  } catch (error) {
    console.error("[API] Error starting quiz attempt:", error);
    return NextResponse.json(
      { success: false, message: "Failed to start quiz attempt" },
      { status: 500 }
    );
  }
} 