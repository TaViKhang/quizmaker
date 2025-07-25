import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

// POST handler for a student to leave a class
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to leave a class" }, 
        { status: 401 }
      );
    }
    
    // Only students can leave a class
    if (session.user.role !== Role.STUDENT) {
      return NextResponse.json(
        { success: false, error: "Only students can leave a class" }, 
        { status: 403 }
      );
    }
    
    const classId = params.id;
    const studentId = session.user.id;
    
    // Check if class exists
    const classExists = await db.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        name: true,
      }
    });
    
    if (!classExists) {
      return NextResponse.json(
        { success: false, error: "Class not found" }, 
        { status: 404 }
      );
    }
    
    // Check if the student is enrolled in this class
    const enrollment = await db.classEnrollment.findFirst({
      where: {
        classId,
        studentId
      }
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "You are not enrolled in this class" }, 
        { status: 404 }
      );
    }
    
    // Delete the enrollment
    await db.classEnrollment.delete({
      where: {
        id: enrollment.id
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `You have successfully left the class "${classExists.name}"`,
      classId: classId
    });
    
  } catch (error) {
    console.error("Error leaving class:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while trying to leave the class" }, 
      { status: 500 }
    );
  }
} 