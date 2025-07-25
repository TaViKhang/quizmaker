import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Middleware to check if user is authenticated
 * @returns User session or throws 401 error
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  
  return session;
}

/**
 * Middleware to check if user is a teacher
 * @returns User session or throws 403 error
 */
export async function requireTeacherRole() {
  const session = await requireAuth();
  
  if (session.user.role !== Role.TEACHER) {
    throw new Response("Forbidden: Teachers only", { status: 403 });
  }
  
  return session;
}

/**
 * Middleware to check if teacher has access to a specific class
 * @param classId - The ID of the class to check access for
 * @returns The class object if access is granted or throws 403 error
 */
export async function requireTeacherClassAccess(classId: string) {
  const session = await requireTeacherRole();
  
  const classData = await prisma.class.findUnique({
    where: {
      id: classId,
    },
  });
  
  if (!classData) {
    throw new Response("Class not found", { status: 404 });
  }
  
  if (classData.teacherId !== session.user.id) {
    throw new Response("Forbidden: You don't have access to this class", { status: 403 });
  }
  
  return { session, classData };
}

/**
 * Middleware to check if teacher has access to a specific student
 * @param studentId - The ID of the student to check access for
 * @returns Object containing session, student and classes if access is granted or throws 403 error
 */
export async function requireTeacherStudentAccess(studentId: string) {
  const session = await requireTeacherRole();
  
  // Find classes taught by this teacher that have this student enrolled
  const studentEnrollments = await prisma.classEnrollment.findMany({
    where: {
      studentId: studentId,
      class: {
        teacherId: session.user.id,
      },
    },
    include: {
      class: true,
    },
  });
  
  if (studentEnrollments.length === 0) {
    throw new Response("Forbidden: You don't have access to this student", { status: 403 });
  }
  
  const student = await prisma.user.findUnique({
    where: {
      id: studentId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
  
  if (!student) {
    throw new Response("Student not found", { status: 404 });
  }
  
  const classes = studentEnrollments.map(enrollment => enrollment.class);
  
  return { session, student, classes };
}

/**
 * Middleware to check if teacher has access to a specific quiz
 * @param quizId - The ID of the quiz to check access for
 * @returns The quiz object if access is granted or throws 403 error
 */
export async function requireTeacherQuizAccess(quizId: string) {
  const session = await requireTeacherRole();
  
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
  });
  
  if (!quiz) {
    throw new Response("Quiz not found", { status: 404 });
  }
  
  if (quiz.authorId !== session.user.id) {
    throw new Response("Forbidden: You don't have access to this quiz", { status: 403 });
  }
  
  return { session, quiz };
}

/**
 * Middleware to check if teacher has access to a specific quiz attempt
 * @param attemptId - The ID of the quiz attempt to check access for
 * @returns The attempt object if access is granted or throws 403 error
 */
export async function requireTeacherAttemptAccess(attemptId: string) {
  const session = await requireTeacherRole();
  
  const attempt = await prisma.quizAttempt.findUnique({
    where: {
      id: attemptId,
    },
    include: {
      quiz: true,
    },
  });
  
  if (!attempt) {
    throw new Response("Attempt not found", { status: 404 });
  }
  
  if (attempt.quiz.authorId !== session.user.id) {
    throw new Response("Forbidden: You don't have access to this attempt", { status: 403 });
  }
  
  return { session, attempt };
}

/**
 * Error handling wrapper for API route handlers
 * @param handler - The route handler function
 * @returns A function that handles errors from the route handler
 */
export function withErrorHandling(handler: Function) {
  return async (req: NextRequest, params?: any) => {
    try {
      return await handler(req, params);
    } catch (error) {
      console.error("API Error:", error);
      
      if (error instanceof Response) {
        return NextResponse.json(
          { error: error.statusText },
          { status: error.status }
        );
      }
      
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
} 