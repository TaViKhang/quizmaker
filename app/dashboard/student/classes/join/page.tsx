import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JoinClassForm } from "@/components/dashboard/student/join-class-form";

// Main page component (Server Component)
export default async function JoinClassPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Join a class" 
        text="Enter the class code provided by your teacher to join a new class."
      />
      <JoinClassForm />
    </DashboardShell>
  );
} 