import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

interface RouteParams {
  params: {
    quizId: string;
  };
}

/**
 * POST handler for duplicating a quiz
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Forbidden: Teachers only" }, { status: 403 });
    }
    
    // Fetch the original quiz
    const originalQuiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });
    
    // Check if quiz exists
    if (!originalQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    
    // Check if user is authorized to duplicate the quiz
    if (originalQuiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to duplicate this quiz" }, { status: 403 });
    }
    
    // Create a new quiz as a copy
    const newQuiz = await prisma.quiz.create({
      data: {
        title: `${originalQuiz.title} (Copy)`,
        description: originalQuiz.description,
        timeLimit: originalQuiz.timeLimit,
        authorId: session.user.id,
        isActive: originalQuiz.isActive,
        isPublished: false, // Always set as draft initially
        accessCode: originalQuiz.accessCode,
        category: originalQuiz.category,
        classId: originalQuiz.classId,
        maxAttempts: originalQuiz.maxAttempts,
        passingScore: originalQuiz.passingScore,
        showResults: originalQuiz.showResults,
        shuffleQuestions: originalQuiz.shuffleQuestions,
        tags: originalQuiz.tags,
        isPublic: originalQuiz.isPublic,
      },
    });
    
    // Duplicate all questions and options
    if (originalQuiz.questions.length > 0) {
      for (const question of originalQuiz.questions) {
        // Create new question
        const newQuestion = await prisma.question.create({
          data: {
            quizId: newQuiz.id,
            content: question.content,
            type: question.type,
            points: question.points,
            order: question.order,
            category: question.category,
            difficulty: question.difficulty,
            explanation: question.explanation,
            mediaType: question.mediaType,
            mediaUrl: question.mediaUrl,
            metadata: question.metadata as Prisma.InputJsonValue | undefined,
            tags: question.tags,
          },
        });
        
        // Create new options for the question
        if (question.options.length > 0) {
          await prisma.option.createMany({
            data: question.options.map(option => ({
              questionId: newQuestion.id,
              content: option.content,
              isCorrect: option.isCorrect,
              order: option.order,
              group: option.group,
              matchId: option.matchId,
              position: option.position,
            })),
          });
        }
      }
    }
    
    // Fetch the complete new quiz with questions and options
    const completeNewQuiz = await prisma.quiz.findUnique({
      where: {
        id: newQuiz.id,
      },
      include: {
        questions: {
          include: {
            options: true,
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
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });
    
    // Transform the data for response
    const transformedQuiz = {
      id: completeNewQuiz!.id,
      title: completeNewQuiz!.title,
      description: completeNewQuiz!.description,
      isActive: completeNewQuiz!.isActive,
      isPublished: completeNewQuiz!.isPublished,
      createdAt: completeNewQuiz!.createdAt,
      updatedAt: completeNewQuiz!.updatedAt,
      category: completeNewQuiz!.category,
      classId: completeNewQuiz!.classId,
      className: completeNewQuiz!.class?.name || null,
      questionsCount: completeNewQuiz!._count.questions,
      attemptsCount: completeNewQuiz!._count.attempts,
    };
    
    return NextResponse.json(transformedQuiz);
  } catch (error) {
    console.error("Error duplicating quiz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 