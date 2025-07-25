import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Trả về thông tin session để debug
    return NextResponse.json({
      isAuthenticated: !!session,
      session: session,
      user: session?.user || null,
      message: session ? "Authenticated" : "Not authenticated"
    });
  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json({
      error: "Failed to retrieve session",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 