import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, requireTeacherRole } from "@/lib/auth-middleware";

/**
 * GET handler for retrieving all students enrolled in teacher's classes
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireTeacherRole();
  const teacherId = session.user.id;
  
  // Get URL parameters for pagination, sorting, etc.
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  
  // Base query filters
  const whereClause: any = {
    class: {
      teacherId,
    },
  };
  
  // Add optional class filter
  if (classId) {
    whereClause.classId = classId;
  }
  
  // Get unique student IDs from enrollments in teacher's classes
  const enrollments = await prisma.classEnrollment.findMany({
    where: whereClause,
    select: {
      studentId: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      joinedAt: true,
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });
  
  // Group by student ID to get unique students with all their classes
  const studentMap = new Map();
  
  for (const enrollment of enrollments) {
    if (!studentMap.has(enrollment.studentId)) {
      studentMap.set(enrollment.studentId, {
        id: enrollment.student.id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        image: enrollment.student.image,
        classes: [],
      });
    }
    
    studentMap.get(enrollment.studentId).classes.push({
      id: enrollment.class.id,
      name: enrollment.class.name,
      joinedAt: enrollment.joinedAt,
    });
  }
  
  // Convert map to array and apply search filter if needed
  let students = Array.from(studentMap.values());
  
  if (search) {
    const searchLower = search.toLowerCase();
    students = students.filter(student => 
      student.name?.toLowerCase().includes(searchLower) || 
      student.email?.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply pagination
  const totalCount = students.length;
  const paginatedStudents = students.slice(offset, offset + limit);
  
  // Get activity data for these students (quiz attempts)
  const studentIds = paginatedStudents.map(student => student.id);
  
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: {
        in: studentIds,
      },
      quiz: {
        authorId: teacherId,
      },
    },
    select: {
      userId: true,
      score: true,
      completedAt: true,
      quiz: {
        select: {
          id: true,
          title: true,
          classId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Group quiz attempts by student
  const attemptsMap = new Map();
  
  for (const attempt of quizAttempts) {
    if (!attemptsMap.has(attempt.userId)) {
      attemptsMap.set(attempt.userId, []);
    }
    
    attemptsMap.get(attempt.userId).push({
      quizId: attempt.quiz.id,
      quizTitle: attempt.quiz.title,
      classId: attempt.quiz.classId,
      score: attempt.score,
      completedAt: attempt.completedAt,
    });
  }
  
  // Add activity data to student records
  for (const student of paginatedStudents) {
    student.recentActivity = attemptsMap.get(student.id) || [];
    
    // Calculate average score
    if (student.recentActivity.length > 0) {
      const completedAttempts = student.recentActivity.filter((a: any) => a.score !== null);
      if (completedAttempts.length > 0) {
        const totalScore = completedAttempts.reduce((sum: number, a: any) => sum + a.score, 0);
        student.averageScore = Math.round(totalScore / completedAttempts.length);
      } else {
        student.averageScore = null;
      }
    } else {
      student.averageScore = null;
    }
  }
  
  return Response.json({
    students: paginatedStudents,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
    },
  });
}); 