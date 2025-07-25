import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role, Quiz, QuizAttempt, Prisma } from "@prisma/client";
import { ApiError } from "@/app/api/utils/api-response";

// Define types for our extended QuizAttempt with included relations
type QuizAttemptWithRelations = Prisma.QuizAttemptGetPayload<{
  include: {
    quiz: {
      include: {
        class: true;
        questions: {
          include: {
            options: true;
          }
        };
      }
    };
    answers: {
      include: {
        question: {
          include: {
            options: true;
          }
        }
      }
    }
  }
}>;

interface QuizResultItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string | null;
  className: string | null;
  category: string | null;
  score: number; 
  totalQuestions: number;
  correctQuestions: number;
  completedAt: string;
  timeTakenMinutes: number | null;
  feedbackAvailable: boolean;
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

/**
 * API endpoint to get student\'s completed quiz results.
 * @route GET /api/users/me/quiz-results
 * @returns {{ success: boolean, data?: QuizResultItem[], error?: string }}
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    
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
    
    // Build where clause
    const whereClause: any = {
      userId,
      completedAt: {
        not: null,
        gte: startDate,
      },
    };
    
    // Add subject filter if provided
    if (subject) {
      whereClause.quiz = {
        category: {
          equals: subject,
          mode: "insensitive",
        },
      };
    }
    
    // Get total count for pagination
    const totalCount = await db.quizAttempt.count({
      where: whereClause,
    });
    
    // Trả về mảng trống nếu không có kết quả thay vì dữ liệu mẫu
    if (totalCount === 0) {
      return createApiResponse({
        status: 200,
        data: {
          results: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            pageSize
          },
          timeFrame,
          subject: subject || null
        },
      });
    }
    
    // Fetch quiz attempts with related data
    const attempts = await db.quizAttempt.findMany({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        completedAt: "desc",
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        answers: {
          select: {
            isCorrect: true,
          },
        },
      },
    });
    
    // Format response data
    const formattedAttempts = attempts.map(attempt => {
      const totalQuestions = attempt.answers.length;
      const correctQuestions = attempt.answers.filter(a => a.isCorrect).length;
      
      return {
        attemptId: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        quizDescription: attempt.quiz.description,
        className: attempt.quiz.class?.name || null,
        category: attempt.quiz.category,
        score: attempt.score || 0,
        totalQuestions,
        correctQuestions,
        completedAt: attempt.completedAt,
        timeTakenMinutes: attempt.timeSpent 
          ? Math.round(attempt.timeSpent / 60) 
          : null,
        feedbackAvailable: false,
      };
    });
    
    return createApiResponse({
      status: 200,
      data: {
        results: formattedAttempts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / pageSize),
          totalItems: totalCount,
          pageSize,
        },
        timeFrame,
        subject: subject || null,
      },
    });
    
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return createApiErrorResponse({
      status: 500,
      message: "Failed to fetch quiz results",
    });
  }
} 