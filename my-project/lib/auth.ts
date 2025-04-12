import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@prisma/client";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  
  return session?.user;
}

export async function isAuthenticated() {
  const session = await getSession();
  
  return !!session?.user;
}

export async function hasRole(role: Role) {
  const user = await getCurrentUser();
  
  return user?.role === role;
}

export async function isTeacher() {
  const user = await getCurrentUser();
  
  return user?.role === Role.TEACHER;
}

export async function isStudent() {
  return hasRole(Role.STUDENT);
} 