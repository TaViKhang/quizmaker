'use client'

import React from "react"
import { useMediaQuery } from "@/hooks/use-breakpoint"
import { breakpointQueries } from "@/hooks/use-breakpoint"

interface ResponsiveProps {
  children: React.ReactNode
  showOnMobile?: boolean
  showOnTablet?: boolean
  showOnDesktop?: boolean
  breakpoint?: keyof typeof breakpointQueries
  above?: boolean
}

/**
 * Component that conditionally renders content based on the current screen size
 * 
 * @example
 * ```tsx
 * <Responsive
 *   xs={<MobileNav />}
 *   lg={<DesktopNav />}
 *   fallback={<MobileNav />} // For SSR
 * />
 * ```
 */
export function Responsive({
  children,
  showOnMobile = true,
  showOnTablet = true,
  showOnDesktop = true,
  breakpoint,
  above,
}: ResponsiveProps) {
  // If using the breakpoint prop directly
  if (breakpoint) {
    const matches = useMediaQuery(breakpointQueries[breakpoint])
    // Above means show when query matches, below means show when it doesn't match
    const shouldShow = above ? matches : !matches
    return shouldShow ? <>{children}</> : null
  }

  // If using the showOn props
  const isTablet = useMediaQuery(breakpointQueries.md)
  const isDesktop = useMediaQuery(breakpointQueries.lg)

  const isMobileView = !isTablet && !isDesktop
  const isTabletView = isTablet && !isDesktop
  const isDesktopView = isDesktop

  if (
    (isMobileView && !showOnMobile) ||
    (isTabletView && !showOnTablet) ||
    (isDesktopView && !showOnDesktop)
  ) {
    return null
  }

  return <>{children}</>
}

interface MobileProps {
  children: React.ReactNode
}

export function Mobile({ children }: MobileProps) {
  return (
    <Responsive showOnTablet={false} showOnDesktop={false}>
      {children}
    </Responsive>
  )
}

interface TabletProps {
  children: React.ReactNode
}

export function Tablet({ children }: TabletProps) {
  return (
    <Responsive showOnMobile={false} showOnDesktop={false}>
      {children}
    </Responsive>
  )
}

interface DesktopProps {
  children: React.ReactNode
}

export function Desktop({ children }: DesktopProps) {
  return (
    <Responsive showOnMobile={false} showOnTablet={false}>
      {children}
    </Responsive>
  )
}

interface OnlyAboveProps {
  children: React.ReactNode
  breakpoint: keyof typeof breakpointQueries
}

export function OnlyAbove({ children, breakpoint }: OnlyAboveProps) {
  return (
    <Responsive breakpoint={breakpoint} above={true}>
      {children}
    </Responsive>
  )
}

interface OnlyBelowProps {
  children: React.ReactNode
  breakpoint: keyof typeof breakpointQueries
}

export function OnlyBelow({ children, breakpoint }: OnlyBelowProps) {
  return (
    <Responsive breakpoint={breakpoint} above={false}>
      {children}
    </Responsive>
  )
}

interface ResponsiveVisibilityProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to render
   */
  children: React.ReactNode
  /**
   * Hide on "xs" screens (below sm breakpoint)
   */
  hideOnXs?: boolean
  /**
   * Hide on "sm" screens
   */
  hideOnSm?: boolean
  /**
   * Hide on "md" screens
   */
  hideOnMd?: boolean
  /**
   * Hide on "lg" screens
   */
  hideOnLg?: boolean
  /**
   * Hide on "xl" screens
   */
  hideOnXl?: boolean
  /**
   * Hide on "2xl" screens
   */
  hideOn2xl?: boolean
  /**
   * Only show on "xs" screens (below sm breakpoint)
   */
  onlyXs?: boolean
  /**
   * Only show on "sm" screens
   */
  onlySm?: boolean
  /**
   * Only show on "md" screens
   */
  onlyMd?: boolean
  /**
   * Only show on "lg" screens
   */
  onlyLg?: boolean
  /**
   * Only show on "xl" screens
   */
  onlyXl?: boolean
  /**
   * Only show on "2xl" screens
   */
  only2xl?: boolean
}

/**
 * Component that shows or hides content based on the current screen size
 * 
 * @example
 * ```tsx
 * // Hide on mobile, show on larger screens
 * <ResponsiveVisibility hideOnXs>
 *   <DesktopContent />
 * </ResponsiveVisibility>
 * 
 * // Only show on mobile
 * <ResponsiveVisibility onlyXs>
 *   <MobileContent />
 * </ResponsiveVisibility>
 * ```
 */
export function ResponsiveVisibility({
  children,
  hideOnXs,
  hideOnSm,
  hideOnMd,
  hideOnLg,
  hideOnXl,
  hideOn2xl,
  onlyXs,
  onlySm,
  onlyMd,
  onlyLg,
  onlyXl,
  only2xl,
  ...props
}: ResponsiveVisibilityProps) {
  const { breakpoint } = useBreakpoint()
  
  // Handle SSR
  if (typeof window === 'undefined') {
    return <div {...props}>{children}</div>
  }

  // Check if current breakpoint matches "only" conditions
  if (
    (onlyXs && breakpoint !== null) ||
    (onlySm && breakpoint !== 'sm') ||
    (onlyMd && breakpoint !== 'md') ||
    (onlyLg && breakpoint !== 'lg') ||
    (onlyXl && breakpoint !== 'xl') ||
    (only2xl && breakpoint !== '2xl')
  ) {
    return null
  }

  // Check if current breakpoint matches "hide" conditions
  if (
    (hideOnXs && breakpoint === null) ||
    (hideOnSm && breakpoint === 'sm') ||
    (hideOnMd && breakpoint === 'md') ||
    (hideOnLg && breakpoint === 'lg') ||
    (hideOnXl && breakpoint === 'xl') ||
    (hideOn2xl && breakpoint === '2xl')
  ) {
    return null
  }

  return <div {...props}>{children}</div>
} 