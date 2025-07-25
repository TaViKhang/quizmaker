import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { ApiError, createApiResponse } from "@/app/api/utils/api-response";

/**
 * API endpoint to get upcoming quizzes (assessments) for a student.
 * While the term "assessments" is used in the route for broader context,
 * this endpoint specifically returns quizzes scheduled for the student.
 * @route GET /api/users/me/upcoming-assessments
 * @returns Array of upcoming quizzes with class and quiz details
 */
export async function GET() {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Only students can access this API
    if (session.user.role !== Role.STUDENT) {
      throw new ApiError(403, "Access denied: Student role required");
    }

    const userId = session.user.id;
    const now = new Date();
    
    // Get upcoming assessments for the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find classes the student is enrolled in
    const enrolledClasses = await db.classEnrollment.findMany({
      where: {
        studentId: userId,
      },
      select: {
        classId: true,
      },
    });

    const classIds = enrolledClasses.map((enrollment) => enrollment.classId);

    // Get quizzes from those classes that are scheduled for the next 7 days
    const upcomingAssessments = await db.quiz.findMany({
      where: {
        classId: {
          in: classIds,
        },
        // Published quizzes that haven't been attempted by this student
        isPublished: true,
        startDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        // Exclude quizzes that the student has already attempted
        NOT: {
          attempts: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        timeLimit: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Trả về mảng trống thay vì dữ liệu mẫu khi không tìm thấy kết quả
    if (upcomingAssessments.length === 0) {
      return createApiResponse([]);
    }

    // Return the result
    return createApiResponse(upcomingAssessments);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error("Error fetching upcoming assessments:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 