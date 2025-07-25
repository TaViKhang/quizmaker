import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { QuizResultsClient } from "./QuizResultsClient";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Quiz Results | OnTest",
  description: "View and analyze quiz results",
};

interface ResultsPageProps {
  params: {
    quizId: string;
  };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // Only teachers can access this page
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }
  
  const { quizId } = params;
  
  // Verify the teacher has permission to view this quiz
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
      authorId: session.user.id,
    },
    include: {
      questions: {
        select: {
          id: true,
          content: true,
          type: true,
          points: true,
          order: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
  
  if (!quiz) {
    notFound();
  }
  
  // Get all attempts for this quiz
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId,
      completedAt: {
        not: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  });
  
  // Calculate statistics
  const totalAttempts = attempts.length;
  const questionsWithStats = quiz.questions.map(question => {
    // Find answers for this question
    const questionAnswers = attempts.flatMap(
      attempt => attempt.answers.filter(answer => answer.questionId === question.id)
    );
    
    // Calculate average score for this question
    let avgScore = 0;
    let correctCount = 0;
    
    if (questionAnswers.length > 0) {
      const totalScore = questionAnswers.reduce((sum, answer) => {
        // Count as correct if score is at least 90% of possible points
        if (answer.score && answer.score >= question.points * 0.9) {
          correctCount++;
        }
        return sum + (answer.score || 0);
      }, 0);
      
      avgScore = Math.round((totalScore / (questionAnswers.length * question.points)) * 100);
    }
    
    // Calculate percentage of correct answers
    const correctPercentage = questionAnswers.length > 0
      ? Math.round((correctCount / questionAnswers.length) * 100)
      : 0;
    
    return {
      ...question,
      avgScore,
      correctPercentage,
      totalAnswers: questionAnswers.length,
    };
  });
  
  // Calculate overall statistics
  let overallAvgScore = 0;
  let passingCount = 0;
  
  if (totalAttempts > 0) {
    const totalScorePercentage = attempts.reduce((sum, attempt) => 
      sum + (attempt.score || 0), 0);
    
    overallAvgScore = Math.round(totalScorePercentage / totalAttempts);
    
    // Count passing attempts based on quiz passing score
    if (quiz.passingScore) {
      passingCount = attempts.filter(
        attempt => attempt.score && attempt.score >= (quiz.passingScore || 0)
      ).length;
    }
  }
  
  const overallStats = {
    totalAttempts,
    overallAvgScore,
    passingCount,
    passingPercentage: totalAttempts > 0 ? Math.round((passingCount / totalAttempts) * 100) : 0,
    passingScore: quiz.passingScore,
  };
  
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
          <BreadcrumbItem>Results</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <DashboardHeader
        heading="Quiz Results & Analytics"
        text={`View detailed analytics and student performance for "${quiz.title}"`}
      />
      
      <QuizResultsClient
        quiz={quiz}
        attempts={attempts}
        questionsWithStats={questionsWithStats}
        overallStats={overallStats}
      />
    </DashboardShell>
  );
} 