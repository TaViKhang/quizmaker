import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * PUT handler for publishing a quiz
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }

    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }

    const userId = session.user.id;
    const quizId = params.quizId;

    // Check if the quiz exists and belongs to the teacher
    const existingQuiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        authorId: userId, // Ensure this quiz belongs to the teacher
      },
      include: {
        questions: true,
      },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });
    }

    // Make sure the quiz has at least one question
    if (existingQuiz.questions.length === 0) {
      return NextResponse.json(
        { error: "Quiz phải có ít nhất một câu hỏi để có thể xuất bản" },
        { status: 400 }
      );
    }

    // Update the quiz to be published
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        isPublished: true,
      },
    });

    return NextResponse.json({
      success: true,
      quiz: updatedQuiz,
    });
  } catch (error) {
    console.error("Error publishing quiz:", error);
    return NextResponse.json(
      { error: "Lỗi khi xuất bản quiz" },
      { status: 500 }
    );
  }
} 