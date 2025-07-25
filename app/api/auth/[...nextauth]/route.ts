import NextAuth, { AuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import GoogleProvider from "next-auth/providers/google"
import { ROLES, RoleType } from "@/lib/constants"

// Domain email được ủy quyền cao hơn
const AUTHORIZED_TEACHER_DOMAINS = ['school.edu', 'university.edu', 'teacher.org']

// Fix cho type adapter
const prismaAdapter = PrismaAdapter(db) as any

// Cải thiện error handling
const handleAuthError = (error: any, context: string) => {
  console.error(`[Auth Error] ${context}:`, error);
  return false;
}

export const authOptions: AuthOptions = {
  adapter: prismaAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 4 * 60 * 60, // 4 hours
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      try {
        // Trường hợp đăng nhập - Chỉ cập nhật token khi có user từ đăng nhập
        if (user) {
          // Đảm bảo role có thể null
          token.role = user.role as RoleType | null;
          token.id = user.id;
          return token;
        }
        
        // Trường hợp trigger update - Cập nhật token khi có sự thay đổi rõ ràng
        if (trigger === 'update' && token?.sub) {
          try {
            const dbUser = await db.user.findUnique({
              where: { id: token.sub },
              select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                image: true 
              }
            });
            
            if (dbUser) {
              // Cập nhật token với giá trị mới
              token.role = dbUser.role as RoleType | null;
              token.name = dbUser.name;
              token.email = dbUser.email;
              token.picture = dbUser.image;
              
              // Thêm timestamp để đảm bảo không cache token cũ
              token.updatedAt = Date.now();
            }
          } catch (error) {
            console.error("Error updating token:", error);
          }
          return token;
        }
        
        // Trường hợp token từ session: kiểm tra nếu cần cập nhật
        if (token?.sub && (!token.role || !token.updatedAt || Date.now() - (token.updatedAt as number || 0) > 60 * 1000)) {
          try {
            const dbUser = await db.user.findUnique({
              where: { id: token.sub },
              select: { role: true }
            });
            
            if (dbUser) {
              token.role = dbUser.role as RoleType | null;
              token.updatedAt = Date.now();
            }
          } catch (error) {
            console.error("Error refreshing token:", error);
          }
        }
        
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          // Đảm bảo role có thể null
          session.user.role = token.role as RoleType | null;
          session.user.id = token.id as string;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
    async signIn({ user, account, profile }) {
      // Nếu user có email
      if (user?.email) {
        try {
          // Kiểm tra user đã tồn tại chưa
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          })
          
          if (!existingUser) {
            // Tạo user mới không có role (null) để người dùng chọn sau
            await db.user.create({
              data: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: null, // Không thiết lập role mặc định
              },
            })
            
            // Đánh dấu để redirect tới trang chọn role
            return true
          }
          
          return true
        } catch (error) {
          return handleAuthError(error, "signIn callback");
        }
      }
      
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
    error: '/auth/error',
    newUser: '/auth/select-role' // Điều hướng người dùng mới đến trang chọn role
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, ...message) {
      console.error(`[NextAuth Error] ${code}:`, ...message);
    },
    warn(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[NextAuth Warning] ${code}:`, ...message);
      }
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`[NextAuth Debug] ${code}:`, ...message);
      }
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
