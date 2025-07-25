import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET handler to fetch a user's quiz attempt by ID
 * This endpoint is used for the student to view their own quiz result
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Fetch the attempt with all necessary related data
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Quiz attempt not found" },
        { status: 404 }
      );
    }

    // Calculate statistics and metrics
    const totalQuestions = attempt.quiz.questions.length;
    const answeredQuestions = attempt.answers.length;
    
    const correctAnswers = attempt.answers.filter((answer) => answer.isCorrect).length;
    const incorrectAnswers = attempt.answers.filter((answer) => answer.isCorrect === false).length;
    const pendingGrading = attempt.answers.filter(
      (answer) => answer.isCorrect === null && answer.feedback === null
    ).length;
    
    // Calculate accuracy based on total questions, not just questions that were graded
    // Accuracy = số câu đúng / tổng số câu trong quiz
    const gradedQuestions = correctAnswers + incorrectAnswers;
    const accuracy = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;
      
    // Calculate score based on all questions in the quiz, not just answered ones
    // If no questions were answered, score should be 0, not null
    let calculatedScore = 0;
    if (attempt.score !== null) {
      // Preserve existing score but recompute if answeredQuestions < totalQuestions
      if (answeredQuestions < totalQuestions && gradedQuestions > 0) {
        // Calculate proportion of answered questions vs total
        const totalCorrectPoints = attempt.answers.reduce((sum, answer) => {
          return answer.isCorrect ? sum + (answer.question.points || 1) : sum;
        }, 0);
        const totalPossiblePoints = attempt.quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        calculatedScore = totalPossiblePoints > 0 
          ? Math.round((totalCorrectPoints / totalPossiblePoints) * 100)
          : 0;
      } else {
        calculatedScore = attempt.score;
      }
    }

    // Format the questions and answers in a way that's easy for the frontend to consume
    const questionMap = new Map();
    attempt.quiz.questions.forEach((question) => {
      questionMap.set(question.id, {
        ...question,
        answer: null, // Will be populated if the user answered this question
      });
    });

    // Add user's answers to the questions
    attempt.answers.forEach((answer) => {
      if (questionMap.has(answer.questionId)) {
        const question = questionMap.get(answer.questionId);
        question.answer = {
          id: answer.id,
          selectedOptionId: answer.selectedOption,
          selectedOptions: answer.selectedOptionIds || [], // Add selected options array
          textAnswer: answer.textAnswer,
          jsonData: answer.textAnswer, // For complex question types, textAnswer contains JSON
          isCorrect: answer.isCorrect,
          score: answer.score,
          feedback: answer.feedback,
        };
      }
    });

    // Convert the Map to an array
    const questions = Array.from(questionMap.values());

    // Calculate total points possible and earned points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const earnedPoints = questions.reduce((sum, q) => {
      if (q.answer && q.answer.score !== undefined && q.answer.score !== null) {
        return sum + q.answer.score;
      }
      return sum;
    }, 0);

    // Determine if the attempt is passing based on the quiz's passing score
    const isPassing = attempt.quiz.passingScore !== null 
      ? (attempt.score || 0) >= attempt.quiz.passingScore 
      : null;

    // Format the final response
    const formattedAttempt = {
      id: attempt.id,
      quizId: attempt.quizId,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      score: calculatedScore, // Use our recalculated score instead of the stored one
      timeSpent: attempt.timeSpent,
      isPassing: attempt.quiz.passingScore !== null ? calculatedScore >= attempt.quiz.passingScore : null,
      totalPoints,
      earnedPoints,
    };

    const formattedQuiz = {
      id: attempt.quiz.id,
      title: attempt.quiz.title,
      description: attempt.quiz.description,
      timeLimit: attempt.quiz.timeLimit,
      passingScore: attempt.quiz.passingScore,
      class: attempt.quiz.class,
      totalQuestions,
    };

    return NextResponse.json({
      success: true,
      data: {
        attempt: formattedAttempt,
        quiz: formattedQuiz,
        user: attempt.user,
        questions,
        statistics: {
          totalQuestions,
          answeredQuestions,
          correctAnswers,
          incorrectAnswers,
          pendingGrading,
          accuracy,
          totalPoints,
          earnedPoints,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching quiz result details:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch quiz result details" },
      { status: 500 }
    );
  }
} 