import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma, QuizAttempt } from "@prisma/client";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  subMonths, 
  format, 
  parseISO,
  differenceInDays
} from "date-fns";

// Define types for response data
export interface TimeBasedProgressItem {
  date: string;
  attemptCount: number;
  averageScore: number;
  totalScore: number;
  totalQuestions: number;
  correctQuestions: number;
}

export interface SubjectPerformanceItem {
  subject: string;
  attemptCount: number;
  totalScore: number;
  averageScore: number;
  totalQuestions: number;
  correctQuestions: number;
  improvement: number | null;
}

export interface ImprovementTrendsData {
  overall: number | null;
  bySubject: Array<{
    subject: string;
    improvement: number;
    earlyAverage: number;
    lateAverage: number;
  }>;
}

export interface LearningHabitsData {
  mostActiveDay: {
    day: string;
    count: number;
  };
  mostActiveHour: {
    hour: number;
    formattedTime: string;
    count: number;
  };
  dayDistribution: Array<{
    day: string;
    count: number;
  }>;
  hourDistribution: Array<{
    hour: number;
    formattedTime: string;
    count: number;
  }>;
}

export interface ImprovementAreasData {
  subjects: Array<{
    subject: string;
    averageScore: number;
    scoreDifference: number;
  }>;
  averageScore: number;
}

export interface StrengthsData {
  subjects: Array<{
    subject: string;
    averageScore: number;
    scoreDifference: number;
  }>;
  averageScore: number;
}

export interface LearningProgressResponse {
  totalAttempts: number;
  timeFrame: string;
  progressByTime: TimeBasedProgressItem[];
  subjectPerformance: SubjectPerformanceItem[];
  improvementTrends: ImprovementTrendsData;
  learningHabits: LearningHabitsData;
  improvementAreas: ImprovementAreasData;
  strengths: StrengthsData;
}

// Types for the database queries
interface AttemptWithRelations extends QuizAttempt {
  quiz: {
    id: string;
    title: string;
    category: string | null;
    class: {
      id: string;
      name: string;
    } | null;
  };
  answers: Array<{
    id: string;
    isCorrect: boolean | null;
    score: number | null;
  }>;
}

/**
 * API endpoint to get student's learning progress over time.
 * This provides more detailed analytics for progress tracking.
 * 
 * @route GET /api/users/me/learning-progress
 * @query timeFrame - Optional filter for time range (default: "last30days")
 *                   Options: "last7days", "last30days", "last90days", "last6months", "lastYear", "allTime"
 * @query subject - Optional filter for specific subject
 * @returns {Object} Detailed learning progress data
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
    const subject = searchParams.get("subject");
    
    // Calculate date range
    const { startDate, endDate, interval } = getTimeRangeAndInterval(timeFrame);
    
    // Base query for attempts
    const attemptsWhere: Prisma.QuizAttemptWhereInput = {
      userId,
      completedAt: {
        not: null,
        gte: startDate,
        lte: endDate,
      },
      ...(subject && {
        quiz: {
          category: subject,
        }
      })
    };
    
    // Get all quiz attempts in the time range
    const allAttempts = await db.quizAttempt.findMany({
      where: attemptsWhere,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            category: true,
            class: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        answers: {
          select: {
            id: true,
            isCorrect: true,
            score: true,
          }
        }
      },
      orderBy: {
        completedAt: 'asc',
      }
    }) as unknown as AttemptWithRelations[];

    // Group attempts by quiz and get best attempt per quiz for analytics
    const quizBestAttempts = new Map<string, AttemptWithRelations>();

    allAttempts.forEach(attempt => {
      const existingBest = quizBestAttempts.get(attempt.quizId);
      if (!existingBest || (attempt.score || 0) > (existingBest.score || 0)) {
        quizBestAttempts.set(attempt.quizId, attempt);
      }
    });

    // Use best attempts for analytics calculations
    const attempts = Array.from(quizBestAttempts.values());

    // Calculate progress metrics
    const totalAttempts = allAttempts.length; // Keep total for practice tracking
    const uniqueQuizzesCompleted = attempts.length; // Unique quizzes for analytics
    
    // Time-based progress data
    const progressByTime = generateTimeBasedProgress(attempts, startDate, endDate, interval);
    
    // Subject performance aggregation
    const subjectPerformance = calculateSubjectPerformance(attempts);
    
    // Improvement trends
    const improvementTrends = calculateImprovementTrends(attempts, progressByTime);
    
    // Learning habit patterns (e.g., when student usually takes quizzes)
    const learningHabits = analyzeLearningHabits(attempts);
    
    // Personal improvement areas (subjects or quiz types with lower scores)
    const improvementAreas = identifyImprovementAreas(attempts, subjectPerformance);
    
    // Strengths (subjects or quiz types with higher scores)
    const strengths = identifyStrengths(attempts, subjectPerformance);
    
    const responseData: LearningProgressResponse = {
      totalAttempts,
      timeFrame,
      progressByTime,
      subjectPerformance,
      improvementTrends,
      learningHabits,
      improvementAreas,
      strengths
    };
    
    return createApiResponse({
      status: 200,
      data: responseData,
    });
    
  } catch (error) {
    console.error("Error fetching learning progress:", error);
    return createApiErrorResponse({
      status: 500,
      message: "Failed to fetch learning progress data",
    });
  }
}

// Helper function to generate appropriate time intervals based on time frame
function getTimeRangeAndInterval(timeFrame: string): { 
  startDate: Date; 
  endDate: Date; 
  interval: 'day' | 'week' | 'month' 
} {
  const now = new Date();
  let startDate = new Date();
  let interval: 'day' | 'week' | 'month' = "day";
  
  switch (timeFrame) {
    case "last7days":
      startDate = subDays(now, 7);
      interval = "day";
      break;
    case "last30days":
      startDate = subDays(now, 30);
      interval = "day";
      break;
    case "last90days":
      startDate = subDays(now, 90);
      interval = "week";
      break;
    case "last6months":
      startDate = subMonths(now, 6);
      interval = "week";
      break;
    case "lastYear":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      interval = "month";
      break;
    case "allTime":
      startDate = new Date(0); // January 1, 1970
      interval = "month";
      break;
    default:
      startDate = subDays(now, 30);
      interval = "day";
  }
  
  return { startDate, endDate: now, interval };
}

// Helper to generate time-based progress data
function generateTimeBasedProgress(
  attempts: AttemptWithRelations[], 
  startDate: Date, 
  endDate: Date, 
  interval: 'day' | 'week' | 'month'
): TimeBasedProgressItem[] {
  // Group attempts by time periods
  const periodMap = new Map<string, TimeBasedProgressItem>();
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  // Initialize periods based on interval
  if (interval === "day") {
    // For shorter timeframes, track each day
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = format(date, "yyyy-MM-dd");
      periodMap.set(dateKey, {
        date: dateKey,
        attemptCount: 0,
        averageScore: 0,
        totalScore: 0,
        totalQuestions: 0,
        correctQuestions: 0,
      });
    }
  } else if (interval === "week") {
    // Group by weeks
    const weeks = Math.ceil(totalDays / 7);
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekKey = `Week ${i + 1} (${format(weekStart, "MMM d")})`;
      periodMap.set(weekKey, {
        date: weekKey,
        attemptCount: 0,
        averageScore: 0,
        totalScore: 0,
        totalQuestions: 0,
        correctQuestions: 0,
      });
    }
  } else {
    // Group by months
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthKey = format(currentDate, "MMM yyyy");
      periodMap.set(monthKey, {
        date: monthKey,
        attemptCount: 0,
        averageScore: 0,
        totalScore: 0,
        totalQuestions: 0,
        correctQuestions: 0,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }
  
  // Add attempt data to the respective periods
  attempts.forEach(attempt => {
    if (!attempt.completedAt) return;
    
    const attemptDate = new Date(attempt.completedAt);
    let periodKey: string;
    
    if (interval === "day") {
      periodKey = format(attemptDate, "yyyy-MM-dd");
    } else if (interval === "week") {
      const daysSinceStart = differenceInDays(attemptDate, startDate);
      const weekNumber = Math.floor(daysSinceStart / 7);
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (weekNumber * 7));
      periodKey = `Week ${weekNumber + 1} (${format(weekStart, "MMM d")})`;
    } else {
      periodKey = format(attemptDate, "MMM yyyy");
    }
    
    if (periodMap.has(periodKey)) {
      const period = periodMap.get(periodKey)!;
      period.attemptCount += 1;
      
      // Calculate score-related metrics
      const totalQuestions = attempt.answers.length;
      const correctQuestions = attempt.answers.filter(a => a.isCorrect === true).length;
      const attemptScore = attempt.score || (totalQuestions > 0 
        ? (correctQuestions / totalQuestions) * 100 
        : 0);
      
      period.totalScore += attemptScore;
      period.totalQuestions += totalQuestions;
      period.correctQuestions += correctQuestions;
    }
  });
  
  // Calculate averages for each period
  periodMap.forEach(period => {
    if (period.attemptCount > 0) {
      period.averageScore = period.totalScore / period.attemptCount;
    }
  });
  
  return Array.from(periodMap.values());
}

// Helper to calculate subject performance
function calculateSubjectPerformance(attempts: AttemptWithRelations[]): SubjectPerformanceItem[] {
  const subjectMap = new Map<string, SubjectPerformanceItem>();
  
  attempts.forEach(attempt => {
    const subject = attempt.quiz.category || "Uncategorized";
    
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        subject,
        attemptCount: 0,
        totalScore: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctQuestions: 0,
        improvement: null,
      });
    }
    
    const subjectData = subjectMap.get(subject)!;
    subjectData.attemptCount += 1;
    subjectData.totalScore += attempt.score || 0;
    
    // Add question metrics
    const totalQuestions = attempt.answers.length;
    const correctQuestions = attempt.answers.filter(a => a.isCorrect === true).length;
    
    subjectData.totalQuestions += totalQuestions;
    subjectData.correctQuestions += correctQuestions;
  });
  
  // Calculate averages
  subjectMap.forEach(subject => {
    if (subject.attemptCount > 0) {
      subject.averageScore = subject.totalScore / subject.attemptCount;
    }
  });
  
  return Array.from(subjectMap.values());
}

// Helper to calculate improvement trends
function calculateImprovementTrends(
  attempts: AttemptWithRelations[], 
  progressByTime: TimeBasedProgressItem[]
): ImprovementTrendsData {
  // Simple implementation: compare first and last period scores
  if (progressByTime.length < 2) {
    return {
      overall: null,
      bySubject: []
    };
  }
  
  // Filter out periods with no attempts
  const periodsWithData = progressByTime.filter(p => p.attemptCount > 0);
  
  if (periodsWithData.length < 2) {
    return {
      overall: null,
      bySubject: []
    };
  }
  
  const firstPeriod = periodsWithData[0];
  const lastPeriod = periodsWithData[periodsWithData.length - 1];
  
  const scoreDifference = lastPeriod.averageScore - firstPeriod.averageScore;
  
  // Calculate subject improvements
  const subjectMap = new Map<string, {
    early: { count: number, totalScore: number },
    late: { count: number, totalScore: number }
  }>();
  
  // Group attempts by subject and period
  attempts.forEach(attempt => {
    const subject = attempt.quiz.category || "Uncategorized";
    const completedAt = new Date(attempt.completedAt!);
    const period = Math.floor(attempts.length / 2); // Simple approach: divide into first/second half
    
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        early: { count: 0, totalScore: 0 },
        late: { count: 0, totalScore: 0 }
      });
    }
    
    const subjectData = subjectMap.get(subject)!;
    
    if (completedAt < new Date(attempts[period].completedAt!)) {
      // Early period
      subjectData.early.count++;
      subjectData.early.totalScore += attempt.score || 0;
    } else {
      // Late period
      subjectData.late.count++;
      subjectData.late.totalScore += attempt.score || 0;
    }
  });
  
  // Calculate subject improvements
  const subjectImprovements: Array<{
    subject: string;
    improvement: number;
    earlyAverage: number;
    lateAverage: number;
  }> = [];
  
  subjectMap.forEach((data, subject) => {
    const earlyAvg = data.early.count > 0 ? data.early.totalScore / data.early.count : 0;
    const lateAvg = data.late.count > 0 ? data.late.totalScore / data.late.count : 0;
    
    if (data.early.count > 0 && data.late.count > 0) {
      subjectImprovements.push({
        subject,
        improvement: lateAvg - earlyAvg,
        earlyAverage: earlyAvg,
        lateAverage: lateAvg
      });
    }
  });
  
  return {
    overall: scoreDifference,
    bySubject: subjectImprovements
  };
}

// Helper to analyze learning habits
function analyzeLearningHabits(attempts: AttemptWithRelations[]): LearningHabitsData {
  const dayOfWeekCounts = Array(7).fill(0);
  const hourOfDayCounts = Array(24).fill(0);
  
  attempts.forEach(attempt => {
    if (!attempt.completedAt) return;
    
    const date = new Date(attempt.completedAt);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hourOfDay = date.getHours();
    
    dayOfWeekCounts[dayOfWeek]++;
    hourOfDayCounts[hourOfDay]++;
  });
  
  // Find most active day
  const mostActiveDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Find most active hour
  const mostActiveHourIndex = hourOfDayCounts.indexOf(Math.max(...hourOfDayCounts));
  
  return {
    mostActiveDay: {
      day: dayNames[mostActiveDayIndex],
      count: dayOfWeekCounts[mostActiveDayIndex]
    },
    mostActiveHour: {
      hour: mostActiveHourIndex,
      formattedTime: `${mostActiveHourIndex.toString().padStart(2, '0')}:00 - ${(mostActiveHourIndex + 1).toString().padStart(2, '0')}:00`,
      count: hourOfDayCounts[mostActiveHourIndex]
    },
    dayDistribution: dayOfWeekCounts.map((count, index) => ({
      day: dayNames[index],
      count
    })),
    hourDistribution: hourOfDayCounts.map((count, index) => ({
      hour: index,
      formattedTime: `${index.toString().padStart(2, '0')}:00`,
      count
    }))
  };
}

// Helper to identify improvement areas
function identifyImprovementAreas(
  attempts: AttemptWithRelations[], 
  subjectPerformance: SubjectPerformanceItem[]
): ImprovementAreasData {
  // Find subjects with below-average scores
  const allScores = subjectPerformance.map(s => s.averageScore);
  const averageScore = allScores.length > 0 
    ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
    : 0;
  
  const improvementSubjects = subjectPerformance
    .filter(s => s.averageScore < averageScore)
    .sort((a, b) => a.averageScore - b.averageScore) // Sort by lowest scores first
    .map(s => ({
      subject: s.subject,
      averageScore: s.averageScore,
      scoreDifference: averageScore - s.averageScore
    }));
  
  return {
    subjects: improvementSubjects,
    averageScore,
  };
}

// Helper to identify strengths
function identifyStrengths(
  attempts: AttemptWithRelations[], 
  subjectPerformance: SubjectPerformanceItem[]
): StrengthsData {
  // Find subjects with above-average scores
  const allScores = subjectPerformance.map(s => s.averageScore);
  const averageScore = allScores.length > 0 
    ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
    : 0;
  
  const strengthSubjects = subjectPerformance
    .filter(s => s.averageScore >= averageScore)
    .sort((a, b) => b.averageScore - a.averageScore) // Sort by highest scores first
    .map(s => ({
      subject: s.subject,
      averageScore: s.averageScore,
      scoreDifference: s.averageScore - averageScore
    }));
  
  return {
    subjects: strengthSubjects,
    averageScore,
  };
}

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