import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";
import ClassDetailsClient from "@/components/dashboard/teacher/class-details-client";

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
      title: `${classData.name} | Teacher Dashboard`,
      description: classData.description || `Manage the ${classData.name} class`,
    };
  } catch (error) {
    console.error("Error fetching class data for metadata:", error);
    return {
      title: "Class Details | Teacher Dashboard",
    };
  }
}

export default async function ClassDetailsPage({ params }: PageProps) {
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
          heading={classData.name}
          text={classData.description || `Manage the ${classData.name} class`}
        />
        <ClassDetailsClient classData={classData} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error fetching class data:", error);
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Class Not Found"
          text="The requested class could not be loaded"
        />
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          Error loading class data. Please try again later.
        </div>
      </DashboardShell>
    );
  }
} 