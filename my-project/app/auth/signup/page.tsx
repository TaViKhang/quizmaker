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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-50 blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-50 blur-3xl opacity-50"></div>
      </div>
      
      <div className="w-full h-full md:h-auto md:max-w-6xl md:mx-auto md:my-8 relative z-10 flex items-center justify-center">
        <div className="w-full h-full md:h-auto flex flex-col lg:flex-row bg-white rounded-none md:rounded-3xl overflow-hidden shadow-xl">
          {/* Left column - details */}
          <div className="w-full lg:w-1/2 bg-gradient-to-b from-emerald-50 to-slate-100 lg:flex hidden relative">
            {/* Background image with frame container */}
            <div className="absolute inset-4 z-0 rounded-2xl overflow-hidden shadow-inner">
              <Image
                src="/assets/images/background-pattern.svg"
                alt="Background pattern"
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                className="opacity-20"
                priority
              />
            </div>
            
            <div className="flex flex-col h-full w-full p-6 md:p-8 relative z-10">
              {/* Content container with frame */}
              <div className="absolute inset-4 border border-slate-200/50 rounded-2xl pointer-events-none"></div>
              
              {/* Top section with logo */}
              <div className="animate-fadeIn mb-4">
                <h1 className="text-2xl font-bold text-slate-800 bg-gradient-to-r from-emerald-600 to-blue-600 text-transparent bg-clip-text">
                  EduAsses
                </h1>
                <p className="text-slate-600 mt-1">
                  Online Assessment System
                </p>
              </div>
              
              {/* Middle section with illustration */}
              <div className="flex-1 flex flex-col justify-center items-center py-2">
                {/* Main message */}
                <div className="animate-slideUp delay-100 max-w-md text-center mb-3">
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">
                    Create your account
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Join our online learning platform to create, manage, and participate in assessments with ease.
                  </p>
                </div>
                
                {/* Illustration with animation */}
                <div className="relative w-full h-48 mb-3 animate-floatUp delay-200">
                  <Image
                    src="/assets/images/students.svg"
                    alt="Students illustration"
                    fill
                    style={{ objectFit: "contain", objectPosition: "center" }}
                    className="drop-shadow-lg"
                    priority
                  />
                </div>
              </div>
              
              {/* Bottom section with feature highlights */}
              <div className="grid grid-cols-1 gap-3 animate-fadeIn delay-300 max-w-md mx-auto">
                <div className="flex items-start space-x-3 bg-white/70 p-3 rounded-xl shadow-sm hover:shadow transition-all duration-300 backdrop-blur-sm">
                  <div className="bg-emerald-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 1 0-16 0"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Simple account creation</h3>
                    <p className="text-slate-600 text-sm">Quick account setup with Google authentication</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 bg-white/70 p-3 rounded-xl shadow-sm hover:shadow transition-all duration-300 backdrop-blur-sm">
                  <div className="bg-blue-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M22 11v1a10 10 0 1 1-9-10"></path><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" x2="9" y1="9" y2="9"></line><line x1="15" x2="15" y1="9" y2="9"></line><path d="M16 5 A2 2 0 0 1 18 7 A2 2 0 0 1 16 9 A2 2 0 0 1 14 7 A2 2 0 0 1 16 5"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Verified identity</h3>
                    <p className="text-slate-600 text-sm">Ensure your educational account is properly verified</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 bg-white/70 p-3 rounded-xl shadow-sm hover:shadow transition-all duration-300 backdrop-blur-sm">
                  <div className="bg-purple-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">High security</h3>
                    <p className="text-slate-600 text-sm">Your data is protected with industry-standard encryption</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - sign up card */}
          <div className="w-full lg:w-1/2 p-6 md:p-8 flex items-center justify-center animate-fadeSlideIn">
            <div className="w-full max-w-md">
              <Card className="border-0 shadow-none">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-xl font-bold">Create an account</CardTitle>
                  <CardDescription>
                    Accounts will be automatically created when you sign in with Google
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <Button className="w-full py-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm" asChild>
                    <Link href="/auth/signin">
                      <Image 
                        src="/assets/icons/google.svg" 
                        alt="Google" 
                        width={20} 
                        height={20} 
                        className="mr-2"
                      />
                      <span>Continue with Google</span>
                    </Link>
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <Link 
                    href="/auth/signin" 
                    className="text-slate-600 hover:text-emerald-600 transition-colors"
                  >
                    Already have an account? Sign in
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 