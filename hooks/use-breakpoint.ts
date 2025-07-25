'use client'

import { useState, useEffect } from 'react'

// Breakpoint values matching Tailwind CSS defaults
export const breakpointValues = {
  sm: 640,   // Small screens (mobile)
  md: 768,   // Medium screens (tablet/small laptop)
  lg: 1024,  // Large screens (laptop)
  xl: 1280,  // Extra large screens (desktop)
  '2xl': 1536, // 2X extra large screens (large desktop)
}

// Media query strings to use directly with window.matchMedia
export const breakpointQueries = {
  sm: `(min-width: ${breakpointValues.sm}px)`,
  md: `(min-width: ${breakpointValues.md}px)`,
  lg: `(min-width: ${breakpointValues.lg}px)`,
  xl: `(min-width: ${breakpointValues.xl}px)`,
  '2xl': `(min-width: ${breakpointValues['2xl']}px)`,
  // Additional useful queries
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',
  hover: '(hover: hover)',
  touchscreen: '(hover: none) and (pointer: coarse)',
}

type BreakpointKey = keyof typeof breakpointValues
type MediaQueryKey = keyof typeof breakpointQueries

/**
 * Hook for responsive design that listens to viewport size changes
 * @param query - Media query string or key from breakpointQueries
 * @returns Boolean indicating if the query matches
 */
export function useMediaQuery(query: string | MediaQueryKey): boolean {
  // In SSR, always return false initially
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Resolve the query string
    const queryString = typeof query === 'string' && query in breakpointQueries 
      ? breakpointQueries[query as MediaQueryKey] 
      : query
      
    // Create media query
    const mediaQuery = window.matchMedia(queryString)
    
    // Set initial value
    setMatches(mediaQuery.matches)
    
    // Handler function
    const handleResize = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Add event listener
    mediaQuery.addEventListener('change', handleResize)
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleResize)
    }
  }, [query])
  
  return matches
}

/**
 * Hook for getting the current breakpoint values based on viewport size
 * @returns Object with boolean values for each breakpoint and up
 */
export function useBreakpoint() {
  const isSm = useMediaQuery('sm')
  const isMd = useMediaQuery('md')
  const isLg = useMediaQuery('lg')
  const isXl = useMediaQuery('xl')
  const is2Xl = useMediaQuery('2xl')
  
  // Determine current exact breakpoint
  const exact =
    is2Xl ? '2xl' :
    isXl ? 'xl' :
    isLg ? 'lg' :
    isMd ? 'md' :
    isSm ? 'sm' :
    'xs' // Below sm
  
  return {
    // Current exact breakpoint
    exact,
    // Individual breakpoint flags (true if screen is at least this size)
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    // Helpers for semantic usage
    isMobile: !isMd,      // < md (below 768px)
    isTablet: isMd && !isLg,  // >= md && < lg
    isDesktop: isLg,      // >= lg (1024px+)
    isLargeDesktop: isXl, // >= xl (1280px+)
  }
}