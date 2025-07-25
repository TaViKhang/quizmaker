import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { QuizPreviewClient } from "./QuizPreviewClient";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Quiz Preview | OnTest",
  description: "Preview your quiz before publishing.",
};

interface PageProps {
  params: {
    quizId: string;
  };
}

/**
 * Server Component for Quiz Preview page
 * Handles authentication and fetches quiz data
 */
export default async function QuizPreviewPage({ params }: PageProps) {
  const quizId = params.quizId;
  
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Teacher, redirect
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  // Get quiz with questions and options
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
      authorId: session.user.id,
    },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  // If quiz not found or doesn't belong to the teacher
  if (!quiz) {
    redirect("/dashboard/teacher/quizzes");
  }

  return (
    <DashboardShell>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/teacher/quizzes">Quizzes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/dashboard/teacher/quizzes/${quizId}/edit`}>{quiz.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Preview</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <DashboardHeader
        heading="Quiz Preview"
        text="Preview your quiz as students will see it."
      />
      
      <QuizPreviewClient quiz={quiz} />
    </DashboardShell>
  );
} 