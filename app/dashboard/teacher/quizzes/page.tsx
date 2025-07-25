import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { QuizManagementClient } from "./QuizManagementClient";
import { searchParamsCache } from "@/app/lib/searchParamsCache";
import type { SearchParams } from "nuqs/server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Quiz Management | OnTest",
  description: "Create, edit, and manage quizzes for your classes.",
};

interface PageProps {
  searchParams: SearchParams;
}

/**
 * Server Component for Teacher Quiz Management page
 * Handles authentication and fetches initial quiz data
 */
export default async function QuizManagementPage({ searchParams }: PageProps) {
  // Parse search params with default values
  const params = searchParamsCache.parse(searchParams);
  
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Teacher, redirect
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  // Get teacher's quizzes count for pagination info
  const quizzesCount = await prisma.quiz.count({
    where: {
      authorId: session.user.id,
    },
  });

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Quiz Management"
        text="Create, edit, and manage quizzes for your classes."
      >
      </DashboardHeader>
      
      <QuizManagementClient quizzesCount={quizzesCount} />
    </DashboardShell>
  );
} 