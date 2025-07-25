import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@prisma/client";

interface RouteParams {
  params: {
    quizId: string;
    id: string;
  };
}

// Define complete types for the quiz attempt with all related data
interface QuizAttemptWithDetails {
  id: string;
  userId: string;
  quizId: string;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null;
  timeSpent: number | null;
  ipAddress: string | null; 
  userAgent: string | null;
  percentile: number | null;
  averageResponseTime: number | null;
  
  // Related data
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  
  quiz: {
    id: string;
    title: string;
    description: string | null;
    timeLimit: number;
    passingScore: number | null;
    classId: string | null;
    authorId: string | null;
    class?: {
      name: string;
      teacherId: string | null;
    } | null;
    _count: {
      questions: number;
    };
  };
  
  answers: Array<{
    id: string;
    questionId: string;
    selectedOption: string | null;
    textAnswer: string | null;
    isCorrect: boolean | null;
    score: number | null;
    timeSpent: number | null;
    feedback: string | null;
    question: {
      id: string;
      content: string;
      type: string;
      category: string | null;
      points: number;
      explanation: string | null;
      options: Array<{
        id: string;
        content: string;
        isCorrect: boolean;
        order: number;
      }>;
    };
  }>;
}

/**
 * GET handler for retrieving detailed information about a specific quiz attempt
 * for teacher evaluation and grading
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { quizId, id } = params;
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Teacher access only" },
        { status: 401 }
      );
    }
    
    const teacherId = session.user.id;
    
    // Get the quiz attempt with associated data
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: id,
        quizId: quizId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true,
            passingScore: true,
            classId: true,
            authorId: true,
            class: {
              select: {
                name: true,
                teacherId: true,
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
              include: {
                options: true,
              },
            },
          },
          orderBy: {
            id: 'asc', // Ordering by ID instead of createdAt which isn't available
          },
        },
      },
    }) as unknown as QuizAttemptWithDetails;
    
    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Attempt not found" },
        { status: 404 }
      );
    }
    
    // Security check: verify the teacher has access to this quiz/attempt
    const quizAuthorId = attempt.quiz.authorId;
    const classteacherId = attempt.quiz.class?.teacherId;
    
    if (quizAuthorId !== teacherId && classteacherId !== teacherId) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You don't have access to this attempt" },
        { status: 403 }
      );
    }
    
    // Calculate statistics
    const totalQuestions = attempt.answers.length;
    const correctAnswers = attempt.answers.filter((answer) => answer.isCorrect === true).length;
    const incorrectAnswers = attempt.answers.filter((answer) => answer.isCorrect === false).length;
    const pendingGrading = attempt.answers.filter((answer) => answer.isCorrect === null).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Calculate time metrics
    const timeSpent = attempt.timeSpent || 0;
    const averageTimePerQuestion = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;
    
    // Organize questions by category
    const categoryMap = new Map<string, { category: string; total: number; correct: number }>();
    
    attempt.answers.forEach((answer) => {
      const category = answer.question.category || 'Uncategorized';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          total: 0,
          correct: 0,
        });
      }
      
      const data = categoryMap.get(category)!;
      data.total++;
      
      if (answer.isCorrect) {
        data.correct++;
      }
    });
    
    const categoryPerformance = Array.from(categoryMap.values()).map(data => ({
      category: data.category,
      totalQuestions: data.total,
      correctAnswers: data.correct,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));
    
    // Format answers with detailed information
    const formattedAnswers = attempt.answers.map((answer) => {
      // Create a clean version of the question without circular references
      const question = {
        id: answer.question.id,
        content: answer.question.content,
        type: answer.question.type,
        category: answer.question.category,
        points: answer.question.points,
        explanation: answer.question.explanation,
        options: answer.question.options.map((option) => ({
          id: option.id,
          content: option.content,
          isCorrect: option.isCorrect,
          order: option.order,
        })),
      };
      
      return {
        id: answer.id,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOption,
        textAnswer: answer.textAnswer,
        isCorrect: answer.isCorrect,
        points: answer.score,
        feedback: answer.feedback,
        question,
      };
    });
    
    // Determine pass/fail status
    const isPassing = attempt.quiz.passingScore !== null 
      ? (attempt.score || 0) >= attempt.quiz.passingScore 
      : null;
    
    // Format response
    const responseData = {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        userId: attempt.userId,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        isPassing,
      },
      user: attempt.user,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        timeLimit: attempt.quiz.timeLimit,
        passingScore: attempt.quiz.passingScore,
        totalQuestions: attempt.quiz._count.questions,
        className: attempt.quiz.class?.name,
      },
      statistics: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        pendingGrading,
        accuracy,
        timeSpent,
        averageTimePerQuestion,
        categoryPerformance,
      },
      answers: formattedAnswers,
    };
    
    return NextResponse.json({
      success: true,
      data: responseData,
    });
    
  } catch (error) {
    console.error("Error fetching attempt details:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch attempt details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating grading and feedback for a quiz attempt
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { quizId, id } = params;
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Teacher access only" },
        { status: 401 }
      );
    }
    
    const teacherId = session.user.id;
    
    // Verify the quiz belongs to this teacher
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        OR: [
          { authorId: teacherId },
          { class: { teacherId: teacherId } }
        ]
      },
    });
    
    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Quiz not found or you don't have access to it" },
        { status: 404 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { answerId, isCorrect, score, feedback } = body;
    
    if (!answerId) {
      return NextResponse.json(
        { success: false, message: "Missing answerId in request" },
        { status: 400 }
      );
    }
    
    // Update the answer with grading information
    const updatedAnswer = await prisma.answer.updateMany({
      where: {
        id: answerId,
        attempt: {
          id: id,
          quizId: quizId,
        },
      },
      data: {
        isCorrect: isCorrect,
        score: score,
        feedback: feedback,
      },
    });
    
    // If no rows were affected, answer was not found or doesn't belong to this attempt
    if (updatedAnswer.count === 0) {
      return NextResponse.json(
        { success: false, message: "Answer not found or doesn't belong to this attempt" },
        { status: 404 }
      );
    }
    
    // Recalculate the total score for the attempt
    const attemptWithAnswers = await prisma.quizAttempt.findUnique({
      where: {
        id: id,
      },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });
    
    if (attemptWithAnswers) {
      // Calculate new score based on all graded answers
      const totalPoints = attemptWithAnswers.quiz.questions.reduce(
        (sum, q) => sum + (q.points || 1), 0
      );
      
      const earnedPoints = attemptWithAnswers.answers.reduce(
        (sum, a) => sum + (a.score || 0), 0
      );
      
      const newScore = totalPoints > 0 
        ? (earnedPoints / totalPoints) * 100 
        : 0;
      
      // Update the attempt with the new score
      await prisma.quizAttempt.update({
        where: {
          id: id,
        },
        data: {
          score: newScore,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Answer graded successfully",
    });
    
  } catch (error) {
    console.error("Error updating answer grade:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update answer grade" },
      { status: 500 }
    );
  }
} 