/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: "2rem",
  		screens: {
  			"2xl": "1400px",
  		},
  	},
  	extend: {
  		fontFamily: {
  			sans: ["var(--font-sans)"],
  			mono: ["var(--font-mono)"],
  		},
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],   // 36px
        'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],    // 24px
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],   // 20px
        'h4': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],  // 18px
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],    // 16px
        'small': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }], // 14px
        'xs': ['0.75rem', { lineHeight: '1.6', fontWeight: '400' }],   // 12px
      },
  		borderRadius: {
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius)',
  			sm: 'var(--radius-sm)',
  			full: 'var(--radius-full)',
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))',
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))',
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))',
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))',
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))',
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))',
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))',
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))',
  			},
  		},
  		spacing: {
  			'4xs': '0.25rem', // 4px
  			'3xs': '0.5rem',  // 8px
  			'2xs': '0.75rem', // 12px
  			'xs': '1rem',     // 16px
  			'sm': '1.5rem',   // 24px
  			'md': '2rem',     // 32px
  			'lg': '3rem',     // 48px
  			'xl': '4rem',     // 64px
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			fadeIn: {
  				from: { opacity: '0' },
  				to: { opacity: '1' },
  			},
  			slideUp: {
  				from: { opacity: '0', transform: 'translateY(20px)' },
  				to: { opacity: '1', transform: 'translateY(0)' },
  			},
  			slideRight: {
  				from: { opacity: '0', transform: 'translateX(-20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' },
  			},
  			fadeSlideIn: {
  				from: { opacity: '0', transform: 'translateX(20px)' },
  				to: { opacity: '1', transform: 'translateX(0)' },
  			},
  			'pulse-slow': {
  				'0%, 100%': { opacity: '0.5' },
  				'50%': { opacity: '0.7' },
  			},
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fadeIn': 'fadeIn 1s ease forwards',
  			'slideUp': 'slideUp 1s ease forwards',
  			'slideRight': 'slideRight 0.8s ease-out forwards',
  			'fadeSlideIn': 'fadeSlideIn 1s ease forwards',
  			'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

