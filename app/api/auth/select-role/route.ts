import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { ROLES } from "@/lib/constants";

// Increase authentication speed by using runtime config
export const dynamic = 'force-dynamic';
// Remove edge runtime because it's not compatible with Prisma

// Schema validation for the request
const selectRoleSchema = z.object({
  role: z.enum([ROLES.TEACHER, ROLES.STUDENT], {
    message: "Role must be either TEACHER or STUDENT",
  }),
});

export async function POST(req: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to select a role" }, 
        { status: 401 }
      );
    }

    // Parse and validate the request body - only get necessary fields
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validationResult = selectRoleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.flatten() }, 
        { status: 400 }
      );
    }

    const { role } = validationResult.data;

    try {
      // Check if user exists before updating
      const existingUser = await db.user.findUnique({
        where: { id: session.user.id },
      });
      
      if (!existingUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      // Update role in database
      const updatedUser = await db.user.update({
        where: { id: session.user.id },
        data: { role },
        select: {
          id: true,
          role: true,
        }
      });
      
      // Force session refresh
      const timestamp = Date.now();
      
      // Create protection variable to prevent infinite loops
      const redirectToken = Math.random().toString(36).substring(2, 15);
      
      // Create special cookie to mark role selection
      const response = NextResponse.json(
        {
          success: true,
          user: updatedUser,
          timestamp
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
      
      // Set cookie to mark that user has selected a role
      response.cookies.set('role-selected', 'true', {
        httpOnly: true,
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });
      
      // Set protection cookie to prevent loops
      response.cookies.set('redirect-protection', redirectToken, {
        httpOnly: true,
        maxAge: 30, // 30 seconds
        path: '/',
      });
      
      return response;
      
    } catch (dbError) {
      console.error("Database error during role selection:", dbError);
      return NextResponse.json(
        { error: "Failed to update role in database. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in role selection:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." }, 
      { status: 500 }
    );
  }
} 