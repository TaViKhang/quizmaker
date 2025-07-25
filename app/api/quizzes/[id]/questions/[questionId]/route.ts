import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, QuestionType, MediaType, Prisma } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError,
  formatZodError
} from "@/lib/api-response";
import { QuizQuestionService } from "@/app/api/services/quiz-question-service";
import { 
  UpdateQuestionSchema,
  UpdateQuestionInput,
  OptionSchema 
} from "@/app/api/schemas/question-schemas";
import { 
  MultipleChoiceMetadataSchema 
} from "@/app/api/schemas/question-metadata-schemas";

// Initialize service
const quizQuestionService = new QuizQuestionService();

// Function to handle quiz permission checking and common logic
async function checkQuizPermission(
  quizId: string, 
  userId: string, 
  userRole: Role | null | undefined
) {
  const permissionResult = await quizQuestionService.checkQuizPermission(
    quizId, 
    userId, 
    userRole
  );

  if (!permissionResult.hasPermission) {
    if (permissionResult.error?.code === "NOT_FOUND") {
      return createNotFoundError(permissionResult.error.message);
    }
    return createErrorResponse(
      permissionResult.error?.code || "PERMISSION_DENIED",
      permissionResult.error?.message || "Permission denied"
    );
  }

  return null; // No error
}

/**
 * GET: Get a specific question in the quiz
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const { id: quizId, questionId } = params;
    
    // Check if quiz exists
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
    });
    
    if (!quiz) {
      return createNotFoundError("Quiz not found");
    }
    
    // Check if question exists and belongs to this quiz
    const question = await db.question.findFirst({
      where: {
        id: questionId,
        quizId,
      },
      include: {
        options: {
          orderBy: { order: "asc" }
        },
          },
    });
    
    if (!question) {
      return createNotFoundError("Question not found or does not belong to this quiz");
    }
    
    // Check access permissions
    const isTeacher = session.user.role === Role.TEACHER;
    
    // For teachers: must be quiz author or class teacher
    if (isTeacher) {
      const isAuthor = quiz.authorId === session.user.id;
      
      if (quiz.classId) {
        const classInfo = await db.class.findUnique({
          where: { id: quiz.classId },
          select: { teacherId: true },
        });
        
        const isClassTeacher = classInfo?.teacherId === session.user.id;
        
        if (!isAuthor && !isClassTeacher) {
          return createPermissionError("You don't have permission to view this question");
        }
      } else if (!isAuthor) {
        return createPermissionError("You don't have permission to view this question");
      }
    } 
    // For students: check if quiz is published and accessible
    else {
      if (!quiz.isPublished) {
        return createPermissionError("This quiz is not published yet");
      }
      
      // Check if student is enrolled in the class (if quiz is attached to a class)
      if (quiz.classId) {
        const enrollment = await db.classEnrollment.findFirst({
          where: {
            classId: quiz.classId,
            studentId: session.user.id,
          },
        });
        
        if (!enrollment) {
          return createPermissionError("You are not enrolled in this class");
        }
      } 
      // Check if quiz is public or has valid access
      else if (!quiz.isPublic) {
        // Additional access checks could be added here
        return createPermissionError("You don't have permission to view this question");
      }
    }
    
    return createSuccessResponse(question);
    
  } catch (error) {
    console.error("Error retrieving question:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

/**
 * PUT: Update a specific question in the quiz
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const { id: quizId, questionId } = params;
    
    // Check permission
    const permissionError = await checkQuizPermission(
      quizId, 
      session.user.id, 
      session.user.role
    );
    
    if (permissionError) {
      return permissionError;
    }
    
    // Check if question exists and belongs to this quiz
    const question = await db.question.findFirst({
      where: {
        id: questionId,
        quizId,
      },
      include: {
        options: true
      }
    });
    
    if (!question) {
      return createNotFoundError("Question not found or does not belong to this quiz");
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Make sure type is included - can't change question type
    if (!body.type) {
      body.type = question.type;
    } else if (body.type !== question.type) {
      return createErrorResponse(
        "INVALID_OPERATION",
        "Cannot change question type"
      );
    }
    
    // Validate request body using the schema
    // Use schema from question-schemas.ts
    const validationResult = UpdateQuestionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid question data",
        formatZodError(validationResult.error)
      );
    }
    
    // Process validated data
    const validatedData = validationResult.data;
    
    // Process metadata based on question type
    let updatedMetadata: Record<string, any> = question.metadata as Record<string, any> || {};
    
    if (question.type === "MULTIPLE_CHOICE") {
      // Handle metadata for multiple choice questions
      // Extract metadata properties from the validated data
      const allowMultiple = 
        body.allowMultiple !== undefined ? body.allowMultiple : 
        body.allowMultipleAnswers !== undefined ? body.allowMultipleAnswers :
        (updatedMetadata.allowMultiple !== undefined ? updatedMetadata.allowMultiple : false);
      
      const shuffleOptions = 
        body.shuffleOptions !== undefined ? body.shuffleOptions :
        (updatedMetadata.shuffleOptions !== undefined ? updatedMetadata.shuffleOptions : false);
      
      // Prepare metadata object
      const metadataUpdate = {
        allowMultiple,
        shuffleOptions,
      };
      
      // Validate with dedicated schema
      const metadataValidation = MultipleChoiceMetadataSchema.safeParse(metadataUpdate);
      if (metadataValidation.success) {
        updatedMetadata = metadataValidation.data;
      } else {
      return createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid metadata for Multiple Choice question",
          formatZodError(metadataValidation.error)
        );
      }
    } else if (body.metadata) {
      // For other question types, use metadata as provided
      updatedMetadata = {
        ...updatedMetadata,
        ...(body.metadata as Record<string, any>)
      };
    }
    
    // Update question with options in a transaction
    const updatedQuestion = await db.$transaction(async (tx) => {
      // 1. Update question data first
      const updatedQuestionData = await tx.question.update({
        where: { id: questionId },
        data: {
          content: validatedData.content,
          points: validatedData.points,
          order: validatedData.order,
          explanation: validatedData.explanation,
          category: validatedData.category,
          difficulty: validatedData.difficulty,
          metadata: updatedMetadata as any, // Cast to any to satisfy Prisma
          // Other fields as needed
        }
      });
      
      // 2. Handle options update only if options array is provided
      if (validatedData.options && Array.isArray(validatedData.options)) {
        // Delete all existing options first
        await tx.option.deleteMany({
          where: { questionId }
        });
        
        // Then create new options
        if (validatedData.options.length > 0) {
          await tx.option.createMany({
            data: validatedData.options.map((option, index) => ({
              questionId,
              content: option.content,
              isCorrect: option.isCorrect || false,
              // Preserve order from client, fallback to index
              order: option.order !== undefined ? option.order : index,
              group: option.group || null,
              matchId: option.matchId || null,
              position: option.position || null
            }))
          });
        }
      }
      
      // 3. Return updated question with options
      return await tx.question.findUnique({
        where: { id: questionId },
        include: {
          options: {
            orderBy: { order: "asc" }
          }
        }
      });
    });
    
    return createSuccessResponse({
        message: "Question updated successfully",
      question: updatedQuestion
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

/**
 * DELETE: Remove a specific question from the quiz
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const { id: quizId, questionId } = params;
    
    // Check permission
    const permissionError = await checkQuizPermission(
      quizId, 
      session.user.id, 
      session.user.role
    );
    
    if (permissionError) {
      return permissionError;
    }
    
    // Check if question exists and belongs to this quiz
    const question = await db.question.findFirst({
      where: {
        id: questionId,
        quizId,
      },
    });
    
    if (!question) {
      return createNotFoundError("Question not found or does not belong to this quiz");
    }
    
    // Delete question using service
    const success = await quizQuestionService.deleteQuizQuestion(quizId, questionId);
    
    if (!success) {
      return createErrorResponse(
        "DELETE_FAILED",
        "Failed to delete question"
      );
    }
    
    // Reorder remaining questions to fill the gap
    const remainingQuestions = await db.question.findMany({
      where: { quizId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    
    if (remainingQuestions.length > 0) {
      await db.$transaction(
        remainingQuestions.map((q, index) => 
          db.question.update({
            where: { id: q.id },
            data: { order: index },
          })
        )
      );
    }
    
    return createSuccessResponse({
      message: "Question deleted successfully",
    });
    
  } catch (error) {
    console.error("Error deleting question:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}