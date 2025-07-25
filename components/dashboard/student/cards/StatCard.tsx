"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  /**
   * Title of the stat card
   */
  title: string;
  /**
   * Current value to display
   */
  value: string | number;
  /**
   * Icon to display in the card header
   */
  icon: React.ReactNode;
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
  /**
   * Additional description or explanation for the main value
   */
  description?: string;
  /**
   * Optional previous value to calculate and display trend
   */
  previousValue?: number;
  /**
   * Unit for the value and previousValue (e.g., '%', ' quizzes')
   * @default ''
   */
  unit?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Icon color class
   * @default "text-primary"
   */
  iconColor?: string;
  /**
   * On click handler for interactive cards
   */
  onClick?: () => void;
  /**
   * Whether to show pointer cursor and hover effect
   * @default false
   */
  interactive?: boolean;
}

// Define animation variants
const cardVariants = {
  initial: { 
    scale: 1 
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15
    }
  }
};

// Define trend arrow animation variants
const trendArrowVariants = {
  initial: { y: 0 },
  animate: (direction: "up" | "down") => ({
    y: direction === "up" ? -2 : 2,
    transition: {
      repeat: Infinity,
      repeatType: "reverse" as const,
      duration: 0.8
    }
  })
};

/**
 * Reusable stat card component for dashboards
 */
export function StatCard({
  title,
  value,
  icon,
  isLoading = false,
  description,
  previousValue,
  unit = '',
  className,
  iconColor = "text-primary",
  onClick,
  interactive = false,
}: StatCardProps) {
  let trendPercentage: number | null = null;
  let trendDirection: "up" | "down" | "neutral" = "neutral";

  if (previousValue !== undefined && typeof value === 'number' && previousValue !== null) {
    if (previousValue === 0 && value > 0) {
      trendPercentage = 100; // Or handle as 'new' or 'increased significantly'
      trendDirection = "up";
    } else if (previousValue === 0 && value === 0) {
        trendPercentage = 0;
        trendDirection = "neutral";
    } else if (previousValue !== 0) {
      trendPercentage = parseFloat((((value - previousValue) / previousValue) * 100).toFixed(1));
      if (trendPercentage > 0) trendDirection = "up";
      if (trendPercentage < 0) trendDirection = "down";
    }
  }

  const displayValue = typeof value === 'number' ? `${value}${unit}` : value;
  const displayPreviousValue = previousValue !== undefined ? `${previousValue}${unit}` : '';

  if (interactive && !isLoading) {
    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={onClick}
        className={cn(
          "rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-200 overflow-hidden",
          interactive && "cursor-pointer transition-colors hover:border-border/80 hover:bg-accent/40",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            {title}
            {interactive && !isLoading && (
              <motion.svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="text-muted-foreground ml-1 opacity-70"
                animate={{ x: [0, 4, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 1.5,
                  ease: "easeInOut",
                  repeatDelay: 1
                }}
              >
                <path 
                  d="M9 5L15 12L9 19" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </CardTitle>
          <div className={cn("h-4 w-4", iconColor)}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {displayValue}
          </motion.div>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {trendPercentage !== null && (
            <div className={cn(
              "text-xs flex items-center mt-1",
              trendDirection === "up" ? "text-emerald-600"
                : trendDirection === "down" ? "text-red-600"
                : "text-muted-foreground"
            )}>
              {trendDirection === "up" && (
                <motion.div
                  variants={trendArrowVariants}
                  initial="initial"
                  animate="animate"
                  custom="up"
                >
                  <ArrowUp className="h-3 w-3 mr-0.5" />
                </motion.div>
              )}
              {trendDirection === "down" && (
                <motion.div
                  variants={trendArrowVariants}
                  initial="initial"
                  animate="animate"
                  custom="down"
                >
                  <ArrowDown className="h-3 w-3 mr-0.5" />
                </motion.div>
              )}
              {trendPercentage !== 0 ? `${Math.abs(trendPercentage)}%` : ''}
              {trendPercentage === 0 && trendDirection === "neutral" ? "No change" : 
                (trendPercentage !== 0 ? (trendDirection === "up" ? " increase" : " decrease") : '')}
              {previousValue !== undefined && trendPercentage !== 0 && <span className="text-muted-foreground ml-1">from {displayPreviousValue}</span>}
            </div>
          )}
        </CardContent>
      </motion.div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1">
          {title}
        </CardTitle>
        <div className={cn("h-4 w-4", iconColor)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-4 w-32" />
            {previousValue !== undefined && <Skeleton className="h-3 w-24 mt-1" />} 
          </>
        ) : (
          <>
            <motion.div 
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {displayValue}
            </motion.div>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trendPercentage !== null && (
              <div className={cn(
                "text-xs flex items-center mt-1",
                trendDirection === "up" ? "text-emerald-600"
                  : trendDirection === "down" ? "text-red-600"
                  : "text-muted-foreground"
              )}>
                {trendDirection === "up" && (
                  <motion.div
                    variants={trendArrowVariants}
                    initial="initial"
                    animate="animate"
                    custom="up"
                  >
                    <ArrowUp className="h-3 w-3 mr-0.5" />
                  </motion.div>
                )}
                {trendDirection === "down" && (
                  <motion.div
                    variants={trendArrowVariants}
                    initial="initial"
                    animate="animate"
                    custom="down"
                  >
                    <ArrowDown className="h-3 w-3 mr-0.5" />
                  </motion.div>
                )}
                {trendPercentage !== 0 ? `${Math.abs(trendPercentage)}%` : ''}
                {trendPercentage === 0 && trendDirection === "neutral" ? "No change" : 
                 (trendPercentage !== 0 ? (trendDirection === "up" ? " increase" : " decrease") : '')}
                {previousValue !== undefined && trendPercentage !== 0 && <span className="text-muted-foreground ml-1">from {displayPreviousValue}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 