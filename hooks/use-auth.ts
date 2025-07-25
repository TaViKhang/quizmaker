"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { RoleType } from "@/lib/constants";

export function useAuth() {
  const { data: session, status, update } = useSession();
  
  const user = session?.user;
  const isLoading = status === "loading";
  
  const hasRole = (role: Role | Role[]) => {
    if (!user || user.role === null) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role as Role);
    }
    
    return user.role === role;
  };
  
  const isTeacher = user?.role === Role.TEACHER;
  const isStudent = user?.role === Role.STUDENT;
  
  const isAuthenticated = status === "authenticated";
  
  // Add Google login function
  const loginWithGoogle = async (callbackUrl = "/dashboard") => {
    return await signIn("google", { callbackUrl });
  };
  
  // Add logout function
  const logout = async (callbackUrl = "/") => {
    return await signOut({ callbackUrl });
  };
  
  // Add function to update session after role change
  const refreshSession = async () => {
    await update();
  };
  
  return {
    user,
    status,
    isLoading,
    hasRole,
    isTeacher,
    isStudent,
    isAuthenticated,
    refreshSession,
    loginWithGoogle,
    logout
  };
} 