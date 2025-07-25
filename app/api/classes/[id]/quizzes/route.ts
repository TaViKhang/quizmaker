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
  createServerError,
  formatZodError
} from "@/lib/api-response";
import { createNotificationsForClass } from "@/lib/notification-service";

// Schema for creating a quiz
const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isPublished: z.boolean().default(false),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timeLimit: z.number().int().min(1).default(60),
  maxAttempts: z.number().int().min(1).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(false),
  showResults: z.boolean().default(false),
  allowReview: z.boolean().default(false),
  requirePassword: z.boolean().default(false),
  password: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can create quizzes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can create quizzes");
    }
    
    const classId = params.id;
    
    // Check if teacher owns the class
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      }
    });
    
    if (!classExists) {
      return createErrorResponse(
        "NOT_FOUND",
        "Class not found or you don't have permission to create quizzes for it"
      );
    }
    
    const body = await request.json();
    
    const validationResult = createQuizSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid quiz data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    
    // Create the quiz
    const newQuiz = await db.quiz.create({
      data: {
        ...data,
        classId,
        authorId: session.user.id,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      }
    });
    
// Add notification logic to notify all students in the class when a quiz is published
if (data.isPublished) {
  // Get the class details to include the class name in the notification
  const classDetails = await db.class.findUnique({
    where: { id: classId },
    select: { name: true }
  });
  
  if (classDetails) {
    // Create notifications for all students in the class
    await createNotificationsForClass({
      classId,
      title: "New Quiz Available",
      message: `A new quiz "${newQuiz.title}" is available in class "${classDetails.name}"`,
      category: 'NEW_QUIZ',
      resourceId: newQuiz.id,
      resourceType: "quiz",
          expiredAt: newQuiz.endDate || undefined
    });
      }
    }
    
    return createSuccessResponse(newQuiz);
    
  } catch (error) {
    console.error("Error creating quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 