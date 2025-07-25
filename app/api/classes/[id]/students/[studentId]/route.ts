import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

// DELETE handler for removing a student from a class
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to remove a student from a class" }, 
        { status: 401 }
      );
    }
    
    const classId = params.id;
    const studentId = params.studentId;
    
    // Get the class
    const classDetails = await db.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        teacherId: true,
      }
    });
    
    if (!classDetails) {
      return NextResponse.json(
        { error: "Class not found" }, 
        { status: 404 }
      );
    }
    
    // Check permission
    const isTeacher = session.user.role === Role.TEACHER;
    const isClassTeacher = isTeacher && classDetails.teacherId === session.user.id;
    const isSelfRemoval = session.user.id === studentId;
    
    // Only the teacher of the class or the student themselves can remove a student
    if (!isClassTeacher && !isSelfRemoval) {
      return NextResponse.json(
        { error: "You don't have permission to remove students from this class" }, 
        { status: 403 }
      );
    }
    
    // Check if student is enrolled
    const enrollment = await db.classEnrollment.findFirst({
      where: {
        classId,
        studentId
      }
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this class" }, 
        { status: 404 }
      );
    }
    
    // Remove student from class
    await db.classEnrollment.delete({
      where: {
        id: enrollment.id
      }
    });
    
    // If this is a self-removal (student leaving class), return different message
    if (isSelfRemoval) {
      return NextResponse.json({
        message: "You have successfully left the class"
      });
    }
    
    return NextResponse.json({
      message: "Student removed from class successfully"
    });
    
  } catch (error) {
    console.error("Error removing student from class:", error);
    return NextResponse.json(
      { error: "An error occurred while removing the student from the class" }, 
      { status: 500 }
    );
  }
} 