import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { Role } from "@prisma/client";

// Schema validation for the request
const changeRoleSchema = z.object({
  userId: z.string(),
  newRole: z.enum([Role.TEACHER, Role.STUDENT])
});

export async function PATCH(req: Request) {
  try {
    // Check user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" }, 
        { status: 401 }
      );
    }

    // Only teachers should be allowed to change roles
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json(
        { error: "You don't have permission to perform this action" }, 
        { status: 403 }
      );
    }

    // Parse and validate data from the request
    const body = await req.json();
    const validationResult = changeRoleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.flatten() }, 
        { status: 400 }
      );
    }

    const { userId, newRole } = validationResult.data;

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: {
        id: userId,
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // Don't allow changing your own role
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" }, 
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        role: newRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the user role" }, 
      { status: 500 }
    );
  }
} 