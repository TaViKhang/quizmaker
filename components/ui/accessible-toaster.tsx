"use client"

import * as React from "react"
import { Toaster as ShadcnToaster } from "@/components/ui/toaster"

/**
 * Accessible Toaster component
 * 
 * Wraps the standard Toaster and adds additional accessibility features
 * such as proper ARIA roles and focus management
 */
export const AccessibleToaster = React.forwardRef<HTMLDivElement>((props, ref) => {
  // Set up screen reader access
  React.useEffect(() => {
    if (!ref || typeof ref === 'function' || !ref.current) return
    
    // Ensure proper ARIA roles
    const toaster = ref.current
    
    // Ensure the toaster has a role of "status" for screen readers
    if (!toaster.hasAttribute("role")) {
      toaster.setAttribute("role", "status")
    }
    
    // Add aria-live="polite" to ensure screen readers announce toast content
    if (!toaster.hasAttribute("aria-live")) {
      toaster.setAttribute("aria-live", "polite")
    }
    
    // Add aria-atomic="true" so the entire toast is announced
    if (!toaster.hasAttribute("aria-atomic")) {
      toaster.setAttribute("aria-atomic", "true")
    }
  }, [ref])
  
  return <ShadcnToaster ref={ref} {...props} />
})

AccessibleToaster.displayName = "AccessibleToaster"

// Re-export for convenient usage
export { useToast, toast } from "@/components/ui/use-toast" 