import { Metadata } from "next";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UserRoleManagement } from "@/components/admin/user-role-management";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: "Quản lý người dùng | EduAsses",
  description: "Quản lý danh sách người dùng và phân quyền trong hệ thống",
};

export default async function UsersPage() {
  // Kiểm tra phân quyền
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/auth/signin");
  }
  
  // Chỉ ADMIN mới có quyền truy cập trang này
  if (session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }
  
  // Lấy danh sách tất cả người dùng
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

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Quản lý người dùng"
        text="Xem và quản lý tất cả tài khoản người dùng trong hệ thống."
      />
      <div className="grid gap-8">
        <UserRoleManagement users={users} currentUserId={session.user.id} />
      </div>
    </DashboardShell>
  );
} 