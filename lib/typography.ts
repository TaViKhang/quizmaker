/**
 * Typography classes following the EduAsses Design System
 * with responsive sizes for different breakpoints
 */
export const typography = {
  /**
   * Display typography - largest text for hero sections
   * 36px on mobile, scaling up to 48px on larger screens
   */
  display: "text-4xl font-bold md:text-5xl lg:text-6xl tracking-tight",
  
  /**
   * H1 heading - Page titles
   * 30px on mobile, scaling to 36px
   */
  h1: "text-3xl font-bold md:text-4xl tracking-tight",
  
  /**
   * H2 heading - Section titles
   * 24px on mobile, scaling to 30px
   */
  h2: "text-2xl font-semibold md:text-3xl tracking-tight",
  
  /**
   * H3 heading - Subsection titles
   * 20px on mobile, scaling to 24px
   */
  h3: "text-xl font-semibold md:text-2xl",
  
  /**
   * H4 heading - Card titles, smaller section headings
   * 18px on mobile, scaling to 20px
   */
  h4: "text-lg font-medium md:text-xl",
  
  /**
   * Lead paragraph - Introductory text with larger size
   */
  lead: "text-xl text-muted-foreground",
  
  /**
   * Body text - Main content text
   * 16px (default)
   */
  body: "text-base",
  
  /**
   * Small text - Secondary information, metadata
   * 14px
   */
  small: "text-sm font-medium leading-none",
  
  /**
   * Muted text - De-emphasized text
   */
  muted: "text-sm text-muted-foreground",
  
  /**
   * Extra small text - Fine print, footnotes
   * 12px
   */
  xsmall: "text-xs",

  /**
   * Subtle text - Lower emphasis but still readable
   */
  subtle: "text-muted-foreground",
} as const

export type TypographyVariant = keyof typeof typography 