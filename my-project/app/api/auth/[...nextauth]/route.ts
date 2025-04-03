import NextAuth, { AuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import GoogleProvider from "next-auth/providers/google"
import { Role } from "@prisma/client"

// Domain email được ủy quyền cao hơn
const AUTHORIZED_ADMIN_EMAILS = ['admin@example.com']
const AUTHORIZED_TEACHER_DOMAINS = ['school.edu', 'university.edu', 'teacher.org']

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      // Nếu có user mới đăng nhập, cập nhật token từ database
      if (user) {
        token.role = user.role
        token.id = user.id
      } else if (token.sub) {
        // Nếu token đã tồn tại, lấy thông tin mới nhất từ database
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
          })
          
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser.id
            token.name = dbUser.name
            token.email = dbUser.email
            token.picture = dbUser.image
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error)
        }
      }

      // Nếu trigger là update, kiểm tra có cần cập nhật token không
      if (trigger === 'update' && token?.sub) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
          })
          
          if (dbUser) {
            token.role = dbUser.role // Cập nhật role mới
          }
        } catch (error) {
          console.error("Error updating token:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = token.role as Role
        session.user.id = token.id as string
      }
      return session
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
            // Xác định role dựa trên email
            let role = Role.STUDENT // Mặc định là student
            
            // Kiểm tra nếu là admin
            if (AUTHORIZED_ADMIN_EMAILS.includes(user.email)) {
              role = Role.ADMIN
            } 
            // Kiểm tra nếu là giáo viên (domain)
            else if (AUTHORIZED_TEACHER_DOMAINS.some(domain => 
              user.email?.toLowerCase().endsWith(`@${domain}`))) {
              role = Role.TEACHER
            }
            
            // Tạo user mới với role phù hợp
            await db.user.create({
              data: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role,
              },
            })
          }
          
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
    error: '/auth/error',
    newUser: '/auth/signin' // Điều hướng người dùng mới đến trang signin
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
