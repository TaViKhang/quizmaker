import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, Prisma } from "@prisma/client";
import { createNotification } from "@/lib/notification-service";

// Schema validation for adding students to class
const addStudentSchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  // Additional fields can be added if needed
});

// Schema validation for adding multiple students
const addMultipleStudentsSchema = z.object({
  studentIds: z.array(z.string().cuid("Invalid student ID")),
});

// GET handler for fetching students in a class
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view the student list" }, 
        { status: 401 }
      );
    }
    
    const classId = params.id;
    
    // Check if class exists
    const classExists = await db.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        teacherId: true,
        type: true,
      }
    });
    
    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found" }, 
        { status: 404 }
      );
    }
    
    // Check permission
    const isTeacher = session.user.role === Role.TEACHER;
    const isClassTeacher = isTeacher && classExists.teacherId === session.user.id;
    const isStudent = session.user.role === Role.STUDENT;
    
    // For students, check if they are enrolled
    if (isStudent) {
      const enrollment = await db.classEnrollment.findFirst({
        where: {
          classId,
          studentId: session.user.id
        }
      });
      
      if (!enrollment && classExists.type !== "PUBLIC") {
        return NextResponse.json(
          { error: "You don't have permission to view the student list for this class" }, 
          { status: 403 }
        );
      }
    }
    
    // Pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    
    // Build the query
    let where: any = {
      classId,
    };
    
    // Count total students for pagination
    const total = await db.classEnrollment.count({ where });
    
    // Fetch students with pagination
    const enrollments = await db.classEnrollment.findMany({
      where,
      select: {
        id: true,
        joinedAt: true,
        lastActive: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        joinedAt: "desc",
      }
    });
    
    // If search is provided, filter results in memory (since we likely won't have many students per class)
    let filteredEnrollments = enrollments;
    if (search) {
      filteredEnrollments = enrollments.filter(enrollment => {
        const student = enrollment.student;
        return (
          student.name?.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase())
        );
      });
    }
    
    return NextResponse.json({
      students: filteredEnrollments.map(enrollment => ({
        enrollmentId: enrollment.id,
        studentId: enrollment.student.id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        image: enrollment.student.image,
        joinedAt: enrollment.joinedAt,
        lastActive: enrollment.lastActive,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Error fetching class students:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the student list" }, 
      { status: 500 }
    );
  }
}

// POST handler for adding students to a class
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to add students to a class" }, 
        { status: 401 }
      );
    }
    
    // Only teachers can add students
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json(
        { error: "Only teachers can add students to a class" }, 
        { status: 403 }
      );
    }
    
    const classId = params.id;
    
    // Check if class exists and teacher has permission
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      },
      select: {
        id: true,
        name: true,
        maxStudents: true,
        _count: {
          select: {
            students: true
          }
        }
      }
    });
    
    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to add students" }, 
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Handle both single student and multiple students
    if (Array.isArray(body.studentIds)) {
      // Multiple students
      const validationResult = addMultipleStudentsSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid data", details: validationResult.error.flatten() }, 
          { status: 400 }
        );
      }
      
      const { studentIds } = validationResult.data;
      
      // Check if maxStudents limit would be exceeded
      if (classExists.maxStudents && (classExists._count.students + studentIds.length) > classExists.maxStudents) {
        return NextResponse.json(
          { error: `Cannot add students. Class has a maximum limit of ${classExists.maxStudents} students.` }, 
          { status: 400 }
        );
      }
      
      // Check if students exist
      const students = await db.user.findMany({
        where: {
          id: { in: studentIds },
          role: Role.STUDENT
        },
        select: {
          id: true
        }
      });
      
      if (students.length !== studentIds.length) {
        return NextResponse.json(
          { error: "One or more students do not exist" }, 
          { status: 404 }
        );
      }
      
      // Check for existing enrollments
      const existingEnrollments = await db.classEnrollment.findMany({
        where: {
          classId,
          studentId: { in: studentIds }
        },
        select: {
          studentId: true
        }
      });
      
      const existingStudentIds = existingEnrollments.map(e => e.studentId);
      const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));
      
      // Create enrollments for new students
      if (newStudentIds.length > 0) {
        await db.classEnrollment.createMany({
          data: newStudentIds.map(studentId => ({
            classId,
            studentId
          })),
          skipDuplicates: true
        });
        
        // Create notifications for all newly added students
        for (const studentId of newStudentIds) {
          await createNotification({
            userId: studentId,
            title: "You have been added to a new class",
            message: `You have been added to the class "${classExists.name}"`,
            category: 'CLASS_JOINED',
            resourceId: classId,
            resourceType: "class"
          });
        }
      }
      
      return NextResponse.json({
        message: `Added ${newStudentIds.length} students to the class`,
        alreadyEnrolled: existingStudentIds.length,
        added: newStudentIds.length
      });
      
    } else {
      // Single student
      const validationResult = addStudentSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid data", details: validationResult.error.flatten() }, 
          { status: 400 }
        );
      }
      
      const { studentId } = validationResult.data;
      
      // Check if maxStudents limit would be exceeded
      if (classExists.maxStudents && (classExists._count.students + 1) > classExists.maxStudents) {
        return NextResponse.json(
          { error: `Cannot add student. Class has a maximum limit of ${classExists.maxStudents} students.` }, 
          { status: 400 }
        );
      }
      
      // Check if student exists
      const student = await db.user.findFirst({
        where: {
          id: studentId,
          role: Role.STUDENT
        }
      });
      
      if (!student) {
        return NextResponse.json(
          { error: "Student not found" }, 
          { status: 404 }
        );
      }
      
      // Check if student is already enrolled
      const existingEnrollment = await db.classEnrollment.findFirst({
        where: {
          classId,
          studentId
        }
      });
      
      if (existingEnrollment) {
        return NextResponse.json(
          { error: "Student is already enrolled in this class" }, 
          { status: 400 }
        );
      }
      
      // Add student to class
      const enrollment = await db.classEnrollment.create({
        data: {
          classId,
          studentId
        },
        select: {
          id: true,
          joinedAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });
      
      // Create a notification for the student
      await createNotification({
        userId: studentId,
        title: "You have been added to a new class",
        message: `You have been added to the class "${classExists.name}"`,
        category: 'CLASS_JOINED',
        resourceId: classId,
        resourceType: "class"
      });
      
      return NextResponse.json({
        message: "Student added to class successfully",
        enrollment: {
          id: enrollment.id,
          joinedAt: enrollment.joinedAt,
          student: enrollment.student
        }
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error("Error adding student to class:", error);
    return NextResponse.json(
      { error: "An error occurred while adding students to the class" }, 
      { status: 500 }
    );
  }
} 