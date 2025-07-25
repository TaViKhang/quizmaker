import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { AccessibleToaster } from "@/components/ui/accessible-toaster";
import { SessionProvider } from "@/components/auth/session-provider";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from '@/components/providers';
import "./globals.css";

// Import fonts from app/fonts.ts
import { interFont, robotoMono } from "./fonts";

// Metadata for the site
export const metadata: Metadata = {
  title: {
    template: '%s | OnTest',
    default: 'OnTest - Online Assessment Platform',
  },
  description: "Educational assessment platform for tests and quizzes",
  keywords: [
    "education", 
    "assessment", 
    "quiz", 
    "test", 
    "exam", 
    "learning", 
    "online education"
  ],
  authors: [
    {
      name: "OnTest Team",
    },
  ],
};

// Viewport configuration for responsive design
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  viewportFit: "cover",
  // Highlight mobile taps
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#020817" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={cn(
        interFont.variable, 
        robotoMono.variable
      )}
    >
      <body 
        className={cn(
        "min-h-screen bg-background font-sans antialiased",
          // Better mobile tap highlights
        "selection:bg-primary selection:text-primary-foreground",
        // Better text rendering
        "text-foreground subpixel-antialiased"
        )}
      >
        <SessionProvider>
        <Providers>
              <ThemeProvider>
                {/* Skip to content link for accessibility */}
                <a 
                  href="#main-content" 
                  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
                >
                  Skip to content
                </a>
                
                {/* Main content wrapper with min height to push footer down */}
                <div id="main-content" className="relative flex min-h-screen flex-col">
                  <NuqsAdapter>
                    {children}
                  </NuqsAdapter>
                </div>

                {/* Accessible toast notifications */}
                <AccessibleToaster />
              </ThemeProvider>
          </Providers>
            </SessionProvider>
      </body>
    </html>
  );
}
