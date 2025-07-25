import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, ClassType } from "@prisma/client";
import { 
  createPaginatedResponse, 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createServerError,
  formatZodError
} from "@/lib/api-response";
import {
  parseClassQueryParams,
  buildOrderByFromParams,
  buildPaginationParams,
  buildSearchConditions,
  generateClassCode
} from "@/lib/api-utils";

// Enhanced schema validation for creating a class
const createClassSchema = z.object({
  name: z.string()
    .min(3, "Class name must be at least 3 characters")
    .max(100, "Class name too long"),
  description: z.string()
    .max(1000, "Description too long")
    .optional(),
  subject: z.string()
    .max(100, "Subject name too long")
    .optional(),
  type: z.enum([ClassType.PUBLIC, ClassType.PRIVATE])
    .default(ClassType.PRIVATE),
  coverImage: z.string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
  maxStudents: z.number()
    .int("Must be a whole number")
    .positive("Must be a positive number")
    .max(500, "Maximum 500 students allowed")
    .optional(),
  isActive: z.boolean()
    .default(true),
  code: z.string()
    .regex(/^[A-Z0-9]{6,8}$/, "Class code must be 6-8 uppercase letters or numbers")
    .optional(),
}).refine(data => true, {
  message: "",
  path: [],
});

// Schema for updating a class
const updateClassSchema = z.object({
  name: z.string()
    .min(3, "Class name must be at least 3 characters")
    .max(100, "Class name too long")
    .optional(),
  description: z.string()
    .max(1000, "Description too long")
    .optional(),
  subject: z.string()
    .max(100, "Subject name too long")
    .optional(),
  type: z.enum([ClassType.PUBLIC, ClassType.PRIVATE])
    .optional(),
  coverImage: z.string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
  maxStudents: z.number()
    .int("Must be a whole number")
    .positive("Must be a positive number")
    .max(500, "Maximum 500 students allowed")
    .optional(),
  isActive: z.boolean()
    .optional(),
  code: z.string()
    .regex(/^[A-Z0-9]{6,8}$/, "Class code must be 6-8 uppercase letters or numbers")
    .optional(),
}).refine(data => true, {
  message: "",
  path: [],
});

// GET handler for fetching classes with pagination and filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = parseClassQueryParams(searchParams);
    
    // Build the where clause based on user role and filters
    let where: any = {};
    
    // Apply search filter if provided
    if (queryParams.search) {
      where.OR = buildSearchConditions(queryParams.search);
    }
    
    // Apply class type filter if provided
    if (queryParams.type) {
      where.type = queryParams.type;
    }
    
    // Apply active status filter if provided
    if (queryParams.isActive !== undefined) {
      where.isActive = queryParams.isActive;
    }
    
    // Role-specific filters
    if (session.user.role === Role.TEACHER) {
      // Teachers can filter to see only classes they teach
      if (queryParams.onlyJoined) {
        where.teacherId = session.user.id;
      }
    } else if (session.user.role === Role.STUDENT) {
      // Students can filter to see only classes they're enrolled in
      if (queryParams.onlyJoined) {
        where.students = {
          some: {
            studentId: session.user.id
          }
        };
      } 
      // Bỏ giới hạn chỉ xem được lớp PUBLIC hoặc lớp PRIVATE đã tham gia
      // Student có thể xem tất cả các lớp
    }
    
    // Count total classes for pagination
    const total = await db.class.count({ 
      where,
      // No need to include excessive relations for counting
    });
    
    // Set up pagination
    const pagination = buildPaginationParams(queryParams.page, queryParams.limit);
    
    // Set up sorting
    const orderBy = buildOrderByFromParams(queryParams.sortBy, queryParams.sortOrder);
    
    // Fetch classes with pagination
    const classes = await db.class.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        subject: true,
        type: true,
        code: session.user.role === Role.TEACHER ? true : false, // Only return code to teachers
        coverImage: true,
        isActive: true,
        maxStudents: true,
        createdAt: true,
        updatedAt: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        _count: {
          select: {
            students: true,
            quizzes: true,
            announcements: true,
            materials: true,
          }
        },
        // Get upcoming quizzes for students
        quizzes: session.user.role === Role.STUDENT ? {
          where: {
            isPublished: true,
            isActive: true,
            OR: [
              // Upcoming quizzes (start date in the future)
              {
                startDate: {
                  gt: new Date()
                }
              },
              // Ongoing quizzes (started but not ended)
              {
                startDate: {
                  lte: new Date()
                },
                endDate: {
                  gte: new Date()
                }
              }
            ]
          },
          select: {
            id: true
          }
        } : undefined,
        // Get recent announcements for students
        announcements: session.user.role === Role.STUDENT ? {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          select: {
            id: true
          }
        } : undefined,
        // Check if current user is enrolled
        students: session.user.role === Role.STUDENT ? {
          where: {
            studentId: session.user.id
          },
          select: {
            id: true,
            joinedAt: true
          }
        } : undefined
      } as any,
      ...pagination,
      orderBy,
    }) as any; // Using 'as any' temporarily to avoid type errors
    
    // Transform the result to add isEnrolled field for students and ensure consistent format
    const formattedClasses = classes.map((cls: any) => {
      // Create a consistent base object without 'any' type
      const result = {
        id: cls.id,
        name: cls.name,
        description: cls.description,
        subject: cls.subject,
        type: cls.type,
        coverImage: cls.coverImage,
        isActive: cls.isActive,
        maxStudents: cls.maxStudents,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        teacherId: cls.teacherId,
        teacher: {
          id: cls.teacher.id,
          name: cls.teacher.name,
          image: cls.teacher.image,
        },
        studentsCount: cls._count.students,
        quizzesCount: cls._count.quizzes,
        announcementsCount: cls._count.announcements,
        materialsCount: cls._count.materials,
        upcomingQuizCount: 0,
        recentAnnouncementCount: 0,
        isEnrolled: false,
        enrollmentId: undefined as string | undefined,
        joinedAt: undefined as Date | undefined,
        // Only include code for teachers
        ...(session.user.role === Role.TEACHER && { code: cls.code }),
      };
      
      // Add enrollment info for students
      if (session.user.role === Role.STUDENT && cls.students && cls.students.length > 0) {
        result.isEnrolled = true;
        result.enrollmentId = cls.students[0].id;
        result.joinedAt = cls.students[0].joinedAt;
        
        // Add upcoming quiz count for students
        if (cls.quizzes) {
          result.upcomingQuizCount = cls.quizzes.length;
        }
        
        // Add recent announcement count for students
        if (cls.announcements) {
          result.recentAnnouncementCount = cls.announcements.length;
        }
      }
      
      return result;
    });
    
    // Return standardized response
    return createPaginatedResponse(
      formattedClasses,
      total,
      queryParams.page,
      queryParams.limit,
      { 
        filters: { 
          search: queryParams.search, 
          type: queryParams.type, 
          isActive: queryParams.isActive,
        } 
      }
    );
    
  } catch (error) {
    console.error("Error fetching classes:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// POST handler for creating new classes
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can create classes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can create classes");
    }
    
    const body = await request.json();
    
    const validationResult = createClassSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid class data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    
    // Generate a random 6-character class code if not provided
    const classCode = data.code || await generateUniqueClassCode();
    
    // If code was provided, check if it already exists
    if (data.code) {
      const existingClass = await db.class.findUnique({
        where: {
          code: data.code
        }
      });
      
      if (existingClass) {
        return createErrorResponse(
          "DUPLICATE_CODE",
          "Class code already exists, please choose a different code"
        );
      }
    }
    
    // Create the class
    const newClass = await db.class.create({
      data: {
        name: data.name,
        description: data.description,
        subject: data.subject,
        type: data.type,
        code: classCode,
        coverImage: data.coverImage,
        maxStudents: data.maxStudents,
        isActive: data.isActive,
        teacher: {
          connect: {
            id: session.user.id
          }
        }
      }
    });
    
    return createSuccessResponse(newClass);
    
  } catch (error) {
    console.error("Error creating class:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// PUT handler for updating a class
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can update classes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can update classes");
    }
    
    const body = await request.json();
    
    // Require class ID for update
    if (!body.id) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Class ID is required for updates"
      );
    }
    
    // Validate update data
    const validationResult = updateClassSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid class data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    const classId = body.id;
    
    // Check if teacher owns the class
    const existingClass = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      }
    });
    
    if (!existingClass) {
      return createErrorResponse(
        "NOT_FOUND",
        "Class not found or you don't have permission to update it"
      );
    }
    
    // If code is being updated, check if it already exists
    if (data.code && data.code !== existingClass.code) {
      const codeExists = await db.class.findFirst({
        where: {
          code: data.code,
          id: { not: classId }  // Exclude current class
        }
      });
      
      if (codeExists) {
        return createErrorResponse(
          "DUPLICATE_CODE",
          "Class code already exists, please choose a different code"
        );
      }
    }
    
    // Update the class
    const updatedClass = await db.class.update({
      where: {
        id: classId
      },
      data: data
    });
    
    return createSuccessResponse(updatedClass);
    
  } catch (error) {
    console.error("Error updating class:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// DELETE handler for deleting a class
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can delete classes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can delete classes");
    }
    
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("id");
    
    if (!classId) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Class ID is required"
      );
    }
    
    // Check if teacher owns the class
    const existingClass = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      },
      include: {
        quizzes: true,
        students: true,
        announcements: true
      }
    });
    
    if (!existingClass) {
      return createErrorResponse(
        "NOT_FOUND",
        "Class not found or you don't have permission to delete it"
      );
    }
    
    // Delete related records first
    await db.$transaction([
      db.classAnnouncement.deleteMany({
        where: { classId }
      }),
      db.classEnrollment.deleteMany({
        where: { classId }
      }),
      // Update quizzes to remove class association
      db.quiz.updateMany({
        where: { classId },
        data: { classId: null }
      }),
      // Finally delete the class
      db.class.delete({
        where: { id: classId }
      })
    ]);
    
    return createSuccessResponse({ 
      message: "Class deleted successfully",
      deletedId: classId
    });
    
  } catch (error) {
    console.error("Error deleting class:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

async function generateUniqueClassCode(length: number = 6, maxAttempts: number = 5): Promise<string> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const code = generateClassCode(length);
    
    // Check if code already exists
    const existingClass = await db.class.findUnique({
      where: {
        code
      }
    });
    
    if (!existingClass) {
      return code;
    }
    
    attempts++;
  }
  
  // If we've reached max attempts, use a longer code to reduce collision chance
  return generateClassCode(length + 2);
} 