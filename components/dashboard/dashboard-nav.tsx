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
import { Separator } from "@/components/ui/separator";
import { 
  DASHBOARD_NAV_LINKS, 
  DashboardNavItem, 
  RoleType 
} from "@/lib/constants";

interface DashboardNavProps {
  role?: RoleType;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();

  // Filter links based on user role
  const filteredLinks = role 
    ? DASHBOARD_NAV_LINKS.filter((link) => link.roles.includes(role as Role))
    : DASHBOARD_NAV_LINKS.filter((link) => link.roles.length === 0);

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
                : "hover:bg-accent/10 hover:text-accent",
              "justify-start gap-2 transition-colors"
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