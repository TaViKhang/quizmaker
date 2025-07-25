import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuizDetails } from "./quiz-details";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Quiz Details",
  description: "View details, take a quiz, or see your results",
};

interface QuizPageProps {
  params: {
    quizId: string;
  };
}

// Loading skeleton for the quiz details page
function QuizDetailsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        
        <div>
          <div className="rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function QuizPage({ params }: QuizPageProps) {
  const awaitedParams = await params; // Await params
  const quizId = awaitedParams.quizId;
  
  if (!quizId) {
    return notFound();
  }
  
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/student/quizzes">My Quizzes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Quiz Details</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <PageHeader 
        heading="Quiz Details"
        text="View information, start or continue the quiz"
      />
      
      <Suspense fallback={<QuizDetailsLoading />}>
        <QuizDetails quizId={quizId} />
      </Suspense>
    </div>
  );
} 