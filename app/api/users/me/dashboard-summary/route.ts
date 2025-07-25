import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { ApiError, createApiResponse } from "@/app/api/utils/api-response";

/**
 * API endpoint to get student dashboard summary statistics.
 * This includes:
 * - classesJoined: Number of active classes the student has joined.
 * - totalQuizzesCompleted: Total number of quizzes completed (private quizzes only).
 * - averageScore: Average score across all assigned quizzes (using highest score if multiple attempts).
 * - assignedQuizCompletionRate: Completion rate for assigned quizzes.
 * - assignedAverageScorePreviousPeriod: Average score from assigned quizzes completed in the previous month.
 * - assignedPublishedQuizzesCurrentMonthCount: Total number of assigned quizzes published in joined classes within the current month.
 * - assignedCompletedQuizzesCurrentMonthCount: Total number of assigned quizzes completed within the current month.
 * 
 * @route GET /api/users/me/dashboard-summary
 * @returns {{
 *   classesJoined: number,
 *   totalQuizzesCompleted: number,
 *   averageScore: number,
 *   assignedQuizCompletionRate: number,
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
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    // 1. Classes Joined - Count all active classes the student is enrolled in
    const classesJoined = await db.classEnrollment.count({
      where: {
        studentId: userId,
        class: {
          isActive: true
        }
      },
    });
    
    // 2. Get list of enrolled class IDs (for use in subsequent queries)
    const enrolledClasses = await db.classEnrollment.findMany({
      where: {
        studentId: userId,
        class: {
          isActive: true
        }
      },
      select: {
        classId: true
      }
    });
    
    const enrolledClassIds = enrolledClasses.map(ec => ec.classId);
    
    // 3. Total Assigned Quizzes - Count all published and active quizzes in enrolled classes
    let assignedPublishedQuizzesCount = 0;
    if (enrolledClassIds.length > 0) {
      assignedPublishedQuizzesCount = await db.quiz.count({
        where: {
          classId: {
            in: enrolledClassIds
          },
          isPublished: true,
          isActive: true
        }
      });
    }
      // 4. Completed Quizzes - Count UNIQUE quizzes in enrolled classes that the student has completed
    const completedQuizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: userId,
        completedAt: {
          not: null
        },
        quiz: {
          classId: {
            in: enrolledClassIds
          },
          isPublished: true
        }
      },
      select: {
        quizId: true
      },
      distinct: ['quizId']
    });
    
    const totalQuizzesCompleted = completedQuizAttempts.length;
    
    // 5. Assigned Quiz Completion Rate calculation
    let assignedQuizCompletionRate = 0;
    if (assignedPublishedQuizzesCount > 0) {
      assignedQuizCompletionRate = (totalQuizzesCompleted / assignedPublishedQuizzesCount) * 100;
    }
    
    // 6. Find assigned quiz IDs for score calculations
    const assignedQuizzes = await db.quiz.findMany({
      where: {
        classId: {
          in: enrolledClassIds
        },
        isPublished: true,
        isActive: true
      },
      select: {
        id: true
      }
    });
    
    const assignedQuizIds = assignedQuizzes.map(quiz => quiz.id);
    
    // 7. Get all completed attempts for these quizzes
    const allAttempts = await db.quizAttempt.findMany({
      where: {
        userId: userId,
        quizId: {
          in: assignedQuizIds
        },
        completedAt: {
          not: null
        },
        score: {
          not: null
        }
      },
      select: {
        quizId: true,
        score: true,
        completedAt: true
      }
    });
    
    // 8. Calculate average score using highest score per quiz
    const bestScoresByQuiz = new Map<string, number>();
    
    allAttempts.forEach(attempt => {
      const currentBestScore = bestScoresByQuiz.get(attempt.quizId) || 0;
      if ((attempt.score || 0) > currentBestScore) {
        bestScoresByQuiz.set(attempt.quizId, attempt.score || 0);
      }
    });
    
    let totalScoreSum = 0;
    let totalScoredQuizzes = 0;
    
    bestScoresByQuiz.forEach(score => {
      totalScoreSum += score;
      totalScoredQuizzes++;
    });
    
    let averageScore = 0;
    if (totalScoredQuizzes > 0) {
      averageScore = totalScoreSum / totalScoredQuizzes;
    }
    
    // 9. Calculate monthly statistics for current month
    // 9.1. Count published quizzes this month
    let assignedPublishedQuizzesCurrentMonthCount = 0;
    if (enrolledClassIds.length > 0) {
      assignedPublishedQuizzesCurrentMonthCount = await db.quiz.count({
        where: {
          classId: {
            in: enrolledClassIds
          },
          isPublished: true,
          isActive: true,
          createdAt: {
            gte: currentMonth
          }
        }
      });
    }
    
    // 9.2. Count unique completed quizzes this month (not total attempts)
    const completedQuizCurrentMonthAttempts = await db.quizAttempt.findMany({
      where: {
        userId: userId,
        completedAt: {
          not: null,
          gte: currentMonth,
          lte: endOfMonth
        },
        quiz: {
          classId: {
            in: enrolledClassIds
          },
          isPublished: true
        }
      },
      select: {
        quizId: true
      }
    });

    // Count unique quizzes completed this month
    const uniqueCompletedQuizIds = new Set(completedQuizCurrentMonthAttempts.map(attempt => attempt.quizId));
    const assignedCompletedQuizzesCurrentMonthCount = uniqueCompletedQuizIds.size;
    
    // 10. Calculate average score from previous month for comparison
    const previousMonthAttempts = allAttempts.filter(
      attempt => attempt.completedAt && 
                new Date(attempt.completedAt) >= previousMonth && 
                new Date(attempt.completedAt) < currentMonth
    );
    
    // Group by quiz and find highest score per quiz
    const previousMonthBestScores = new Map<string, number>();
    
    previousMonthAttempts.forEach(attempt => {
      const currentBestScore = previousMonthBestScores.get(attempt.quizId) || 0;
      if ((attempt.score || 0) > currentBestScore) {
        previousMonthBestScores.set(attempt.quizId, attempt.score || 0);
      }
    });
    
    let previousMonthTotalScore = 0;
    let previousMonthQuizCount = 0;
    
    previousMonthBestScores.forEach(score => {
      previousMonthTotalScore += score;
      previousMonthQuizCount++;
    });
    
    let assignedAverageScorePreviousPeriod = 0;
    if (previousMonthQuizCount > 0) {
      assignedAverageScorePreviousPeriod = previousMonthTotalScore / previousMonthQuizCount;
    }
    
    // Return formatted response with all dashboard statistics
    return createApiResponse({
      classesJoined,
      totalQuizzesCompleted,
      averageScore: parseFloat(averageScore.toFixed(1)),
      assignedQuizCompletionRate: parseFloat(assignedQuizCompletionRate.toFixed(1)),
      assignedPublishedQuizzesCurrentMonthCount,
      assignedCompletedQuizzesCurrentMonthCount,
      assignedAverageScorePreviousPeriod: parseFloat(assignedAverageScorePreviousPeriod.toFixed(1))
    });
    
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error fetching student dashboard stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 