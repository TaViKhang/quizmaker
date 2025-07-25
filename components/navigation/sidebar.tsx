"use client"

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { 
  DASHBOARD_NAV_LINKS, 
  RoleType,
  DashboardNavItem
} from "@/lib/constants";
import {
  isActiveRoute,
  getAdditionalNavItems
} from "@/lib/navigation-adapter";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft,
  ChevronRight, 
  Menu, 
  LayoutDashboard,
  X
} from "lucide-react";

// Mở rộng type DashboardNavItem để hỗ trợ children
interface NavItemWithChildren {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: {
    title: string;
    href: string;
  }[];
}

interface SidebarProps {
  /**
   * User role for filtering navigation
   */
  role?: RoleType;
  /**
   * Custom navigation items (overrides default links)
   */
  customNavItems?: NavItemWithChildren[];
  /**
   * Whether the sidebar can be collapsed
   * @default true
   */
  collapsible?: boolean;
  /**
   * Default collapsed state (only used if collapsible)
   * @default false
   */
  defaultCollapsed?: boolean;
  /**
   * Whether to show a mobile toggle button
   * Only needed for custom mobile layouts
   * @default false
   */
  showMobileToggle?: boolean;
  /**
   * Callback when mobile toggle is clicked
   */
  onMobileToggle?: () => void;
  /**
   * Additional class names for the sidebar
   */
  className?: string;
}

/**
 * Dashboard sidebar component with collapsible and responsive features
 */
export function Sidebar({
  role,
  customNavItems,
  collapsible = true,
  defaultCollapsed = false,
  showMobileToggle = false,
  onMobileToggle,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  
  // Use custom nav items if provided, otherwise filter based on role
  const baseNavItems = customNavItems || 
    (role 
      ? DASHBOARD_NAV_LINKS.filter((link) => link.roles.includes(role as Role))
      : DASHBOARD_NAV_LINKS.filter((link) => link.roles.length === 0));
  
  // Add additional nav items for new features using the adapter
  const additionalNavItems = role ? getAdditionalNavItems().filter(
    (link) => link.roles.includes(role as Role)
  ) : [];
  
  // Combine base and additional nav items
  const navItems = [...baseNavItems, ...additionalNavItems];
  
  return (
    <div className={cn(
      "flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300",
      collapsed ? "w-[70px]" : "w-[240px]",
      className
    )}>
      {/* Sidebar header with collapse control */}
      <div className={cn(
        "flex h-16 items-center border-b border-border px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="OnTest-logo text-sidebar-foreground flex items-center">
            <span className="font-bold mr-2">OnTest</span>
          </Link>
        )}
        
        {collapsed && (
          <Link href="/dashboard" className="OnTest-logo text-sidebar-foreground rounded-md p-1.5 transition-colors hover:bg-sidebar-accent/10">
            <LayoutDashboard className="h-5 w-5 text-sidebar-accent" />
          </Link>
        )}
        
        {collapsible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
        
        {showMobileToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            className="md:hidden h-8 w-8 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Main navigation */}
      <div className={cn(
        "flex-1 overflow-auto py-4",
        collapsed ? "px-2" : "px-3"
      )}>
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(pathname, item.href);
            const hasChildren = 'children' in item && item.children && item.children.length > 0;
            
            if (collapsed || !hasChildren) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md transition-colors",
                    collapsed ? "justify-center p-2" : "px-3 py-2",
                    isActive
                      ? "bg-sidebar-accent/10 text-sidebar-accent"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-accent"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
                  {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                </Link>
              );
            }
            
            // For items with children, use Accordion
            const childActive = (item as NavItemWithChildren).children?.some(
              (child) => isActiveRoute(pathname, child.href)
            );
            
            return (
              <Accordion
                key={item.href}
                type="single"
                collapsible
                defaultValue={childActive ? `item-${index}` : undefined}
                className="border-none"
              >
                <AccordionItem value={`item-${index}`} className="border-none">
                  <AccordionTrigger
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 rounded-md transition-colors hover:no-underline",
                      (isActive || childActive)
                        ? "bg-sidebar-accent/10 text-sidebar-accent hover:bg-sidebar-accent/15"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-accent"
                    )}
                  >
                    <Icon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-1">
                    <div className="ml-9 space-y-1 pl-3 border-l border-sidebar-border">
                      {(item as NavItemWithChildren).children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center py-2 px-3 text-xs font-medium rounded-md transition-colors",
                            child.href === pathname
                              ? "bg-sidebar-accent/10 text-sidebar-accent"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/5 hover:text-sidebar-accent"
                          )}
                          aria-current={child.href === pathname ? "page" : undefined}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
        </nav>
      </div>
      
      {/* Footer area - can be extended to show user info or actions */}
      <div className={cn(
        "border-t border-border p-4",
        collapsed ? "flex justify-center" : "block"
      )}>
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-8 w-8 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
            aria-label="Expand sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          <div className="text-xs text-sidebar-foreground/70">
            <p>OnTest © {new Date().getFullYear()}</p>
          </div>
        )}
      </div>
    </div>
  );
} 