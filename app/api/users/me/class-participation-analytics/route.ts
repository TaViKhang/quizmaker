import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

// GET method for retrieving class participation analytics
export async function GET(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Verify user is a student
    if (session.user.role !== Role.STUDENT) {
      return NextResponse.json(
        { success: false, error: "Access denied: Student role required" },
        { status: 403 }
      );
    }

    // Get timeFrame parameter from query string
    const { searchParams } = new URL(request.url);
    const timeFrame = searchParams.get('timeFrame') || 'last30days';
    const userId = session.user.id;

    // Determine date ranges based on timeFrame
    const now = new Date();
    let startDate: Date;
    
    switch (timeFrame) {
      case 'last7days':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last90days':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'allTime':
        startDate = new Date(2000, 0, 1); // Far in the past to get everything
        break;
      case 'last30days':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
    }

    // 1. Get all classes joined by the student
    const classEnrollments = await db.classEnrollment.findMany({
      where: {
        studentId: userId,
        class: {
          isActive: true
        }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                quizzes: {
                  where: {
                    isPublished: true,
                    isActive: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const enrolledClassIds = classEnrollments.map(ec => ec.classId);

    // 2. Get quiz attempts for participation over time tracking
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: userId,
        completedAt: {
          not: null,
          gte: startDate
        },
        quiz: {
          classId: {
            in: enrolledClassIds
          },
          isPublished: true
        }
      },
      include: {
        quiz: {
          select: {
            id: true,
            classId: true,
            title: true
          }
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    });

    // 3. Group attempts by quiz and get best attempt per quiz for accurate counting
    const quizBestAttempts = new Map<string, any>();

    quizAttempts.forEach(attempt => {
      const quizId = attempt.quiz.id;
      const existing = quizBestAttempts.get(quizId);

      if (!existing || (attempt.score || 0) > (existing.score || 0)) {
        quizBestAttempts.set(quizId, attempt);
      }
    });

    const uniqueQuizAttempts = Array.from(quizBestAttempts.values());

    // 4. Compute total study time (using unique quizzes completed)
    // For simplicity, we'll estimate based on completed quizzes (10 minutes per quiz)
    const AVERAGE_QUIZ_TIME_SECONDS = 600; // 10 minutes per quiz
    const totalStudyTimeSeconds = uniqueQuizAttempts.length * AVERAGE_QUIZ_TIME_SECONDS;

    // 5. Calculate participation over time (aggregated by week) using unique quizzes
    const participationByWeek = new Map<string, Set<string>>();

    uniqueQuizAttempts.forEach(attempt => {
      if (attempt.completedAt) {
        // Format week as YYYY-MM-DD (using Monday of the week)
        const date = new Date(attempt.completedAt);
        const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)
        const mondayOffset = day === 0 ? -6 : 1 - day; // Calculate days since last Monday
        const monday = new Date(date);
        monday.setDate(date.getDate() + mondayOffset);

        const weekKey = monday.toISOString().split('T')[0];

        if (!participationByWeek.has(weekKey)) {
          participationByWeek.set(weekKey, new Set());
        }
        participationByWeek.get(weekKey)!.add(attempt.quiz.id);
      }
    });

    // Convert to array for response
    const participationOverTime = Array.from(participationByWeek).map(([date, quizSet]) => ({
      date,
      completedQuizzes: quizSet.size // Count unique quizzes per week
    })).sort((a, b) => a.date.localeCompare(b.date)); // Ensure chronological order

    // 6. Calculate class performance breakdown using unique quizzes
    const classPerformanceBreakdown = classEnrollments.map(enrollment => {
      // Count unique completed quizzes for this class
      const classQuizAttempts = uniqueQuizAttempts.filter(
        attempt => attempt.quiz.classId === enrollment.classId
      );
      const completedQuizCount = classQuizAttempts.length;

      // Calculate completion rate
      const assignedQuizCount = enrollment.class._count.quizzes;
      const completionRate = assignedQuizCount > 0
        ? (completedQuizCount / assignedQuizCount) * 100
        : 0;

      // Estimate time spent in class
      const timeSpentInClassSeconds = completedQuizCount * AVERAGE_QUIZ_TIME_SECONDS;

      return {
        classId: enrollment.classId,
        className: enrollment.class.name,
        quizzesAssigned: assignedQuizCount,
        quizzesCompletedByStudent: completedQuizCount, // Now counts unique quizzes
        classCompletionRate: parseFloat(completionRate.toFixed(1)),
        timeSpentInClassSeconds: timeSpentInClassSeconds
      };
    });

    // 6. Compile the final analytics data
    const analyticsData = {
      keyMetrics: {
        activeClasses: classEnrollments.length,
        overallEngagementRate: classPerformanceBreakdown.length > 0
          ? parseFloat((classPerformanceBreakdown.reduce((sum, c) => sum + c.classCompletionRate, 0) / classPerformanceBreakdown.length).toFixed(1))
          : 0,
        totalStudyTimeSeconds: totalStudyTimeSeconds
      },
      classPerformanceBreakdown: classPerformanceBreakdown,
      participationOverTime: participationOverTime
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error("Error fetching class participation analytics:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch analytics",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 