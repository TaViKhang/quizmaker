"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  LogOut, 
  Settings, 
  ChevronRight,
  User as UserIcon
} from "lucide-react";
import { signOut } from "next-auth/react";
import { DASHBOARD_NAV_LINKS } from "@/lib/constants";

interface MobileNavProps {
  /**
   * Callback when nav item is clicked
   */
  onNavItemClick?: () => void;
}

/**
 * Mobile navigation for the application
 * Used in mobile drawer/sheet
 */
export function MobileNav({ onNavItemClick }: MobileNavProps) {
  const { status, user } = useAuth();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const userRole = user?.role || null;

  // Filter links based on user role
  const filteredLinks = isAuthenticated && userRole
    ? DASHBOARD_NAV_LINKS.filter((link) => link.roles.includes(userRole as Role))
    : [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar">
      {/* Header area with logo and user info */}
      <div className="border-b border-sidebar-border p-4">
        <Link 
          href="/" 
          className="eduasses-logo inline-flex items-center gap-2 mb-6"
          onClick={onNavItemClick}
        >
          <span className="font-bold text-lg">EduAsses</span>
        </Link>
        
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 mt-2">
            <Avatar className="h-8 w-8 border border-sidebar-border">
              <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium leading-none text-sidebar-foreground">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate max-w-[180px]">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <Link 
              href="/auth/signin" 
              className="w-full"
              onClick={onNavItemClick}
            >
              <Button 
                variant="default" 
                className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              >
                Sign in
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {/* Home link */}
          <Link
            href="/"
            onClick={onNavItemClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-sidebar-accent/10 text-sidebar-accent"
                : "text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-accent"
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          
          {/* Dashboard link if authenticated */}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              onClick={onNavItemClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-sidebar-accent/10 text-sidebar-accent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-accent"
              )}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          )}
          
          {/* Role-specific links */}
          {filteredLinks.length > 0 && (
            <div className="mt-4 space-y-1">
              <div className="px-3 py-1 text-xs font-medium text-sidebar-foreground/70">
                {userRole === 'TEACHER' ? 'Teacher' : 'Student'} Menu
              </div>
              
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavItemClick}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent/10 text-sidebar-accent"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {link.title}
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-sidebar-accent" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
      
      {/* Footer actions */}
      {isAuthenticated && (
        <div className="border-t border-sidebar-border p-4">
          <div className="space-y-1">
            <Link
              href="/dashboard/settings"
              onClick={onNavItemClick}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            
            <button
              onClick={async () => {
                onNavItemClick?.();
                await signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 