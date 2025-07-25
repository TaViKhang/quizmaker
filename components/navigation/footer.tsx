import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Github, 
  Mail, 
  MessageSquare, 
  CreditCard,
  Phone,
  HelpCircle
} from "lucide-react";

interface FooterProps {
  /**
   * Style variant for the footer
   * @default "default"
   */
  variant?: "default" | "simple" | "minimal";
  /**
   * Background style for the footer
   * @default "default"
   */
  background?: "default" | "primary" | "secondary" | "accent" | "muted";
  /**
   * Whether to include the navigation menu
   * @default true
   */
  includeNav?: boolean;
  /**
   * Whether to include social links
   * @default true 
   */
  includeSocial?: boolean;
  /**
   * Whether to include the sign up form
   * @default false
   */
  includeSignUp?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Application footer component with different variants
 */
export function Footer({
  variant = "default",
  background = "default",
  includeNav = true,
  includeSocial = true,
  includeSignUp = false,
  className,
}: FooterProps) {
  // Background colors based on variant
  const backgrounds = {
    default: "bg-background border-t",
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  
  // Simplified version - minimal footer
  if (variant === "minimal") {
    return (
      <footer className={cn(
        "py-4",
        backgrounds[background],
        className
      )}>
        <div className="container flex items-center justify-between">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} EduAsses. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    );
  }
  
  // Simple footer with more links but still compact
  if (variant === "simple") {
    return (
      <footer className={cn(
        "py-6",
        backgrounds[background],
        className
      )}>
        <div className="container">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <div>
              <Link href="/" className="eduasses-logo inline-flex items-center gap-2">
                <span className="font-bold">EduAsses</span>
              </Link>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Educational assessment platform for tests and quizzes, helping educators create and manage examinations efficiently.
              </p>
            </div>
            
            {includeNav && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Platform</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/features" className="hover:underline">Features</Link></li>
                    <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                    <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Company</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/about" className="hover:underline">About us</Link></li>
                    <li><Link href="/contact" className="hover:underline">Contact</Link></li>
                    <li><Link href="/blog" className="hover:underline">Blog</Link></li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Legal</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/terms" className="hover:underline">Terms</Link></li>
                    <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
                    <li><Link href="/cookies" className="hover:underline">Cookies</Link></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex flex-col md:flex-row justify-between items-center pt-4 border-t">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} EduAsses. All rights reserved.
            </p>
            
            {includeSocial && (
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <Link href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">
                  <Github className="h-5 w-5" />
                </Link>
                <Link href="#" aria-label="Email" className="text-muted-foreground hover:text-foreground">
                  <Mail className="h-5 w-5" />
                </Link>
                <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }
  
  // Full-featured footer (default)
  return (
    <footer className={cn(
      "py-12",
      backgrounds[background],
      className
    )}>
      <div className="container">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column with logo and company info */}
          <div className="space-y-4">
            <Link href="/" className="eduasses-logo inline-flex items-center gap-2">
              <span className="font-bold text-lg">EduAsses</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Educational assessment platform for tests and quizzes, helping educators create and manage examinations efficiently while providing students with a smooth testing experience.
            </p>
            
            {includeSocial && (
              <div className="flex items-center gap-4 mt-6">
                <Link href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">
                  <Github className="h-5 w-5" />
                </Link>
                <Link href="#" aria-label="Email" className="text-muted-foreground hover:text-foreground">
                  <Mail className="h-5 w-5" />
                </Link>
                <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
          
          {/* Middle navigation columns */}
          {includeNav && (
            <div className="col-span-1 lg:col-span-1">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-medium">Platform</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/features" className="hover:underline">Features</Link></li>
                    <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                    <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
                    <li><Link href="/docs" className="hover:underline">Documentation</Link></li>
                    <li><Link href="/status" className="hover:underline">System Status</Link></li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Company</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/about" className="hover:underline">About us</Link></li>
                    <li><Link href="/contact" className="hover:underline">Contact</Link></li>
                    <li><Link href="/blog" className="hover:underline">Blog</Link></li>
                    <li><Link href="/careers" className="hover:underline">Careers</Link></li>
                    <li><Link href="/legal" className="hover:underline">Legal</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Right column with contact or newsletter */}
          <div className="space-y-4">
            {includeSignUp ? (
              <>
                <h4 className="font-medium">Stay updated</h4>
                <p className="text-sm text-muted-foreground">
                  Subscribe to our newsletter for updates, tips, and educational content.
                </p>
                <form className="mt-4 flex gap-2">
                  <input 
                    type="email" 
                    placeholder="your@email.com" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                  <Button type="submit">Subscribe</Button>
                </form>
              </>
            ) : (
              <>
                <h4 className="font-medium">Contact us</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>support@eduasses.com</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>+1 (123) 456-7890</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>Our help center is available 24/7</span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EduAsses. All rights reserved.
            </p>
            
            <div className="flex gap-4 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground hover:underline">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-foreground hover:underline">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 