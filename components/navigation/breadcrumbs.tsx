"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import { getExtendedPathMap, mapToOldRoute } from "@/lib/navigation-adapter";

interface BreadcrumbsProps {
  /**
   * Mapping of path segments to display names
   * e.g. { 'dashboard': 'Dashboard', 'settings': 'Settings' }
   */
  pathMap?: Record<string, string>;
  /**
   * Root path to start breadcrumbs from
   * @default "/"
   */
  rootPath?: string;
  /**
   * Whether to show home icon for root
   * @default true
   */
  showHomeIcon?: boolean;
  /**
   * Background style variant
   * @default "default"
   */
  background?: "default" | "transparent" | "subtle";
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Breadcrumbs navigation component
 * Automatically generates breadcrumbs based on current path
 */
export function Breadcrumbs({
  pathMap = {},
  rootPath = "/",
  showHomeIcon = true,
  background = "default",
  className,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Background styles
  const backgroundStyles = {
    "default": "bg-muted",
    "transparent": "bg-transparent",
    "subtle": "bg-background border-b",
  };
  
  // Merge default path map with provided pathMap
  const mergedPathMap = useMemo(() => {
    const extendedPathMap = getExtendedPathMap();
    return { ...extendedPathMap, ...pathMap };
  }, [pathMap]);
  
  // Generate breadcrumb segments from current path
  const breadcrumbs = useMemo(() => {
    // Remove trailing slash if present
    const cleanPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;
      
    // Map new routes to old routes for consistent breadcrumbs
    const adaptedPath = mapToOldRoute(cleanPath);
    
    // Split the pathname into segments
    const segments = adaptedPath.split('/').filter(Boolean);
    
    // Start with the root item
    const items = [
      {
        label: showHomeIcon ? <Home className="h-4 w-4" /> : "Home",
        href: rootPath,
        active: pathname === rootPath,
      },
    ];
    
    // Build up the breadcrumb trail
    if (segments.length > 0) {
      let currentPath = "";
      
      segments.forEach((segment, index) => {
        // Build current path
        currentPath += `/${segment}`;
        
        // Skip dynamic segments (those starting with '[')
        if (segment.startsWith('[') && segment.endsWith(']')) {
          return;
        }
        
        // Check if this is the last segment
        const isLast = index === segments.length - 1;
        
        // Get display name from map, or format the segment
        let label = mergedPathMap[segment] || segment
          // Convert kebab/snake case to title case
          .replace(/[-_]/g, ' ')
          // Capitalize first letter of each word
          .replace(/\b\w/g, char => char.toUpperCase());
        
        items.push({
          label,
          href: currentPath,
          active: isLast,
        });
      });
    }
    
    return items;
  }, [pathname, mergedPathMap, rootPath, showHomeIcon]);
  
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <nav 
      aria-label="Breadcrumbs" 
      className={cn(
        "px-4 py-2 text-sm md:px-6",
        backgroundStyles[background],
        className
      )}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className={cn(
                      "flex items-center text-muted-foreground hover:text-foreground transition-colors",
                      crumb.active && "text-foreground font-medium"
                    )}
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="mx-1.5 h-3 w-3 text-muted-foreground/50" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
} 