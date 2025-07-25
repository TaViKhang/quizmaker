import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow active:scale-[0.98]",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow active:scale-[0.98]",
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow active:scale-[0.98]",
        info:
          "bg-info text-info-foreground shadow-sm hover:bg-info/90 hover:shadow active:scale-[0.98]",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-secondary hover:border-accent hover:text-accent active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:text-accent hover:shadow active:scale-[0.98]",
        ghost: 
          "hover:bg-secondary hover:text-accent active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-accent",
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 hover:shadow active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2", // Standard padding 8px 16px
        sm: "h-8 rounded-md px-3 py-1 text-xs", // Small padding 4px 12px
        lg: "h-10 rounded-md px-6 py-3 text-base", // Large padding 12px 24px
        xl: "h-12 rounded-lg px-8 py-4 text-base", // Extra large
        icon: "h-9 w-9 p-2", // Icon-only with padding 8px
        "icon-sm": "h-8 w-8 p-1.5 rounded-md text-xs", // Small icon
        "icon-lg": "h-10 w-10 p-2.5 rounded-md", // Large icon
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
            {children}
          </div>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
