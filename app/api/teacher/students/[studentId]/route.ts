import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, requireTeacherStudentAccess } from "@/lib/auth-middleware";
import { QuizAttempt } from "@prisma/client";

interface RouteParams {
  params: {
    studentId: string;
  };
}

// Define the types for the quiz attempt with associated data
interface QuizAttemptWithDetails extends QuizAttempt {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    classId: string | null;
    category: string | null;
    passingScore: number | null;
    class?: {
      name: string;
    } | null;
    _count: {
      questions: number;
    };
  };
  answers: Array<{
    id: string;
    isCorrect: boolean;
    question: {
      content: string;
      points: number;
      type: string;
      category: string | null;
    };
  }>;
}

/**
 * GET handler for retrieving detailed student information and academic performance
 */
export const GET = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { studentId } = params;
  const { session, student, classes } = await requireTeacherStudentAccess(studentId);
  const teacherId = session.user.id;
  
  // Get class IDs taught by this teacher that the student is enrolled in
  const classIds = classes.map(cls => cls.id);
  
  // Get all quiz attempts by this student for quizzes created by this teacher
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: {
      userId: studentId,
      quiz: {
        authorId: teacherId,
      },
    },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
          classId: true,
          category: true,
          passingScore: true,
          class: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
      },
      answers: {
        include: {
          question: {
            select: {
              content: true,
              points: true,
              type: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  }) as unknown as QuizAttemptWithDetails[];
  
  // Calculate performance metrics
  const totalAttempts = quizAttempts.length;
  const completedAttempts = quizAttempts.filter(attempt => attempt.completedAt !== null);
  const totalScore = completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
  const averageScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : null;
  
  // Create an array of classes with completion and performance data
  const classesWithPerformance = await Promise.all(
    classes.map(async (cls) => {
      // Find attempts for quizzes in this class
      const classQuizAttempts = quizAttempts.filter(attempt => attempt.quiz.classId === cls.id);
      const completedClassAttempts = classQuizAttempts.filter(attempt => attempt.completedAt !== null);
      
      // Get total quizzes in the class
      const totalQuizzes = await prisma.quiz.count({
        where: {
          classId: cls.id,
          authorId: teacherId,
        },
      });
      
      // Get unique quizzes attempted in this class
      const uniqueQuizIds = new Set(classQuizAttempts.map(attempt => attempt.quizId));
      
      return {
        id: cls.id,
        name: cls.name,
        description: cls.description,
        subject: cls.subject,
        type: cls.type,
        totalQuizzes,
        quizzesAttempted: uniqueQuizIds.size,
        quizzesCompleted: new Set(completedClassAttempts.map(attempt => attempt.quizId)).size,
        averageScore: completedClassAttempts.length > 0
          ? Math.round(completedClassAttempts.reduce((sum: number, attempt: QuizAttemptWithDetails) => sum + (attempt.score || 0), 0) / completedClassAttempts.length)
          : null,
      };
    })
  );
  
  // Get subject-based performance if available
  const subjectPerformance = [];
  const subjectMap = new Map<string, { subject: string; scores: number[] }>();
  
  for (const cls of classesWithPerformance) {
    if (cls.subject && cls.averageScore !== null) {
      if (!subjectMap.has(cls.subject)) {
        subjectMap.set(cls.subject, {
          subject: cls.subject,
          scores: [],
        });
      }
      
      subjectMap.get(cls.subject)?.scores.push(cls.averageScore);
    }
  }
  
  for (const [subject, data] of subjectMap.entries()) {
    const totalScore = data.scores.reduce((sum: number, score: number) => sum + score, 0);
    subjectPerformance.push({
      subject,
      averageScore: Math.round(totalScore / data.scores.length),
    });
  }
  
  // Organize performance data by question categories
  const categoryPerformance = new Map<string, { category: string; totalQuestions: number; correctAnswers: number }>();
  
  for (const attempt of quizAttempts) {
    for (const answer of attempt.answers) {
      const category = answer.question.category || 'Uncategorized';
      
      if (!categoryPerformance.has(category)) {
        categoryPerformance.set(category, {
          category,
          totalQuestions: 0,
          correctAnswers: 0,
        });
      }
      
      const data = categoryPerformance.get(category);
      if (data) {
        data.totalQuestions++;
        
        if (answer.isCorrect) {
          data.correctAnswers++;
        }
      }
    }
  }
  
  const categoryAnalytics = Array.from(categoryPerformance.values()).map(data => ({
    category: data.category,
    totalQuestions: data.totalQuestions,
    correctAnswers: data.correctAnswers,
    accuracy: Math.round((data.correctAnswers / data.totalQuestions) * 100),
  }));
  
  // Prepare the response
  const responseData = {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      image: student.image,
    },
    overview: {
      totalClasses: classes.length,
      totalQuizAttempts: totalAttempts,
      completedQuizzes: completedAttempts.length,
      averageScore,
    },
    classes: classesWithPerformance,
    quizAttempts: quizAttempts.map(attempt => ({
      id: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      quizDescription: attempt.quiz.description,
      classId: attempt.quiz.classId,
      className: attempt.quiz.class?.name || 'No Class',
      category: attempt.quiz.category,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      score: attempt.score,
      passingScore: attempt.quiz.passingScore,
      totalQuestions: attempt.quiz._count.questions,
      questionsAnswered: attempt.answers.length,
      timeSpent: attempt.timeSpent,
    })),
    subjectPerformance,
    categoryAnalytics,
  };
  
  return Response.json(responseData);
}); 