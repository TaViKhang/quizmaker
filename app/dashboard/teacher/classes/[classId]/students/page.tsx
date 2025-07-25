import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";
import ClassStudentsClient from "./ClassStudentsClient";

interface PageProps {
  params: {
    classId: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // Fetch class data for dynamic metadata
  const headersInstance = await headers();
  const protocol = headersInstance.get("x-forwarded-proto") || "http";
  const host = headersInstance.get("host") || "localhost:3000";
  const apiUrl = `${protocol}://${host}/api/teacher/classes/${params.classId}`;

  try {
    const response = await fetch(apiUrl, { 
      next: { tags: [`class-${params.classId}`] },
      headers: {
        "Cookie": headersInstance.get("cookie") || "",
      }
    });
    
    if (!response.ok) {
      return {
        title: "Class Not Found | Teacher Dashboard",
      };
    }
    
    const classData = await response.json();
    
    return {
      title: `Students - ${classData.name} | Teacher Dashboard`,
      description: `Manage students for the ${classData.name} class`,
    };
  } catch (error) {
    console.error("Error fetching class data for metadata:", error);
    return {
      title: "Class Students | Teacher Dashboard",
    };
  }
}

export default async function ClassStudentsPage({ params }: PageProps) {
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

  // Fetch initial class data
  const headersInstance = await headers();
  const protocol = headersInstance.get("x-forwarded-proto") || "http";
  const host = headersInstance.get("host") || "localhost:3000";
  const apiUrl = `${protocol}://${host}/api/teacher/classes/${params.classId}`;

  try {
    const response = await fetch(apiUrl, { 
      next: { tags: [`class-${params.classId}`] },
      headers: {
        "Cookie": headersInstance.get("cookie") || "",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch class: ${response.status}`);
    }
    
    const classData = await response.json();
    
    return (
      <DashboardShell>
        <DashboardHeader
          heading={`Students - ${classData.name}`}
          text="Manage students in this class"
        />
        <div className="rounded-md border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">Students Management</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This feature is coming soon. You will be able to manage students, view their progress, 
            and control class enrollments.
          </p>
        </div>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error fetching class data:", error);
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Class Students"
          text="The requested class could not be loaded"
        />
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          Error loading class data. Please try again later.
        </div>
      </DashboardShell>
    );
  }
} 