"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  type DialogProps
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface AccessibleDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  /**
   * The title of the dialog (required for accessibility)
   * If you don't want to show a visible title, set hideTitle to true
   */
  title: string
  /**
   * Optional description for the dialog
   */
  description?: string
  /**
   * Whether to hide the title visually (it will still be accessible to screen readers)
   * @default false
   */
  hideTitle?: boolean
  /**
   * Children content
   */
  children: React.ReactNode
  /**
   * Optional footer content
   */
  footer?: React.ReactNode
}

/**
 * An accessible wrapper for DialogContent that ensures a title is always provided
 * for screen reader accessibility
 */
export function AccessibleDialogContent({
  title,
  description,
  hideTitle = false,
  footer,
  children,
  className,
  ...props
}: AccessibleDialogContentProps) {
  return (
    <DialogContent className={cn("sm:max-w-[425px]", className)} {...props}>
      <DialogHeader>
        <DialogTitle className={cn(hideTitle && "sr-only")}>
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription>
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
      <div className="py-4">
        {children}
      </div>
      {footer && (
        <DialogFooter>
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  )
}

// Re-export Dialog components for convenience
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogProps
} 