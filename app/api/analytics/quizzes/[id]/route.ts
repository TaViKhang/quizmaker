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
 * GET /api/analytics/quizzes/[id]
 * Get analytics for a specific quiz
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
      return notFoundResponse("Quiz not found");
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
      return errorResponse("You don't have permission to view analytics for this quiz", {
        status: 403,
        code: "FORBIDDEN",
      });
    }

    // Get analytics data
    const analytics = await attemptService.getQuizAnalytics(params.id);

    return successResponse(analytics);
  } catch (error: any) {
    console.error("Error fetching quiz analytics:", error);
    return serverErrorResponse("Failed to fetch quiz analytics");
  }
} 