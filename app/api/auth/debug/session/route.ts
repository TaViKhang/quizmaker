import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Chi tiết hơn về userId trong session
    return NextResponse.json({
      session: session,
      user: session?.user || null,
      userId: session?.user?.id || null,
      userIdType: session?.user?.id ? typeof session.user.id : null,
      userIdLength: session?.user?.id ? session.user.id.length : null,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : []
    });
  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json({
      error: "Failed to retrieve session",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 