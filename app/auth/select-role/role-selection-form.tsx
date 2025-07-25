"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROLES, RoleType } from "@/lib/constants";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { GraduationCap, Users } from "lucide-react";

interface RoleSelectionFormProps {
  userId: string;
}

export function RoleSelectionForm({ userId }: RoleSelectionFormProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  const handleRoleSelect = async () => {
    if (!selectedRole) {
      toast.error("Vui lòng chọn vai trò của bạn");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Hiển thị toast ngay lập tức để người dùng biết đang xử lý
      const loadingToast = toast.loading("Đang cập nhật vai trò của bạn...");
      
      const response = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
        // Tắt cache để đảm bảo luôn gửi request mới
        cache: 'no-store',
      });
      
      // Xóa toast loading
      toast.dismiss(loadingToast);
      
      // Kiểm tra response để đảm bảo đó là JSON trước khi parse
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server trả về không phải định dạng JSON: " + await response.text());
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Lỗi khi parse JSON:", jsonError);
        throw new Error("Không thể xử lý dữ liệu từ server. Vui lòng thử lại.");
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to select role");
      }
      
      // Đánh dấu đã redirect để tránh hiển thị thông báo không cần thiết
      setHasRedirected(true);
      
      // Hiển thị toast thành công và thông báo sẽ chuyển hướng
      toast.success("Vai trò đã được cập nhật thành công. Đang chuyển hướng...");
      
      // Phương pháp mạnh mẽ nhất: Làm mới toàn bộ session
      // Ép buộc refresh session với signOut và redirect
      setTimeout(() => {
        // Chuyển hướng đến dashboard HOẶC sign out rồi sign in lại
        // Cách 1: Chuyển hướng trực tiếp (có thể vẫn bị lỗi session)
        const timestamp = Date.now();
        router.push(`/dashboard?t=${timestamp}`);
        
        // Cách 2 (dự phòng nếu cách 1 không hiệu quả):
        // Sau 3 giây nếu chưa chuyển hướng thành công
        setTimeout(() => {
          // Nếu vẫn ở trang hiện tại, buộc đăng xuất và đăng nhập lại
          if (window.location.pathname.includes('select-role')) {
            alert("Đang làm mới phiên đăng nhập để áp dụng vai trò mới. Bạn sẽ được đăng nhập lại tự động.");
            signOut({ callbackUrl: '/auth/signin' });
          }
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error("Error selecting role:", error);
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật vai trò. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };
  
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={`p-4 cursor-pointer border-2 transition-all ${
            selectedRole === ROLES.STUDENT
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-transparent hover:border-slate-200"
          }`}
          onClick={() => !isLoading && setSelectedRole(ROLES.STUDENT)}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-emerald-100 p-3">
              <GraduationCap className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg">Student</h3>
            <p className="text-sm text-slate-600">
              Take tests, view results, and track your progress
            </p>
          </div>
        </Card>
        
        <Card 
          className={`p-4 cursor-pointer border-2 transition-all ${
            selectedRole === ROLES.TEACHER
              ? "border-blue-500 bg-blue-50/50"
              : "border-transparent hover:border-slate-200"
          }`}
          onClick={() => !isLoading && setSelectedRole(ROLES.TEACHER)}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="rounded-full bg-blue-100 p-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">Teacher</h3>
            <p className="text-sm text-slate-600">
              Create tests, manage students, and view analytics
            </p>
          </div>
        </Card>
      </div>
      
      <Button 
        className="w-full mt-2" 
        onClick={handleRoleSelect}
        disabled={!selectedRole || isLoading}
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Vui lòng đợi...
          </>
        ) : (
          "Tiếp tục"
        )}
      </Button>
    </div>
  );
} 