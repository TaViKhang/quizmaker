import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

interface RouteParams {
  params: {
    quizId: string;
  };
}

// Schema for updating a quiz
const updateQuizSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  timeLimit: z.coerce.number().int().min(1).max(240).optional(),
  isActive: z.boolean().optional(),
  classId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  passingScore: z.coerce.number().min(0).max(100).optional().nullable(),
  maxAttempts: z.coerce.number().int().min(1).optional().nullable(),
  showResults: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

/**
 * GET handler for retrieving a specific quiz by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }
    
    // Check if user is a teacher 
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Find the quiz
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        // Ensure this quiz belongs to the teacher
        authorId: userId
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
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });
    
    // Check if quiz exists
    if (!quiz) {
      return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });
    }
    
    // Check if user is authorized to access the quiz
    if (quiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You don't have access to this quiz" }, { status: 403 });
    }
    
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error retrieving quiz:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin quiz" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a quiz
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Check if quiz exists and belongs to the teacher
    const existingQuiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        // Ensure this quiz belongs to the teacher
        authorId: userId
      },
    });
    
    if (!existingQuiz) {
      return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });
    }
    
    if (existingQuiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this quiz" }, { status: 403 });
    }
    
    // Parse and validate the request body
    const body = await req.json();
    
    const validationResult = updateQuizSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // Convert date strings to Date objects if provided
    const updateData = { ...data };
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Update the quiz
    const updatedQuiz = await prisma.quiz.update({
      where: {
        id: quizId,
      },
      data: updateData,
    });
    
    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật quiz" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a quiz
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Check if quiz exists and belongs to the teacher
    const existingQuiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        // Ensure this quiz belongs to the teacher
        authorId: userId
      },
    });
    
    if (!existingQuiz) {
      return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });
    }
    
    if (existingQuiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to delete this quiz" }, { status: 403 });
    }
    
    // Delete the quiz and all related data
    // Note: This assumes cascading deletes are set up in the Prisma schema
    await prisma.quiz.delete({
      where: {
        id: quizId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa quiz" },
      { status: 500 }
    );
  }
} 