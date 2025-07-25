import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CreateClassForm } from "./CreateClassForm";

export const metadata: Metadata = {
  title: "Create Class | OnTest",
  description: "Create a new class for your students.",
};

/**
 * Server Component for the Create Class page
 * Handles authentication and renders the form for class creation
 */
export default async function CreateClassPage() {
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Teacher, redirect
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Create Class"
        text="Create a new class for your students."
      />
      
      <CreateClassForm />
    </DashboardShell>
  );
} 