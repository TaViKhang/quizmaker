import NextAuth, { AuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import GoogleProvider from "next-auth/providers/google"
import { ROLES, RoleType } from "@/lib/constants"

// Domain email được ủy quyền cao hơn
const AUTHORIZED_TEACHER_DOMAINS = ['school.edu', 'university.edu', 'teacher.org']

// Fix cho type adapter
const prismaAdapter = PrismaAdapter(db) as any

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
      // Nếu có user mới đăng nhập, cập nhật token từ database
      if (user) {
        token.role = user.role as RoleType
        token.id = user.id
      } else if (token.sub) {
        // Nếu token đã tồn tại, lấy thông tin mới nhất từ database
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
          })
          
          if (dbUser) {
            token.role = dbUser.role as RoleType
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
            token.role = dbUser.role as RoleType // Cập nhật role mới
          }
        } catch (error) {
          console.error("Error updating token:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.role = token.role as RoleType
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
            // Xác định role mặc định là STUDENT
            let role: RoleType = ROLES.STUDENT
            
            // Kiểm tra nếu là giáo viên (domain)
            if (AUTHORIZED_TEACHER_DOMAINS.some(domain => 
              user.email?.toLowerCase().endsWith(`@${domain}`))) {
              role = ROLES.TEACHER
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
            
            // Đánh dấu để redirect tới trang chọn role
            return true
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
    newUser: '/auth/select-role' // Điều hướng người dùng mới đến trang chọn role
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
