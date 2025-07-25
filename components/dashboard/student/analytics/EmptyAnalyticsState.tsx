import React from 'react'
import { AlertCircle, BarChart3, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EmptyAnalyticsStateProps {
  /**
   * The title to display
   */
  title?: string
  /**
   * The description to display
   */
  description?: string
  /**
   * The icon to display
   */
  icon?: React.ReactNode
  /**
   * The action to display
   */
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * Visual style of the empty state
   * @default "default"
   */
  variant?: "default" | "error" | "warning" | "info"
}

/**
 * Empty state component for analytics sections
 * Follows the design system for consistent empty states
 */
export function EmptyAnalyticsState({
  title = "No data available",
  description = "There's no analytics data available for this section at the moment.",
  icon,
  action,
  variant = "default"
}: EmptyAnalyticsStateProps) {
  // Determine icon and colors based on variant
  const getIcon = () => {
    if (icon) return icon
    
    switch(variant) {
      case "error":
        return <AlertCircle className="h-12 w-12 text-destructive/60" />
      case "warning":
        return <AlertCircle className="h-12 w-12 text-amber-500/60" />
      case "info":
        return <Info className="h-12 w-12 text-blue-500/60" />
      default:
        return <BarChart3 className="h-12 w-12 text-muted-foreground/60" />
    }
  }
  
  // Determine title classes based on variant
  const getTitleClass = () => {
    switch(variant) {
      case "error":
        return "text-destructive"
      case "warning":
        return "text-amber-500"
      case "info":
        return "text-blue-500"
      default:
        return ""
    }
  }
  
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center text-center py-8">
        {getIcon()}
        <h3 className={`mt-4 text-lg font-semibold ${getTitleClass()}`}>
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          {description}
        </p>
        {action && (
          <Button 
            onClick={action.onClick} 
            variant={variant === "default" ? "default" : "outline"}
            className="mt-6"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
} 