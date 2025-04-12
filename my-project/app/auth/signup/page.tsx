import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Sign up | EduAsses",
  description: "Create a new account to manage online testing"
}

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-50 blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-50 blur-3xl opacity-50 animate-pulse-slow-reverse"></div>
        <div className="absolute top-[30%] left-[15%] w-[200px] h-[200px] rounded-full bg-purple-50 blur-3xl opacity-30 animate-float-slow"></div>
      </div>
      
      <div className="w-full h-full md:h-auto max-w-7xl mx-auto my-8 px-4 relative z-10 flex items-center justify-center">
        <Card className="w-full border-0 overflow-hidden bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl">
          <div className="flex flex-col lg:flex-row">
            {/* Left column - Illustration and info */}
            <div className="relative w-full lg:w-1/2 p-6 md:p-10 flex flex-col bg-gradient-to-br from-emerald-500 to-blue-600 text-white overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Logo and branding */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-white flex items-center">
                    <span className="inline-block mr-2 bg-white text-emerald-500 p-1.5 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </span>
                    EduAsses
                  </h1>
                  <p className="text-white/80 mt-2 text-lg">
                    Online Assessment System
                  </p>
                </div>
                
                {/* Main message with animation */}
                <div className="animate-fadeIn max-w-lg mb-6">
                  <h2 className="text-2xl font-semibold mb-3">
                    Join our academic community
                  </h2>
                  <p className="text-white/90 text-lg leading-relaxed">
                    Create, manage, and participate in online assessments with our intuitive platform designed specifically for educational purposes.
                  </p>
                </div>
                
                {/* Features with animated icons */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="flex items-center space-x-4 animate-fadeSlideRight delay-100">
                    <div className="flex-shrink-0 bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="2" x2="9" y2="4"></line><line x1="15" y1="2" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="22"></line><line x1="15" y1="20" x2="15" y2="22"></line><line x1="20" y1="9" x2="22" y2="9"></line><line x1="20" y1="14" x2="22" y2="14"></line><line x1="2" y1="9" x2="4" y2="9"></line><line x1="2" y1="14" x2="4" y2="14"></line></svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Comprehensive Tests</h3>
                      <p className="text-white/80">Support for multiple question types and testing formats</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 animate-fadeSlideRight delay-200">
                    <div className="flex-shrink-0 bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Detailed Analytics</h3>
                      <p className="text-white/80">Track progress and performance with intuitive dashboards</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 animate-fadeSlideRight delay-300">
                    <div className="flex-shrink-0 bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Secure Platform</h3>
                      <p className="text-white/80">Enterprise-grade security for all your academic data</p>
                    </div>
                  </div>
                </div>
                
                {/* Social proof */}
                <div className="mt-8 bg-white/10 p-4 rounded-xl backdrop-blur-sm animate-fadeIn delay-500">
                  <p className="text-white/90 font-medium italic">
                    "EduAsses has transformed how we conduct assessments at our university. The platform is intuitive and saves our faculty hours of work."
                  </p>
                  <div className="mt-2 flex items-center">
                    <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Prof. Sarah Johnson</p>
                      <p className="text-white/70 text-sm">Education Technology Director</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Sign up form simplified */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 flex items-center justify-center bg-slate-50/30">
              <div className="w-full max-w-md">
                <div className="space-y-8 text-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Create an account
                    </h2>
                    <p className="text-slate-600 mt-2">
                      Accounts will be automatically created when you sign in with Google
                    </p>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full py-6 relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    asChild
                  >
                    <Link href="/auth/signin" className="flex items-center justify-center">
                      <div className="flex items-center justify-center">
                        <div className="bg-white rounded-full p-1 mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <span className="font-medium text-base">Continue with Google</span>
                      </div>
                    </Link>
                  </Button>
                  
                  {/* Information note */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-800 text-sm flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      <span>Your Google account will be used to identify you on the platform. We do not share your information with third parties.</span>
                    </p>
                  </div>
                  
                  <div>
                    <Link 
                      href="/auth/signin" 
                      className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors inline-flex items-center"
                    >
                      <span>Already have an account? Sign in</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 