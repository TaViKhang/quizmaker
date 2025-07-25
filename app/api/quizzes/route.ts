import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, Prisma, ClassType, QuestionType } from "@prisma/client";
import { 
  createPaginatedResponse, 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createServerError,
  formatZodError
} from "@/lib/api-response";
import { createNotificationsForClass } from "@/lib/notification-service";

// Enhanced schema validation for creating a quiz
const createQuizSchema = z.object({
  title: z.string()
    .min(3, "Quiz title must be at least 3 characters")
    .max(200, "Quiz title too long"),
  description: z.string()
    .max(2000, "Description too long")
    .optional(),
  classId: z.string()
    .cuid("Invalid class ID")
    .optional(),
  timeLimit: z.number()
    .int("Time limit must be a whole number")
    .min(1, "Time limit must be at least 1 minute")
    .max(480, "Time limit cannot exceed 8 hours (480 minutes)"),
  maxAttempts: z.number()
    .int("Must be a whole number")
    .positive("Must be a positive number")
    .optional(),
  passingScore: z.number()
    .min(0, "Passing score cannot be negative")
    .max(100, "Passing score must be between 0-100")
    .optional(),
  shuffleQuestions: z.boolean()
    .default(false),
  showResults: z.boolean()
    .default(true),
  startDate: z.string()
    .datetime("Invalid start date format")
    .optional(),
  endDate: z.string()
    .datetime("Invalid end date format")
    .optional(),
  isActive: z.boolean()
    .default(true),
  isPublished: z.boolean()
    .default(false),
  accessCode: z.string()
    .max(20, "Access code too long")
    .optional(),
  category: z.string()
    .max(50, "Category too long")
    .optional(),
  tags: z.array(
    z.string().max(30, "Tag is too long")
  )
    .max(10, "Maximum 10 tags allowed")
    .optional(),
  isPublic: z.boolean()
    .default(false),
  publicAccessCode: z.string()
    .regex(/^[A-Za-z0-9]{8,12}$/, "Public access code must be 8-12 alphanumeric characters")
    .optional(),
  questionTypes: z.array(
    z.enum([
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.TRUE_FALSE,
      QuestionType.SHORT_ANSWER,
      QuestionType.MATCHING,
      QuestionType.FILL_BLANK,
      QuestionType.ESSAY,
      QuestionType.CODE,
      QuestionType.FILE_UPLOAD
    ])
  )
    .optional(),
}).refine(data => {
  // Ensure endDate is after startDate if both are provided
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Schema for updating a quiz - tạo lại schema để tránh lỗi .partial()
const updateQuizSchema = z.object({
  id: z.string().cuid("Invalid quiz ID"),
  title: z.string()
    .min(3, "Quiz title must be at least 3 characters")
    .max(200, "Quiz title too long")
    .optional(),
  description: z.string()
    .max(2000, "Description too long")
    .optional(),
  classId: z.string()
    .cuid("Invalid class ID")
    .optional(),
  timeLimit: z.number()
    .int("Time limit must be a whole number")
    .min(1, "Time limit must be at least 1 minute")
    .max(480, "Time limit cannot exceed 8 hours (480 minutes)")
    .optional(),
  maxAttempts: z.number()
    .int("Must be a whole number")
    .positive("Must be a positive number")
    .optional(),
  passingScore: z.number()
    .min(0, "Passing score cannot be negative")
    .max(100, "Passing score must be between 0-100")
    .optional(),
  shuffleQuestions: z.boolean()
    .optional(),
  showResults: z.boolean()
    .optional(),
  startDate: z.string()
    .datetime("Invalid start date format")
    .optional(),
  endDate: z.string()
    .datetime("Invalid end date format")
    .optional(),
  isActive: z.boolean()
    .optional(),
  isPublished: z.boolean()
    .optional(),
  accessCode: z.string()
    .max(20, "Access code too long")
    .optional(),
  category: z.string()
    .max(50, "Category too long")
    .optional(),
  tags: z.array(
    z.string().max(30, "Tag is too long")
  )
    .max(10, "Maximum 10 tags allowed")
    .optional(),
  isPublic: z.boolean()
    .optional(),
  publicAccessCode: z.string()
    .regex(/^[A-Za-z0-9]{8,12}$/, "Public access code must be 8-12 alphanumeric characters")
    .optional(),
  questionTypes: z.array(
    z.enum([
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.TRUE_FALSE,
      QuestionType.SHORT_ANSWER,
      QuestionType.MATCHING,
      QuestionType.FILL_BLANK,
      QuestionType.ESSAY,
      QuestionType.CODE,
      QuestionType.FILE_UPLOAD
    ])
  )
    .optional(),
}).refine(data => {
  // Ensure endDate is after startDate if both are provided
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Enhanced filter parameters for quiz queries
interface QuizQueryParams {
  page: number;
  limit: number;
  search: string;
  classId?: string;
  authorId?: string;
  isActive?: boolean;
  isPublished?: boolean;
  category?: string;
  tags?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  questionTypes?: QuestionType[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Function to parse query parameters into structured object
function parseQuizQueryParams(searchParams: URLSearchParams): QuizQueryParams {
  return {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
    search: searchParams.get("search") || "",
    classId: searchParams.get("classId") || undefined,
    authorId: searchParams.get("authorId") || undefined,
    isActive: searchParams.get("isActive") !== null 
      ? searchParams.get("isActive") === "true" 
      : undefined,
    isPublished: searchParams.get("isPublished") !== null 
      ? searchParams.get("isPublished") === "true" 
      : undefined,
    category: searchParams.get("category") || undefined,
    tags: searchParams.get("tags") ? searchParams.get("tags")!.split(",") : undefined,
    startDateFrom: searchParams.get("startDateFrom") || undefined,
    startDateTo: searchParams.get("startDateTo") || undefined,
    endDateFrom: searchParams.get("endDateFrom") || undefined,
    endDateTo: searchParams.get("endDateTo") || undefined,
    questionTypes: searchParams.get("questionTypes") 
      ? searchParams.get("questionTypes")!.split(",") as QuestionType[] 
      : undefined,
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
  };
}

// GET handler for fetching quizzes with enhanced filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const { searchParams } = new URL(request.url);
    const queryParams = parseQuizQueryParams(searchParams);
    
    // Pagination
    const offset = (queryParams.page - 1) * queryParams.limit;
    
    // Build query filters based on parameters
    let where: Prisma.QuizWhereInput = {};
    
    // Search filter
    if (queryParams.search) {
      where.OR = [
        { title: { contains: queryParams.search, mode: "insensitive" } },
        { description: { contains: queryParams.search, mode: "insensitive" } },
        { category: { contains: queryParams.search, mode: "insensitive" } },
      ];
    }
    
    // Class filter
    if (queryParams.classId) {
      where.classId = queryParams.classId;
    }
    
    // Author filter
    if (queryParams.authorId) {
      where.authorId = queryParams.authorId;
    }
    
    // Status filters
    if (queryParams.isActive !== undefined) {
      where.isActive = queryParams.isActive;
    }
    
    if (queryParams.isPublished !== undefined) {
      where.isPublished = queryParams.isPublished;
    }
    
    // Category filter
    if (queryParams.category) {
      where.category = queryParams.category;
    }
    
    // Tags filter
    if (queryParams.tags && queryParams.tags.length > 0) {
      where.tags = {
        hasSome: queryParams.tags
      };
    }
    
    // Date range filters
    if (queryParams.startDateFrom || queryParams.startDateTo) {
      where.startDate = {};
      
      if (queryParams.startDateFrom) {
        where.startDate.gte = new Date(queryParams.startDateFrom);
      }
      
      if (queryParams.startDateTo) {
        where.startDate.lte = new Date(queryParams.startDateTo);
      }
    }
    
    if (queryParams.endDateFrom || queryParams.endDateTo) {
      where.endDate = {};
      
      if (queryParams.endDateFrom) {
        where.endDate.gte = new Date(queryParams.endDateFrom);
      }
      
      if (queryParams.endDateTo) {
        where.endDate.lte = new Date(queryParams.endDateTo);
      }
    }
    
    // Question type filter
    if (queryParams.questionTypes && queryParams.questionTypes.length > 0) {
      where.questions = {
        some: {
          type: {
            in: queryParams.questionTypes
          }
        }
      };
    }
    
    // Role-specific filters
    if (session.user.role === Role.TEACHER) {
      // Teachers can see all quizzes they created
      where.authorId = session.user.id;
    } else if (session.user.role === Role.STUDENT) {
      // Students can only see published, active quizzes from classes they're enrolled in
      const currentDate = new Date();
      
      where = {
        ...where,
        isPublished: true,
        isActive: true,
        // Combine date and access conditions using AND
        AND: [
          // Date conditions
          {
            OR: [
              { startDate: { lte: currentDate } },
              { startDate: null }
            ],
            AND: [
              { endDate: { gte: currentDate } },
              { endDate: null }
            ]
          },
          // Access conditions
          {
            OR: [
              { isPublic: true },
              {
                class: {
                  OR: [
                    { type: ClassType.PUBLIC },
                    {
                      students: {
                        some: {
                          studentId: session.user.id,
                        },
                      },
                    },
                  ],
                }
              }
            ]
          }
        ]
      };
    }
    
    // Get total count for pagination
    const total = await db.quiz.count({ where });
    
    // Tìm các quizzes
    const quizzes = await db.quiz.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            code: session.user.role === Role.TEACHER ? true : false,
          }
        },
        questions: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
        attempts: {
          where: {
            userId: session.user.id,
      },
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
        }
      },
      orderBy: {
        [queryParams.sortBy]: queryParams.sortOrder,
      },
      skip: offset,
      take: queryParams.limit,
    });
    
    // For students, check if they have attempted each quiz
    let formattedQuizzes;
    
    if (session.user.role === Role.STUDENT) {
      // Get all attempt IDs for this student
      const attempts = await db.quizAttempt.findMany({
        where: {
          userId: session.user.id,
          quizId: {
            in: quizzes.map(q => q.id)
          }
        },
        select: {
          id: true,
          quizId: true,
          completedAt: true,
          score: true,
        }
      });
      
      // Map attempts to quizzes
      const attemptsMap = new Map();
      attempts.forEach(attempt => {
        if (!attemptsMap.has(attempt.quizId)) {
          attemptsMap.set(attempt.quizId, []);
        }
        attemptsMap.get(attempt.quizId).push(attempt);
      });
      
      // Add attempt info to quizzes
      formattedQuizzes = quizzes.map(quiz => {
        const quizAttempts = attemptsMap.get(quiz.id) || [];
        const attemptCount = quizAttempts.length;
        const lastAttempt = attemptCount > 0 ? quizAttempts.reduce((latest: { completedAt: Date | null; }, current: { completedAt: Date | null; }) => 
          !latest.completedAt || (current.completedAt && current.completedAt > latest.completedAt) 
            ? current 
            : latest
        ) : null;
        
        const highestScore = quizAttempts.length > 0 
          ? Math.max(...quizAttempts.filter((a: { score: number | null }) => a.score !== null).map((a: { score: number | null }) => a.score || 0)) 
          : null;
        
        return {
        ...quiz,
          attemptsCount: attemptCount,
          lastAttemptId: lastAttempt?.id || null,
          lastAttemptDate: lastAttempt?.completedAt || null,
          highestScore,
          hasUnfinishedAttempt: quizAttempts.some((a: { completedAt: Date | null }) => a.completedAt === null),
          canAttempt: quiz.maxAttempts ? attemptCount < quiz.maxAttempts : true,
        };
      });
    } else {
      // For teachers, just pass through the quiz data
      formattedQuizzes = quizzes;
    }
    
    // Return formatted response
    return createPaginatedResponse(
      formattedQuizzes as any,
      total,
      queryParams.page,
      queryParams.limit,
      {
        filters: { 
          search: queryParams.search,
          classId: queryParams.classId,
          authorId: queryParams.authorId,
          isActive: queryParams.isActive,
          isPublished: queryParams.isPublished,
          category: queryParams.category,
          tags: queryParams.tags,
          startDateFrom: queryParams.startDateFrom,
          startDateTo: queryParams.startDateTo,
          endDateFrom: queryParams.endDateFrom,
          endDateTo: queryParams.endDateTo,
          questionTypes: queryParams.questionTypes,
        }
      }
    );
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// POST handler for creating a quiz with enhanced validation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can create quizzes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can create quizzes");
    }
    
    const requestData = await request.json();
    const validationResult = createQuizSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid quiz data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    
    // Check if user is allowed to create quiz in the specified class
    if (data.classId) {
      const classDetails = await db.class.findUnique({
        where: { 
          id: data.classId,
        },
      });
      
      if (!classDetails) {
        return createErrorResponse(
          "NOT_FOUND",
          "Class not found"
        );
      }
      
      if (classDetails.teacherId !== session.user.id) {
        return createPermissionError("You can only create quizzes for classes you teach");
      }
    }
    
    // Nếu quiz là public nhưng không có publicAccessCode, tự động tạo
    if (data.isPublic && !data.publicAccessCode) {
      data.publicAccessCode = generatePublicAccessCode();
    }
    
    // Construct the quiz data with proper types
    const quizData: any = {
      title: data.title,
      description: data.description,
      classId: data.classId,
      timeLimit: data.timeLimit,
      maxAttempts: data.maxAttempts,
      passingScore: data.passingScore,
      shuffleQuestions: data.shuffleQuestions,
      showResults: data.showResults,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isActive: data.isActive,
      isPublished: data.isPublished,
      accessCode: data.accessCode,
      category: data.category,
      tags: data.tags || [],
      isPublic: data.isPublic,
      publicAccessCode: data.publicAccessCode,
      authorId: session.user.id
    };
    
    // Save to metadata if needed
    if (data.questionTypes && data.questionTypes.length > 0) {
      quizData.metadata = {
        ...quizData.metadata,
        questionTypes: data.questionTypes
      };
    }
    
    const newQuiz = await db.quiz.create({
      data: quizData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });
    
    // Create notification if quiz is published and has a class
    if (data.isPublished && data.classId) {
      const classId = data.classId;
      
      await createNotificationsForClass({
        classId,
        title: "New Quiz Available",
        message: `A new quiz "${data.title}" has been published.`,
        category: "QUIZ",
        resourceId: newQuiz.id,
        resourceType: "Quiz",
        link: `/quizzes/${newQuiz.id}`
      } as any);
    }
    
    return createSuccessResponse(newQuiz);
    
  } catch (error) {
    console.error("Error creating quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// PUT handler for updating quizzes
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can update quizzes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can update quizzes");
    }
    
    const body = await request.json();
    
    const validationResult = updateQuizSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid quiz data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    const quizId = data.id;
    
    // Nếu quiz được cập nhật thành public và không có publicAccessCode, tự động tạo
    if (data.isPublic === true && !data.publicAccessCode) {
      data.publicAccessCode = generatePublicAccessCode();
    }
    
    // Check if teacher owns the quiz
    const existingQuiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        authorId: session.user.id
      },
      include: {
        attempts: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (!existingQuiz) {
      return createErrorResponse(
        "NOT_FOUND",
        "Quiz not found or you don't have permission to update it"
      );
    }
    
    // If class ID is being updated, validate it
    if (data.classId && data.classId !== existingQuiz.classId) {
      const classExists = await db.class.findFirst({
        where: {
          id: data.classId,
          teacherId: session.user.id
        }
      });
      
      if (!classExists) {
        return createErrorResponse(
          "INVALID_CLASS",
          "Class not found or you don't have permission to add quizzes to it"
        );
      }
    }
    
    // If public access code is being updated, check if it's unique
    if (data.isPublic && data.publicAccessCode && data.publicAccessCode !== existingQuiz.publicAccessCode) {
      const duplicateCode = await db.quiz.findFirst({
        where: {
          publicAccessCode: data.publicAccessCode,
          id: { not: quizId }
    }
      });
      
      if (duplicateCode) {
        return createErrorResponse(
          "DUPLICATE_CODE",
          "Public access code already exists, please choose a different code"
        );
      }
    }
    
    // Convert date strings to Date objects if provided
    const updateData: any = { ...data };
    delete updateData.id; // Remove id from update data
    
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    
    // Prevent changing certain fields if quiz has attempts
    if (existingQuiz.attempts.length > 0) {
      // Don't allow changing time limit, max attempts if there are existing attempts
      delete updateData.timeLimit;
      delete updateData.maxAttempts;
      
      // Add warning to response
      const warnings = ["Some settings could not be changed because this quiz has existing attempts."];
    }
    
    // Update the quiz
    const updatedQuiz = await db.quiz.update({
      where: {
        id: quizId
      },
      data: updateData
    });
    
    // If the quiz was published and linked to a class, send notification
    if (data.isPublished === true && !existingQuiz.isPublished && updatedQuiz.classId) {
      await createNotificationsForClass({
        classId: updatedQuiz.classId,
        title: "Quiz Published",
        message: `Quiz "${updatedQuiz.title}" is now available.`,
        link: `/quizzes/${updatedQuiz.id}`
      } as any);
    }
    
    return createSuccessResponse(updatedQuiz);
    
  } catch (error) {
    console.error("Error updating quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// DELETE handler for deleting quizzes
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can delete quizzes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can delete quizzes");
    }
    
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("id");
    
    if (!quizId) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Quiz ID is required"
      );
    }
    
    // Check if teacher owns the quiz
    const existingQuiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        authorId: session.user.id
      },
      include: {
        attempts: {
          select: {
            id: true
          }
        },
        questions: {
      select: {
            id: true
          }
        }
      }
    });
    
    if (!existingQuiz) {
      return createErrorResponse(
        "NOT_FOUND",
        "Quiz not found or you don't have permission to delete it"
      );
    }
    
    // Check if the quiz has attempts
    if (existingQuiz.attempts.length > 0) {
      return createErrorResponse(
        "QUIZ_HAS_ATTEMPTS",
        "Cannot delete quiz with existing attempts. Consider deactivating it instead."
      );
    }
    
    // Use a transaction to delete questions, options, and the quiz
    await db.$transaction(async (tx) => {
      // Delete all options for questions in this quiz
      for (const question of existingQuiz.questions) {
        await tx.option.deleteMany({
          where: {
            questionId: question.id
          }
      });
      }
      
      // Delete all questions
      await tx.question.deleteMany({
        where: {
          quizId
        }
      });
      
      // Delete the quiz
      await tx.quiz.delete({
        where: {
          id: quizId
        }
        });
    });
    
    return createSuccessResponse({
      message: "Quiz deleted successfully",
      deletedId: quizId
    });
    
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// Helper function to reorder questions
async function reorderQuestions(quizId: string) {
  const questions = await db.question.findMany({
    where: { quizId },
    orderBy: { order: 'asc' }
  });
  
  // Reorder questions to have sequential order numbers
  const updates = questions.map((question, index) => {
    return db.question.update({
      where: { id: question.id },
      data: { order: index }
    });
  });
  
  await Promise.all(updates);
}

// Sorting function for questions
function sortQuestionsByOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}

// Sorting function for question options
function sortOptionsByOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}

// Helper to compare arrays
function compareQuestions(current: Array<{
  content: string;
  points: number;
  type: string;
  options?: Array<{
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
  order: number;
}>, latest: Array<{
  content: string;
  points: number;
  type: string;
  options?: Array<{
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
  order: number;
}>) {
  if (current.length !== latest.length) return false;
  
  // Sort both arrays by order
  const sortedCurrent = [...current].sort(sortQuestionsByOrder);
  const sortedLatest = [...latest].sort(sortQuestionsByOrder);
  
  for (let i = 0; i < sortedCurrent.length; i++) {
    const currQ = sortedCurrent[i];
    const latestQ = sortedLatest[i];
    
    if (
      currQ.content !== latestQ.content ||
      currQ.points !== latestQ.points ||
      currQ.type !== latestQ.type
    ) {
      return false;
    }
    
    // Compare options
    const currOpts = currQ.options || [];
    const latestOpts = latestQ.options || [];
    
    if (currOpts.length !== latestOpts.length) return false;
    
    // Sort both option arrays by order
    const sortedCurrentOpts = [...currOpts].sort(sortOptionsByOrder);
    const sortedLatestOpts = [...latestOpts].sort(sortOptionsByOrder);
    
    for (let j = 0; j < sortedCurrentOpts.length; j++) {
      const currOpt = sortedCurrentOpts[j];
      const latestOpt = sortedLatestOpts[j];
      
      if (
        currOpt.content !== latestOpt.content ||
        currOpt.isCorrect !== latestOpt.isCorrect
      ) {
        return false;
      }
    }
  }
  
  return true;
}

// Helper function to generate a random public access code
function generatePublicAccessCode(length: number = 10): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset.charAt(randomIndex);
  }
  return result;
} 