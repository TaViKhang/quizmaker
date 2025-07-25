'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useMediaQuery } from "@/hooks/use-breakpoint"
import { breakpointQueries } from "@/hooks/use-breakpoint"
import { Section } from "@/components/ui/section"
import { ModeToggle } from "@/components/theme/mode-toggle"

interface AuthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The main content (auth form)
   */
  children: React.ReactNode
  /**
   * Background image URL for the side section (on larger screens)
   */
  backgroundImage?: string
  /**
   * Content to display in the side section (on larger screens)
   */
  sideContent?: React.ReactNode
  /**
   * Text or logo to show at the top of the auth form
   */
  logo?: React.ReactNode
  /**
   * Footer content
   */
  footer?: React.ReactNode
  /**
   * Whether to show a full-width layout
   * @default false
   */
  fullWidth?: boolean
  /**
   * Show the mode toggle in the corner
   * @default true
   */
  showModeToggle?: boolean
}

/**
 * Responsive layout for authentication pages (sign in, sign up, etc.)
 * Features a side section with background image on larger screens
 */
export function AuthLayout({
  children,
  backgroundImage = "/images/auth-background.jpg", // Default background
  sideContent,
  logo,
  footer,
  fullWidth = false,
  showModeToggle = true,
  className,
  ...props
}: AuthLayoutProps) {
  const isLargeScreen = useMediaQuery(breakpointQueries.lg);
  const isTablet = useMediaQuery(breakpointQueries.md);

  return (
    <div 
      className={cn(
        "flex min-h-[100dvh] flex-col lg:flex-row",
        className
      )} 
      {...props}
    >
      {/* Side section with background image - only visible on lg screens */}
      {isLargeScreen && (
        <div className="relative hidden flex-1 lg:block">
          {backgroundImage && (
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={backgroundImage}
                alt="Authentication background"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 0"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          )}
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
          
          {/* Side content container */}
          {sideContent && (
            <div className="relative z-10 flex h-full w-full items-center justify-center p-6 sm:p-8 md:p-12 text-white">
              <div className="max-w-md">
                {sideContent}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main auth form container */}
      <div className={cn(
        "flex flex-1 flex-col",
        fullWidth ? "lg:flex-1" : "lg:w-[500px] xl:w-[550px]"
      )}>
        {/* Mode toggle */}
        {showModeToggle && (
          <div className="absolute right-4 top-4 z-50">
            <ModeToggle />
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-6 md:px-8 lg:p-12">
          {/* Logo section */}
          {logo && (
            <div className="mb-8 flex justify-center">
              {logo}
            </div>
          )}

          {/* Form content */}
          <div className="mx-auto w-full max-w-[400px] lg:max-w-none">
            {children}
          </div>

          {/* Footer content (links, etc.) */}
          {footer && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 