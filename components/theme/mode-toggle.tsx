"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  variant?: "default" | "navbar" | "minimal" | "buttons";
  size?: "default" | "sm" | "lg";
  className?: string;
}

/**
 * Theme mode toggle component
 * Provides UI for switching between light, dark, and system themes
 * 
 * @param variant The visual variant of the toggle
 *   - default: Dropdown menu with options
 *   - navbar: Simple icon toggle for navigation bars
 *   - minimal: Compact icon-only toggle
 *   - buttons: Three separate buttons for each theme
 * @param size The size of the toggle
 *   - default: Standard size
 *   - sm: Smaller size
 *   - lg: Larger size, better for touch
 * @param className Additional classes to apply
 */
export function ModeToggle({ 
  variant = "default",
  size = "default",
  className 
}: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Only render component content after first client-side render
  // to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Size mappings
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
  };

  if (!mounted) {
    return variant === "buttons" ? (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={sizeClasses[size]} />
        <div className={sizeClasses[size]} />
        <div className={sizeClasses[size]} />
      </div>
    ) : (
      <Button 
        variant="ghost" 
        size="icon" 
        className={sizeClasses[size]} 
        disabled 
      />
    );
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
          sizeClasses[size],
          "text-foreground transition-all duration-300 hover:bg-accent/20 hover:text-accent",
          "rounded-md", // Slightly less rounded for better touch UX
          className
        )}
      >
        <Sun className={cn(
          iconSizes[size],
          "rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0"
        )} />
        <Moon className={cn(
          iconSizes[size],
          "absolute rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100"
        )} />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  // Minimal variant (icon only)
  if (variant === "minimal") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
        className={cn(
          sizeClasses[size],
          "transition-all duration-200 hover:bg-accent/20 hover:text-accent",
          "rounded-md", // Slightly less rounded for better touch UX
          className
        )}
        title="Change theme"
      >
        {theme === "light" ? (
          <Sun className={cn(iconSizes[size], "transition-transform duration-200 hover:rotate-45")} />
        ) : theme === "dark" ? (
          <Moon className={cn(iconSizes[size], "transition-transform duration-200 hover:scale-110")} />
        ) : (
          <Laptop className={cn(iconSizes[size], "transition-transform duration-200 hover:scale-110")} />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  // Buttons variant
  if (variant === "buttons") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant={theme === "light" ? "default" : "outline"}
          size="icon"
          onClick={() => setTheme("light")}
          className={cn(
            sizeClasses[size],
            "transition-transform duration-200 hover:scale-105",
            size === "lg" ? "rounded-xl" : "rounded-md" // Better touch target shape
          )}
          title="Light mode"
        >
          <Sun className={cn(
            iconSizes[size],
            "transition-all duration-200",
            theme === "light" && "text-primary-foreground"
          )} />
          <span className="sr-only">Light mode</span>
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          size="icon"
          onClick={() => setTheme("dark")}
          className={cn(
            sizeClasses[size],
            "transition-transform duration-200 hover:scale-105",
            size === "lg" ? "rounded-xl" : "rounded-md"
          )}
          title="Dark mode"
        >
          <Moon className={cn(
            iconSizes[size],
            "transition-all duration-200",
            theme === "dark" && "text-primary-foreground"
          )} />
          <span className="sr-only">Dark mode</span>
        </Button>
        <Button
          variant={theme === "system" ? "default" : "outline"}
          size="icon"
          onClick={() => setTheme("system")}
          className={cn(
            sizeClasses[size],
            "transition-transform duration-200 hover:scale-105",
            size === "lg" ? "rounded-xl" : "rounded-md"
          )}
          title="System theme"
        >
          <Laptop className={cn(
            iconSizes[size],
            "transition-all duration-200",
            theme === "system" && "text-primary-foreground"
          )} />
          <span className="sr-only">System theme</span>
        </Button>
      </div>
    );
  }

  // Default variant (dropdown)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            sizeClasses[size],
            "transition-all duration-200 hover:border-accent hover:text-accent",
            size === "lg" ? "rounded-xl" : "rounded-md", // Better touch target
            className
          )}
        >
          {theme === "light" ? (
            <Sun className={cn(iconSizes[size], "transition-transform duration-200 hover:rotate-45")} />
          ) : theme === "dark" ? (
            <Moon className={cn(iconSizes[size], "transition-transform duration-200 hover:scale-110")} />
          ) : (
            <Laptop className={cn(iconSizes[size], "transition-transform duration-200 hover:scale-110")} />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="animate-fadeIn min-w-[180px]"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn(
            "cursor-pointer flex items-center py-3 transition-colors hover:text-accent", 
            theme === "light" && "bg-accent/10 font-medium"
          )}
        >
          <Sun className="h-5 w-5 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn(
            "cursor-pointer flex items-center py-3 transition-colors hover:text-accent", 
            theme === "dark" && "bg-accent/10 font-medium"
          )}
        >
          <Moon className="h-5 w-5 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={cn(
            "cursor-pointer flex items-center py-3 transition-colors hover:text-accent", 
            theme === "system" && "bg-accent/10 font-medium"
          )}
        >
          <Laptop className="h-5 w-5 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 