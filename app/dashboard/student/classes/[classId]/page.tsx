import { Metadata } from "next";
import { ClassDashboard } from "@/components/dashboard/student/class-dashboard";

export const metadata: Metadata = {
  title: "Class Dashboard | OnTest",
  description: "View class details, announcements, materials, and quizzes",
};

export default function ClassPage() {
  return (
    <div className="flex flex-col gap-8">
      <ClassDashboard />
    </div>
  );
} 