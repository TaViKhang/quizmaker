import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import { cache } from "react";

// Re-export authOptions from here to fix import issue
export { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Cache getSession để không truy vấn nhiều lần trong cùng một request
export const getSession = cache(async () => {
  return await getServerSession(authOptions);
});

// Cache getCurrentUser để tối ưu hiệu suất
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user;
});

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
  const user = await getCurrentUser();
  return user?.role === Role.STUDENT;
} 