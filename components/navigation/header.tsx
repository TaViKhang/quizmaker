"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  Loader2, 
  LogOut, 
  Settings, 
  User as UserIcon,
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle
} from "lucide-react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { NotificationIndicator } from "@/components/notification/notification-indicator";

interface HeaderProps {
  /**
   * Main navigation items for desktop view
   */
  navItems?: {
    title: string;
    href: string;
    active?: boolean;
  }[];
  /**
   * Whether to show the logo
   * @default true
   */
  showLogo?: boolean;
  /**
   * Whether to show mode toggle (light/dark)
   * @default true
   */
  showModeToggle?: boolean;
  /**
   * Whether to show notifications
   * @default true
   */
  showNotifications?: boolean;
  /**
   * Whether to show user menu
   * @default true 
   */
  showUserMenu?: boolean;
  /**
   * Logo link href
   * @default "/"
   */
  logoHref?: string;
  /**
   * Variant for background style
   * @default "default"
   */
  variant?: "default" | "transparent" | "blur";
  /**
   * Whether this header is inside a dashboard
   * @default false
   */
  isDashboard?: boolean;
  /**
   * Custom content to render on the right side
   */
  rightContent?: React.ReactNode;
}

/**
 * Application header component with responsive design
 * Supports desktop and mobile views with customizable nav items
 */
export function Header({
  navItems,
  showLogo = true,
  showModeToggle = true,
  showNotifications = true,
  showUserMenu = true,
  logoHref = "/",
  variant = "default",
  isDashboard = false,
  rightContent
}: HeaderProps) {
  const { status, user } = useAuth();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  
  // Default nav items for dashboard
  const defaultDashboardItems = [
    { title: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" },
    { title: "Exams", href: "/dashboard/exams", active: pathname.includes("/dashboard/exams") },
    { title: "Results", href: "/dashboard/results", active: pathname.includes("/dashboard/results") },
    { title: "Documentation", href: "/docs", active: pathname.includes("/docs") },
  ];
  
  // Use provided nav items or defaults based on context
  const currentNavItems = navItems || (isDashboard ? defaultDashboardItems : []);
  
  // Header background styles
  const headerStyles = {
    "default": "bg-background border-b",
    "transparent": "bg-transparent",
    "blur": "bg-background/80 backdrop-blur-sm border-b"
  };
  
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full transition-all duration-200",
      headerStyles[variant]
    )}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          {/* Logo */}
          {showLogo && (
            <Link 
              href={logoHref} 
              className="inline-flex items-center gap-2 font-bold"
              aria-label="EduAsses Home"
            >
              {isDashboard ? (
                <>
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <span className="hidden md:inline-block">EduAsses</span>
                </>
              ) : (
                <span>EduAsses</span>
              )}
            </Link>
          )}
          
          {/* Desktop Navigation */}
          {currentNavItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {currentNavItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    item.active || pathname === item.href
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          )}
          
          {/* Mobile Menu Button - Only on mobile */}
          {isDashboard && (
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <MobileNav onNavItemClick={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2">
          {/* Custom right content if provided */}
          {rightContent}

          {/* Theme toggle */}
          {showModeToggle && <ModeToggle variant="minimal" />}
          
          {/* Notifications icon */}
          {showNotifications && isAuthenticated && (
            <NotificationIndicator />
          )}
          
          {/* User menu */}
          {showUserMenu && (
            <>
              {isLoading ? (
                <Button disabled size="icon" variant="ghost">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative h-9 w-9 rounded-full"
                      aria-label="Open user menu"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                        <AvatarFallback className="bg-secondary">
                          {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/exams">
                        <FileText className="mr-2 h-4 w-4" />
                        My Exams
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/results">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Results
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/docs">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Help & Documentation
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => await signOut({ callbackUrl: "/" })}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/signin">
                  <Button size="sm" variant="default">Sign in</Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
} 