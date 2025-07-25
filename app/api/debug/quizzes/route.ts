import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users
    if (!session?.user) {
      return NextResponse.json({
        error: "Authentication required"
      }, { status: 401 });
    }
    
    // Get a list of quizzes with basic info
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 most recent
    });
    
    return NextResponse.json({
      quizzes,
      message: "Fetched quizzes successfully"
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({
      error: "Failed to fetch quizzes",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 