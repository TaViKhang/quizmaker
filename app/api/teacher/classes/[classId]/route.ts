import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role, ClassType } from "@prisma/client";
import { generateRandomCode } from "@/lib/utils";
import { z } from "zod";

interface RouteParams {
  params: {
    classId: string;
  };
}

/**
 * GET handler for retrieving a specific class with detailed information
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
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

    // Check if class exists and belongs to the teacher
    const classExists = await prisma.class.findUnique({
      where: {
        id: classId,
        teacherId: session.user.id,
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have access to it" },
        { status: 404 }
      );
    }

    // Get detailed class information
    const classInfo = await prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        _count: {
          select: {
            students: true,
            quizzes: true,
          },
        },
      },
    });

    // Get student count and basic stats
    const studentCount = await prisma.classEnrollment.count({
      where: {
        classId,
      },
    });

    // Get quiz counts by status
    const quizCounts = await prisma.quiz.groupBy({
      by: ['isActive', 'isPublished'],
      where: {
        classId,
      },
      _count: {
        id: true,
      },
    });

    const activePublishedQuizzes = quizCounts.find(q => q.isActive && q.isPublished)?._count.id || 0;
    const draftQuizzes = quizCounts.find(q => !q.isPublished)?._count.id || 0;
    const inactiveQuizzes = quizCounts.find(q => !q.isActive && q.isPublished)?._count.id || 0;

    // Get recent activity
    const recentQuizzes = await prisma.quiz.findMany({
      where: {
        classId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        isActive: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    const recentEnrollments = await prisma.classEnrollment.findMany({
      where: {
        classId,
      },
      orderBy: {
        joinedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        joinedAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get quiz statistics
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: {
          classId,
        },
        completedAt: {
          not: null,
        },
      },
      select: {
        score: true,
        userId: true,
        completedAt: true,
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
          },
        },
      },
    });

    // Calculate average scores using best attempt per student per quiz
    const studentQuizBestScores = new Map<string, Map<string, number>>();

    // Group attempts by student and quiz, keeping only best score
    quizAttempts.forEach(attempt => {
      if (attempt.score !== null) {
        if (!studentQuizBestScores.has(attempt.userId)) {
          studentQuizBestScores.set(attempt.userId, new Map());
        }

        const studentQuizzes = studentQuizBestScores.get(attempt.userId)!;
        const currentBest = studentQuizzes.get(attempt.quiz.id) || 0;

        if (attempt.score > currentBest) {
          studentQuizzes.set(attempt.quiz.id, attempt.score);
        }
      }
    });

    // Calculate average from best scores only
    const allBestScores: number[] = [];
    studentQuizBestScores.forEach(quizzes => {
      quizzes.forEach(score => {
        allBestScores.push(score);
      });
    });

    const averageScore = allBestScores.length > 0
      ? Math.round(allBestScores.reduce((sum, score) => sum + score, 0) / allBestScores.length)
      : null;

    // Calculate student participation
    const totalStudents = studentCount;
    const studentsWithAttempts = new Set(quizAttempts.map(a => a.userId)).size;
    
    const participationRate = totalStudents > 0
      ? Math.round((studentsWithAttempts / totalStudents) * 100)
      : 0;

    // Calculate top performing students using best scores per quiz
    const studentPerformance = new Map();

    // Process all attempts to calculate student performance using best scores
    quizAttempts.forEach(attempt => {
      const { userId, score, completedAt } = attempt;

      if (!studentPerformance.has(userId)) {
        studentPerformance.set(userId, {
          id: userId,
          quizBestScores: new Map(),
          totalAttempts: 0,
          averageScore: null,
          lastAttemptAt: null
        });
      }

      const student = studentPerformance.get(userId);
      student.totalAttempts += 1; // Count all attempts for practice tracking

      if (score !== null) {
        // Track best score per quiz
        const currentBest = student.quizBestScores.get(attempt.quiz.id) || 0;
        if (score > currentBest) {
          student.quizBestScores.set(attempt.quiz.id, score);
        }

        // Calculate average from best scores
        const bestScores = Array.from(student.quizBestScores.values());
        student.averageScore = bestScores.length > 0
          ? Math.round(bestScores.reduce((sum, s) => sum + s, 0) / bestScores.length)
          : null;
      }

      // Update last attempt time if newer
      if (completedAt && (!student.lastAttemptAt || new Date(completedAt) > new Date(student.lastAttemptAt))) {
        student.lastAttemptAt = completedAt;
      }
    });
    
    // Get student details from the database
    const studentIds = Array.from(studentPerformance.keys());
    const studentsWithDetails = await prisma.user.findMany({
      where: {
        id: {
          in: studentIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        enrolledClasses: {
          where: {
            classId
          },
          select: {
            lastActive: true
          }
        }
      }
    });
    
    // Combine performance data with student details
    const topStudents = studentsWithDetails.map(student => {
      const performance = studentPerformance.get(student.id);
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        attemptCount: performance?.totalAttempts || 0, // Total practice attempts
        completedQuizzes: performance?.quizBestScores?.size || 0, // Unique quizzes completed
        averageScore: performance?.averageScore || null,
        lastActive: student.enrolledClasses[0]?.lastActive?.toISOString() || performance?.lastAttemptAt?.toISOString() || null
      };
    })
    .filter(student => student.attemptCount > 0) // Only include students with attempts
    .sort((a, b) => {
      // First sort by average score (higher is better)
      if (a.averageScore !== b.averageScore) {
        return (b.averageScore || 0) - (a.averageScore || 0);
      }

      // Then by completed quizzes (higher is better)
      if (a.completedQuizzes !== b.completedQuizzes) {
        return b.completedQuizzes - a.completedQuizzes;
      }

      // Finally by most recent activity (newer is better)
      return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime();
    })
    .slice(0, 5); // Take top 5 students

    // Format the response
    const formattedClass = {
      id: classInfo?.id,
      name: classInfo?.name,
      description: classInfo?.description,
      subject: classInfo?.subject,
      type: classInfo?.type,
      inviteCode: classInfo?.code,
      isActive: classInfo?.isActive,
      teacherId: classInfo?.teacherId,
      createdAt: classInfo?.createdAt.toISOString(),
      updatedAt: classInfo?.updatedAt.toISOString(),
      topStudents,
      stats: {
        students: {
          total: studentCount,
          active: studentsWithAttempts,
          participationRate,
        },
        quizzes: {
          total: classInfo?._count.quizzes || 0,
          active: activePublishedQuizzes,
          drafts: draftQuizzes,
          inactive: inactiveQuizzes,
        },
        performance: {
          averageScore,
          completedAttempts: quizAttempts.length,
        },
      },
      recentActivity: {
        quizzes: recentQuizzes.map(quiz => ({
          ...quiz,
          updatedAt: quiz.updatedAt.toISOString(),
        })),
        enrollments: recentEnrollments.map(enrollment => ({
          id: enrollment.id,
          student: enrollment.student,
          joinedAt: enrollment.joinedAt.toISOString(),
        })),
      },
    };

    return NextResponse.json(formattedClass);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class details" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a class
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    // Check if class exists and belongs to the teacher
    const classExists = await prisma.class.findUnique({
      where: {
        id: classId,
        teacherId: session.user.id,
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have access to it" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate request body
    const updateSchema = z.object({
      name: z.string().min(1, "Class name is required").optional(),
      description: z.string().nullable().optional(),
      subject: z.string().nullable().optional(),
      type: z.nativeEnum(ClassType).optional(),
      isActive: z.boolean().optional(),
    });

    const validatedData = updateSchema.parse(body);

    // Update the class
    const updatedClass = await prisma.class.update({
      where: {
        id: classId,
      },
      data: validatedData,
    });

    return NextResponse.json({
      message: "Class updated successfully",
      class: {
        id: updatedClass.id,
        name: updatedClass.name,
        description: updatedClass.description,
        subject: updatedClass.subject,
        type: updatedClass.type,
        isActive: updatedClass.isActive,
        updatedAt: updatedClass.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating class:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a class
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    // Check if class exists and belongs to the teacher
    const classExists = await prisma.class.findUnique({
      where: {
        id: classId,
        teacherId: session.user.id,
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have access to it" },
        { status: 404 }
      );
    }

    // Delete the class - this will cascade delete all related records if you have set up your schema correctly
    await prisma.class.delete({
      where: {
        id: classId,
      },
    });

    return NextResponse.json({
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
} 