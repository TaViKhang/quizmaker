"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@prisma/client";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BarChart,
  BookOpen,
  ClipboardCheck,
  FileText,
  Home,
  ListChecks,
  Menu,
  Settings,
  Users,
} from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { status, user } = useAuth();
  
  const isAuthenticated = status === "authenticated";
  const userRole = user?.role || Role.STUDENT;

  // All possible links
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
  const filteredLinks = isAuthenticated 
    ? links.filter((link) => link.roles.includes(userRole)) 
    : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-lg font-bold">EduAsses</SheetTitle>
        </SheetHeader>
        {isAuthenticated ? (
          <div className="my-4 grid gap-2">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium",
                    pathname === link.href
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.title}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="my-4 grid gap-2">
            <Link
              href="/auth/signin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium hover:bg-muted/50"
            >
              Sign In
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
} 