'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-breakpoint";
import { breakpointQueries } from "@/hooks/use-breakpoint";

interface BottomNavProps {
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeIcon?: React.ComponentType<{ className?: string }>; 
  }[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const isMobile = !useMediaQuery(breakpointQueries.md);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-6">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface BottomNavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

export function BottomNavItem({
  href,
  label,
  icon,
  isActive,
}: BottomNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center space-y-1",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
} 