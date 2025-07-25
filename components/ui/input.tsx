import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: boolean
  hint?: string
  endIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, hint, endIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative flex flex-col gap-1 w-full">
        {/* Input wrapper for icon positioning */}
        <div className="relative">
          {/* Start icon if provided */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          
      <input
        type={type}
        className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm",
              icon && "pl-10",  // Add left padding if icon is present
              endIcon && "pr-10", // Add right padding if end icon is present
              error && "border-destructive focus-visible:ring-destructive/50",
          className
        )}
            disabled={disabled}
        ref={ref}
            aria-invalid={error ? "true" : undefined}
        {...props}
      />
          
          {/* End icon if provided */}
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
              {endIcon}
            </div>
          )}
        </div>
        
        {/* Hint or error message */}
        {hint && (
          <p 
            className={cn(
              "text-xs",
              error 
                ? "text-destructive" 
                : "text-muted-foreground"
            )}
            id={`${props.id || ''}-hint`}
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
