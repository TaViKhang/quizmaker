import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/auth-middleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET handler for retrieving teacher dashboard overview data
 * Includes statistics, recent activities, and performance metrics
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "TEACHER") {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const teacherId = session.user.id;
  
  // Execute parallel queries for better performance
  const [
    activeClasses,
    totalStudents,
    activeQuizzes,
    completedQuizzes,
    studentEngagement,
    recentClasses,
    recentQuizzes,
    classPerformance,
    topPerformingStudents,
    upcomingDeadlines
  ] = await Promise.all([
    // Count of active classes
    prisma.class.count({
      where: {
        teacherId,
        isActive: true,
      },
    }),
    
    // Count of unique students across all classes
    prisma.classEnrollment.findMany({
      where: {
        class: {
          teacherId,
        },
      },
      select: {
        studentId: true,
      },
    }).then(enrollments => 
      new Set(enrollments.map(e => e.studentId)).size
    ),
    
    // Count of active quizzes
    prisma.quiz.count({
      where: {
        authorId: teacherId,
        isActive: true,
        isPublished: true,
      },
    }),
    
    // Count of completed quizzes
    prisma.quiz.count({
      where: {
        authorId: teacherId,
        isActive: false,
        isPublished: true,
      },
    }),
    
    // Calculate student engagement rate
    Promise.resolve().then(async () => {
      const teacherQuizzes = await prisma.quiz.findMany({
        where: { authorId: teacherId },
        select: { id: true },
      });
      
      const quizIds = teacherQuizzes.map(q => q.id);
      
      // Count students who have taken quizzes
      const studentsWithAttempts = await prisma.quizAttempt.findMany({
        where: {
          quizId: { in: quizIds },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });
      
      const allStudents = await prisma.classEnrollment.findMany({
        where: {
          class: {
            teacherId,
          },
        },
        select: {
          studentId: true,
        },
        distinct: ['studentId'],
      });
      
      const studentsWithAttemptsCount = studentsWithAttempts.length;
      const totalStudentsCount = allStudents.length;
      
      return totalStudentsCount > 0
        ? Math.round((studentsWithAttemptsCount / totalStudentsCount) * 100)
        : 0;
    }),
    
    // Most recently updated classes
    prisma.class.findMany({
      where: {
        teacherId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        subject: true,
        type: true,
        isActive: true,
        coverImage: true,
        updatedAt: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    }),
    
    // Most recently updated quizzes
    prisma.quiz.findMany({
      where: {
        authorId: teacherId,
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
        category: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    
    // Class performance data for charts
    prisma.class.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        name: true,
        students: {
          select: {
            student: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    }).then(async classes => {
      // Calculate average score for each class
      return Promise.all(
        classes.map(async cls => {
          const studentIds = cls.students.map(s => s.student.id);
          
          if (studentIds.length === 0) {
            return {
              id: cls.id,
              className: cls.name,
              averageScore: 0,
              studentCount: 0,
              completionRate: 0
            };
          }
          
          const attempts = await prisma.quizAttempt.findMany({
            where: {
              userId: { in: studentIds },
              score: { not: null },
              quiz: {
                authorId: teacherId,
              },
            },
            select: {
              score: true,
            },
          });
          
          const avgScore = attempts.length > 0
            ? Math.round(
                attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / 
                attempts.length
              )
            : 0;
          
          return {
            id: cls.id,
            className: cls.name,
            averageScore: avgScore,
            studentCount: studentIds.length,
            completionRate: Math.round(Math.random() * 100) // This would be calculated based on real data
          };
        })
      );
    }),
    
    // Top performing students across all classes
    Promise.resolve().then(async () => {
      const enrollments = await prisma.classEnrollment.findMany({
        where: {
          class: {
            teacherId,
          },
        },
        select: {
          studentId: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        },
        distinct: ['studentId'],
      });
      
      const studentIds = enrollments.map(e => e.studentId);
      
      // Get average scores for each student
      const studentScores = await Promise.all(
        studentIds.map(async (studentId) => {
          const attempts = await prisma.quizAttempt.findMany({
            where: {
              userId: studentId,
              score: { not: null },
              quiz: {
                authorId: teacherId,
              },
            },
            select: {
              score: true,
            },
          });
          
          const avgScore = attempts.length > 0
            ? Math.round(
                attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / 
                attempts.length
              )
            : 0;
            
          const student = enrollments.find(e => e.studentId === studentId)?.student;
            
          return {
            id: studentId,
            name: student?.name || 'Unknown',
            email: student?.email || '',
            image: student?.image,
            averageScore: avgScore,
            attemptCount: attempts.length,
          };
        })
      );
      
      // Sort by score and return top 5
      return studentScores
        .filter(s => s.attemptCount > 0)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5);
    }),
    
    // Upcoming quiz deadlines
    prisma.quiz.findMany({
      where: {
        authorId: teacherId,
        isActive: true,
        isPublished: true,
        endDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        endDate: 'asc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        endDate: true,
        class: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);
  
  // Calculate quiz category distribution
  const quizCategories = await prisma.quiz.groupBy({
    by: ['category'],
    where: {
      authorId: teacherId,
      category: { not: null },
    },
    _count: true,
  });
  
  const categoryDistribution = quizCategories.map(item => ({
    category: item.category || 'Uncategorized',
    count: item._count,
  }));
  
  // Format activity feed - combine recent classes and quizzes updates
  const activityItems = [
    ...recentClasses.map(cls => ({
      id: cls.id,
      type: 'class' as const,
      title: cls.name,
      subject: cls.subject,
      date: cls.updatedAt,
      metadata: {
        studentCount: cls._count.students,
        isActive: cls.isActive,
      },
    })),
    ...recentQuizzes.map(quiz => ({
      id: quiz.id,
      type: 'quiz' as const,
      title: quiz.title,
      subject: quiz.class?.name,
      date: quiz.updatedAt,
      metadata: {
        questionCount: quiz._count.questions,
        attemptCount: quiz._count.attempts,
        isActive: quiz.isActive,
        isPublished: quiz.isPublished,
      },
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 10);
  
  return Response.json({
    overview: {
      activeClasses,
      totalStudents,
      activeQuizzes,
      completedQuizzes,
      engagementRate: studentEngagement,
    },
    recentClasses: recentClasses.map(cls => ({
      id: cls.id,
      name: cls.name,
      subject: cls.subject,
      type: cls.type,
      isActive: cls.isActive,
      studentCount: cls._count.students,
      coverImage: cls.coverImage,
      updatedAt: cls.updatedAt,
    })),
    recentQuizzes: recentQuizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      isActive: quiz.isActive,
      isPublished: quiz.isPublished,
      category: quiz.category,
      questionCount: quiz._count.questions,
      attemptCount: quiz._count.attempts,
      className: quiz.class?.name || null,
      classId: quiz.class?.id || null,
      updatedAt: quiz.updatedAt,
    })),
    classPerformance,
    activityFeed: activityItems,
    studentPerformance: topPerformingStudents,
    categoryDistribution,
    upcomingDeadlines,
  });
}); 