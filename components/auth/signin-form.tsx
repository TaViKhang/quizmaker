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
      className="flex flex-col space-y-6 max-w-md w-full mx-auto"
    >
      <motion.div 
        variants={itemVariants}
        className="flex flex-col space-y-2 text-center"
      >
        <h1 className="text-2xl font-bold tracking-tight">Sign in to EduAsses</h1>
        <p className="text-muted-foreground">Access the online assessment platform</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="space-y-4">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 h-11 px-4 py-2 border border-input rounded-lg"
          onClick={handleGoogleLogin}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin mr-2"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              <FcGoogle className="h-5 w-5" />
              <span>Sign in with Google</span>
            </>
          )}
        </Button>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground">
          The system only supports Google login
        </p>
        <div className="mt-4 text-xs text-muted-foreground">
          By logging in, you agree to our{" "}
          <Link href="/terms" className="text-primary underline hover:text-primary/90">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary underline hover:text-primary/90">
            Privacy Policy
          </Link>.
        </div>
      </motion.div>
    </motion.div>
  );
} 