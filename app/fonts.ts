import { Inter, Roboto_Mono } from "next/font/google";

/**
 * Inter - Main font for content
 * Modern, clear, readable sans-serif font
 */
export const interFont = Inter({
  // Only load necessary font weights for performance
  weight: ["300", "400", "500", "600", "700"],
  // Only load necessary subsets
  subsets: ["latin"],
  // Convert to CSS variable for use throughout the app
  variable: "--font-sans",
  // Show fallback font while main font is loading
  display: "swap",
});

/**
 * Roboto Mono - Font for code blocks
 * Monospace font with good readability
 */
export const robotoMono = Roboto_Mono({
  // Only load necessary font weights
  weight: ["400", "500", "700"],
  // Only load necessary subsets
  subsets: ["latin"],
  // Convert to CSS variable for use
  variable: "--font-mono",
  // Show fallback font while main font is loading
  display: "swap",
});

// For backward compatibility
export const geistSans = interFont;
export const geistMono = robotoMono;