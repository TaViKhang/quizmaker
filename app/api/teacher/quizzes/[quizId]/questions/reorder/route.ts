import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

// Schema for reordering questions
const reorderSchema = z.object({
  order: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(1),
    })
  ),
});

/**
 * PUT handler for reordering questions in a quiz
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
    const paramsData = await params;
    const quizId = paramsData.quizId;

    // Check if the quiz exists and belongs to the teacher
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        authorId: userId,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = reorderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get all questions for this quiz
    const quizQuestions = await prisma.question.findMany({
      where: { quizId },
      select: { id: true },
    });

    // Verify that all question IDs in the request belong to this quiz
    const quizQuestionIds = quizQuestions.map((q) => q.id);
    const allQuestionsExist = data.order.every((item) =>
      quizQuestionIds.includes(item.id)
    );

    if (!allQuestionsExist) {
      return NextResponse.json(
        { error: "Một hoặc nhiều câu hỏi không tồn tại trong quiz này" },
        { status: 400 }
      );
    }

    // Update the order of each question
    await Promise.all(
      data.order.map((item) =>
        prisma.question.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering questions:", error);
    return NextResponse.json(
      { error: "Lỗi khi sắp xếp lại câu hỏi" },
      { status: 500 }
    );
  }
} 