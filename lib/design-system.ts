/**
 * Design System Configuration - EduAsses
 * This file contains design tokens and configuration for the EduAsses Design System
 */

// Color System
export const colors = {
  // Primary palette
  navy: 'hsl(222.2, 47.4%, 11.2%)', // #0f172a
  slate: 'hsl(210, 40%, 96.1%)',    // #f1f5f9
  emerald: 'hsl(160, 66%, 44%)',    // #10b981
  
  // Functional colors
  success: 'hsl(142, 71%, 45%)',    // #22c55e
  warning: 'hsl(38, 92%, 50%)',     // #f59e0b
  danger: 'hsl(0, 84%, 60%)',       // #ef4444
  info: 'hsl(221, 83%, 53%)',       // #3b82f6
};

// Dark Mode Colors
export const darkModeColors = {
  // Primary palette
  navy: 'hsl(222.2, 47.4%, 11.2%)', // Background in dark mode
  slate: 'hsl(217.2, 32.6%, 20%)',
  emerald: 'hsl(160, 84%, 50%)',    // Adjusted for better contrast
  
  // Functional colors
  success: 'hsl(142, 76%, 50%)',    // Adjusted for better contrast
  warning: 'hsl(38, 95%, 55%)',
  danger: 'hsl(0, 84%, 65%)',
  info: 'hsl(221, 83%, 60%)',
};

// Typography Scale
export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSizes: {
    'display': '2.25rem',   // 36px
    'h1': '1.875rem',       // 30px
    'h2': '1.5rem',         // 24px
    'h3': '1.25rem',        // 20px
    'h4': '1.125rem',       // 18px
    'body': '1rem',         // 16px
    'small': '0.875rem',    // 14px
    'xs': '0.75rem',        // 12px
  },
  fontWeights: {
    'regular': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
  },
  lineHeights: {
    'tight': 1.2,
    'normal': 1.6,
    'relaxed': 1.8,
  }
};

// Spacing Scale
export const spacing = {
  '4xs': '0.25rem',  // 4px
  '3xs': '0.5rem',   // 8px
  '2xs': '0.75rem',  // 12px
  'xs': '1rem',      // 16px
  'sm': '1.5rem',    // 24px
  'md': '2rem',      // 32px
  'lg': '3rem',      // 48px
  'xl': '4rem',      // 64px
};

// Border Radius
export const borderRadius = {
  'none': '0',
  'sm': '0.25rem',  // 4px
  'md': '0.5rem',   // 8px
  'lg': '0.625rem', // 10px
  'full': '9999px',
};

// Shadows
export const shadows = {
  'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Z-index Scale
export const zIndices = {
  'hide': -1,
  'auto': 'auto',
  'base': 0,
  'dropdown': 1000,
  'sticky': 1100,
  'fixed': 1200,
  'overlay': 1300,
  'modal': 1400,
  'popover': 1500,
  'tooltip': 1600,
};

// Transition Presets
export const transitions = {
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'durations': {
    'fastest': '100ms',
    'fast': '200ms',
    'normal': '300ms',
    'slow': '500ms',
    'slowest': '700ms',
  }
}; 