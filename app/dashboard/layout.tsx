import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import { Suspense } from "react";

// Import các components
import { Sidebar } from "@/components/navigation/sidebar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Footer } from "@/components/navigation/footer";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { NotificationIndicator } from "@/components/notification/notification-indicator";
import { UserDropdown } from "@/components/navigation/user-dropdown";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";

export const metadata: Metadata = {
  title: "Dashboard | OnTest",
  description: "Online assessment management system OnTest",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // Auth check
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // Get user role for sidebar filtering
  const userRole = session.user.role;

  const cookieStore = await cookies();
  const roleSelectedCookie = cookieStore.get('role-selected');
  
  if (session.user.role === null && !roleSelectedCookie) {
    redirect("/auth/select-role");
  }

  // Define path mapping for better breadcrumb labels
  const breadcrumbPathMap = {
    'dashboard': 'Dashboard',
    'teacher': 'Teacher',
    'student': 'Student',
    'admin': 'Admin',
    'exams': 'Exams',
    'questions': 'Questions',
    'results': 'Results',
    'settings': 'Settings',
    'classes': 'My Classes',
    'materials': 'Materials',
    'announcements': 'Announcements',
    'create': 'Create',
    'role-requests': 'Role Requests',
    'users': 'Users',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Suspense fallback={<div className="w-[240px] bg-sidebar animate-pulse" />}>
        <Sidebar role={userRole} />
      </Suspense>
      
      {/* Main content */}
      <AnalyticsProvider>
      <main className="flex-1 overflow-y-auto">
        <div className="container pb-8 pt-6">
          {/* Top bar with utilities - Thay thế cho Header */}
          <div className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="flex h-16 items-center justify-between px-4">
              {/* Mobile menu toggle và logo */}
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0">
                    <MobileNav />
                  </SheetContent>
                </Sheet>
                
                <Link href="/dashboard" className="flex items-center gap-2 font-bold">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <span>OnTest</span>
                </Link>
              </div>
              
              {/* Utilities - Theme toggle, notifications, user menu */}
              <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <ModeToggle variant="minimal" />
                
                {/* Notifications */}
                <NotificationIndicator />
                
                {/* User menu - Giờ là Client Component riêng biệt */}
                <UserDropdown user={{...session.user, role: session.user.role}} />
              </div>
            </div>
          </div>
          
          {/* Breadcrumbs */}
          <Breadcrumbs pathMap={breadcrumbPathMap} background="transparent" />

          {/* Main content */}
          <div className="flex-1 p-4 md:p-6">{children}</div>

          {/* Footer */}
          <Footer variant="minimal" />
        </div>
      </main>
      </AnalyticsProvider>
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
} 