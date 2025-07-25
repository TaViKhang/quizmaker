import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";
import ClassManagementClient from "@/components/dashboard/teacher/class-management-client";

export const metadata: Metadata = {
  title: "Classes | Teacher Dashboard",
  description: "Manage your classes, students, and quizzes",
};

export default async function ClassManagementPage() {
  // Get user session
  const session = await getServerSession(authOptions);

  // Redirect if user is not logged in
  if (!session || !session.user) {
    redirect("/login?callbackUrl=/dashboard/teacher/classes");
  }

  // Redirect if user is not a teacher
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  // Fetch initial classes data
  const headersInstance = await headers();
  const protocol = headersInstance.get("x-forwarded-proto") || "http";
  const host = headersInstance.get("host") || "localhost:3000";
  const apiUrl = `${protocol}://${host}/api/teacher/classes`;

  try {
    const response = await fetch(`${apiUrl}?page=1&limit=10`, {
      next: { tags: ["teacher-classes"] },
      headers: {
        "Cookie": headersInstance.get("cookie") || "",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch classes: ${response.status}`);
    }
    
    const classesData = await response.json();
    
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Class Management"
          text="Create and manage your classes"
        />
        <ClassManagementClient initialData={classesData} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error fetching classes data:", error);
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Class Management"
          text="Create and manage your classes"
        />
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          Error loading classes data. Please try again later.
        </div>
      </DashboardShell>
    );
  }
} 