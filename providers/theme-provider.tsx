"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * OnTest Theme Provider
 * 
 * A wrapper around next-themes that provides a consistent theme experience
 * across the OnTest platform.
 * 
 * Features:
 * - Persists theme preference in local storage
 * - Supports system theme detection
 * - Handles theme switching with smooth transitions
 * - Provides theme values according to OnTest Design System
 *
 * The color palette is defined in globals.css with CSS variables following
 * the academic palette:
 * - Navy (Primary): HSL(222.2, 47.4%, 11.2%) - #0f172a
 * - Slate (Secondary): HSL(210, 40%, 96.1%) - #f1f5f9
 * - Emerald (Accent): HSL(160, 66%, 44%) - #10b981
 * 
 * @param {React.ReactNode} children - The child components
 * @param {object} props - Additional props for NextThemesProvider
 */
export function ThemeProvider({ 
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      enableColorScheme={true}
      disableTransitionOnChange={true}
      storageKey="OnTest-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
} 