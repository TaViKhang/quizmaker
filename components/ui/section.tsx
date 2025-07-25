import React from "react"
import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The content of the section
   */
  children: React.ReactNode
  /**
   * Control the vertical padding of the section
   * @default "md"
   */
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  /**
   * The HTML element to render the section as
   * @default "section"
   */
  as?: "section" | "div" | "article" | "main" | "aside"
  container?: boolean
}

const spacingMap = {
  none: "py-0",
  xs: "py-4 md:py-6",
  sm: "py-6 md:py-8",
  md: "py-8 md:py-12",
  lg: "py-12 md:py-16",
  xl: "py-16 md:py-24",
}

/**
 * A section component that provides consistent vertical spacing
 * according to the EduAsses Design System
 */
export function Section({
  children,
  className,
  spacing = "md",
  as: Component = "section",
  container = true,
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn(
        spacingMap[spacing],
        className
      )}
      {...props}
    >
      {container ? (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      ) : (
        children
      )}
    </Component>
  )
} 