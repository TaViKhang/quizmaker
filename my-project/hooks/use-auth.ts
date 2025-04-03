"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export function useAuth() {
  const { data: session, status, update } = useSession();
  
  const user = session?.user;
  
  const hasRole = (role: Role | Role[]) => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role as Role);
    }
    
    return user.role === role;
  };
  
  const isAdmin = user?.role === Role.ADMIN;
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
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    isAuthenticated,
    refreshSession,
    loginWithGoogle,
    logout
  };
} 