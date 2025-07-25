import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, ClassType } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError,
  formatZodError
} from "@/lib/api-response";

/**
 * Schema for validating access requests
 */
const accessRequestSchema = z.object({
  accessCode: z.string().optional(),
  publicAccessCode: z.string().optional(),
});

/**
 * POST handler for checking quiz access permissions
 * This endpoint validates access codes and user permissions for a quiz
 * Authentication is required for all access
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Always require authentication
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const quizId = params.id;
    const body = await request.json();
    
    // Validate request body
    const validationResult = accessRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid access request data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    
    // Get the quiz
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        class: {
          select: {
            id: true,
            type: true,
            students: {
              select: { 
                studentId: true 
              }
            }
          }
        }
      }
    });
    
    if (!quiz) {
      return createNotFoundError("Quiz not found");
    }
    
    // Check if quiz is active and published
    if (!quiz.isActive || !quiz.isPublished) {
      return createErrorResponse(
        "QUIZ_NOT_AVAILABLE",
        "This quiz is not currently available"
      );
    }
    
    // Check if quiz is within the available time frame
    const now = new Date();
    if (
      (quiz.startDate && new Date(quiz.startDate) > now) ||
      (quiz.endDate && new Date(quiz.endDate) < now)
    ) {
      return createErrorResponse(
        "QUIZ_NOT_AVAILABLE",
        "This quiz is not available at this time"
      );
    }
    
    // Authenticated user access logic
    
    // Check if this is a class quiz and user is enrolled
    if (quiz.classId) {
      // If it's a private class, check if user is enrolled
      if (quiz.class?.type === ClassType.PRIVATE) {
        const isEnrolled = quiz.class.students.some(
          enrollment => enrollment.studentId === session.user.id
        );
        
        if (!isEnrolled && session.user.role !== Role.TEACHER) {
          return createPermissionError("You are not enrolled in this class");
        }
      }
    }
    
    // Check access code for non-public quizzes (if required)
    if (!quiz.isPublic && quiz.accessCode) {
      if (data.accessCode !== quiz.accessCode) {
        return createErrorResponse(
          "INVALID_ACCESS_CODE",
          "Invalid access code"
        );
      }
    }
    
    // Check public access code for public quizzes
    if (quiz.isPublic && quiz.publicAccessCode) {
      if (data.publicAccessCode !== quiz.publicAccessCode) {
        return createErrorResponse(
          "INVALID_ACCESS_CODE",
          "Invalid public access code"
        );
      }
    }
    
    // Check max attempts if applicable
    if (quiz.maxAttempts) {
      const attemptCount = await db.quizAttempt.count({
        where: {
          quizId,
          userId: session.user.id
        }
      });
      
      if (attemptCount >= quiz.maxAttempts) {
        return createErrorResponse(
          "MAX_ATTEMPTS_REACHED",
          "You have reached the maximum number of attempts for this quiz"
        );
      }
    }
    
    // User has access
    return createSuccessResponse({
      hasAccess: true,
      message: "Access granted",
      accessType: "authenticated",
      requiresAttemptCreation: true,
      userId: session.user.id
    });
    
  } catch (error) {
    console.error("Error checking quiz access:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 