"use client"

import * as React from "react"
import { createContext, useContext } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Moon, Sun, Laptop } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ThemeContextType {
  theme?: string
  setTheme: (theme: string) => void
  systemTheme?: string
}

const ThemeContext = createContext<ThemeContextType>({
  theme: undefined,
  setTheme: () => {},
  systemTheme: undefined,
})

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
      storageKey="OnTest-theme"
      {...props}
    >
      <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
    </NextThemesProvider>
  )
}

function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const themeContext = useNextTheme()
  
  return (
    <ThemeContext.Provider value={themeContext as ThemeContextType}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface ThemeSwitcherProps {
  variant?: "default" | "navbar" | "minimal" | "buttons"
  className?: string
}

export function ThemeSwitcher({ 
  variant = "default", 
  className
}: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Only render component content after first client-side render
  // to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return variant === "buttons" ? (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="w-9 h-9" />
        <div className="w-9 h-9" />
        <div className="w-9 h-9" />
      </div>
    ) : (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled />
    )
  }

  // Navbar variant (simple toggle)
  if (variant === "navbar") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        className={cn(
          "h-9 w-9 text-foreground transition-all duration-300 hover:bg-accent/20 hover:text-accent-foreground", 
          className
        )}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  // Minimal variant (icon only)
  if (variant === "minimal") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200 hover:bg-accent/20 hover:text-accent-foreground", 
          className
        )}
        title="Change theme"
      >
        {theme === "light" ? (
          <Sun className="h-4 w-4 transition-transform duration-200 hover:rotate-45" />
        ) : theme === "dark" ? (
          <Moon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
        ) : (
          <Laptop className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  // Buttons variant
  if (variant === "buttons") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Button
          variant={theme === "light" ? "default" : "outline"}
          size="icon"
          onClick={() => setTheme("light")}
          className="h-9 w-9 rounded-full transition-transform duration-200 hover:scale-105"
          title="Light mode"
        >
          <Sun className={cn(
            "h-4 w-4 transition-all duration-200",
            theme === "light" && "text-primary-foreground"
          )} />
          <span className="sr-only">Light mode</span>
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          size="icon"
          onClick={() => setTheme("dark")}
          className="h-9 w-9 rounded-full transition-transform duration-200 hover:scale-105"
          title="Dark mode"
        >
          <Moon className={cn(
            "h-4 w-4 transition-all duration-200",
            theme === "dark" && "text-primary-foreground"
          )} />
          <span className="sr-only">Dark mode</span>
        </Button>
        <Button
          variant={theme === "system" ? "default" : "outline"}
          size="icon"
          onClick={() => setTheme("system")}
          className="h-9 w-9 rounded-full transition-transform duration-200 hover:scale-105"
          title="System theme"
        >
          <Laptop className={cn(
            "h-4 w-4 transition-all duration-200",
            theme === "system" && "text-primary-foreground"
          )} />
          <span className="sr-only">System theme</span>
        </Button>
      </div>
    )
  }

  // Default variant (dropdown)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "h-9 w-9 transition-all duration-200 hover:border-accent hover:text-accent",
            className
          )}
        >
          {theme === "light" ? (
            <Sun className="h-4 w-4 transition-transform duration-200 hover:rotate-45" />
          ) : theme === "dark" ? (
            <Moon className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          ) : (
            <Laptop className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="animate-fadeIn w-40"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn("cursor-pointer transition-colors hover:text-accent", theme === "light" && "bg-accent/10 font-medium")}
        >
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn("cursor-pointer transition-colors hover:text-accent", theme === "dark" && "bg-accent/10 font-medium")}
        >
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={cn("cursor-pointer transition-colors hover:text-accent", theme === "system" && "bg-accent/10 font-medium")}
        >
          <Laptop className="h-4 w-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Icons
function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function LaptopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
} 