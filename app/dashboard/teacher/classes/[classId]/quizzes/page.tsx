import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";
import ClassQuizzesClient from "@/components/dashboard/teacher/class-quizzes-client";

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
      title: `Quizzes for ${classData.name} | Teacher Dashboard`,
      description: `Manage quizzes for the ${classData.name} class`,
    };
  } catch (error) {
    console.error("Error fetching class data for metadata:", error);
    return {
      title: "Class Quizzes | Teacher Dashboard",
    };
  }
}

export default async function ClassQuizzesPage({ params }: PageProps) {
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

  // Fetch initial class and quiz data
  const headersInstance = await headers();
  const protocol = headersInstance.get("x-forwarded-proto") || "http";
  const host = headersInstance.get("host") || "localhost:3000";
  
  // Fetch class details first to verify teacher has access
  const classApiUrl = `${protocol}://${host}/api/teacher/classes/${params.classId}`;
  const quizzesApiUrl = `${protocol}://${host}/api/teacher/classes/${params.classId}/quizzes`;

  try {
    // Fetch class data to verify access
    const classResponse = await fetch(classApiUrl, { 
      next: { tags: [`class-${params.classId}`] },
      headers: {
        "Cookie": headersInstance.get("cookie") || "",
      }
    });
    
    if (!classResponse.ok) {
      throw new Error(`Failed to fetch class: ${classResponse.status}`);
    }
    
    const classData = await classResponse.json();
    
    // Fetch initial quizzes data
    const quizzesResponse = await fetch(`${quizzesApiUrl}?page=1&limit=10`, {
      next: { tags: [`class-quizzes-${params.classId}`] },
      headers: {
        "Cookie": headersInstance.get("cookie") || "",
      }
    });
    
    if (!quizzesResponse.ok) {
      throw new Error(`Failed to fetch quizzes: ${quizzesResponse.status}`);
    }
    
    const quizzesData = await quizzesResponse.json();
    
    return (
      <DashboardShell>
        <DashboardHeader
          heading={`Quizzes for ${classData.name}`}
          text={`Manage quizzes for this class`}
        />
        <ClassQuizzesClient 
          classId={params.classId}
          initialData={quizzesData} 
        />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Class Quizzes"
          text="The requested data could not be loaded"
        />
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          Error loading class or quiz data. Please try again later.
        </div>
      </DashboardShell>
    );
  }
} 