import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLES } from "@/lib/constants";

// Maximum inactivity time (in seconds) - 1 hour
const MAX_INACTIVITY_TIME = 60 * 60;

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // List of protected routes
  const authRoutes = [
    "/dashboard",
    "/quiz",
    "/profile",
  ];

  // List of teacher-only routes
  const teacherRoutes = [
    "/dashboard/create",
    "/quiz/create",
    "/dashboard/teacher",
  ];

  const { pathname } = req.nextUrl;

  // Check if the path needs authentication
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Check if the path is only for teachers
  const isTeacherRoute = teacherRoutes.some(route => pathname.startsWith(route));

  // Check for user inactivity if authenticated
  if (isAuthenticated) {
    // Get the last activity timestamp from cookies
    const lastActivity = req.cookies.get("last-activity")?.value;
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Update the last activity timestamp for authenticated routes
    const response = NextResponse.next();
    response.cookies.set("last-activity", currentTime.toString(), { 
      httpOnly: true,
      maxAge: MAX_INACTIVITY_TIME,
      path: "/"
    });

    // If last activity exists and the user has been inactive for too long on protected routes
    if (lastActivity && isAuthRoute) {
      const inactiveTime = currentTime - parseInt(lastActivity);
      
      // Force logout if inactive for too long
      if (inactiveTime > MAX_INACTIVITY_TIME) {
        // Clear the last-activity cookie
        const logoutResponse = NextResponse.redirect(new URL("/api/auth/signout", req.url));
        logoutResponse.cookies.set("last-activity", "", { maxAge: 0 });
        return logoutResponse;
      }
    }
    
    // Return the response with updated activity cookie
    if (isAuthRoute) {
      return response;
    }
  }

  // Redirect if not authenticated and accessing protected route
  if (isAuthRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Check teacher permissions
  if (isTeacherRoute && token?.role !== ROLES.TEACHER) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirect when already logged in but still trying to access login/signup pages
  if (isAuthenticated && (
    pathname === "/auth/signin" || 
    pathname === "/auth/signup" ||
    pathname === "/login" ||
    pathname === "/register"
  )) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 