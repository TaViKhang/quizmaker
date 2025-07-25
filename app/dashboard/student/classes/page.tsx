import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClassesPageContent } from "./classes-page-content"; // Import the new client component

// Server component
export default async function ClassesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Lớp học của tôi" 
        text="Quản lý và truy cập các lớp học bạn tham gia"
      />
      <ClassesPageContent />
    </DashboardShell>
  );
} 