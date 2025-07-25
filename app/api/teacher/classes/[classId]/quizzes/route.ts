import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

// Schema for query validation
const querySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "draft", ""]).optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "startDate", "averageScore", ""]).optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc", ""]).optional().default("desc"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json(
        { error: "Access denied: Teacher role required" },
        { status: 403 }
      );
    }

    const { classId } = params;

    // Check if class exists and belongs to teacher
    const classRecord = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id,
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: "Class not found or access denied" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const rawParams = {
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "10",
      search: url.searchParams.get("search") || "",
      status: url.searchParams.get("status") || "",
      sortBy: url.searchParams.get("sortBy") || "updatedAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
    };

    // Validate query parameters
    const parsedParams = querySchema.parse(rawParams);

    // Calculate pagination
    const skip = (parsedParams.page - 1) * parsedParams.limit;

    // Build filter conditions
    let where: Prisma.QuizWhereInput = {
      classId,
    };

    // Add search filter if provided
    if (parsedParams.search) {
      where.OR = [
        { title: { contains: parsedParams.search, mode: "insensitive" as Prisma.QueryMode } },
        { description: { contains: parsedParams.search, mode: "insensitive" as Prisma.QueryMode } },
      ];
    }

    // Add status filter if provided
    if (parsedParams.status === "active") {
      where.isActive = true;
      where.isPublished = true;
    } else if (parsedParams.status === "inactive") {
      where.isActive = false;
      where.isPublished = true;
    } else if (parsedParams.status === "draft") {
      where.isPublished = false;
    }

    // Count total quizzes matching filter
    const totalQuizzes = await prisma.quiz.count({ where });

    // Get quizzes with pagination, filtering, and sorting
    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: {
        [parsedParams.sortBy || "updatedAt"]: parsedParams.sortOrder || "desc",
      },
      skip,
      take: parsedParams.limit,
      include: {
        questions: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          }
        },
      },
    });

    // Get additional quiz statistics using best attempt per student
    const formattedQuizzes = await Promise.all(quizzes.map(async (quiz) => {
      // Get completed attempts for score calculation
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          quizId: quiz.id,
          completedAt: { not: null },
        },
        select: {
          score: true,
          userId: true,
        },
      });

      // Group by student and get best score per student
      const studentBestScores = new Map<string, number>();

      attempts.forEach(attempt => {
        if (attempt.score !== null && attempt.userId) {
          const currentBest = studentBestScores.get(attempt.userId) || 0;
          if (attempt.score > currentBest) {
            studentBestScores.set(attempt.userId, attempt.score);
          }
        }
      });

      const bestScores = Array.from(studentBestScores.values());

      // Calculate average score from best scores only
      const averageScore = bestScores.length > 0
        ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
        : null;

      // Calculate completion rate based on unique students
      const totalAttempts = quiz._count.attempts;
      const uniqueStudentsCompleted = studentBestScores.size;
      const completionRate = totalAttempts > 0
        ? Math.round((uniqueStudentsCompleted / totalAttempts) * 100)
        : 0;

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        isActive: quiz.isActive,
        isPublished: quiz.isPublished ?? false,
        category: quiz.category,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        startDate: quiz.startDate?.toISOString() || null,
        endDate: quiz.endDate?.toISOString() || null,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        questionCount: quiz.questions.length,
        attemptCount: quiz._count.attempts,
        averageScore,
        completionRate,
      };
    }));

    // Format class data
    const classData = {
      id: classRecord.id,
      name: classRecord.name,
      subject: classRecord.subject,
      description: classRecord.description,
      type: classRecord.type || "Regular",
      isActive: classRecord.isActive,
      studentCount: classRecord._count.students,
    };

    // Calculate pagination data
    const totalPages = Math.ceil(totalQuizzes / parsedParams.limit);

    return NextResponse.json({
      quizzes: formattedQuizzes,
      class: classData,
      pagination: {
        page: parsedParams.page,
        limit: parsedParams.limit,
        total: totalQuizzes,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
} 