import React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content of the container
   */
  children: React.ReactNode
  /**
   * The maximum width of the container
   * @default "lg"
   */
  size?: "sm" | "md" | "lg" | "xl" | "full"
  /**
   * Center the container horizontally
   * @default true
   */
  centered?: boolean
}

const sizeMap = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  full: "max-w-full",
}

/**
 * A responsive container component that provides consistent
 * spacing and maximum widths according to the EduAsses Design System
 */
export function Container({
  children,
  className,
  size = "lg",
  centered = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeMap[size],
        {
          "mx-auto": centered,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 