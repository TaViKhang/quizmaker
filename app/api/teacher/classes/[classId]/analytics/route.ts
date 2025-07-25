import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, requireTeacherClassAccess } from "@/lib/auth-middleware";

interface RouteParams {
  params: {
    classId: string;
  };
}

/**
 * GET handler for retrieving class analytics and student performance data
 */
export const GET = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { classId } = params;
  const { session, classData } = await requireTeacherClassAccess(classId);
  const teacherId = session.user.id;
  
  // Get quizzes in this class
  const quizzes = await prisma.quiz.findMany({
    where: {
      classId,
      authorId: teacherId,
    },
    select: {
      id: true,
      title: true,
      isActive: true,
      isPublished: true,
      category: true,
      passingScore: true,
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
  });
  
  // Get students enrolled in the class
  const enrollments = await prisma.classEnrollment.findMany({
    where: {
      classId,
    },
    select: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      joinedAt: true,
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });
  
  // Get all quiz attempts for this class's quizzes
  const quizIds = quizzes.map(quiz => quiz.id);
  
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId: {
        in: quizIds,
      },
      completedAt: {
        not: null,
      },
    },
    select: {
      id: true,
      quizId: true,
      userId: true,
      score: true,
      completedAt: true,
      startedAt: true,
      timeSpent: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
  
  // Generate class overview statistics
  const totalStudents = enrollments.length;
  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter(quiz => quiz.isActive && quiz.isPublished).length;
  const studentIds = enrollments.map(enrollment => enrollment.student.id);
  
  // Calculate students who have attempted at least one quiz
  const studentsWithAttempts = new Set(
    attempts.map(attempt => attempt.userId)
  ).size;
  
  const participationRate = totalStudents > 0 
    ? Math.round((studentsWithAttempts / totalStudents) * 100) 
    : 0;
  
  // Calculate average scores by quiz using best attempt per student
  const quizScores = new Map<string, {
    quizId: string,
    title: string,
    studentBestScores: Map<string, number>,
    passingScore: number | null
  }>();

  quizzes.forEach(quiz => {
    quizScores.set(quiz.id, {
      quizId: quiz.id,
      title: quiz.title,
      studentBestScores: new Map(),
      passingScore: quiz.passingScore,
    });
  });

  // Group attempts by quiz and student, keeping only best score per student per quiz
  attempts.forEach(attempt => {
    if (attempt.score !== null) {
      const quizData = quizScores.get(attempt.quizId);
      if (quizData) {
        const currentBest = quizData.studentBestScores.get(attempt.userId) || 0;
        if (attempt.score > currentBest) {
          quizData.studentBestScores.set(attempt.userId, attempt.score);
        }
      }
    }
  });

  const quizPerformance = Array.from(quizScores.values())
    .map(data => {
      const bestScores = Array.from(data.studentBestScores.values());
      const avgScore = bestScores.length > 0
        ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
        : null;

      const passRate = bestScores.length > 0 && data.passingScore !== null
        ? Math.round((bestScores.filter(score => score >= (data.passingScore ?? 0)).length / bestScores.length) * 100)
        : null;

      return {
        quizId: data.quizId,
        title: data.title,
        attemptCount: bestScores.length, // Count unique students, not total attempts
        averageScore: avgScore,
        passingScore: data.passingScore,
        passRate,
        scores: bestScores,
      };
    });
  
  // Student performance summary using best attempt per quiz per student
  const studentPerformance = new Map<string, {
    studentId: string,
    name: string | null,
    quizBestScores: Map<string, number>, // Track best score per quiz
    totalAttempts: number // Track total practice attempts
  }>();

  enrollments.forEach(enrollment => {
    studentPerformance.set(enrollment.student.id, {
      studentId: enrollment.student.id,
      name: enrollment.student.name,
      quizBestScores: new Map(),
      totalAttempts: 0,
    });
  });

  // Process attempts to get best score per quiz per student
  attempts.forEach(attempt => {
    const studentData = studentPerformance.get(attempt.userId);
    if (studentData && attempt.score !== null) {
      studentData.totalAttempts++; // Count all attempts for practice tracking

      const currentBest = studentData.quizBestScores.get(attempt.quizId) || 0;
      if (attempt.score > currentBest) {
        studentData.quizBestScores.set(attempt.quizId, attempt.score);
      }
    }
  });

  const studentStats = Array.from(studentPerformance.values())
    .map(data => {
      const bestScores = Array.from(data.quizBestScores.values());
      const completedQuizzes = data.quizBestScores.size;

      return {
        studentId: data.studentId,
        name: data.name,
        attemptCount: data.totalAttempts, // Total practice attempts
        completedCount: completedQuizzes, // Unique quizzes completed
        completionRate: totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0,
        averageScore: bestScores.length > 0
          ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
          : null,
      };
    })
    .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  
  // Time analysis
  const timeAnalysis = attempts.filter(a => a.timeSpent !== null).map(attempt => ({
    quizId: attempt.quizId,
    studentId: attempt.userId,
    studentName: attempt.user.name,
    timeSpent: attempt.timeSpent,
    score: attempt.score,
  }));
  
  // Calculate average time spent per quiz
  const quizTimeMap = new Map<string, { totalTime: number, count: number }>();
  
  timeAnalysis.forEach(item => {
    if (!quizTimeMap.has(item.quizId)) {
      quizTimeMap.set(item.quizId, { totalTime: 0, count: 0 });
    }
    
    const data = quizTimeMap.get(item.quizId);
    if (data && item.timeSpent) {
      data.totalTime += item.timeSpent;
      data.count++;
    }
  });
  
  const quizTimeAnalysis = Array.from(quizTimeMap.entries())
    .map(([quizId, data]) => {
      const quiz = quizzes.find(q => q.id === quizId);
      return {
        quizId,
        title: quiz ? quiz.title : 'Unknown Quiz',
        averageTimeSpent: Math.round(data.totalTime / data.count),
        attemptCount: data.count,
      };
    });
  
  // Calculate performance trends
  const attemptsWithDate = attempts
    .filter(a => a.completedAt)
    .map(a => ({
      date: new Date(a.completedAt!).toISOString().split('T')[0],
      score: a.score,
    }));
  
  const dateMap = new Map<string, { date: string, scores: number[], count: number }>();
  
  attemptsWithDate.forEach(item => {
    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, { date: item.date, scores: [], count: 0 });
    }
    
    const data = dateMap.get(item.date);
    if (data && item.score !== null) {
      data.scores.push(item.score);
      data.count++;
    }
  });
  
  const dailyPerformance = Array.from(dateMap.values())
    .map(data => ({
      date: data.date,
      attemptCount: data.count,
      averageScore: data.scores.length > 0
        ? Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
        : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return Response.json({
    classInfo: {
      id: classData.id,
      name: classData.name,
      subject: classData.subject,
      description: classData.description,
      type: classData.type,
      isActive: classData.isActive,
    },
    overview: {
      totalStudents,
      totalQuizzes,
      activeQuizzes,
      participationRate,
      averageClassScore: quizPerformance.length > 0
        ? Math.round(
            quizPerformance
              .filter(q => q.averageScore !== null)
              .reduce((sum, q) => sum + (q.averageScore || 0), 0) / 
            quizPerformance.filter(q => q.averageScore !== null).length
          )
        : null,
    },
    quizPerformance,
    studentStats,
    timeAnalysis: quizTimeAnalysis,
    trends: dailyPerformance,
  });
}); 