import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CreateQuizForm } from "./CreateQuizForm";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Create Quiz | OnTest",
  description: "Create a new quiz for your students.",
};

/**
 * Server Component for the Create Quiz page
 * Handles authentication and fetches necessary data for creating a quiz
 */
export default async function CreateQuizPage() {
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Teacher, redirect
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  // Get the teacher's classes for the class selection dropdown
  const teacherClasses = await prisma.class.findMany({
    where: {
      teacherId: session.user.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      subject: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get categories from existing quizzes (for autocomplete)
  const existingCategories = await prisma.quiz.findMany({
    where: {
      authorId: session.user.id,
      category: {
        not: null,
      },
    },
    select: {
      category: true,
    },
    distinct: ["category"],
  });

  const categories = existingCategories
    .map(quiz => quiz.category!)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create Quiz"
        text="Create a new quiz for your students."
      />
      
      <CreateQuizForm classes={teacherClasses} categories={categories} />
    </DashboardShell>
  );
} 