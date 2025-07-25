import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelectionForm } from "./role-selection-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Select Role | OnTest",
  description: "Choose your role in the education platform"
};

// Change from force-dynamic to force-static to prevent continuous reloading
// export const dynamic = 'force-dynamic';
export const revalidate = 60;

function RoleSelectionSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// Đảm bảo trang chính render nhanh, không chờ dữ liệu
export default function SelectRolePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-50 blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-50 blur-3xl opacity-50 animate-pulse-slow-reverse"></div>
      </div>
      
      <Card className="max-w-md w-full border-0 overflow-hidden bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl">
        <CardHeader className="space-y-1 text-center pb-0">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 p-1">
              <div className="bg-white dark:bg-slate-950 rounded-full p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Choose Your Role</CardTitle>
          <CardDescription>
            Select your role to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="grid gap-6">
            {/* Sử dụng một key cố định để ngăn re-render khi revalidate */}
            <Suspense key="role-selection" fallback={<RoleSelectionSkeleton />}>
              <AuthCheck />
            </Suspense>
            
            <div className="mt-2 text-xs text-center text-slate-500">
              <p>
                You can&apos;t change your role later, so please choose carefully.
                If you need to change it in the future, contact an administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Xác thực nhanh và tải trang không phù hợp
async function AuthCheck() {
  const user = await getCurrentUser();
  
  // Nếu chưa đăng nhập hoặc đã có role, redirect trước khi tải content
  if (!user) {
    redirect("/auth/signin");
  }
  
  if (user.role) {
    redirect("/dashboard");
  }
  
  // Nếu đã đăng nhập và chưa có role, hiển thị form
  return <RoleSelectionContent user={user} />;
}

// Tách riêng nội dung để không phải truy vấn user lần nữa
function RoleSelectionContent({ user }: { user: any }) {
  return (
    <>
      <p className="text-sm text-slate-600 text-center">
        Welcome, <span className="font-medium">{user.name || user.email}</span>! 
        Please select your role in the platform. This will help us personalize your experience.
      </p>
      
      <RoleSelectionForm userId={user.id} />
    </>
  );
} 