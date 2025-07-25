'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-breakpoint"
import { breakpointQueries } from "@/hooks/use-breakpoint"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The main content of the dashboard
   */
  children: React.ReactNode
  /**
   * The sidebar content
   */
  sidebar: React.ReactNode
  /**
   * Show sidebar by default on mobile
   * @default false
   */
  defaultMobileOpen?: boolean
  /**
   * Optional header content to show above the main content
   */
  header?: React.ReactNode
  /**
   * The width of the sidebar on larger screens
   * @default "md"
   */
  sidebarWidth?: "sm" | "md" | "lg"
  /**
   * Apply bottom padding for mobile navigation
   * @default true
   */
  bottomPadding?: boolean
}

const sidebarWidthClasses = {
  sm: "w-64",
  md: "w-72",
  lg: "w-80",
};

/**
 * Responsive dashboard layout with collapsible sidebar for mobile devices
 */
export function DashboardLayout({
  children,
  sidebar,
  defaultMobileOpen = false,
  header,
  sidebarWidth = "md",
  bottomPadding = true,
  className,
  ...props
}: DashboardLayoutProps) {
  // Track if sidebar is open on mobile
  const [mobileOpen, setMobileOpen] = React.useState(defaultMobileOpen)
  const isDesktop = useMediaQuery(breakpointQueries.lg)
  const isMobile = !useMediaQuery(breakpointQueries.md)
  
  // Close mobile sidebar when screen size increases to desktop
  React.useEffect(() => {
    if (isDesktop && mobileOpen) {
      setMobileOpen(false)
    }
  }, [isDesktop, mobileOpen])

  // Handle ESC key to close sidebar on mobile
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && !isDesktop) {
        setMobileOpen(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, isDesktop])

  return (
    <div 
      className={cn(
        "flex min-h-screen flex-col", 
        bottomPadding && "pb-16 md:pb-0",
        className
      )} 
      {...props}
    >
      {/* Mobile header */}
      {isMobile && (
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-md" 
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <div className="flex-1 overflow-hidden">
            {header ? (
              <div className="truncate">{header}</div>
            ) : (
              <div className="text-lg font-semibold">OnTest</div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 z-20 flex h-[100dvh] flex-col border-r bg-background transition-transform",
            sidebarWidthClasses[sidebarWidth],
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            "md:sticky md:top-0 md:h-screen md:translate-x-0",
            // Adjust for mobile header height
            "mt-16 md:mt-0"
          )}
        >
          <div className="h-full overflow-y-auto pb-16 md:pb-0">
            {sidebar}
          </div>
        </aside>

        {/* Main content */}
        <main className={cn(
          "flex-1 pt-6 px-4 md:pt-8 md:px-8",
          !isDesktop && mobileOpen && "pointer-events-none opacity-50 md:pointer-events-auto md:opacity-100"
        )}>
          {isDesktop && header && (
            <header className="mb-6">{header}</header>
          )}
          <div className="pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
} 