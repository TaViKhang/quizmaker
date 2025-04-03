"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  BarChart,
  BookOpen,
  ClipboardCheck,
  FileText,
  Home,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";

interface DashboardNavProps {
  userRole: Role;
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();

  // Định nghĩa các liên kết dựa trên vai trò người dùng
  const links = [
    {
      title: "Trang chủ",
      href: "/dashboard",
      icon: Home,
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT],
    },
    // ADMIN links
    {
      title: "Người dùng",
      href: "/dashboard/admin/users",
      icon: Users,
      roles: [Role.ADMIN],
    },
    {
      title: "Thống kê",
      href: "/dashboard/admin/stats",
      icon: BarChart,
      roles: [Role.ADMIN],
    },
    // TEACHER links
    {
      title: "Đề thi",
      href: "/dashboard/teacher/exams",
      icon: FileText,
      roles: [Role.TEACHER, Role.ADMIN],
    },
    {
      title: "Câu hỏi",
      href: "/dashboard/teacher/questions",
      icon: ListChecks,
      roles: [Role.TEACHER, Role.ADMIN],
    },
    {
      title: "Kết quả",
      href: "/dashboard/teacher/results",
      icon: ClipboardCheck,
      roles: [Role.TEACHER, Role.ADMIN],
    },
    // STUDENT links
    {
      title: "Làm bài",
      href: "/dashboard/student/exams",
      icon: BookOpen,
      roles: [Role.STUDENT],
    },
    {
      title: "Kết quả của tôi",
      href: "/dashboard/student/results",
      icon: ClipboardCheck,
      roles: [Role.STUDENT],
    },
    // Shared links
    {
      title: "Cài đặt",
      href: "/dashboard/settings",
      icon: Settings,
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT],
    },
  ];

  // Lọc các liên kết phù hợp với vai trò người dùng
  const filteredLinks = links.filter((link) => link.roles.includes(userRole));

  return (
    <nav className="grid gap-2 md:grid-cols-1">
      {filteredLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              pathname === link.href
                ? "bg-muted hover:bg-muted font-medium"
                : "hover:bg-transparent hover:underline",
              "justify-start gap-2"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
} 