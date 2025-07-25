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

// Schema validation for joining a class with code
const joinClassWithCodeSchema = z.object({
  code: z.string({
    required_error: "Class code is required",
  }),
});

// Schema validation for joining a class with ID (for public classes)
const joinClassWithIdSchema = z.object({
  classId: z.string({
    required_error: "Class ID is required",
  }),
});

// POST handler for joining a class
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only students can join classes
    if (session.user.role !== Role.STUDENT) {
      return createPermissionError("Only students can join classes");
    }
    
    const body = await request.json();
    
    // Determine which schema to use based on whether code or classId is provided
    let classToJoin;
    let validationResult;
    
    if (body.code) {
      // Join with code
      validationResult = joinClassWithCodeSchema.safeParse(body);
      
      if (!validationResult.success) {
        return createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid data",
          formatZodError(validationResult.error)
        );
      }
      
      const { code } = validationResult.data;
      
      // Check if the class exists
      classToJoin = await db.class.findUnique({
        where: {
          code,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
      });
    } else if (body.classId) {
      // Join with classId (only works for PUBLIC classes)
      validationResult = joinClassWithIdSchema.safeParse(body);
      
      if (!validationResult.success) {
        return createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid data",
          formatZodError(validationResult.error)
        );
      }
      
      const { classId } = validationResult.data;
      
      // Check if the class exists and is PUBLIC
      classToJoin = await db.class.findFirst({
        where: {
          id: classId,
          isActive: true,
          type: ClassType.PUBLIC, // Only allows joining PUBLIC classes without code
        },
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
      });
    } else {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Either class code or class ID is required"
      );
    }
    
    if (!classToJoin) {
      return createNotFoundError("Class not found, is not active, or requires a join code");
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