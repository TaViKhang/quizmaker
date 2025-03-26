"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Define required types
type Attribute = "class" | "data-theme" | "data-mode"

// Define provider props type
type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: Attribute | Attribute[]
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  storageKey?: string
  themes?: string[]
  forcedTheme?: string
  onValueChange?: (value: string) => void
}

/**
 * Theme provider component for the application
 * Manages theme switching between light and dark modes
 * Supports system theme preference
 * 
 * @param children Child components wrapped by this provider
 * @param props Additional props passed directly to NextThemesProvider
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
} 