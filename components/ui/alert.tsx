import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, Check, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-success/50 text-success dark:border-success [&>svg]:text-success",
        warning:
          "border-warning/50 text-warning dark:border-warning [&>svg]:text-warning",
        info:
          "border-info/50 text-info dark:border-info [&>svg]:text-info",
      },
      size: {
        default: "text-sm",
        sm: "text-xs p-3 [&>svg]:top-3 [&>svg]:left-3",
        lg: "text-base p-5 [&>svg]:top-5 [&>svg]:left-5",
      },
      dismissible: {
        true: "pr-10", // Extra space for close button
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      dismissible: false,
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      icon?: React.ReactNode,
      dismissible?: boolean,
      onDismiss?: () => void
    }
>(({ className, variant, size, icon, dismissible = false, onDismiss, children, ...props }, ref) => {
    // Default icons based on variant
  const getDefaultIcon = () => {
    if (!icon) {
      switch (variant) {
        case "destructive":
          return <AlertCircle className="h-4 w-4" />
        case "success":
          return <Check className="h-4 w-4" />
        case "warning":
          return <AlertCircle className="h-4 w-4" />
        case "info":
          return <Info className="h-4 w-4" />
        default:
      return null
      }
    }
    return icon
    }

    return (
  <div
    ref={ref}
    role="alert"
      className={cn(alertVariants({ variant, size, dismissible, className }))}
    {...props}
      >
      {getDefaultIcon()}
      <div className="flex-1">{children}</div>
      {dismissible && onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-foreground/50 opacity-70 transition-opacity hover:opacity-100 hover:bg-muted"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      </div>
    )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
