import React from "react"
import { cn } from "@/lib/utils"

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content of the grid
   */
  children: React.ReactNode
  /**
   * Number of columns on mobile (default)
   * @default 1
   */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  /**
   * Number of columns on small devices (sm: 640px)
   */
  colsSm?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  /**
   * Number of columns on medium devices (md: 768px)
   */
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  /**
   * Number of columns on large devices (lg: 1024px)
   */
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  /**
   * Gap between grid items
   * @default 4
   */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
}

/**
 * A responsive grid component using CSS Grid
 * with support for different column counts at various breakpoints
 */
export function Grid({
  children,
  className,
  cols = 1,
  gap = 4,
  colsSm,
  colsMd,
  colsLg,
  ...props
}: GridProps) {
  const getColsClass = (cols: number) => `grid-cols-${cols}`;
  
  return (
    <div
      className={cn(
        "grid",
        getColsClass(cols),
        colsSm && `sm:${getColsClass(colsSm)}`,
        colsMd && `md:${getColsClass(colsMd)}`,
        colsLg && `lg:${getColsClass(colsLg)}`,
        gap > 0 && `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 