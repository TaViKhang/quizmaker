import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import TeacherDashboardContent from "@/components/dashboard/teacher/dashboard-content";
import { cookies, headers } from "next/headers";

export const metadata: Metadata = {
  title: "Teacher Dashboard | OnTest",
  description: "Overview of your classes, students, and educational performance metrics.",
};

/**
 * Server Component for the Teacher Dashboard page
 * Fetches initial data for dashboard visualization
 */
export default async function TeacherDashboardPage() {
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Teacher, redirect
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  // Fetch dashboard data from API with server-side credentials
  let dashboardData;
  try {
    // Sử dụng URL constructor để tạo URL tuyệt đối
    const apiUrl = new URL('/api/teacher/dashboard', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    
    const response = await fetch(apiUrl.toString(), {
      headers: { Cookie: (await headers()).get("cookie") || "" },
      cache: "no-store",
      next: { revalidate: 0 }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    dashboardData = await response.json();
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    dashboardData = {
      overview: {
        activeClasses: 0,
        totalStudents: 0,
        activeQuizzes: 0,
        completedQuizzes: 0,
        engagementRate: 0
      },
      recentClasses: [],
      recentQuizzes: [],
      classPerformance: [],
      activityFeed: [],
      studentPerformance: [],
      categoryDistribution: [],
      upcomingDeadlines: []
    };
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Teacher Dashboard"
        text="Overview of your classes, students, and educational performance metrics."
      />
      
      <TeacherDashboardContent initialData={dashboardData} />
    </DashboardShell>
  );
} 