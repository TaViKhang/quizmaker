import { Metadata } from "next";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Role } from "@prisma/client";
import { UserInfo } from "@/app/dashboard/settings/user-info";

export const metadata: Metadata = {
  title: "User Management | EduAsses",
  description: "Manage users and their roles in the system",
};

export default async function UsersPage() {
  // Check authorization
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/auth/signin");
  }
  
  // Only TEACHER role can access this page
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }
  
  // Get list of all users
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // For now, just display the teacher's own information
  const currentUser = users.find(user => user.id === session.user.id);

  // Convert the user to the format expected by UserInfo component
  const formattedUser = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    image: currentUser.image,
    role: currentUser.role as string
  } : null;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="User Management"
        text="View and manage all user accounts in the system."
      />
      <div className="grid gap-8">
        {formattedUser && <UserInfo user={formattedUser} />}
        <p className="text-center text-sm text-muted-foreground">
          User management features are under development.
        </p>
      </div>
    </DashboardShell>
  );
} 