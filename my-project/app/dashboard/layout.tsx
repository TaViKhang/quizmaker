import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Shell } from "@/components/ui/shell";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard | EduAsses",
  description: "Hệ thống quản lý đánh giá trực tuyến EduAsses",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  return (
    <Shell className="gap-0 px-0">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="hidden items-center space-x-2 md:flex">
              <span className="hidden font-bold sm:inline-block">
                EduAsses
              </span>
            </Link>
            <MobileNav />
            <nav className="hidden gap-6 md:flex">
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/docs"
                className={cn(
                  "flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:text-sm"
                )}
              >
                Tài liệu
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle variant="navbar" />
            <UserNav
              user={{
                name: session.user.name,
                image: session.user.image,
                email: session.user.email,
                role: session.user.role,
              }}
            />
          </div>
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
        <aside className="hidden w-[220px] flex-col md:flex lg:w-[240px]">
          <div className="sticky top-20">
            <DashboardNav userRole={session.user.role} />
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6">
          {children}
        </main>
      </div>
    </Shell>
  );
} 