import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { format, subMonths, subDays, parseISO, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, addDays, isBefore, differenceInDays, subWeeks } from "date-fns";
import { QuizAttempt, Prisma } from "@prisma/client";

// Kiểu dữ liệu cho QuizAttempt đã được thêm include
type QuizAttemptWithQuiz = QuizAttempt & {
  quiz: {
    title: string;
    category?: string; // category thay cho subject vì trong schema không có subject
  }
};

// Interface cho request query parameters
interface ScoreAnalyticsQueryParams {
  timeFrame?: string; // last7days, last30days, last90days, last6months, lastYear, allTime
  subject?: string;
  minScore?: string;
  maxScore?: string;
  includePublicQuizzes?: boolean;
}

// Response utilities
interface SuccessResponseOptions {
  headers?: Record<string, string>;
}

/**
 * Utility function to create consistent API responses
 */
function createApiResponse<T>(data: T, options: SuccessResponseOptions = {}) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    {
      headers: options.headers || {}
    }
  );
}

/**
 * Cấu hình cache cho response
 */
export const dynamic = 'force-dynamic'; // Opt out of static rendering
export const revalidate = 3600; // Revalidate every hour

/**
 * Response data types that match the frontend expectations
 */
interface OverallScoreStats {
  averageScore: number;
  previousAverageScore: number | null;
  improvement: number | null;
  totalAssessments: number;
  currentPeriodLabel: string;
  previousPeriodLabel: string | null;
}

interface TimePointScoreData {
  date: string; // ISO YYYY-MM-DD
  averageScore: number;
  assessmentCount: number;
}

interface SubjectScorePerformance {
  subject: string;
  averageScore: number;
  assessmentCount: number;
}

interface ScoreAnalyticsData {
  overallStats: OverallScoreStats;
  timeSeriesData: TimePointScoreData[];
  subjectPerformance: SubjectScorePerformance[];
}

/**
 * GET /api/users/me/score-analytics
 * 
 * Fetches score analytics data for the current authenticated student
 * Supports filtering by timeFrame (last7days, last30days, last90days, allTime)
 * Returns data formatted according to the ScoreAnalyticsData interface
 */
export async function GET(req: NextRequest) {
  try {
    // Parse request URL for query parameters
    const { searchParams } = new URL(req.url);
    const queryParams: ScoreAnalyticsQueryParams = {
      timeFrame: searchParams.get('timeFrame') || 'last30days',
      subject: searchParams.get('subject') || undefined,
      minScore: searchParams.get('minScore') || undefined,
      maxScore: searchParams.get('maxScore') || undefined,
      includePublicQuizzes: searchParams.get('includePublicQuizzes') === 'true',
    };

    // Get the current session to identify the user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if the user has the student role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Only students can access this endpoint" },
        { status: 403 }
      );
    }

    // Get date ranges for current and previous periods based on timeFrame
    const { currentStartDate, currentEndDate, previousStartDate, previousEndDate, currentPeriodLabel, previousPeriodLabel } = getDateRanges(queryParams.timeFrame);
    
    // Calculate the appropriate time grouping based on the timeFrame
    const timeGrouping = getTimeGrouping(queryParams.timeFrame);
    
    // Build filters
    const currentPeriodFilter = {
      userId,
      completedAt: { 
        not: null,
        gte: currentStartDate,
        lte: currentEndDate
      }
    };
    
    const previousPeriodFilter = {
      userId,
      completedAt: { 
        not: null,
        gte: previousStartDate,
        lte: previousEndDate
      }
    };
    
    // Add score filter if provided
    let scoreFilter = {};
    if (queryParams.minScore || queryParams.maxScore) {
      scoreFilter = {
        score: {
          ...(queryParams.minScore && { gte: parseFloat(queryParams.minScore) }),
          ...(queryParams.maxScore && { lte: parseFloat(queryParams.maxScore) }),
        }
      };
    }
    
    // Build category filter if provided
    let categoryFilter = {};
    if (queryParams.subject) {
      categoryFilter = {
        quiz: {
          category: { equals: queryParams.subject }
        }
      };
    }
    
    // Combine all filters
    const currentPeriodWhereClause = {
      ...currentPeriodFilter,
      ...scoreFilter,
      ...categoryFilter
    };
    
    const previousPeriodWhereClause = {
      ...previousPeriodFilter,
      ...scoreFilter,
      ...categoryFilter
    };
    
    // 1. Fetch ALL completed attempts within current period for accurate analytics
    // (not limited by pagination, we need all data for proper calculations)
    const currentPeriodAttempts = await prisma.quizAttempt.findMany({
      where: currentPeriodWhereClause,
      include: {
        quiz: {
          select: {
            title: true,
            category: true,
            isPublic: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    }) as (QuizAttemptWithQuiz & { quiz: { isPublic?: boolean } })[];
    
    // Filter attempts based on quiz visibility setting (include or exclude public quizzes)
    const filteredAttempts = queryParams.includePublicQuizzes
      ? currentPeriodAttempts
      : currentPeriodAttempts.filter(attempt => !attempt.quiz?.isPublic);

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Score Analytics API] User: ${userId}`);
      console.log(`[Score Analytics API] Time frame: ${queryParams.timeFrame}`);
      console.log(`[Score Analytics API] Include public quizzes: ${queryParams.includePublicQuizzes}`);
      console.log(`[Score Analytics API] Total attempts found: ${currentPeriodAttempts.length}`);
      console.log(`[Score Analytics API] Filtered attempts: ${filteredAttempts.length}`);
      console.log(`[Score Analytics API] Public quiz attempts filtered out: ${currentPeriodAttempts.length - filteredAttempts.length}`);
    }

    if (!filteredAttempts.length) {
      console.log(`[Score Analytics API] No data found for user ${userId} in timeframe ${queryParams.timeFrame}`);
      return NextResponse.json(
        {
          success: true,
          data: {
            overallStats: {
              averageScore: 0,
              previousAverageScore: null,
              improvement: null,
              totalAssessments: 0,
              currentPeriodLabel,
              previousPeriodLabel
            },
            timeSeriesData: [],
            subjectPerformance: []
          }
        },
        {
        headers: {
          'Cache-Control': 'max-age=3600, s-maxage=3600'
          }
        }
      );
    }

    // 2. Calculate overall stats
    const overallStats = await calculateOverallStats(
      userId, 
      currentStartDate, currentEndDate, 
      previousStartDate, previousEndDate,
      currentPeriodLabel, previousPeriodLabel,
      currentPeriodWhereClause, previousPeriodWhereClause
    );
    
    // 3. Generate time series data
    const timeSeriesData = generateTimeSeriesData(filteredAttempts, timeGrouping, currentStartDate, currentEndDate);
    
    // 4. Calculate subject performance
    const subjectPerformance = calculateSubjectPerformance(filteredAttempts);
    
    // 5. Combine all data into the final response
    const analyticsData: ScoreAnalyticsData = {
      overallStats,
      timeSeriesData,
      subjectPerformance,
    };

    // Debug logging for successful response
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Score Analytics API] Successful response for user ${userId}:`);
      console.log(`[Score Analytics API] - Average score: ${overallStats.averageScore}`);
      console.log(`[Score Analytics API] - Total assessments: ${overallStats.totalAssessments}`);
      console.log(`[Score Analytics API] - Time series data points: ${timeSeriesData.length}`);
      console.log(`[Score Analytics API] - Subject performance entries: ${subjectPerformance.length}`);
    }

    // Return the data with appropriate cache headers
    return createApiResponse(analyticsData, {
      headers: {
        'Cache-Control': 'max-age=3600, s-maxage=3600'
      }
    });
    
  } catch (err) {
    console.error("Error fetching score analytics:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch score analytics data" },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall statistics for both current and previous periods
 * Uses best attempt per quiz to avoid inflated counts from practice attempts
 */
async function calculateOverallStats(
  userId: string,
  currentStartDate: Date,
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date,
  currentPeriodLabel: string,
  previousPeriodLabel: string | null,
  currentPeriodWhereClause: any,
  previousPeriodWhereClause: any
): Promise<OverallScoreStats> {
  // Get current period attempts with quiz info
  const currentPeriodAttempts = await prisma.quizAttempt.findMany({
    where: currentPeriodWhereClause,
    select: {
      score: true,
      quizId: true,
    },
  });

  // Group by quiz and get best score for each unique quiz
  const quizBestScores = new Map<string, number>();

  currentPeriodAttempts.forEach(attempt => {
    if (attempt.score !== null) {
      const currentBest = quizBestScores.get(attempt.quizId) || 0;
      if (attempt.score > currentBest) {
        quizBestScores.set(attempt.quizId, attempt.score);
      }
    }
  });

  const currentPeriodScores = Array.from(quizBestScores.values());

  const averageScore = currentPeriodScores.length > 0
    ? currentPeriodScores.reduce((sum, score) => sum + score, 0) / currentPeriodScores.length
    : 0;

  // Count unique quizzes, not total attempts
  const totalAssessments = quizBestScores.size;
  
  // Get previous period stats (if applicable)
  let previousAverageScore: number | null = null;
  let improvement: number | null = null;

  if (previousStartDate && previousEndDate) {
    const previousPeriodAttempts = await prisma.quizAttempt.findMany({
      where: previousPeriodWhereClause,
      select: {
        score: true,
        quizId: true,
      },
    });

    // Group by quiz and get best score for each unique quiz in previous period
    const previousQuizBestScores = new Map<string, number>();

    previousPeriodAttempts.forEach(attempt => {
      if (attempt.score !== null) {
        const currentBest = previousQuizBestScores.get(attempt.quizId) || 0;
        if (attempt.score > currentBest) {
          previousQuizBestScores.set(attempt.quizId, attempt.score);
        }
      }
    });

    const previousPeriodScores = Array.from(previousQuizBestScores.values());

    previousAverageScore = previousPeriodScores.length > 0
      ? previousPeriodScores.reduce((sum, score) => sum + score, 0) / previousPeriodScores.length
      : null;

    // Calculate improvement percentage if we have both scores
    if (previousAverageScore !== null && previousAverageScore > 0) {
      improvement = ((averageScore - previousAverageScore) / previousAverageScore) * 100;
    }
  }
  
  return {
    averageScore,
    previousAverageScore,
    improvement,
    totalAssessments,
    currentPeriodLabel,
    previousPeriodLabel,
  };
}

/**
 * Generate time series data with appropriate granularity based on selected timeFrame
 * Uses best attempt per quiz per time period to avoid inflated counts
 */
function generateTimeSeriesData(
  attempts: QuizAttemptWithQuiz[],
  grouping: 'day' | 'week' | 'month',
  startDate: Date,
  endDate: Date
): TimePointScoreData[] {
  // Group attempts by the specified time unit and quiz
  const groupedAttempts = new Map<string, Map<string, { bestScore: number, hasAttempt: boolean }>>();

  // Generate all time points in the range (even with no data)
  const allTimePoints: string[] = [];
  let currentDate = new Date(startDate);

  while (isBefore(currentDate, endDate) || format(currentDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
    let timePoint: string;

    if (grouping === 'day') {
      timePoint = format(currentDate, 'yyyy-MM-dd');
      currentDate = addDays(currentDate, 1);
    } else if (grouping === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as week start
      timePoint = format(weekStart, 'yyyy-MM-dd');
      currentDate = addDays(currentDate, 7);
    } else { // month
      const monthStart = startOfMonth(currentDate);
      timePoint = format(monthStart, 'yyyy-MM');
      currentDate = addDays(endOfMonth(currentDate), 1);
    }

    if (!groupedAttempts.has(timePoint)) {
      groupedAttempts.set(timePoint, new Map());
    }

    allTimePoints.push(timePoint);
  }

  // Process attempts into the grouped structure, tracking best score per quiz per time period
  for (const attempt of attempts) {
    if (!attempt.completedAt || !attempt.score) continue;

    const attemptDate = new Date(attempt.completedAt);
    let timePoint: string;

    if (grouping === 'day') {
      timePoint = format(attemptDate, 'yyyy-MM-dd');
    } else if (grouping === 'week') {
      const weekStart = startOfWeek(attemptDate, { weekStartsOn: 1 }); // Monday as week start
      timePoint = format(weekStart, 'yyyy-MM-dd');
    } else { // month
      timePoint = format(attemptDate, 'yyyy-MM');
    }

    if (!groupedAttempts.has(timePoint)) {
      groupedAttempts.set(timePoint, new Map());
    }

    const timeGroup = groupedAttempts.get(timePoint)!;
    const quizId = attempt.quizId;

    if (!timeGroup.has(quizId)) {
      timeGroup.set(quizId, { bestScore: attempt.score, hasAttempt: true });
    } else {
      const existing = timeGroup.get(quizId)!;
      if (attempt.score > existing.bestScore) {
        existing.bestScore = attempt.score;
      }
    }
  }
  
  // Convert the grouped data to the expected output format
  const result: TimePointScoreData[] = allTimePoints
    .filter((timePoint, index, self) => self.indexOf(timePoint) === index) // Remove duplicates
    .map(timePoint => {
      const timeGroup = groupedAttempts.get(timePoint)!;
      const quizScores = Array.from(timeGroup.values()).map(quiz => quiz.bestScore);

      const averageScore = quizScores.length > 0
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
        : 0;

      return {
        date: timePoint,
        averageScore,
        assessmentCount: quizScores.length, // Count unique quizzes, not total attempts
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date)); // Ensure chronological order

  return result;
}

/**
 * Calculate performance metrics by subject (category)
 * Uses best attempt per quiz to avoid inflated counts from practice attempts
 */
function calculateSubjectPerformance(attempts: QuizAttemptWithQuiz[]): SubjectScorePerformance[] {
  // Group attempts by subject and quiz, tracking best score per quiz
  const subjectMap = new Map<string, Map<string, number>>();

  for (const attempt of attempts) {
    if (!attempt.score) continue;

    const subject = attempt.quiz?.category || "Unknown";
    const quizId = attempt.quizId;

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, new Map());
    }

    const subjectQuizzes = subjectMap.get(subject)!;

    if (!subjectQuizzes.has(quizId)) {
      subjectQuizzes.set(quizId, attempt.score);
    } else {
      const currentBest = subjectQuizzes.get(quizId)!;
      if (attempt.score > currentBest) {
        subjectQuizzes.set(quizId, attempt.score);
      }
    }
  }

  // Convert the grouped data to the expected output format
  const result: SubjectScorePerformance[] = Array.from(subjectMap.entries())
    .map(([subject, quizScores]) => {
      const scores = Array.from(quizScores.values());
      const averageScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      return {
        subject,
        averageScore,
        assessmentCount: scores.length, // Count unique quizzes, not total attempts
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore); // Sort by score (highest first)

  return result;
}

/**
 * Determine the appropriate time grouping based on the timeFrame
 */
function getTimeGrouping(timeFrame?: string): 'day' | 'week' | 'month' {
  switch (timeFrame) {
    case 'last7days':
    case 'last30days':
      return 'day';
    case 'last90days':
      return 'week';
    case 'last6months':
    case 'lastYear':
    case 'allTime':
    default:
      return 'month';
  }
}

/**
 * Calculate date ranges based on timeFrame
 */
function getDateRanges(timeFrame?: string) {
  const now = new Date();
  let currentStartDate: Date;
  let currentEndDate: Date = now;
  let previousStartDate: Date;
  let previousEndDate: Date;
  let currentPeriodLabel: string;
  let previousPeriodLabel: string | null = null;
  
  switch (timeFrame) {
    case 'last7days':
      currentStartDate = subDays(now, 7);
      previousStartDate = subDays(currentStartDate, 7);
      previousEndDate = subDays(now, 8);
      currentPeriodLabel = 'Last 7 Days';
      previousPeriodLabel = 'Previous 7 Days';
      break;
    case 'last30days':
      currentStartDate = subDays(now, 30);
      previousStartDate = subDays(currentStartDate, 30);
      previousEndDate = subDays(now, 31);
      currentPeriodLabel = 'Last 30 Days';
      previousPeriodLabel = 'Previous 30 Days';
      break;
    case 'last90days':
      currentStartDate = subDays(now, 90);
      previousStartDate = subDays(currentStartDate, 90);
      previousEndDate = subDays(now, 91);
      currentPeriodLabel = 'Last 3 Months';
      previousPeriodLabel = 'Previous 3 Months';
      break;
    case 'last6months':
      currentStartDate = subMonths(now, 6);
      previousStartDate = subMonths(currentStartDate, 6);
      previousEndDate = subDays(currentStartDate, 1);
      currentPeriodLabel = 'Last 6 Months';
      previousPeriodLabel = 'Previous 6 Months';
      break;
    case 'lastYear':
      currentStartDate = subMonths(now, 12);
      previousStartDate = subMonths(currentStartDate, 12);
      previousEndDate = subDays(currentStartDate, 1);
      currentPeriodLabel = 'Last Year';
      previousPeriodLabel = 'Previous Year';
      break;
    case 'allTime':
      currentStartDate = subMonths(now, 24); // Show up to 2 years of data
      previousStartDate = new Date(0); // Use epoch time instead of null
      previousEndDate = new Date(0); // Use epoch time instead of null
      currentPeriodLabel = 'All Time';
      previousPeriodLabel = null;
      break;
    default:
      // Default to last 30 days
      currentStartDate = subDays(now, 30);
      previousStartDate = subDays(currentStartDate, 30);
      previousEndDate = subDays(currentStartDate, 1);
      currentPeriodLabel = 'Last 30 Days';
      previousPeriodLabel = 'Previous 30 Days';
  }
  
  return {
    currentStartDate,
    currentEndDate,
    previousStartDate,
    previousEndDate,
    currentPeriodLabel,
    previousPeriodLabel
  };
} 