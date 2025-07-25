import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@prisma/client";

/**
 * POST /api/migrations/mcq-answers
 * Migrates existing MCQ/TRUE_FALSE answers to use selectedOptionIds instead of selectedOption
 * Requires TEACHER role
 */
export async function POST(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all MCQ/TRUE_FALSE answers that need migration
    const mcqAnswers = await prisma.answer.findMany({
      where: {
        question: {
          type: {
            in: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE]
          }
        },
        selectedOptionIds: {
          equals: []
        },
        selectedOption: {
          not: null
        }
      },
      include: {
        question: true
      }
    });

    console.log(`Found ${mcqAnswers.length} MCQ answers to migrate`);

    let migratedCount = 0;
    let errorCount = 0;
    
    // Process each answer
    for (const answer of mcqAnswers) {
      try {
        if (answer.selectedOption) {
          // Convert selectedOption to selectedOptionIds array
          const selectedOptions = [answer.selectedOption];
          
          // Update the answer with the new selectedOptionIds
          await prisma.answer.update({
            where: { id: answer.id },
            data: { 
              selectedOptionIds: selectedOptions 
            }
          });
          
          migratedCount++;
        }
      } catch (error) {
        console.error(`Error migrating answer ${answer.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. Migrated: ${migratedCount}, Errors: ${errorCount}`,
      migrated: migratedCount,
      errors: errorCount,
      total: mcqAnswers.length
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, message: "Migration failed", error: String(error) },
      { status: 500 }
    );
  }
} 