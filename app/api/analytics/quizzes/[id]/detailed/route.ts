import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AttemptService } from "@/app/api/services/attempt-service";
import { 
  errorResponse, 
  notFoundResponse,
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "@/app/api/utils/api-response";
import { API_MESSAGES } from "@/app/api/utils/api-types";
import { prisma } from "@/lib/prisma";

const attemptService = new AttemptService();

/**
 * GET /api/analytics/quizzes/[id]/detailed
 * Get detailed analytics for a specific quiz
 * This endpoint is restricted to teachers only and includes sensitive student data
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

    // Get attempts with user details
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Process data to get student-specific analytics
    const studentAnalytics = attempts.reduce((result, attempt) => {
      const userId = attempt.userId;
      
      if (!userId) return result; // Skip guest attempts
      
      if (!result[userId]) {
        result[userId] = {
          user: attempt.user,
          attempts: [],
          averageScore: 0,
          totalAttempts: 0,
          bestScore: 0,
          completionTime: 0,
        };
      }
      
      // Add attempt data
      result[userId].attempts.push({
        id: attempt.id,
        score: attempt.score,
        completedAt: attempt.completedAt,
        timeSpent: attempt.timeSpent,
        startedAt: attempt.startedAt,
      });
      
      // Update aggregate stats
      result[userId].totalAttempts++;
      
      if (attempt.score !== null) {
        const totalScore = result[userId].averageScore * (result[userId].totalAttempts - 1);
        result[userId].averageScore = (totalScore + attempt.score) / result[userId].totalAttempts;
        result[userId].bestScore = Math.max(result[userId].bestScore, attempt.score);
      }
      
      if (attempt.timeSpent) {
        result[userId].completionTime += attempt.timeSpent;
      }
      
      return result;
    }, {} as Record<string, any>);

    // Get question-level analytics per student
    const questionAnalytics = attempts.flatMap(attempt => {
      if (!attempt.userId) return []; // Skip guest attempts
      
      return attempt.answers.map(answer => ({
        userId: attempt.userId,
        studentName: attempt.user?.name,
        questionId: answer.questionId,
        questionContent: answer.question.content,
        questionType: answer.question.type,
        isCorrect: answer.isCorrect,
        selectedOption: answer.selectedOption,
        textAnswer: answer.textAnswer,
        score: answer.score,
        attemptId: attempt.id,
        attemptDate: attempt.completedAt,
      }));
    });

    return successResponse({
      quizId: params.id,
      studentCount: Object.keys(studentAnalytics).length,
      studentAnalytics: Object.values(studentAnalytics),
      questionAnalytics,
    });
  } catch (error: any) {
    console.error("Error fetching detailed quiz analytics:", error);
    return serverErrorResponse("Failed to fetch detailed quiz analytics");
  }
} 