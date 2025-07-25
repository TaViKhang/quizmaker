import { RoleType } from "@/lib/constants";
import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: RoleType;
    } & DefaultSession["user"];
  }

  interface User {
    role: RoleType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RoleType;
  }
} 