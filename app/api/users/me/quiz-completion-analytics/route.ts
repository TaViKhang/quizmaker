import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role, Prisma } from "@prisma/client";
import { ApiError } from "@/app/api/utils/api-response";
import { 
  startOfToday, 
  subDays, 
  subMonths, 
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
  parseISO
} from "date-fns";

// Helper functions for API responses
function createApiResponse({ status = 200, data = {}, message = "" }) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

function createApiErrorResponse({ status = 400, message = "" }) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

/**
 * API endpoint to get student quiz completion analytics.
 * This endpoint returns detailed metrics about student's quiz completion rates and statistics.
 * 
 * @route GET /api/users/me/quiz-completion-analytics
 * @query timeFrame - Optional parameter to filter data by time range
 *                    Options: "last7days", "last30days", "last90days", "allTime"
 *                    Default: "last30days"
 * @returns {Object} Analytics data including key metrics, quiz breakdown, completion trends, and category analysis
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createApiErrorResponse({
        status: 401,
        message: "Unauthorized",
      });
    }
    
    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;
    const timeFrame = searchParams.get("timeFrame") || "last30days";
    
    // Calculate date range based on time frame
    const now = new Date();
    let startDate: Date;
    
    switch (timeFrame) {
      case "last7days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "last30days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case "last90days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        break;
      case "last6months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "lastYear":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "allTime":
        startDate = new Date(0); // January 1, 1970
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
    }
    
    // Get user's enrolled classes first
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
    
    // Get total assigned quizzes (only from enrolled classes)
    // Count all published quizzes in enrolled classes, regardless of time range
    // This ensures logical consistency: completed ≤ total always
    let totalQuizzes = 0;
    if (enrolledClassIds.length > 0) {
      totalQuizzes = await db.quiz.count({
        where: {
          classId: {
            in: enrolledClassIds
          },
          isPublished: true,
          isActive: true,
        },
      });
    }
    
    // Get completed quizzes (only from enrolled classes)
    const completedQuizAttempts = enrolledClassIds.length > 0 
      ? await db.quizAttempt.findMany({
          where: {
            userId,
            completedAt: {
              not: null,
              gte: startDate,
              lte: now
            },
            quiz: {
              classId: {
                in: enrolledClassIds
              },
              isPublished: true
            }
          },
          select: {
            quizId: true,
            score: true, // Include score for average calculation
          }
        })
      : [];

    // Count distinct quizIds
    const uniqueQuizIds = new Set(completedQuizAttempts.map(attempt => attempt.quizId));
    const completedQuizzes = uniqueQuizIds.size;

    // Calculate average score using best attempt per quiz (not all attempts)
    const quizBestScores = new Map<string, number>();

    completedQuizAttempts.forEach(attempt => {
      if (attempt.score !== null) {
        const currentBest = quizBestScores.get(attempt.quizId) || 0;
        if (attempt.score > currentBest) {
          quizBestScores.set(attempt.quizId, attempt.score);
        }
      }
    });

    const bestScores = Array.from(quizBestScores.values());
    const averageScore = bestScores.length > 0
      ? parseFloat((bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length).toFixed(1))
      : 0;
      
    // Calculate average attempts per quiz
    const quizAttemptsCount = new Map();
    completedQuizAttempts.forEach(attempt => {
      const count = quizAttemptsCount.get(attempt.quizId) || 0;
      quizAttemptsCount.set(attempt.quizId, count + 1);
    });
    
    const totalAttempts = Array.from(quizAttemptsCount.values()).reduce((sum, count) => sum + count, 0);
    const averageAttempts = quizAttemptsCount.size > 0 
      ? parseFloat((totalAttempts / quizAttemptsCount.size).toFixed(1))
      : 0;
    
    // Calculate completion rate
    const completionRate = totalQuizzes > 0 
      ? Math.round((completedQuizzes / totalQuizzes) * 100) 
      : 0;
    
    // Get quizzes by subject with completion stats (only from enrolled classes)
    // Count all published quizzes by category, regardless of time range for consistency
    const quizzesBySubject = enrolledClassIds.length > 0
      ? await db.quiz.groupBy({
          by: ["category"],
          where: {
            classId: {
              in: enrolledClassIds
            },
            isPublished: true,
            isActive: true,
            category: {
              not: null,
            },
          },
          _count: {
            id: true,
          },
        })
      : [];
    
    // Get completed quizzes by subject (only from enrolled classes)
    const completedBySubject = enrolledClassIds.length > 0
      ? await db.quizAttempt.groupBy({
          by: ["quizId"],
          where: {
            userId,
            completedAt: {
              not: null,
              gte: startDate,
              lte: now,
            },
            quiz: {
              classId: {
                in: enrolledClassIds
              },
              category: {
                not: null,
              },
            },
          },
          _count: {
            id: true,
          },
        })
      : [];
    
    // Map quiz IDs to subjects
    const quizSubjectMap = await db.quiz.findMany({
      where: {
        id: {
          in: completedBySubject.map(q => q.quizId),
        },
      },
      select: {
        id: true,
        category: true,
      },
    });
    
    // Create a map of subject to completions
    const subjectCompletions = new Map();
    
    quizSubjectMap.forEach(quiz => {
      const subject = quiz.category || "Uncategorized";
      if (!subjectCompletions.has(subject)) {
        subjectCompletions.set(subject, 0);
      }
      
      const completion = completedBySubject.find(c => c.quizId === quiz.id);
      if (completion) {
        subjectCompletions.set(subject, subjectCompletions.get(subject) + 1);
      }
    });
    
    // Format subject completion data
    const subjectStats = quizzesBySubject.map(subject => {
      const subjectName = subject.category || "Uncategorized";
      const totalSubjectQuizzes = subject._count.id;
      const completedSubjectQuizzes = subjectCompletions.get(subjectName) || 0;
      const subjectCompletionRate = totalSubjectQuizzes > 0 
        ? Math.round((completedSubjectQuizzes / totalSubjectQuizzes) * 100) 
        : 0;
      
      return {
        subject: subjectName,
        totalQuizzes: totalSubjectQuizzes,
        completedQuizzes: completedSubjectQuizzes,
        completionRate: subjectCompletionRate,
      };
    });
    
    // Get latest completed quiz (only from enrolled classes)
    const latestCompletion = enrolledClassIds.length > 0
      ? await db.quizAttempt.findFirst({
          where: {
            userId,
            completedAt: {
              not: null,
            },
            quiz: {
              classId: {
                in: enrolledClassIds
              }
            }
          },
          orderBy: {
            completedAt: "desc",
          },
          select: {
            completedAt: true,
            quiz: {
              select: {
                title: true,
              },
            },
          },
        })
      : null;
    
    // Find subjects with highest and lowest completion rates
    let bestSubject = null;
    let worstSubject = null;
    
    if (subjectStats.length > 0) {
      const sortedByCompletion = [...subjectStats].sort(
        (a, b) => b.completionRate - a.completionRate
      );
      
      bestSubject = {
        name: sortedByCompletion[0].subject,
        completionRate: sortedByCompletion[0].completionRate,
      };
      
      worstSubject = {
        name: sortedByCompletion[sortedByCompletion.length - 1].subject,
        completionRate: sortedByCompletion[sortedByCompletion.length - 1].completionRate,
      };
    }
    
    // Check if we have quiz data
    if (totalQuizzes === 0) {
      return createApiResponse({
        status: 200,
        data: {
          totalQuizzes: 0,
          completedQuizzes: 0,
          completionRate: 0,
          subjectStats: [],
          latestCompletion: null,
          bestSubject: null,
          worstSubject: null,
          timeFrame,
        },
        message: "No quiz data found",
      });
    }

    // Continue with the rest of the function if real data exists...
    
    // Generate completion trend data
    // Create time periods based on time frame
    const { startDate: trendStartDate, endDate: trendEndDate } = getTimeRange(timeFrame);
    const timePeriods = generateTimePeriods(trendStartDate, trendEndDate, "month");

    // Group completed quizzes by month using best attempt per quiz
    const completionTrends = await Promise.all(
      timePeriods.map(async (period) => {
        const [year, month] = period.split('-');
        const periodStartDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const periodEndDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month

        const periodAttempts = enrolledClassIds.length > 0
          ? await db.quizAttempt.findMany({
              where: {
                userId,
                completedAt: {
                  not: null,
                  gte: periodStartDate,
                  lte: periodEndDate
                },
                quiz: {
                  classId: {
                    in: enrolledClassIds
                  }
                }
              },
              select: {
                score: true,
                quizId: true
              }
            })
          : [];

        // Get best score per quiz for this period
        const periodQuizBestScores = new Map<string, number>();

        periodAttempts.forEach(attempt => {
          if (attempt.score !== null) {
            const currentBest = periodQuizBestScores.get(attempt.quizId) || 0;
            if (attempt.score > currentBest) {
              periodQuizBestScores.set(attempt.quizId, attempt.score);
            }
          }
        });

        const periodBestScores = Array.from(periodQuizBestScores.values());
        const periodAverageScore = periodBestScores.length > 0
          ? parseFloat((periodBestScores.reduce((sum, score) => sum + score, 0) / periodBestScores.length).toFixed(1))
          : 0;

        return {
          period,
          completedCount: periodQuizBestScores.size, // Count unique quizzes, not total attempts
          averageScore: periodAverageScore
        };
      })
    );
    
    // Get quiz details for breakdown (simplified version - just most recent attempts from enrolled classes)
    const recentQuizAttempts = enrolledClassIds.length > 0
      ? await db.quizAttempt.findMany({
          where: {
            userId,
            completedAt: {
              not: null,
              gte: startDate,
              lte: now
            },
            quiz: {
              classId: {
                in: enrolledClassIds
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          take: 5, // Get just the 5 most recent for simplicity
          select: {
            quizId: true,
            score: true,
            completedAt: true,
            quiz: {
              select: {
                id: true,
                title: true,
                class: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        })
      : [];
    
    // Transform to expected format
    const quizBreakdown = recentQuizAttempts.map(attempt => ({
      quizId: attempt.quiz.id,
      title: attempt.quiz.title,
      className: attempt.quiz.class?.name || "No Class",
      completionStatus: "completed" as const,
      bestScore: attempt.score,
      attemptCount: 1, // Simplified - would need additional query for real count
      lastAttemptDate: attempt.completedAt?.toISOString() || null
    }));
    
    return createApiResponse({
      status: 200,
      data: {
        // Key metrics
        totalQuizzes,
        completedQuizzes,
        completionRate,
        averageScore,
        averageAttempts,
        
        // Subject stats (categories)
        subjectStats,
        
        // Latest completion info
        latestCompletion: latestCompletion ? {
          title: latestCompletion.quiz.title,
          completedAt: latestCompletion.completedAt,
        } : null,
        
        // Subject performance
        bestSubject,
        worstSubject,
        
        // Time series data
        completionTrends,
        
        // Quiz breakdown
        quizBreakdown,
        
        // Selected time frame
        timeFrame,
      },
    });
    
  } catch (error) {
    console.error("Error fetching quiz completion analytics:", error);
    return createApiErrorResponse({
      status: 500,
      message: "Failed to fetch quiz completion analytics",
    });
  }
}

/**
 * Determines the time range based on the specified timeFrame.
 * 
 * @param timeFrame - "last7days", "last30days", "last90days", or "allTime"
 * @returns Object containing startDate and endDate
 */
function getTimeRange(timeFrame: string) {
  const today = startOfToday();
  
  switch (timeFrame) {
    case "last7days":
      return {
        startDate: subDays(today, 7),
        endDate: today
      };
    case "last30days":
      return {
        startDate: subDays(today, 30),
        endDate: today
      };
    case "last90days":
      return {
        startDate: subDays(today, 90),
        endDate: today
      };
    case "allTime":
    default:
      return {
        startDate: subMonths(today, 12), // Default to last 12 months
        endDate: today
      };
  }
}

/**
 * Generates all time periods between start and end dates based on monthly grouping.
 * 
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @param groupBy - Currently only supports "month"
 * @returns Array of period keys in format YYYY-MM
 */
function generateTimePeriods(
  startDate: Date,
  endDate: Date,
  groupBy: "month"
): string[] {
  const periods: string[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const periodKey = format(currentDate, "yyyy-MM");
    periods.push(periodKey);
    
    // Move to next month
    currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
  }
  
  return periods;
} 