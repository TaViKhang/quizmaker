import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { Role, QuestionType, Question, Answer, QuizAttempt, User } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { GradingPanel } from "./GradingPanel";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Manual Grading | OnTest",
  description: "Grade essay and code questions, provide feedback to students",
};

interface GradingPageProps {
  params: {
    quizId: string;
  };
  searchParams: {
    attemptId?: string;
  };
}

type AttemptWithUserAndAnswers = QuizAttempt & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  answers: (Answer & {
    question: Question;
  })[];
};

export default async function GradingPage({ params, searchParams }: GradingPageProps) {
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
  const { attemptId } = searchParams;
  
  // Verify the teacher has permission to grade this quiz
  const quiz = await prisma.quiz.findUnique({
    where: {
      id: quizId,
      authorId: session.user.id,
    },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
  
  if (!quiz) {
    notFound();
  }
  
  // Get attempts that need manual grading (essay or code questions)
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId,
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
          question: {
            include: {
              options: true, // Include options for MCQ/True-False questions
            }
          },
        },
        // Include Essay, Code, and MCQ/True-False questions for review and feedback
        where: {
          OR: [
            // Questions that need manual grading
            {
              question: {
                type: {
                  in: [QuestionType.ESSAY, QuestionType.CODE],
                },
              },
              score: null, // Ungraded
            },
            // Already auto-graded MCQ/True-False questions for review and feedback
            {
              question: {
                type: {
                  in: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE],
                },
              }
            }
          ]
        }
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  });
  
  // Filter attempts to only those with questions that need grading
  const attemptsNeedingGrading = attempts.filter((attempt: AttemptWithUserAndAnswers) => 
    attempt.answers.some((answer: Answer & { question: Question }) => 
      // Ungraded essays and code questions
      (answer.score === null && 
       (answer.question.type === QuestionType.ESSAY || answer.question.type === QuestionType.CODE))
    )
  );
  
  // Get the current selected attempt (if any)
  const selectedAttempt = attemptId 
    ? attempts.find((a: AttemptWithUserAndAnswers) => a.id === attemptId) 
    : attemptsNeedingGrading[0];
  
  // Get the questions that need manual grading in this quiz
  const manualGradingQuestions = quiz.questions.filter(
    (question: Question) => 
      question.type === QuestionType.ESSAY || 
      question.type === QuestionType.CODE ||
      question.type === QuestionType.MULTIPLE_CHOICE ||
      question.type === QuestionType.TRUE_FALSE
  );
  
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
          <BreadcrumbItem>Manual Grading</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <DashboardHeader
        heading="Manual Grading"
        text="Grade essay and code submissions, provide feedback to students"
      />
      
      <GradingPanel
        quizId={quizId}
        quizTitle={quiz.title}
        questions={manualGradingQuestions}
        attempts={attempts}
        selectedAttempt={selectedAttempt}
      />
    </DashboardShell>
  );
} 