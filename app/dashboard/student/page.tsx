import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StudentOverviewPageClient } from "./StudentOverviewPageClient";
import { searchParamsCache } from "@/app/lib/searchParamsCache";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = {
  title: "Student Dashboard | OnTest",
  description: "Manage your learning and view your academic performance overview, including upcoming quizzes and results.",
};

interface PageProps {
  searchParams: SearchParams;
}

/**
 * Server Component for the Student Dashboard page
 * Handles authentication and renders the client components
 */
export default async function StudentDashboardPage({ searchParams }: PageProps) {
  // Parse search params with default values
  const params = searchParamsCache.parse(searchParams);
  
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Student, redirect
  if (session.user.role !== Role.STUDENT) {
    redirect("/dashboard");
  }

  // Format greeting based on time of day
  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
  } else if (currentHour >= 18) {
    greeting = "Good evening";
  }

  const userName = session.user.name || "Student";

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`${greeting}, ${userName}!`}
        text="Here's an overview of your academic progress, upcoming quizzes, and recent results."
      />
      
      <StudentOverviewPageClient />
    </DashboardShell>
  );
} 