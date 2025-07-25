import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { 
  subDays,
  subMonths,
  subYears, 
  format, 
  parseISO 
} from "date-fns";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Replace removed utility functions with inline versions
function createApiResponse<T>(options: { status?: number; data: T }) {
  return NextResponse.json(
    { success: true, data: options.data },
    { status: options.status || 200 }
  );
}

function createApiErrorResponse(options: { status?: number; message: string }) {
  return NextResponse.json(
    { success: false, message: options.message },
    { status: options.status || 400 }
  );
}

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
    const subjectFilter = searchParams.get("subject") || undefined;
    
    // Get date range based on time frame
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
      case "last3months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "last6months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "last12months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
    }
    
    // Get all completed quiz attempts
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: userId,
        completedAt: {
          gte: startDate,
          lte: now,
        },
        ...(subjectFilter && {
          quiz: {
            category: {
              equals: subjectFilter,
              mode: "insensitive",
            }
          }
        })
      },
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
            isCorrect: true,
            score: true,
          }
        }
      },
      orderBy: {
        completedAt: "asc",
      }
    });
    
    // Group attempts by quiz ID and select only the best attempt for each quiz
    const bestAttemptsByQuiz: Map<string, any> = new Map();
    
    quizAttempts.forEach(attempt => {
      const quizId = attempt.quiz.id;
      // Calculate score for this attempt
      const totalQuestions = attempt.answers.length;
      const scoreSum = attempt.answers.reduce((sum: number, answer: any) => sum + (answer.score || 0), 0);
      const scorePercentage = totalQuestions > 0 ? (scoreSum / totalQuestions) * 100 : 0;
      
      // Store score on the attempt object for easier comparison
      const attemptWithScore = {
        ...attempt,
        calculatedScore: scorePercentage
      };
      
      // If we don't have an attempt for this quiz yet, or this attempt has a higher score
      if (!bestAttemptsByQuiz.has(quizId) || 
          bestAttemptsByQuiz.get(quizId).calculatedScore < attemptWithScore.calculatedScore) {
        bestAttemptsByQuiz.set(quizId, attemptWithScore);
      }
    });
    
    // Convert map to array of best attempts
    const bestAttempts = Array.from(bestAttemptsByQuiz.values());
    
    // Calculate overall stats
    const totalAssessments = bestAttempts.length;
    
    // Calculate average score
    let totalScore = 0;
    let totalMaxScore = 0;
    
    bestAttempts.forEach(attempt => {
      // Sum up all correct answers scores
      const attemptScore = attempt.answers.reduce((sum: number, answer: any) => sum + (answer.score || 0), 0);
      totalScore += attemptScore;
      
      // Calculate max possible score for this attempt (assuming each question is worth 1 point)
      // This is a simplification; would need to get actual max scores from questions
      totalMaxScore += attempt.answers.length;
    });
    
    const averageScore = totalAssessments > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    
    // Generate time series data for score trends
    const timeSeriesData = generateTimeSeriesData(bestAttempts, timeFrame);
    
    // Calculate subject performance
    const subjectPerformance = calculateSubjectPerformance(bestAttempts);
    
    // Calculate completion data
    const completionData = calculateCompletionData(bestAttempts, subjectPerformance);
    
    // Get the list of all subjects for filtering
    const allSubjects = [...new Set(bestAttempts.map(attempt => 
      attempt.quiz.category || "Uncategorized"
    ))];
    
    // For previous period comparison (basic implementation)
    // This would ideally compare with the previous equivalent time period
    const previousPeriodStart = new Date(startDate);
    const timeFrameDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - timeFrameDays);
    
    const previousPeriodAttempts = await db.quizAttempt.findMany({
      where: {
        userId: userId,
        completedAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
      include: {
        quiz: {
          select: {
            id: true,
          }
        },
        answers: {
          select: {
            score: true,
          }
        }
      }
    });
    
    // Group previous period attempts by quiz ID and select only the best attempt for each quiz
    const prevBestAttemptsByQuiz: Map<string, any> = new Map();
    
    previousPeriodAttempts.forEach(attempt => {
      const quizId = attempt.quiz.id;
      // Calculate score for this attempt
      const totalQuestions = attempt.answers.length;
      const scoreSum = attempt.answers.reduce((sum: number, answer: any) => sum + (answer.score || 0), 0);
      const scorePercentage = totalQuestions > 0 ? (scoreSum / totalQuestions) * 100 : 0;
      
      // Store score on the attempt object for easier comparison
      const attemptWithScore = {
        ...attempt,
        calculatedScore: scorePercentage
      };
      
      // If we don't have an attempt for this quiz yet, or this attempt has a higher score
      if (!prevBestAttemptsByQuiz.has(quizId) || 
          prevBestAttemptsByQuiz.get(quizId).calculatedScore < attemptWithScore.calculatedScore) {
        prevBestAttemptsByQuiz.set(quizId, attemptWithScore);
      }
    });
    
    // Convert map to array of best previous attempts
    const bestPreviousAttempts = Array.from(prevBestAttemptsByQuiz.values());
    
    let previousAverageScore = null;
    let improvement = null;
    
    if (bestPreviousAttempts.length > 0) {
      let prevTotalScore = 0;
      let prevTotalMaxScore = 0;
      
      bestPreviousAttempts.forEach(attempt => {
        const attemptScore = attempt.answers.reduce((sum: number, answer: any) => sum + (answer.score || 0), 0);
        prevTotalScore += attemptScore;
        prevTotalMaxScore += attempt.answers.length;
      });
      
      previousAverageScore = (prevTotalScore / prevTotalMaxScore) * 100;
      improvement = averageScore - previousAverageScore;
    }
    
    const overallStats = {
      averageScore: parseFloat(averageScore.toFixed(1)),
      previousAverageScore: previousAverageScore !== null ? parseFloat(previousAverageScore.toFixed(1)) : null,
      improvement: improvement !== null ? parseFloat(improvement.toFixed(1)) : null,
      totalAssessments,
      currentPeriodLabel: formatTimeFrameLabel(timeFrame),
      previousPeriodLabel: previousAverageScore !== null ? `Previous ${formatTimeFrameLabel(timeFrame)}` : null,
    };
    
    // Return analytics data
    return createApiResponse<any>({
      status: 200,
      data: {
        overallStats,
        timeSeriesData,
        subjectPerformance,
        completionData,
        allSubjects,
        timeFrame,
      },
    });
    
  } catch (error) {
    console.error("Error fetching results analytics:", error);
    return createApiErrorResponse({
      status: 500,
      message: "Failed to fetch results analytics",
    });
  }
}

// Helper functions
function generateTimeSeriesData(attempts: any[], timeFrame: string) {
  if (attempts.length === 0) return [];
  
  const data: {date: string, averageScore: number, assessmentCount: number}[] = [];
  const dateScoreMap = new Map<string, {total: number, count: number}>();
  
  // Format for date grouping based on time frame
  let dateFormat: (date: Date) => string;
  
  switch (timeFrame) {
    case "last7days":
      // Group by day
      dateFormat = (date) => date.toISOString().split('T')[0];
      break;
    case "last30days":
      // Group by day
      dateFormat = (date) => date.toISOString().split('T')[0];
      break;
    case "last3months":
    case "last6months":
      // Group by week
      dateFormat = (date) => {
        const year = date.getFullYear();
        const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
        const month = date.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}-W${weekNumber}`;
      };
      break;
    case "last12months":
      // Group by month
      dateFormat = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}`;
      };
      break;
    default:
      dateFormat = (date) => date.toISOString().split('T')[0];
  }
  
  // Aggregate scores by date
  attempts.forEach(attempt => {
    if (!attempt.completedAt) return;
    
    const completedAt = new Date(attempt.completedAt);
    const dateKey = dateFormat(completedAt);
    
    // Calculate score for this attempt
    const totalQuestions = attempt.answers.length;
    const correctAnswers = attempt.answers.filter((a: any) => a.isCorrect).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    // Add to map
    if (!dateScoreMap.has(dateKey)) {
      dateScoreMap.set(dateKey, { total: score, count: 1 });
    } else {
      const current = dateScoreMap.get(dateKey)!;
      dateScoreMap.set(dateKey, {
        total: current.total + score,
        count: current.count + 1
      });
    }
  });
  
  // Convert map to array and calculate averages
  dateScoreMap.forEach((value, key) => {
    data.push({
      date: key,
      averageScore: parseFloat((value.total / value.count).toFixed(1)),
      assessmentCount: value.count
    });
  });
  
  // Sort by date
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

function calculateSubjectPerformance(attempts: any[]) {
  const subjectMap = new Map<string, {
    totalScore: number,
    totalQuestions: number,
    count: number,
    prevTotalScore: number,
    prevCount: number
  }>();
  
  const midpoint = Math.floor(attempts.length / 2);
  
  attempts.forEach((attempt, index) => {
    const subject = attempt.quiz.category || "Uncategorized";
    const totalQuestions = attempt.answers.length;
    const correctAnswers = attempt.answers.filter((a: any) => a.isCorrect).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    // Determine if this attempt is in first or second half of time period
    // to calculate basic trend
    const isPrevHalf = index < midpoint;
    
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        totalScore: isPrevHalf ? 0 : score,
        totalQuestions: isPrevHalf ? 0 : totalQuestions,
        count: isPrevHalf ? 0 : 1,
        prevTotalScore: isPrevHalf ? score : 0,
        prevCount: isPrevHalf ? 1 : 0
      });
    } else {
      const current = subjectMap.get(subject)!;
      
      if (isPrevHalf) {
        subjectMap.set(subject, {
          ...current,
          prevTotalScore: current.prevTotalScore + score,
          prevCount: current.prevCount + 1
        });
      } else {
        subjectMap.set(subject, {
          ...current,
          totalScore: current.totalScore + score,
          totalQuestions: current.totalQuestions + totalQuestions,
          count: current.count + 1
        });
      }
    }
  });
  
  // Convert map to array and calculate averages
  const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const averageScore = data.count > 0 ? data.totalScore / data.count : 0;
    const prevAverageScore = data.prevCount > 0 ? data.prevTotalScore / data.prevCount : null;
    
    // Calculate trend (percentage change)
    let trend = null;
    if (prevAverageScore !== null && prevAverageScore > 0) {
      trend = ((averageScore - prevAverageScore) / prevAverageScore) * 100;
    }
    
    return {
      subject,
      averageScore: parseFloat(averageScore.toFixed(1)),
      assessmentCount: data.count,
      trend: trend !== null ? parseFloat(trend.toFixed(1)) : null
    };
  });
  
  // Sort by average score
  return subjectPerformance.sort((a, b) => b.averageScore - a.averageScore);
}

function calculateCompletionData(attempts: any[], subjectPerformance: any[]) {
  // Get total number of assessments
  const totalQuizzes = attempts.length;
  
  // Count completed quizzes (all attempts that have completedAt)
  const completedQuizzes = attempts.filter(attempt => attempt.completedAt).length;
  
  // Calculate completion rate
  const completionRate = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
  
  // Find best subject
  let bestSubject = {
    name: "None",
    score: 0
  };
  
  if (subjectPerformance.length > 0) {
    const best = subjectPerformance[0];
    bestSubject = {
      name: best.subject,
      score: best.averageScore
    };
  }
  
  // Find most improved subject
  let mostImprovedSubject;
  
  const improvedSubjects = subjectPerformance
    .filter(s => s.trend !== null && s.trend > 0)
    .sort((a, b) => b.trend! - a.trend!);
  
  if (improvedSubjects.length > 0) {
    mostImprovedSubject = {
      name: improvedSubjects[0].subject,
      improvement: improvedSubjects[0].trend!
    };
  }
  
  return {
    totalQuizzes,
    completedQuizzes,
    completionRate: parseFloat(completionRate.toFixed(1)),
    bestSubject,
    ...(mostImprovedSubject && { mostImprovedSubject })
  };
}

function formatTimeFrameLabel(timeFrame: string): string {
  switch (timeFrame) {
    case "last7days": return "Last 7 days";
    case "last30days": return "Last 30 days";
    case "last3months": return "Last 3 months";
    case "last6months": return "Last 6 months";
    case "last12months": return "Last 12 months";
    default: return "Last 30 days";
  }
}