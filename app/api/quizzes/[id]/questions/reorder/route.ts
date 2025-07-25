import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError,
  formatZodError
} from "@/lib/api-response";

// Schema validation for question reordering
const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().cuid("Invalid question ID")),
});

// Function to handle reordering logic - extracted to avoid code duplication
async function handleReordering(
  request: Request,
  quizId: string,
  userId: string,
  userRole: Role | undefined | null
) {
  try {
    // Only teachers can reorder questions
    if (userRole !== Role.TEACHER) {
      return createPermissionError("Only teachers can reorder questions");
    }
    
    // Check if quiz exists and user has permission
    const quiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        authorId: userId,
      }
    });
    
    if (!quiz) {
      return createNotFoundError("Quiz not found or you don't have permission to modify it");
    }
    
    // Check if quiz is already published and has attempts
    if (quiz.isPublished) {
      const hasAttempts = await db.quizAttempt.findFirst({
        where: {
          quizId,
        }
      });
      
      if (hasAttempts) {
        return createErrorResponse(
          "QUIZ_HAS_ATTEMPTS",
          "Cannot reorder questions in a quiz that has attempts. Unpublish the quiz first."
        );
      }
    }
    
    const body = await request.json();
    
    // Validate the reordering data
    const validationResult = reorderQuestionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid question order data",
        formatZodError(validationResult.error)
      );
    }
    
    const { questionIds } = validationResult.data;
    
    // Verify all questions belong to this quiz
    const existingQuestions = await db.question.findMany({
      where: {
        quizId,
      },
      select: {
        id: true,
      }
    });
    
    const existingIds = new Set(existingQuestions.map(q => q.id));
    
    // Check if all provided question IDs exist in the quiz
    if (!questionIds.every(id => existingIds.has(id))) {
      return createErrorResponse(
        "INVALID_QUESTIONS",
        "Some questions do not exist or do not belong to this quiz"
      );
    }
    
    // Check if all questions in the quiz are included in the reordering
    if (questionIds.length !== existingQuestions.length) {
      return createErrorResponse(
        "INCOMPLETE_QUESTIONS",
        "All questions must be included in the reordering"
      );
    }
    
    // Update the order of all questions in a transaction
    await db.$transaction(
      questionIds.map((id, index) => 
        db.question.update({
          where: {
            id,
          },
          data: {
            order: index,
          },
        })
      )
    );
    
    return createSuccessResponse({
      message: "Questions reordered successfully",
      order: questionIds,
    });
    
  } catch (error) {
    console.error("Error reordering questions:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// POST handler to reorder questions in a quiz (backward compatibility)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return createAuthenticationError();
  }
  
  return handleReordering(request, params.id, session.user.id, session.user.role);
}

// PATCH handler to reorder questions in a quiz (new standard RESTful approach)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return createAuthenticationError();
  }
  
  return handleReordering(request, params.id, session.user.id, session.user.role);
} 