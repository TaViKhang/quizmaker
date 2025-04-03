"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export function SignInForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loginWithGoogle("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred while logging in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div 
      initial="hidden"
      animate={mounted ? "visible" : "hidden"}
      variants={containerVariants}
      className="flex flex-col space-y-5 bg-white p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md"
    >
      <motion.div 
        variants={itemVariants}
        className="flex flex-col space-y-1 text-center"
      >
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 text-transparent bg-clip-text">EduAsses</h1>
        <p className="text-slate-500 font-medium text-sm">Online Assessment System</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive" className="border-red-200 bg-red-50 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          className="w-full flex items-center justify-between border-2 rounded-xl py-5 px-4 transition-all duration-300 hover:border-emerald-500 hover:shadow-md hover:scale-[1.02] bg-white text-slate-700 hover:text-emerald-700 font-medium"
          onClick={handleGoogleLogin}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <div className="h-4 w-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mr-2"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              <FcGoogle className="mr-2 h-5 w-5" />
              <span className="flex-grow text-center">Sign in with Google</span>
              <ArrowRight className="ml-auto h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="mt-2 text-center"
      >
        <p className="text-slate-500 text-sm pb-2">
          The system only supports Google login
        </p>
        <div className="text-xs text-slate-400 transition-colors duration-300 hover:text-slate-500">
          By logging in, you agree to our{" "}
          <Link href="/terms" className="text-emerald-600 underline underline-offset-4 hover:text-emerald-700 transition-colors duration-200">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-emerald-600 underline underline-offset-4 hover:text-emerald-700 transition-colors duration-200">
            Privacy Policy
          </Link>.
        </div>
      </motion.div>
    </motion.div>
  );
} 