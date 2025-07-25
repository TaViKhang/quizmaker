import { Inter, Roboto_Mono } from 'next/font/google'

// Setup for Inter - primary font
const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  // Disable preloading to prevent abort errors
  preload: false,
  adjustFontFallback: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif"
  ]
})

// Setup for Roboto Mono - monospace font
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
  // Disable preloading to prevent abort errors
  preload: false,
  adjustFontFallback: true,
  fallback: [
    "Consolas",
    "Monaco",
    "Lucida Console",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "Bitstream Vera Sans Mono",
    "Courier New",
    "monospace"
  ]
})

// Export both fonts
export { interFont, robotoMono } 