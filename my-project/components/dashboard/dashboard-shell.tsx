"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/dashboard/user-nav";

interface DashboardShellProps {
  children?: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/quizzes",
      label: "Bài kiểm tra",
      active: pathname === "/dashboard/quizzes",
    },
    {
      href: "/dashboard/results",
      label: "Kết quả",
      active: pathname === "/dashboard/results",
    },
  ];
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="hidden items-center space-x-2 md:flex">
              <span className="hidden font-bold sm:inline-block">
                QuizMaker
              </span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm ${
                    route.active ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user && <UserNav user={user} />}
          </div>
        </div>
      </header>
      <main className="container flex-1 py-6">
        <div className="grid gap-10">{children}</div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} QuizMaker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 