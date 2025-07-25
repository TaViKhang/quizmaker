'use client'

import { useState, useEffect } from 'react'
import { X, Grid, Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-breakpoint'
import { breakpointQueries } from '@/hooks/use-breakpoint'

/**
 * A development tool that helps visualize spacing, grid, and breakpoints
 * Only appears in development mode
 */
export function SpacingDebug() {
  const [isVisible, setIsVisible] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)

  // Check current breakpoint
  const isSm = useMediaQuery(breakpointQueries.sm)
  const isMd = useMediaQuery(breakpointQueries.md)
  const isLg = useMediaQuery(breakpointQueries.lg)
  const isXl = useMediaQuery(breakpointQueries.xl)
  const is2Xl = useMediaQuery(breakpointQueries['2xl'])

  // Get current breakpoint
  const getCurrentBreakpoint = () => {
    if (is2Xl) return '2xl (≥1536px)'
    if (isXl) return 'xl (≥1280px)'
    if (isLg) return 'lg (≥1024px)'
    if (isMd) return 'md (≥768px)'
    if (isSm) return 'sm (≥640px)'
    return 'xs (<640px)'
  }

  // Check if we're in development mode
  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development')
  }, [])

  // Only show in development mode
  if (!isDevelopment) return null

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
        aria-label="Show spacing debug tools"
      >
        <Ruler className="h-4 w-4" />
      </button>
    )
  }

  return (
    <>
      {/* Grid overlay */}
      {showGrid && (
        <div className="pointer-events-none fixed inset-0 z-[999] px-4 opacity-20 sm:px-6 lg:px-8">
          <div className="container h-full mx-auto">
            <div className="grid h-full w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-full border-x border-dashed border-primary"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control panel */}
      <div className="fixed bottom-4 right-4 z-[1000] rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b p-2">
          <div className="text-xs font-medium">
            Spacing Debug
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 rounded-md p-1 hover:bg-muted"
            aria-label="Close spacing debug"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-3 space-y-4">
          {/* Breakpoint indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current breakpoint:</span>
              <span className="font-semibold">{getCurrentBreakpoint()}</span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
              <div className={cn("py-1 rounded", !isSm && "bg-primary text-primary-foreground")}>xs</div>
              <div className={cn("py-1 rounded", isSm && !isMd && "bg-primary text-primary-foreground")}>sm</div>
              <div className={cn("py-1 rounded", isMd && !isLg && "bg-primary text-primary-foreground")}>md</div>
              <div className={cn("py-1 rounded", isLg && !isXl && "bg-primary text-primary-foreground")}>lg</div>
              <div className={cn("py-1 rounded", isXl && "bg-primary text-primary-foreground")}>xl+</div>
            </div>
          </div>
          
          {/* Grid toggle */}
          <div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-1.5",
                showGrid ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <span className="text-xs font-medium">Show Grid</span>
              <Grid className="h-4 w-4" />
            </button>
          </div>
          
          {/* Window size */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Window size:</div>
            <div className="font-mono text-sm font-semibold"
              suppressHydrationWarning
            >
              {typeof window !== 'undefined' 
                ? `${window.innerWidth}px × ${window.innerHeight}px` 
                : 'Loading...'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 