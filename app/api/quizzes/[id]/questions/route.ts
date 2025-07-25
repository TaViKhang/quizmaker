import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, QuestionType, MediaType } from "@prisma/client";
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

// Base question schema with common fields
const baseQuestionSchema = z.object({
  content: z.string().min(1, "Question content is required"),
  type: z.enum([
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.TRUE_FALSE,
    QuestionType.SHORT_ANSWER,
    QuestionType.MATCHING,
    QuestionType.FILL_BLANK,
    QuestionType.ESSAY,
    QuestionType.CODE,
    QuestionType.FILE_UPLOAD
  ]),
  points: z.number().int().min(1, "Points must be at least 1").default(1),
  order: z.number().int().min(0, "Order must be a non-negative number").optional(),
  mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
  mediaType: z.enum([
    MediaType.IMAGE,
    MediaType.VIDEO,
    MediaType.AUDIO,
    MediaType.DOCUMENT
  ]).optional().nullable(),
  explanation: z.string().optional().nullable(),
  category: z.string().max(50, "Category too long").optional().nullable(),
  tags: z.array(z.string()).optional(),
  
  // Additional fields for specific question types
  codeLanguage: z.string().optional().nullable(),
  codeTemplate: z.string().optional().nullable(),
  caseSensitive: z.boolean().optional(),
  acceptableVariants: z.array(z.string()).optional(),
  maxFileSize: z.number().int().positive().optional().nullable(),
  allowedFileTypes: z.array(z.string()).optional(),
  timeLimit: z.number().int().min(5, "Time limit must be at least 5 seconds").optional().nullable(),
  isMandatory: z.boolean().optional(),
});

// Option schema varies by question type
const multipleChoiceOptionSchema = z.object({
  content: z.string().min(1, "Option content is required"),
  isCorrect: z.boolean(),
  order: z.number().int().min(0).optional(),
  explanation: z.string().optional().nullable(),
  points: z.number().optional().nullable(),
});

const truefalseOptionSchema = z.object({
  content: z.enum(["True", "False"]),
  isCorrect: z.boolean(),
  order: z.number().int().min(0).max(1).optional(),
  explanation: z.string().optional().nullable(),
});

const matchingOptionSchema = z.object({
  id: z.string().optional(), // ID field for existing options
  content: z.string().min(1, "Option content is required"),
  isCorrect: z.boolean().optional(), // Not used for matching
  order: z.number().int().min(0).optional(),
  matchId: z.string().optional(), // Only premises have matchId pointing to responses
  group: z.string().min(1, "Group is required"), // 'premise' or 'response'
});

const fillBlankOptionSchema = z.object({
  content: z.string().min(1, "Option content is required"),
  isCorrect: z.boolean().optional(), // Not directly used for fill-in-the-blank
  order: z.number().int().min(0).optional(),
  position: z.number().int().min(0, "Position must be a non-negative number"),
  points: z.number().optional().nullable(),
});

// Type-specific question validation
const questionSchemas = {
  [QuestionType.MULTIPLE_CHOICE]: baseQuestionSchema.extend({
    options: z.array(multipleChoiceOptionSchema).min(2, "At least 2 options are required"),
  }).refine(data => {
    // At least one option must be correct
    return data.options.some(option => option.isCorrect);
  }, {
    message: "At least one option must be correct",
    path: ["options"],
  }),
  
  [QuestionType.TRUE_FALSE]: baseQuestionSchema.extend({
    options: z.array(truefalseOptionSchema).length(2, "Exactly 2 options (True/False) are required"),
  }).refine(data => {
    // Exactly one option must be correct
    return data.options.filter(option => option.isCorrect).length === 1;
  }, {
    message: "Exactly one option must be correct",
    path: ["options"],
  }),
  
  [QuestionType.SHORT_ANSWER]: baseQuestionSchema.extend({
    options: z.array(multipleChoiceOptionSchema).min(1, "At least 1 correct answer is required"),
    caseSensitive: z.boolean().default(false),
    acceptableVariants: z.array(z.string()).optional(),
  }),
  
  [QuestionType.MATCHING]: baseQuestionSchema.extend({
    options: z.array(matchingOptionSchema).min(4, "At least 2 premises and 2 responses (4 options total) are required"),
    metadata: z.object({
      shuffleOptions: z.boolean().optional()
    }).optional().nullable()
  }).refine(data => {
    // At least 2 premises and 2 responses
    const premises = data.options.filter(option => option.group === 'premise');
    const responses = data.options.filter(option => option.group === 'response');
    return premises.length >= 2 && responses.length >= 2;
  }, {
    message: "At least 2 premises and 2 responses are required",
    path: ["options"],
  }).refine(data => {
    // At least one premise must have a matchId
    const premises = data.options.filter(option => option.group === 'premise');
    return premises.some(premise => premise.matchId && premise.matchId.trim() !== '');
  }, {
    message: "At least one premise must have a matchId assigned",
    path: ["options"],
  }),
  
  [QuestionType.FILL_BLANK]: baseQuestionSchema.extend({
    options: z.array(fillBlankOptionSchema).min(1, "At least 1 blank is required"),
  }).refine(data => {
    // Check that all positions are unique
    const positions = new Set();
    for (const option of data.options) {
      if (positions.has(option.position)) {
        return false;
      }
      positions.add(option.position);
    }
    return true;
  }, {
    message: "Each blank must have a unique position",
    path: ["options"],
  }),
  
  [QuestionType.ESSAY]: baseQuestionSchema.extend({
    options: z.array(z.any()).max(0, "Essay questions should not have options"),
  }),
  
  [QuestionType.CODE]: baseQuestionSchema.extend({
    options: z.array(multipleChoiceOptionSchema).max(0, "Code questions should not have traditional options"),
    codeLanguage: z.string().min(1, "Programming language is required"),
    codeTemplate: z.string().optional(),
  }),
  
  [QuestionType.FILE_UPLOAD]: baseQuestionSchema.extend({
    options: z.array(z.any()).max(0, "File upload questions should not have options"),
    maxFileSize: z.number().int().positive("Max file size must be positive").optional(),
    allowedFileTypes: z.array(z.string()).min(1, "At least one allowed file type is required"),
  }),
};

// Schema for creating a question - discriminated union based on question type
export const createQuestionSchema = z.discriminatedUnion("type", [
  questionSchemas[QuestionType.MULTIPLE_CHOICE] as any,
  questionSchemas[QuestionType.TRUE_FALSE] as any,
  questionSchemas[QuestionType.SHORT_ANSWER] as any,
  questionSchemas[QuestionType.MATCHING] as any,
  questionSchemas[QuestionType.FILL_BLANK] as any,
  questionSchemas[QuestionType.ESSAY] as any,
  questionSchemas[QuestionType.CODE] as any,
  questionSchemas[QuestionType.FILE_UPLOAD] as any,
]);

// Schema for updating a question
export const updateQuestionSchema = z.discriminatedUnion("type", [
  // Multiple choice schema
  z.object({
    type: z.literal(QuestionType.MULTIPLE_CHOICE),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(multipleChoiceOptionSchema).min(2, "At least 2 options are required").optional(),
    isMandatory: z.boolean().optional(),
    metadata: z.object({
        allowMultiple: z.boolean().optional(),
        shuffleOptions: z.boolean().optional(),
        allowPartialCredit: z.boolean().optional()
    }).optional().nullable()
  }),
  
  // True/False schema
  z.object({
    type: z.literal(QuestionType.TRUE_FALSE),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(truefalseOptionSchema).optional(),
    isMandatory: z.boolean().optional(),
  }),
  
  // Short Answer schema
  z.object({
    type: z.literal(QuestionType.SHORT_ANSWER),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(multipleChoiceOptionSchema).min(1, "At least 1 correct answer is required").optional(),
    caseSensitive: z.boolean().optional(),
    acceptableVariants: z.array(z.string()).optional(),
    isMandatory: z.boolean().optional(),
  }),
  
  // Matching schema
  z.object({
    type: z.literal(QuestionType.MATCHING),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(matchingOptionSchema).min(4, "At least 2 premises and 2 responses (4 options total) are required").optional(),
    isMandatory: z.boolean().optional(),
    metadata: z.object({
      shuffleOptions: z.boolean().optional()
    }).optional().nullable()
  }),
  
  // Fill in the blank schema
  z.object({
    type: z.literal(QuestionType.FILL_BLANK),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(fillBlankOptionSchema).min(1, "At least 1 blank is required").optional(),
    isMandatory: z.boolean().optional(),
  }),
  
  // Essay schema
  z.object({
    type: z.literal(QuestionType.ESSAY),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.any()).max(0, "Essay questions should not have options").optional(),
    isMandatory: z.boolean().optional(),
  }),
  
  // Code schema
  z.object({
    type: z.literal(QuestionType.CODE),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.any()).max(0, "Code questions should not have traditional options").optional(),
    codeLanguage: z.string().optional(),
    codeTemplate: z.string().optional(),
    isMandatory: z.boolean().optional(),
  }),
  
  // File Upload schema
  z.object({
    type: z.literal(QuestionType.FILE_UPLOAD),
    content: z.string().min(1, "Question content is required").optional(),
    points: z.number().int().min(1, "Points must be at least 1").optional(),
    order: z.number().int().min(0, "Order must be a non-negative number").optional(),
    mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
    mediaType: z.enum([
      MediaType.IMAGE,
      MediaType.VIDEO,
      MediaType.AUDIO,
      MediaType.DOCUMENT
    ]).optional().nullable(),
    explanation: z.string().optional().nullable(),
    category: z.string().max(50, "Category too long").optional().nullable(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.any()).max(0, "File upload questions should not have options").optional(),
    maxFileSize: z.number().int().positive("Max file size must be positive").optional(),
    allowedFileTypes: z.array(z.string()).min(1, "At least one allowed file type is required").optional(),
    isMandatory: z.boolean().optional(),
  }),
]);

// Schema validation cho parameter
const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

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
 * GET: Get list of questions for a quiz
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const quizId = params.id;
    const url = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = {
      page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 20,
    };
    
    const validationResult = queryParamsSchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        formatZodError(validationResult.error)
      );
    }
    
    const { page, limit } = validationResult.data;
    
    // Check if quiz exists
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        class: {
          include: {
            students: {
              where: {
                studentId: session.user.id
              }
            }
          }
        }
      }
    });
    
    if (!quiz) {
      return createNotFoundError("Quiz not found");
    }
    
    // Check permissions based on role and quiz settings
    const isTeacher = session.user.role === Role.TEACHER;
    let hasAccess = false;
    
    if (isTeacher) {
      // Teacher has access if they created the quiz or teach the class
      hasAccess = quiz.authorId === session.user.id || 
                 (quiz.classId !== null && quiz.class?.teacherId === session.user.id);
    } else {
      // Student access checks
      // 1. Public quiz
      if (quiz.isPublic === true) {
        hasAccess = true;
      } 
      // 2. Class enrollment
      else if (quiz.classId !== null && quiz.class && quiz.class.students && quiz.class.students.length > 0) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return createPermissionError("You don't have access to this quiz");
    }
    
    // Get questions using service
    const result = await quizQuestionService.getQuizQuestions(quizId, limit, page);
    
    return createSuccessResponse({
      items: result.items,
      meta: {
        page,
        limit,
        total: result.total,
        pageCount: Math.ceil(result.total / limit),
      },
    });
    
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

/**
 * POST: Add a question to the quiz
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const quizId = params.id;
    
    // Check permission
    const permissionError = await checkQuizPermission(
      quizId, 
      session.user.id, 
      session.user.role
    );
      
    if (permissionError) {
      return permissionError;
      }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createQuestionSchema.safeParse(body);
    
    if (!validationResult.success) {
        return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid question data",
        formatZodError(validationResult.error)
        );
    }
    
    // Get the maximum order value to append the new question
    const maxOrderQuestion = await db.question.findFirst({
      where: { quizId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    
    const nextOrder = maxOrderQuestion ? maxOrderQuestion.order + 1 : 0;
    
    // Set the order if not provided
    const questionData = {
      ...validationResult.data,
      order: validationResult.data.order ?? nextOrder,
      };
    
    // Create the question using service
    const question = await quizQuestionService.addQuestionToQuiz(
      quizId, 
      questionData
    );
    
    return createSuccessResponse({
      message: "Question added to quiz successfully",
      question,
    });
    
  } catch (error) {
    console.error("Error creating quiz question:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

/**
 * PATCH: Update question ordering in a quiz (redirects to reorder endpoint)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Redirect to the dedicated reorder endpoint
  const reorderUrl = new URL(request.url);
  reorderUrl.pathname = `/api/quizzes/${params.id}/questions/reorder`;
  
  // Forward the request to the reorder endpoint
  return NextResponse.redirect(reorderUrl);
}

// DELETE handler to delete multiple questions at once
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can delete questions
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can delete questions");
    }
    
    const quizId = params.id;
    
    // Check if quiz exists and user has permission
    const quiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        authorId: session.user.id,
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
          "Cannot delete questions from a quiz that has attempts. Unpublish the quiz first."
        );
      }
    }
    
    const { searchParams } = new URL(request.url);
    const questionIds = searchParams.get("ids")?.split(",") || [];
    
    if (questionIds.length === 0) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "No question IDs provided for deletion"
      );
    }
    
    // Verify all questions belong to this quiz
    const questions = await db.question.findMany({
      where: {
        id: { in: questionIds },
        quizId,
      },
      select: {
        id: true,
      }
    });
    
    if (questions.length !== questionIds.length) {
      return createErrorResponse(
        "INVALID_QUESTIONS",
        "Some questions do not exist or do not belong to this quiz"
      );
    }
    
    // Delete the questions and their options in a transaction
    await db.$transaction(async (tx) => {
      // Delete options for all questions
      await tx.option.deleteMany({
        where: {
          questionId: { in: questionIds },
        }
      });
      
      // Delete the questions
      await tx.question.deleteMany({
        where: {
          id: { in: questionIds },
        }
      });
      
      // Reorder remaining questions
      const remainingQuestions = await tx.question.findMany({
        where: {
          quizId,
        },
        orderBy: {
          order: 'asc',
        },
        select: {
          id: true,
        }
      });
      
      // Update orders to be sequential
      for (let i = 0; i < remainingQuestions.length; i++) {
        await tx.question.update({
          where: {
            id: remainingQuestions[i].id,
          },
          data: {
            order: i,
          }
        });
      }
    });
    
    return createSuccessResponse({
      message: "Questions deleted successfully",
      deletedIds: questionIds,
    });
    
  } catch (error) {
    console.error("Error deleting questions:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}