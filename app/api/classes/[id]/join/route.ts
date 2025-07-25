import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role, ClassType } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";

// POST handler for joining a class by ID directly (for public classes)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only students can join classes
    if (session.user.role !== Role.STUDENT) {
      return createPermissionError("Only students can join classes");
    }
    
    const classId = params.id;
    
    // Check if the class exists and is PUBLIC
    const classToJoin = await db.class.findFirst({
      where: {
        id: classId,
        isActive: true,
        type: ClassType.PUBLIC, // Only allows joining PUBLIC classes directly
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });
    
    if (!classToJoin) {
      return createNotFoundError("Class not found, is not active, or is not public");
    }
    
    // Check if the class is full
    if (
      classToJoin.maxStudents !== null &&
      classToJoin._count.students >= classToJoin.maxStudents
    ) {
      return createErrorResponse(
        "CLASS_FULL",
        "This class is full and cannot accept more students"
      );
    }
    
    // Teachers cannot join their own classes
    if (classToJoin.teacherId === session.user.id) {
      return createErrorResponse(
        "INVALID_JOIN",
        "You cannot join a class you are teaching"
      );
    }
    
    // Check if student is already enrolled
    const existingEnrollment = await db.classEnrollment.findFirst({
      where: {
        classId: classToJoin.id,
        studentId: session.user.id,
      },
    });
    
    if (existingEnrollment) {
      return createErrorResponse(
        "ALREADY_ENROLLED",
        "You are already enrolled in this class"
      );
    }
    
    // Create enrollment
    const enrollment = await db.classEnrollment.create({
      data: {
        classId: classToJoin.id,
        studentId: session.user.id,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            coverImage: true,
            teacherId: true,
            teacher: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    return createSuccessResponse({
      message: "Successfully joined the class",
      enrollment,
    });
    
  } catch (error) {
    console.error("Error joining class:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 