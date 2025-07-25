import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { QuizEditForm } from "./QuizEditForm";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Quiz | OnTest",
  description: "Edit your quiz details and questions.",
};

/**
 * Server Component for the Edit Quiz page
 * Handles authentication and fetches the quiz data for editing
 */
export default async function EditQuizPage({ params }: { params: { quizId: string } }) {
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Teacher, redirect
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  // Fetch the quiz data
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: params.quizId,
      authorId: session.user.id, // Ensure the quiz belongs to this teacher
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

  // If quiz not found or doesn't belong to this teacher
  if (!quiz) {
    notFound();
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
        heading="Edit Quiz"
        text="Update your quiz details and manage questions."
      />
      
      <QuizEditForm 
        quiz={quiz} 
        classes={teacherClasses} 
        categories={categories} 
      />
    </DashboardShell>
  );
} 