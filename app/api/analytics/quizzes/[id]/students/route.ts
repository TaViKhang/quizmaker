import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  errorResponse, 
  notFoundResponse,
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "@/app/api/utils/api-response";
import { API_MESSAGES } from "@/app/api/utils/api-types";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/quizzes/[id]/students
 * Get student performance analytics for a specific quiz
 * This endpoint is restricted to teachers only
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Check if the user is a teacher or admin
    const userRole = session.user.role as string;
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return errorResponse(API_MESSAGES.ANALYTICS.STUDENT_RESTRICTED, {
        status: 403,
        code: "FORBIDDEN",
      });
    }

    // Check if the quiz exists and if the user has permission to view it
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        authorId: true,
        classId: true,
      },
    });

    if (!quiz) {
      return notFoundResponse(API_MESSAGES.NOT_FOUND.QUIZ);
    }

    // Check if the user is the quiz author or a teacher of the class
    const isAuthor = quiz.authorId === session.user.id;
    let isTeacherOfClass = false;

    if (quiz.classId) {
      const classRecord = await prisma.class.findUnique({
        where: { id: quiz.classId },
        select: { teacherId: true },
      });
      isTeacherOfClass = classRecord?.teacherId === session.user.id;
    }

    if (!isAuthor && !isTeacherOfClass) {
      return errorResponse(API_MESSAGES.ANALYTICS.FORBIDDEN, {
        status: 403,
        code: "FORBIDDEN",
      });
    }

    // Get student performance data
    const studentPerformance = await prisma.quizAttempt.findMany({
      where: { 
        quizId: params.id,
        userId: { 
          not: undefined // Only include attempts by registered users
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        score: 'desc'
      }
    });

    // Group attempts by student
    interface StudentStat {
      student: {
        id: string;
        name: string | null;
        email: string | null;
      };
      attempts: Array<{
        id: string;
        score: number | null;
        completedAt: Date | null;
        timeSpent: number | null;
      }>;
      bestScore: number | null;
      averageScore: number | null;
      totalAttempts: number;
      averageTime: number;
    }

    const studentStats = studentPerformance.reduce((acc, attempt) => {
      const userId = attempt.user?.id;
      if (!userId) return acc;
      
      if (!acc[userId]) {
        acc[userId] = {
          student: attempt.user,
          attempts: [],
          bestScore: attempt.score,
          averageScore: attempt.score,
          totalAttempts: 1,
          averageTime: attempt.timeSpent || 0
        };
      } else {
        // Add to existing student record
        acc[userId].attempts.push({
          id: attempt.id,
          score: attempt.score,
          completedAt: attempt.completedAt,
          timeSpent: attempt.timeSpent
        });
        
        acc[userId].totalAttempts += 1;
        
        // Update best score if this attempt is better
        if (attempt.score !== null && (acc[userId].bestScore === null || attempt.score > acc[userId].bestScore)) {
          acc[userId].bestScore = attempt.score;
        }
        
        // Update average score
        const totalScores = acc[userId].attempts.reduce((sum: number, att: any) => 
          sum + (att.score !== null ? att.score : 0), 
          attempt.score !== null ? attempt.score : 0
        );
        acc[userId].averageScore = totalScores / acc[userId].totalAttempts;
        
        // Update average time
        if (attempt.timeSpent) {
          const totalTime = acc[userId].attempts.reduce((sum: number, att: any) => 
            sum + (att.timeSpent || 0), 
            attempt.timeSpent
          );
          acc[userId].averageTime = totalTime / acc[userId].totalAttempts;
        }
      }
      
      return acc;
    }, {} as Record<string, StudentStat>);

    // Calculate class statistics
    const students = Object.values(studentStats);
    const studentCount = students.length;
    
    const classStats = {
      totalStudents: studentCount,
      averageClassScore: studentCount > 0 
        ? students.reduce((sum, student: any) => sum + (student.bestScore || 0), 0) / studentCount 
        : 0,
      highestScore: studentCount > 0
        ? Math.max(...students.map((s: any) => s.bestScore || 0))
        : 0,
      lowestScore: studentCount > 0
        ? Math.min(...students.map((s: any) => s.bestScore || 0))
        : 0,
      medianScore: calculateMedian(students.map((s: any) => s.bestScore || 0)),
      scoreDistribution: calculateScoreDistribution(students.map((s: any) => s.bestScore || 0)),
    };

    return successResponse({
      quizId: params.id,
      quizTitle: quiz.title,
      classStats,
      students: Object.values(studentStats)
    });
  } catch (error: any) {
    console.error("Error fetching student performance analytics:", error);
    return serverErrorResponse("Failed to fetch student performance analytics");
  }
}

/**
 * Calculate the median value of an array of numbers
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

/**
 * Calculate score distribution in buckets
 */
function calculateScoreDistribution(scores: number[]): Record<string, number> {
  const distribution: Record<string, number> = {
    '0-10': 0,
    '11-20': 0,
    '21-30': 0,
    '31-40': 0,
    '41-50': 0,
    '51-60': 0,
    '61-70': 0,
    '71-80': 0,
    '81-90': 0,
    '91-100': 0
  };
  
  scores.forEach(score => {
    if (score <= 10) distribution['0-10']++;
    else if (score <= 20) distribution['11-20']++;
    else if (score <= 30) distribution['21-30']++;
    else if (score <= 40) distribution['31-40']++;
    else if (score <= 50) distribution['41-50']++;
    else if (score <= 60) distribution['51-60']++;
    else if (score <= 70) distribution['61-70']++;
    else if (score <= 80) distribution['71-80']++;
    else if (score <= 90) distribution['81-90']++;
    else distribution['91-100']++;
  });
  
  return distribution;
} 