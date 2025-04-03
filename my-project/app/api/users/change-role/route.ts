import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { Role } from "@prisma/client";

// Schema validation cho request
const changeRoleSchema = z.object({
  userId: z.string(),
  newRole: z.enum([Role.ADMIN, Role.TEACHER, Role.STUDENT])
});

export async function PATCH(req: Request) {
  try {
    // Kiểm tra session người dùng
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện chức năng này" }, 
        { status: 401 }
      );
    }

    // Chỉ admin mới có quyền thay đổi role
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện chức năng này" }, 
        { status: 403 }
      );
    }

    // Parse và validate dữ liệu từ request
    const body = await req.json();
    const validationResult = changeRoleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validationResult.error.flatten() }, 
        { status: 400 }
      );
    }

    const { userId, newRole } = validationResult.data;

    // Kiểm tra người dùng tồn tại
    const targetUser = await db.user.findUnique({
      where: {
        id: userId,
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" }, 
        { status: 404 }
      );
    }

    // Không cho phép admin thay đổi role của chính mình để tránh mất quyền admin
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Không thể thay đổi vai trò của chính bạn" }, 
        { status: 400 }
      );
    }

    // Cập nhật role của người dùng
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        role: newRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({
      message: "Đã cập nhật vai trò người dùng thành công",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật vai trò người dùng" }, 
      { status: 500 }
    );
  }
} 