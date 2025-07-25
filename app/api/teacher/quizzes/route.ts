import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * GET handler for retrieving all quizzes for a teacher
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Forbidden: Teachers only" }, { status: 403 });
    }
    
    // Get URL parameters for pagination, sorting, etc.
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const orderBy = searchParams.get("orderBy") || "updatedAt";
    const order = searchParams.get("order") || "desc";
    
    // Find all quizzes created by the authenticated teacher
    const quizzes = await prisma.quiz.findMany({
      where: {
        authorId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        isActive: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        classId: true,
        class: {
          select: {
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
      orderBy: {
        [orderBy]: order,
      },
      skip: offset,
      take: limit,
    });
    
    // Transform the data to include question and attempt counts
    const transformedQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      isActive: quiz.isActive,
      isPublished: quiz.isPublished,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      category: quiz.category,
      classId: quiz.classId,
      className: quiz.class?.name || null,
      questionsCount: quiz._count.questions,
      attemptsCount: quiz._count.attempts,
    }));
    
    return NextResponse.json(transformedQuizzes);
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST handler for creating a new quiz
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Forbidden: Teachers only" }, { status: 403 });
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json({ error: "Quiz title is required" }, { status: 400 });
    }
    
    // Create the quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description || null,
        timeLimit: data.timeLimit || 60, // Default 60 minutes
        authorId: session.user.id,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isPublished: data.isPublished !== undefined ? data.isPublished : false,
        accessCode: data.accessCode || null,
        category: data.category || null,
        classId: data.classId || null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        maxAttempts: data.maxAttempts || null,
        passingScore: data.passingScore || null,
        showResults: data.showResults !== undefined ? data.showResults : true,
        shuffleQuestions: data.shuffleQuestions !== undefined ? data.shuffleQuestions : false,
        startDate: data.startDate ? new Date(data.startDate) : null,
        tags: data.tags || [],
        isPublic: data.isPublic !== undefined ? data.isPublic : false,
        publicAccessCode: data.publicAccessCode || null,
      },
    });
    
    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 