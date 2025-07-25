import { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { QuizzesPageContent } from "./quizzes-page-content";

export const metadata: Metadata = {
  title: "My Quizzes",
  description: "View and take your assigned quizzes",
};

export default function QuizzesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="My Quizzes"
        text="View and take your assigned quizzes"
      />
      
      <QuizzesPageContent />
    </div>
  );
} 