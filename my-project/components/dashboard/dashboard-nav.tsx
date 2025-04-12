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

  // Define links based on user role
  const links = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
      roles: [Role.TEACHER, Role.STUDENT],
    },
    // TEACHER links
    {
      title: "Exams",
      href: "/dashboard/teacher/exams",
      icon: FileText,
      roles: [Role.TEACHER],
    },
    {
      title: "Questions",
      href: "/dashboard/teacher/questions",
      icon: ListChecks,
      roles: [Role.TEACHER],
    },
    {
      title: "Results",
      href: "/dashboard/teacher/results",
      icon: ClipboardCheck,
      roles: [Role.TEACHER],
    },
    // STUDENT links
    {
      title: "Take Exams",
      href: "/dashboard/student/exams",
      icon: BookOpen,
      roles: [Role.STUDENT],
    },
    {
      title: "My Results",
      href: "/dashboard/student/results",
      icon: ClipboardCheck,
      roles: [Role.STUDENT],
    },
    // Shared links
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: [Role.TEACHER, Role.STUDENT],
    },
  ];

  // Filter links based on user role
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