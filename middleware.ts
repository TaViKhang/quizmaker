import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLES } from "@/lib/constants";

// Maximum inactivity time (in seconds) - 1 hour
const MAX_INACTIVITY_TIME = 60 * 60;

// Protected routes
const protectedRoutes = ['/dashboard', '/quiz', '/class', '/admin'];
const roleSelectPath = '/auth/select-role';
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/error', roleSelectPath];

// Session related API endpoints
const SESSION_API_ENDPOINTS = [
  '/api/auth/session', 
  '/api/auth/signin', 
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/csrf'
];

// Prevent infinite redirects with a request counter
const MAX_REDIRECTS = 2;

// Cache check results to avoid repeated checks
const cacheMap = new Map();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // PREVENT LOOPS - Immediately check protection cookies
  // NextRequest.cookies is a synchronous API, different from next/headers cookies()
  const redirectProtection = req.cookies.get('redirect-protection')?.value;
  const roleSelected = req.cookies.get('role-selected')?.value;
  
  // Allow access to all API endpoints with minimal middleware processing
  if (pathname.startsWith('/api/')) {
    // Specific handling for auth API endpoints
    if (SESSION_API_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint))) {
      // Skip all checks for auth endpoints
      return NextResponse.next();
    }
    return NextResponse.next();
  }
  
  // Skip middleware for static files and images
  if (pathname.startsWith('/_next/') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // SPECIAL RULE: If role-selected cookie exists, allow dashboard access even without a role
  if (roleSelected && pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }
  
  // SPECIAL RULE: Allow access to select-role, no token check needed
  if (pathname === roleSelectPath) {
    return NextResponse.next();
  }
  
  // Check protection cookie - if it exists, temporarily let the request through
  if (redirectProtection && pathname !== '/api/auth/session') {
    return NextResponse.next();
  }
  
  try {
    // Get token from NextAuth
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // If not logged in and accessing protected route: redirect to login
    if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
      const url = new URL('/auth/signin', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // If logged in without role, redirect to select-role
    // But only when there's no protection cookie
    if (token && token.role === null && !roleSelected) {
      // Only redirect if not already on the select-role page
      if (pathname !== roleSelectPath) {
        // Create protection token to prevent loops
        const response = NextResponse.redirect(new URL(roleSelectPath, req.url));
        // NextResponse.cookies.set is a synchronous API
        response.cookies.set('redirect-protection', 'true', {
          httpOnly: true,
          maxAge: 10, // Just 10 seconds, enough for the redirect
          path: '/',
        });
        return response;
      }
    }
    
    // If logged in with role, redirect away from auth pages
    if (token && token.role && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch (error) {
    console.error("[Middleware Error]", error);
    // Fail open - allow request to continue even if session check fails
    // This prevents site from being unusable if session API has issues
    return NextResponse.next();
  }
  
  // Nếu là API route liên quan đến quizzes, thêm log
  if (pathname.startsWith('/api/users/me/quizzes')) {
    console.log(`[API Request] ${req.method} ${pathname}${req.nextUrl.search}`);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}; 