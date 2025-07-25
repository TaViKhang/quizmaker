"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/theme/mode-toggle";

interface AuthLayoutProps {
  /**
   * Main content (login/signup form)
   */
  children: React.ReactNode;
  /**
   * Title shown in the left panel
   * @default "Welcome to OnTest"
   */
  title?: string;
  /**
   * Description shown in the left panel
   * @default "The online assessment platform for education"
   */
  description?: string;
  /**
   * Background image for the left panel
   * @default "/assets/images/background-pattern.svg"
   */
  backgroundImage?: string;
  /**
   * Logo element (optional)
   */
  logo?: React.ReactNode;
  /**
   * Footer content (optional)
   */
  footer?: React.ReactNode;
  /**
   * Whether to show theme toggle
   * @default true
   */
  showThemeToggle?: boolean;
  /**
   * Show visual decorations (particles, gradient)
   * @default true
   */
  showDecorations?: boolean;
  /**
   * Show backlink to home page
   * @default true
   */
  showBackToHome?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Authentication layout for login, signup, and similar pages
 * Features a split screen design with decorative elements on the left
 */
export function AuthLayout({
  children,
  title = "Welcome to OnTest",
  description = "The online assessment platform for education",
  backgroundImage = "/assets/images/background-pattern.svg",
  logo,
  footer,
  showThemeToggle = true,
  showDecorations = true,
  showBackToHome = true,
  className,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - Branding area */}
      <div className="relative hidden w-full bg-primary text-primary-foreground md:flex md:w-1/2 md:flex-col">
        {/* Background image and decorations */}
        {backgroundImage && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={backgroundImage}
              alt="Background pattern"
              fill
              quality={90}
              priority
              className="object-cover opacity-10"
            />
          </div>
        )}
        
        {/* Decorative elements */}
        {showDecorations && (
          <>
            <div className="absolute top-1/3 right-0 h-64 w-64 translate-x-1/2 rounded-full bg-accent/30 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 rounded-full bg-accent/20 blur-3xl"></div>
          </>
        )}

        {/* Content container */}
        <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-12">
          {/* Top section with logo */}
          <div>
            {logo || (
              <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-primary-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-foreground text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <span>OnTest</span>
              </Link>
            )}
          </div>
          
          {/* Middle section */}
          <div className="my-auto max-w-md">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-primary-foreground">
              {title}
            </h1>
            <p className="text-xl text-primary-foreground/80">
              {description}
            </p>
            
            {/* Feature list */}
            <div className="mt-10 space-y-4">
              <FeatureItem icon="✓" title="Create versatile assessments">
                Build quizzes with multiple question types and scoring options
              </FeatureItem>
              <FeatureItem icon="✓" title="Real-time results and analytics">
                Get instant feedback and detailed performance analysis
              </FeatureItem>
              <FeatureItem icon="✓" title="Secure testing environment">
                Ensure academic integrity with our secure platform
              </FeatureItem>
            </div>
          </div>
          
          {/* Bottom section with additional content */}
          <div className="mt-auto">
            {footer ? (
              footer
            ) : (
              <p className="text-sm text-primary-foreground/70">
                &copy; {new Date().getFullYear()} OnTest. All rights reserved.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div 
        className={cn(
          "flex w-full flex-col bg-background md:w-1/2",
          className
        )}
      >
        {/* Header actions */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-2">
            {/* Logo on mobile */}
            <Link href="/" className="md:hidden inline-flex items-center gap-2 text-lg font-bold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <span>OnTest</span>
            </Link>
            
            {/* Back to home */}
            {showBackToHome && (
              <Link 
                href="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                ← Back to home
              </Link>
            )}
          </div>
          
          {/* Theme toggle */}
          {showThemeToggle && <ModeToggle />}
        </div>
        
        {/* Form container */}
        <div className="flex flex-1 items-center justify-center p-4 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

// Helper component for feature items
function FeatureItem({ 
  icon, 
  title, 
  children 
}: { 
  icon: string; 
  title: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <span className="text-xs font-bold">{icon}</span>
      </div>
      <div>
        <h3 className="font-medium text-primary-foreground">{title}</h3>
        <p className="text-sm text-primary-foreground/70">{children}</p>
      </div>
    </div>
  );
} 