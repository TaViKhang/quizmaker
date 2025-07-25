import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { ApiError, createApiResponse } from "@/app/api/utils/api-response";

/**
 * API endpoint to get student statistics.
 * This includes:
 * - joinedClassesCount: Number of classes the student has joined.
 * - overallCompletedQuizzesCount: Total number of quizzes completed (both public and assigned, all time).
 * - assignedCompletedQuizzesCount: Total number of assigned (private) quizzes completed (all time).
 * - assignedPublishedQuizzesCount: Total number of assigned (private) quizzes published in joined classes (all time).
 * - assignedAverageScore: Average score from completed assigned (private) quizzes (all time).
 * - assignedAverageScorePreviousPeriod: Average score from assigned (private) quizzes completed before the last 7 days.
 * - assignedPublishedQuizzesCurrentMonthCount: Total number of assigned (private) quizzes published (with a startDate) in joined classes within the current month.
 * - assignedCompletedQuizzesCurrentMonthCount: Total number of assigned (private) quizzes completed within the current month.
 * 
 * @route GET /api/users/me/student-stats
 * @returns {{
 *   joinedClassesCount: number,
 *   overallCompletedQuizzesCount: number,
 *   assignedCompletedQuizzesCount: number,
 *   assignedPublishedQuizzesCount: number,
 *   assignedAverageScore: number,
 *   assignedAverageScorePreviousPeriod: number,
 *   assignedPublishedQuizzesCurrentMonthCount: number,
 *   assignedCompletedQuizzesCurrentMonthCount: number
 * }}
 */
export async function GET() {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Only students can access this API
    if (session.user.role !== Role.STUDENT) {
      throw new ApiError(403, "Access denied: Student role required");
    }

    const userId = session.user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    // Get count of joined classes
    const joinedClassesCount = await db.classEnrollment.count({
      where: {
        studentId: userId,
      },
    });

    // Get IDs of classes the student is enrolled in
    const studentClasses = await db.classEnrollment.findMany({
      where: { studentId: userId },
      select: { classId: true },
    });
    const studentClassIds = studentClasses.map(sc => sc.classId);

    // Get IDs of all quizzes assigned to the student in their classes
    let assignedQuizIds: string[] = [];
    if (studentClassIds.length > 0) {
      const assignedQuizzes = await db.quiz.findMany({
        where: {
          classId: {
            in: studentClassIds,
          },
        },
        select: {
          id: true,
        },
      });
      assignedQuizIds = assignedQuizzes.map(q => q.id);
    }
    
    // Get count of all completed quizzes (overall) - count unique quizzes, not attempts
    const overallCompletedQuizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: userId,
        completedAt: {
          not: null,
        },
      },
      select: {
        quizId: true
      },
      distinct: ['quizId']
    });
    const overallCompletedQuizzesCount = overallCompletedQuizAttempts.length;

    // Get count of assigned (private) quizzes completed (all time) - count unique quizzes
    let assignedCompletedQuizzesCount = 0;
    if (assignedQuizIds.length > 0) {
      const assignedCompletedQuizAttempts = await db.quizAttempt.findMany({
        where: {
          userId: userId,
          quizId: {
            in: assignedQuizIds,
          },
          completedAt: {
            not: null,
          },
        },
        select: {
          quizId: true
        },
        distinct: ['quizId']
      });
      assignedCompletedQuizzesCount = assignedCompletedQuizAttempts.length;
    }

    // Get count of assigned (private) quizzes published in joined classes (all time)
    let assignedPublishedQuizzesCount = 0;
    if (studentClassIds.length > 0) {
      assignedPublishedQuizzesCount = await db.quiz.count({
        where: {
          classId: {
            in: studentClassIds,
          },
          isPublished: true,
        },
      });
    }

    // Get all completed attempts for assigned (private) quizzes for average score calculation
    // Use best attempt per quiz to avoid inflated averages
    let assignedCompletedAttempts: { quizId: string; score: number | null; completedAt: Date | null }[] = [];
    if (assignedQuizIds.length > 0) {
        assignedCompletedAttempts = await db.quizAttempt.findMany({
        where: {
          userId: userId,
          quizId: {
            in: assignedQuizIds,
          },
        completedAt: {
          not: null,
        },
        score: {
          not: null,
        },
      },
      select: {
        quizId: true,
        score: true,
          completedAt: true,
      },
    });
    }

    // Group by quiz and get best score per quiz
    const quizBestScores = new Map<string, { score: number; completedAt: Date }>();

    assignedCompletedAttempts.forEach(attempt => {
      if (attempt.score !== null && attempt.completedAt) {
        const existing = quizBestScores.get(attempt.quizId);
        if (!existing || attempt.score > existing.score) {
          quizBestScores.set(attempt.quizId, {
            score: attempt.score,
            completedAt: attempt.completedAt
          });
        }
      }
    });

    const bestAttempts = Array.from(quizBestScores.values());

    // Calculate average score for assigned (private) quizzes using best scores only
    let assignedAverageScore = 0;
    if (bestAttempts.length > 0) {
      const sum = bestAttempts.reduce((acc: number, attempt) => acc + attempt.score, 0);
      assignedAverageScore = parseFloat((sum / bestAttempts.length).toFixed(1));
    }

    // Calculate average score for assigned (private) quizzes for the "previous period" using best scores
    let assignedAverageScorePreviousPeriod = 0;
    const previousPeriodBestAttempts = bestAttempts.filter(
      (attempt) => new Date(attempt.completedAt) < sevenDaysAgo
    );

    if (previousPeriodBestAttempts.length > 0) {
      const sumPrevious = previousPeriodBestAttempts.reduce(
        (acc: number, attempt) => acc + attempt.score,
        0
      );
      assignedAverageScorePreviousPeriod = parseFloat(
        (sumPrevious / previousPeriodBestAttempts.length).toFixed(1)
      );
    }
    
    // Get total assigned (private) quizzes published (with a startDate) in joined classes for the current month
    let assignedPublishedQuizzesCurrentMonthCount = 0;
    if (studentClassIds.length > 0) {
        assignedPublishedQuizzesCurrentMonthCount = await db.quiz.count({
            where: {
                classId: {
                    in: studentClassIds,
                },
                isPublished: true,
                startDate: { // Assuming startDate indicates when it's "assigned" for the period
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });
    }

    // Calculate completed assigned (private) quizzes in the current month - count unique quizzes
    let assignedCompletedQuizzesCurrentMonthCount = 0;
    if (assignedQuizIds.length > 0) {
        const monthlyCompletedAttempts = await db.quizAttempt.findMany({
        where: {
          userId: userId,
          quizId: {
            in: assignedQuizIds,
          },
          completedAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            select: {
              quizId: true
            },
            distinct: ['quizId']
        });
        assignedCompletedQuizzesCurrentMonthCount = monthlyCompletedAttempts.length;
    }

    // Return the result
    return createApiResponse({
      joinedClassesCount,
      overallCompletedQuizzesCount,
      assignedCompletedQuizzesCount,
      assignedPublishedQuizzesCount,
      assignedAverageScore,
      assignedAverageScorePreviousPeriod,
      assignedPublishedQuizzesCurrentMonthCount,
      assignedCompletedQuizzesCurrentMonthCount,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error fetching student stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 