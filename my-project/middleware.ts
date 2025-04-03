import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // Danh sách các route cần bảo vệ
  const authRoutes = [
    "/dashboard",
    "/quiz",
    "/profile",
    "/admin",
  ];

  // Danh sách các route chỉ dành cho admin
  const adminRoutes = [
    "/admin",
  ];

  // Danh sách các route chỉ dành cho giáo viên và admin
  const teacherRoutes = [
    "/dashboard/create",
    "/quiz/create",
  ];

  const { pathname } = req.nextUrl;

  // Kiểm tra nếu đường dẫn cần xác thực
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Kiểm tra nếu đường dẫn chỉ dành cho admin
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  // Kiểm tra nếu đường dẫn chỉ dành cho giáo viên
  const isTeacherRoute = teacherRoutes.some(route => pathname.startsWith(route));

  // Chuyển hướng nếu chưa xác thực và đang truy cập route bảo vệ
  if (isAuthRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Kiểm tra quyền admin
  if (isAdminRoute && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Kiểm tra quyền giáo viên
  if (isTeacherRoute && token?.role !== "ADMIN" && token?.role !== "TEACHER") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Chuyển hướng khi đã đăng nhập nhưng vẫn cố truy cập trang đăng nhập/đăng ký
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