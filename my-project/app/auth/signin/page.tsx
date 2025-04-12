import { Metadata } from "next"
import Image from "next/image"
import { SignInForm } from "@/components/auth/signin-form"

export const metadata: Metadata = {
  title: "Sign in | EduAsses",
  description: "Sign in to access the online testing system"
}

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-50 blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-50 blur-3xl opacity-50"></div>
      </div>
      
      <div className="w-full h-full md:h-auto md:max-w-6xl md:mx-auto md:my-8 relative z-10 flex items-center justify-center">
        <div className="w-full h-full md:h-auto flex flex-col lg:flex-row bg-white rounded-none md:rounded-3xl overflow-hidden shadow-xl">
          {/* Left column - details about the system */}
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
                    Welcome to the online testing system
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    The platform helps teachers create exams and conduct tests online easily, 
                    while helping students take tests and review results.
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m14.5 9-5 5"></path><path d="m9.5 9 5 5"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Secure authentication</h3>
                    <p className="text-slate-600 text-sm">Quick and secure authentication with Google</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 bg-white/70 p-3 rounded-xl shadow-sm hover:shadow transition-all duration-300 backdrop-blur-sm">
                  <div className="bg-blue-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Data security</h3>
                    <p className="text-slate-600 text-sm">Your data is securely encrypted and protected</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 bg-white/70 p-3 rounded-xl shadow-sm hover:shadow transition-all duration-300 backdrop-blur-sm">
                  <div className="bg-purple-100 p-2 rounded-full hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><rect width="8" height="18" x="4" y="3" rx="1"></rect><rect width="8" height="18" x="12" y="3" rx="1"></rect></svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Multiple question types</h3>
                    <p className="text-slate-600 text-sm">Supporting various question formats for assessment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - sign in form */}
          <div className="w-full lg:w-1/2 p-6 md:p-8 flex items-center justify-center animate-fadeSlideIn">
            <div className="w-full max-w-md">
              <SignInForm />
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-800 text-sm flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span>
                    First time users will be asked to select a role (Student or Teacher) 
                    after signing in. Your role determines which features you can access.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 