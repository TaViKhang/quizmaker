import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, ClassType, Prisma, Class, User } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError,
  formatZodError
} from "@/lib/api-response";
import { triggerClassUpdatedNotification } from "@/lib/service-trigger";

// Schema validation for updating a class
const updateClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name too long").optional(),
  description: z.string().max(1000, "Description too long").optional().nullable(),
  subject: z.string().max(100, "Subject name too long").optional(),
  type: z.enum([ClassType.PUBLIC, ClassType.PRIVATE]).optional(),
  coverImage: z.string().url("Invalid image URL").optional().nullable(),
  maxStudents: z.number().int().positive().max(500, "Maximum students too high").optional(),
  isActive: z.boolean().optional(),
  code: z.string().regex(/^[A-Z0-9]{6,8}$/, "Class code must be 6-8 uppercase letters or numbers").optional(),
});

// Response interfaces
interface TeacherClassDetails {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: ClassType;
  coverImage: string | null;
  isActive: boolean;
  maxStudents: number | null;
  createdAt: Date;
  updatedAt: Date;
  teacherId: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
  studentsCount: number;
  quizzesCount: number;
  announcementsCount: number;
  materialsCount: number;
  code: string | null;
  students: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    enrollmentId: string;
    joinedAt: Date;
  }>;
}

interface StudentClassDetails {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: ClassType;
  coverImage: string | null;
  isActive: boolean;
  maxStudents: number | null;
  createdAt: Date;
  updatedAt: Date;
  teacherId: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
  studentsCount: number;
  quizzesCount: number;
  announcementsCount: number;
  materialsCount: number;
  upcomingQuizCount?: number;
  recentAnnouncementCount?: number;
  isEnrolled: boolean;
  enrollmentId?: string;
  joinedAt?: Date;
}

// Prisma query result type for teacher view
type TeacherClassQueryResult = Class & {
  teacher: Pick<User, 'id' | 'name' | 'image'>;
  students: Array<{
    id: string;
    joinedAt: Date;
    student: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    }
  }>;
  _count: {
    students: number;
    quizzes: number;
    announcements: number;
    materials: number;
  };
};

// Prisma query result type for student view
type StudentClassQueryResult = Class & {
  subject: string | null;
  teacher: Pick<User, 'id' | 'name' | 'image'>;
  students: Array<{
    id: string;
    joinedAt: Date;
  }>;
  quizzes: Array<{
    id: string;
  }>;
  announcements: Array<{
    id: string;
  }>;
  _count: {
    students: number;
    quizzes: number;
    announcements: number;
    materials: number;
  };
};

// GET handler for retrieving a specific class by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const classId = params.id;
    const isTeacher = session.user.role === Role.TEACHER;
    
    if (isTeacher) {
      // Teacher query
      const classItem = await db.class.findUnique({
        where: { id: classId },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }
              }
            },
            orderBy: {
              joinedAt: 'desc'
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
        },
      }) as TeacherClassQueryResult | null;
      
      if (!classItem) {
        return createNotFoundError("Class not found");
      }
      
      const teacherResponse: TeacherClassDetails = {
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        subject: classItem.subject,
        type: classItem.type,
        coverImage: classItem.coverImage,
        isActive: classItem.isActive,
        maxStudents: classItem.maxStudents,
        createdAt: classItem.createdAt,
        updatedAt: classItem.updatedAt,
        teacherId: classItem.teacherId,
        teacher: {
          id: classItem.teacher.id,
          name: classItem.teacher.name,
          image: classItem.teacher.image,
        },
        studentsCount: classItem._count.students,
        quizzesCount: classItem._count.quizzes,
        announcementsCount: classItem._count.announcements,
        materialsCount: classItem._count.materials,
        code: classItem.code,
        students: classItem.students.map(enrollment => ({
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          image: enrollment.student.image,
          enrollmentId: enrollment.id,
          joinedAt: enrollment.joinedAt
        }))
      };
      
      return createSuccessResponse(teacherResponse);
    } else {
      // Student query
      const classItem = await db.class.findUnique({
        where: { id: classId },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          students: {
            where: {
              studentId: session.user.id
            },
            select: {
              id: true,
              joinedAt: true
            }
          },
          quizzes: {
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
            select: { id: true }
          },
          announcements: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            },
            select: { id: true }
          },
          _count: {
            select: {
              students: true,
              quizzes: true,
              announcements: true,
              materials: true,
            }
          },
        },
      }) as any; // Temporarily use 'any' type due to added relations
      
      if (!classItem) {
        return createNotFoundError("Class not found");
      }
      
      // Permission check - Students can only view classes they're enrolled in or public classes
      const isEnrolled = classItem.students.length > 0;
      const isPublic = classItem.type === ClassType.PUBLIC;
      
      if (!isEnrolled && !isPublic) {
        return createPermissionError("You don't have access to this class");
      }
      
      const studentResponse: StudentClassDetails = {
        id: classItem.id,
        name: classItem.name,
        description: classItem.description,
        subject: classItem.subject,
        type: classItem.type,
        coverImage: classItem.coverImage,
        isActive: classItem.isActive,
        maxStudents: classItem.maxStudents,
        createdAt: classItem.createdAt,
        updatedAt: classItem.updatedAt,
        teacherId: classItem.teacherId,
        teacher: {
          id: classItem.teacher.id,
          name: classItem.teacher.name,
          image: classItem.teacher.image,
        },
        studentsCount: classItem._count.students,
        quizzesCount: classItem._count.quizzes,
        announcementsCount: classItem._count.announcements,
        materialsCount: classItem._count.materials,
        upcomingQuizCount: classItem.quizzes.length,
        recentAnnouncementCount: classItem.announcements.length,
        isEnrolled: isEnrolled
      };
      
      if (isEnrolled) {
        studentResponse.enrollmentId = classItem.students[0].id;
        studentResponse.joinedAt = classItem.students[0].joinedAt;
      }
      
      return createSuccessResponse(studentResponse);
    }
  } catch (error) {
    console.error("Error fetching class:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// PUT handler for updating a class
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers who own the class can update it
    const classId = params.id;
    
    const existingClass = await db.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        teacherId: true,
        code: true,
        name: true,
      }
    });
    
    if (!existingClass) {
      return createNotFoundError("Class not found");
    }
    
    // Check if user is the teacher of this class
    if (existingClass.teacherId !== session.user.id) {
      return createPermissionError("You don't have permission to update this class");
    }
    
    const body = await request.json();
    
    // Validate the update data
    const validationResult = updateClassSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid class data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    
    // If code is being updated, check for duplicates
    if (data.code && data.code !== existingClass.code) {
      const classByCode = await db.class.findUnique({
        where: {
          code: data.code
        }
      });
      
      if (classByCode && classByCode.id !== classId) {
        return createErrorResponse(
          "DUPLICATE_CODE",
          "Class code already exists, please choose a different code"
        );
      }
    }

    // Track updated fields to include in notification
    const updatedFields = [];
    if (data.name && data.name !== existingClass.name) {
      updatedFields.push('name');
    }
    if (data.description) {
      updatedFields.push('description');
    }
    if (data.subject) {
      updatedFields.push('subject');
    }
    if (data.type) {
      updatedFields.push('type');
    }
    if (data.isActive !== undefined) {
      updatedFields.push('status');
    }
    if (data.maxStudents) {
      updatedFields.push('maximum students');
    }
    if (data.coverImage) {
      updatedFields.push('cover image');
    }
    if (data.code && data.code !== existingClass.code) {
      updatedFields.push('class code');
    }
    
    // Update the class
    const updatedClass = await db.class.update({
      where: {
        id: classId,
      },
      data,
    });

    // Send notifications if significant changes were made
    if (updatedFields.length > 0) {
      // Send notifications to all enrolled students
      await triggerClassUpdatedNotification({
        classId,
        className: updatedClass.name,
        teacherId: session.user.id,
        updatedFields
      });
    }
    
    return createSuccessResponse({
      id: updatedClass.id,
      name: updatedClass.name,
      code: updatedClass.code,
      type: updatedClass.type,
      isActive: updatedClass.isActive,
      updatedAt: updatedClass.updatedAt
    });
    
  } catch (error) {
    console.error("Error updating class:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// DELETE handler for deleting a class
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const classId = params.id;
    
    // Check if class exists and user is the teacher
    const existingClass = await db.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        name: true,
        teacherId: true,
      }
    });
    
    if (!existingClass) {
      return createNotFoundError("Class not found");
    }
    
    // Only the teacher who created the class can delete it
    if (existingClass.teacherId !== session.user.id) {
      return createPermissionError("You don't have permission to delete this class");
    }
    
    // Use a transaction to handle related records properly
    await db.$transaction([
      // Delete class announcements
      db.classAnnouncement.deleteMany({
        where: { classId }
      }),
      
      // Delete class enrollments
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
      deletedClassId: classId
    });
    
  } catch (error) {
    console.error("Error deleting class:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 