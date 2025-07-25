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

// PATCH handler for unpublishing a quiz
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can unpublish quizzes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can unpublish quizzes");
    }
    
    const quizId = params.id;
    
    // Use transaction to ensure data consistency
    return await db.$transaction(async (prisma) => {
      // Find quiz with necessary data
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
      
      // Only the author or class teacher can unpublish the quiz
      const isAuthor = existingQuiz.authorId === session.user.id;
      const isClassTeacher = existingQuiz.class?.teacherId === session.user.id;
      
      if (!isAuthor && !isClassTeacher) {
        return createPermissionError("You don't have permission to unpublish this quiz");
      }
      
      // Check if quiz is already unpublished
      if (!existingQuiz.isPublished) {
        return createErrorResponse(
          "NOT_PUBLISHED",
          "Quiz is not currently published"
        );
      }
      
      // Get attempts count statistics before unpublishing
      const attemptsStats = await prisma.quizAttempt.groupBy({
        by: ['completedAt'],
        where: {
          quizId,
        },
        _count: {
          id: true
        }
      });
      
      // Calculate completed vs incomplete attempts
      const completedAttempts = attemptsStats.find(stat => stat.completedAt !== null)?._count.id || 0;
      const incompleteAttempts = attemptsStats.find(stat => stat.completedAt === null)?._count.id || 0;
      
      // Check for any active attempts
      if (incompleteAttempts > 0) {
        return createErrorResponse(
          "ACTIVE_ATTEMPTS",
          `Cannot unpublish a quiz while students are taking it (${incompleteAttempts} active attempts)`
        );
      }
      
      // Unpublish the quiz
      const updatedQuiz = await prisma.quiz.update({
        where: {
          id: quizId,
        },
        data: {
          isPublished: false,
          updatedAt: new Date(), // Explicitly update the timestamp
        },
        select: {
          id: true,
          title: true,
          description: true,
          classId: true,
          isPublished: true,
          updatedAt: true,
        }
      });
      
      // Log the unpublishing action
      await prisma.activityLog.create({
        data: {
          action: 'QUIZ_UNPUBLISHED',
          resourceId: quizId,
          resourceType: 'quiz',
          userId: session.user.id,
          details: {
            quizTitle: existingQuiz.title,
            classId: existingQuiz.classId,
            className: existingQuiz.class?.name || 'Unknown',
            completedAttempts,
            reason: request.headers.get('x-unpublish-reason') || 'Not specified'
          }
        }
      }).catch(err => {
        // Log error but don't fail the transaction
        console.error('Failed to create activity log:', err);
      });
      
      return createSuccessResponse({
        ...updatedQuiz,
        completedAttempts,
        message: "Quiz successfully unpublished"
      });
    });
    
  } catch (error) {
    console.error("Error unpublishing quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 