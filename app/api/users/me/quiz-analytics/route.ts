import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay, subDays, subMonths, subYears, format, parseISO } from "date-fns";
import { QuizAttempt, Prisma } from "@prisma/client";

interface TimeSeriesDataPoint {
  date: string;
  averageScore: number;
  assessmentCount: number;
}

interface SubjectPerformanceData {
  subject: string;
  averageScore: number;
  assessmentCount: number;
  trend: number | null;
}

interface AttemptWithQuiz extends QuizAttempt {
  quiz: {
    title: string;
    category: string | null;
  }
}

/**
 * GET handler for /api/users/me/quiz-analytics
 * Provides analytics data for the student's quiz results
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const timeFrame = url.searchParams.get("timeFrame") || "last30days";
    const subject = url.searchParams.get("subject");

    // Determine date range based on timeFrame
    const now = new Date();
    let startDate: Date;

    switch (timeFrame) {
      case "last7days":
        startDate = subDays(now, 7);
        break;
      case "last30days":
        startDate = subDays(now, 30);
        break;
      case "last90days":
        startDate = subDays(now, 90);
        break;
      case "last6months":
        startDate = subMonths(now, 6);
        break;
      case "lastYear":
        startDate = subYears(now, 1);
        break;
      case "allTime":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = subDays(now, 30); // Default to last 30 days
    }

    // Build the base query for quiz attempts
    const whereClause: Prisma.QuizAttemptWhereInput = {
      userId: session.user.id,
      completedAt: { 
        not: null,
        gte: startDate
      },
      score: { not: null }
    };

    // Apply subject filter if specified
    if (subject) {
      whereClause.quiz = {
        category: subject
      };
    }

    // Fetch quiz attempts based on filters
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: whereClause,
      include: {
        quiz: {
          select: {
            title: true,
            category: true,
          }
        }
      },
      orderBy: {
        completedAt: 'desc' as Prisma.SortOrder
      }
    });

    // Calculate the previous period for comparison
    const previousPeriodStartDate = (() => {
      switch (timeFrame) {
        case "last7days":
          return subDays(startDate, 7);
        case "last30days":
          return subDays(startDate, 30);
        case "last90days":
          return subDays(startDate, 90);
        case "last6months":
          return subMonths(startDate, 6);
        case "lastYear":
          return subYears(startDate, 1);
        default:
          return subDays(startDate, 30);
      }
    })();

    // Fetch previous period attempts for comparison
    const previousPeriodAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        completedAt: { 
          not: null,
          gte: previousPeriodStartDate,
          lt: startDate
        },
        score: { not: null }
      },
      include: {
        quiz: {
          select: {
            title: true,
            category: true,
          }
        }
      }
    });

    // Generate time series data for score chart
    const timeSeriesData = generateTimeSeriesData(quizAttempts as AttemptWithQuiz[], timeFrame);

    // Generate subject performance data
    const subjectPerformance = generateSubjectPerformance(
      quizAttempts as AttemptWithQuiz[], 
      previousPeriodAttempts as AttemptWithQuiz[]
    );

    // Calculate overall statistics
    const currentAverageScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length
      : 0;
    
    const previousAverageScore = previousPeriodAttempts.length > 0
      ? previousPeriodAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / previousPeriodAttempts.length
      : null;
    
    const improvement = previousAverageScore !== null
      ? currentAverageScore - previousAverageScore
      : null;

    // Get all quizzes assigned to the student
    const assignedQuizzes = await prisma.quiz.count({
      where: {
        OR: [
          {
            class: {
              students: {
                some: {
                  studentId: session.user.id
                }
              }
            }
          },
          {
            isPublic: true
          }
        ]
      }
    });

    // Calculate completion data
    const completedQuizzes = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT "quizId") as count 
      FROM "QuizAttempt" 
      WHERE "userId" = ${session.user.id} AND "completedAt" IS NOT NULL
    `;

    // Format the response data
    const analyticsData = {
      overallStats: {
        averageScore: currentAverageScore,
        previousAverageScore,
        improvement,
        totalAssessments: quizAttempts.length,
        currentPeriodLabel: getTimeFrameLabel(timeFrame),
        previousPeriodLabel: previousAverageScore !== null ? `previous ${getTimeFrameLabel(timeFrame)}` : null,
      },
      completionData: {
        totalQuizzes: assignedQuizzes,
        completedQuizzes: Number(completedQuizzes[0]?.count || 0),
        completionRate: assignedQuizzes > 0 ? Math.round((Number(completedQuizzes[0]?.count || 0) / assignedQuizzes) * 100) : 0,
        bestSubject: getBestSubject(subjectPerformance),
        mostImprovedSubject: getMostImprovedSubject(subjectPerformance)
      },
      timeSeriesData,
      subjectPerformance,
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error("Error in quiz analytics API:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

// Utility function to generate time series data for the score chart
function generateTimeSeriesData(attempts: AttemptWithQuiz[], timeFrame: string): TimeSeriesDataPoint[] {
  if (!attempts.length) return [];

  // Create a map to store aggregated data by date
  const dataByDate = new Map<string, { date: string, totalScore: number, count: number }>();

  attempts.forEach(attempt => {
    if (!attempt.completedAt || !attempt.score) return;

    // Format date based on timeFrame
    let dateKey: string;
    const completedAt = new Date(attempt.completedAt);

    switch (timeFrame) {
      case "last7days":
      case "last30days":
        // For short timeframes, use daily data points
        dateKey = format(completedAt, "yyyy-MM-dd");
        break;
      case "last90days":
        // For medium timeframes, use weekly data points
        const weekNumber = Math.floor(completedAt.getDate() / 7) + 1;
        dateKey = `${format(completedAt, "yyyy-MM")}-W${weekNumber}`;
        break;
      default:
        // For longer timeframes, use monthly data points
        dateKey = format(completedAt, "yyyy-MM");
    }

    // Update the aggregated data
    if (!dataByDate.has(dateKey)) {
      dataByDate.set(dateKey, {
        date: dateKey,
        totalScore: attempt.score,
        count: 1
      });
    } else {
      const existingData = dataByDate.get(dateKey)!;
      dataByDate.set(dateKey, {
        ...existingData,
        totalScore: existingData.totalScore + attempt.score,
        count: existingData.count + 1
      });
    }
  });

  // Convert the map to an array of data points
  const timeSeriesData = Array.from(dataByDate.values()).map(data => ({
    date: data.date,
    averageScore: parseFloat((data.totalScore / data.count).toFixed(1)),
    assessmentCount: data.count
  }));

  // Sort by date
  return timeSeriesData.sort((a, b) => a.date.localeCompare(b.date));
}

// Utility function to generate subject performance data
function generateSubjectPerformance(
  currentAttempts: AttemptWithQuiz[], 
  previousAttempts: AttemptWithQuiz[]
): SubjectPerformanceData[] {
  // Group current attempts by subject
  const subjectMap = new Map<string, { subject: string, totalScore: number, count: number }>();

  currentAttempts.forEach(attempt => {
    if (!attempt.score || !attempt.quiz.category) return;
    
    const subject = attempt.quiz.category;
    
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        subject,
        totalScore: attempt.score,
        count: 1
      });
    } else {
      const existingData = subjectMap.get(subject)!;
      subjectMap.set(subject, {
        ...existingData,
        totalScore: existingData.totalScore + attempt.score,
        count: existingData.count + 1
      });
    }
  });

  // Group previous attempts by subject
  const previousSubjectMap = new Map<string, { subject: string, totalScore: number, count: number }>();
  
  previousAttempts.forEach(attempt => {
    if (!attempt.score || !attempt.quiz.category) return;
    
    const subject = attempt.quiz.category;
    
    if (!previousSubjectMap.has(subject)) {
      previousSubjectMap.set(subject, {
        subject,
        totalScore: attempt.score,
        count: 1
      });
    } else {
      const existingData = previousSubjectMap.get(subject)!;
      previousSubjectMap.set(subject, {
        ...existingData,
        totalScore: existingData.totalScore + attempt.score,
        count: existingData.count + 1
      });
    }
  });

  // Calculate average scores and trends
  return Array.from(subjectMap.values()).map(data => {
    const averageScore = parseFloat((data.totalScore / data.count).toFixed(1));
    
    // Calculate trend if we have previous data for this subject
    let trend = null;
    if (previousSubjectMap.has(data.subject)) {
      const previousData = previousSubjectMap.get(data.subject)!;
      const previousAverage = previousData.totalScore / previousData.count;
      trend = parseFloat((averageScore - previousAverage).toFixed(1));
    }
    
    return {
      subject: data.subject,
      averageScore,
      assessmentCount: data.count,
      trend
    };
  }).sort((a, b) => b.averageScore - a.averageScore); // Sort by average score (highest first)
}

// Utility function to get the best subject
function getBestSubject(subjectPerformance: SubjectPerformanceData[]) {
  if (!subjectPerformance.length) {
    return { name: "N/A", score: 0 };
  }
  
  const best = subjectPerformance[0]; // Already sorted by score
  return { name: best.subject, score: best.averageScore };
}

// Utility function to get the most improved subject
function getMostImprovedSubject(subjectPerformance: SubjectPerformanceData[]) {
  // Filter to subjects that have a positive trend value (improvement)
  const subjectsWithImprovement = subjectPerformance.filter(subject => 
    subject.trend !== null && subject.trend > 0
  );
  
  if (!subjectsWithImprovement.length) {
    return null;
  }
  
  // Sort by trend value (highest improvement first)
  const mostImproved = subjectsWithImprovement.sort((a, b) => 
    (b.trend as number) - (a.trend as number)
  )[0];
  
  return { 
    name: mostImproved.subject, 
    improvement: mostImproved.trend as number
  };
}

// Utility function to get a human-readable label for the time frame
function getTimeFrameLabel(timeFrame: string): string {
  switch (timeFrame) {
    case "last7days": return "last 7 days";
    case "last30days": return "last 30 days";
    case "last90days": return "last 90 days";
    case "last6months": return "last 6 months";
    case "lastYear": return "last year";
    case "allTime": return "all time";
    default: return timeFrame;
  }
} 