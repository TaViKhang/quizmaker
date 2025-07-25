import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role, Prisma } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";
import { createNotificationsForClass } from "@/lib/notification-service";

// Shared function for publishing quiz logic
async function publishQuiz(request: Request, params: { id: string }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can publish quizzes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can publish quizzes");
    }
    
    const quizId = params.id;
    
    // Use transaction to ensure data consistency
    return await db.$transaction(async (prisma) => {
      // Find the quiz with necessary data
      const existingQuiz = await prisma.quiz.findUnique({
        where: {
          id: quizId,
        },
        select: {
          id: true,
          title: true,
          authorId: true,
          isPublished: true,
          classId: true,
          endDate: true,
          startDate: true,
          timeLimit: true,
          _count: {
            select: {
              questions: true
            }
          },
          class: {
            select: {
              teacherId: true,
              name: true
            }
          }
        }
      });
      
      if (!existingQuiz) {
        return createNotFoundError("Quiz not found");
      }
      
      // Only the author or class teacher can publish the quiz
      const isAuthor = existingQuiz.authorId === session.user.id;
      const isClassTeacher = existingQuiz.class?.teacherId === session.user.id;
      
      if (!isAuthor && !isClassTeacher) {
        return createPermissionError("You don't have permission to publish this quiz");
      }
      
      // Check if quiz is already published
      if (existingQuiz.isPublished) {
        return createErrorResponse(
          "ALREADY_PUBLISHED",
          "Quiz is already published"
        );
      }
      
      // Check if quiz has at least one question
      if (existingQuiz._count.questions === 0) {
        return createErrorResponse(
          "NO_QUESTIONS",
          "Cannot publish a quiz with no questions"
        );
      }
      
      // Additional validation for time constraints
      const now = new Date();
      if (existingQuiz.endDate && new Date(existingQuiz.endDate) < now) {
        return createErrorResponse(
          "INVALID_DATE",
          "Cannot publish a quiz with an end date in the past"
        );
      }
      
      if (existingQuiz.startDate && existingQuiz.endDate &&
          new Date(existingQuiz.startDate) > new Date(existingQuiz.endDate)) {
        return createErrorResponse(
          "INVALID_DATE_RANGE",
          "Start date must be before end date"
        );
      }
      
      // Additional validation for required quiz settings
      if (!existingQuiz.timeLimit || existingQuiz.timeLimit <= 0) {
        return createErrorResponse(
          "INVALID_TIME_LIMIT",
          "Quiz must have a valid time limit"
        );
      }
      
      // Publish the quiz
      const updatedQuiz = await prisma.quiz.update({
        where: {
          id: quizId,
        },
        data: {
          isPublished: true,
          updatedAt: new Date(), // Explicitly update the timestamp
        },
        select: {
          id: true,
          title: true,
          description: true,
          classId: true,
          isPublished: true,
          startDate: true,
          endDate: true,
          timeLimit: true,
          maxAttempts: true,
          updatedAt: true,
        }
      });
      
      // Log the publishing action
      await prisma.activityLog.create({
        data: {
          action: 'QUIZ_PUBLISHED',
          resourceId: quizId,
          resourceType: 'quiz',
          userId: session.user.id,
          details: {
            quizTitle: existingQuiz.title,
            classId: existingQuiz.classId,
            className: existingQuiz.class?.name
          }
        }
      }).catch(err => {
        // Log error but don't fail the transaction
        console.error('Failed to create activity log:', err);
      });
      
      // Create notifications for students if quiz is attached to a class
      if (existingQuiz.classId && existingQuiz.class) {
        try {
          // Format dates for notification
          const startDateStr = existingQuiz.startDate 
            ? new Date(existingQuiz.startDate).toLocaleString() 
            : 'immediately';
            
          const endDateStr = existingQuiz.endDate
            ? ` until ${new Date(existingQuiz.endDate).toLocaleString()}`
            : '';
          
          const timeLimit = existingQuiz.timeLimit 
            ? `You will have ${existingQuiz.timeLimit} minutes to complete it.` 
            : '';
            
          await createNotificationsForClass({
            classId: existingQuiz.classId,
            title: "New Quiz Available",
            message: `A new quiz "${existingQuiz.title}" is available in class "${existingQuiz.class.name || 'Unknown'}" starting ${startDateStr}${endDateStr}. ${timeLimit}`,
            category: 'NEW_QUIZ',
            resourceId: existingQuiz.id,
            resourceType: "quiz",
            expiredAt: existingQuiz.endDate ? new Date(existingQuiz.endDate) : undefined
          });
        } catch (error) {
          console.error("Error sending notifications:", error);
          // Don't fail the transaction if notifications fail
        }
      }
      
      return createSuccessResponse({
        ...updatedQuiz,
        message: "Quiz successfully published"
      });
    });
    
  } catch (error) {
    console.error("Error publishing quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// PATCH handler for publishing a quiz
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return publishQuiz(request, params);
}

// POST handler for publishing a quiz - added for compatibility
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return publishQuiz(request, params);
} 