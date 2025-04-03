"use client";

import { useState } from "react";
import { User, Role } from "@prisma/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  CheckCircle, 
  AlertCircle, 
  Search, 
  UserCircle, 
  Shield, 
  GraduationCap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserRoleManagementProps {
  users: Pick<User, "id" | "name" | "email" | "role" | "image" | "createdAt">[];
  currentUserId: string;
}

export function UserRoleManagement({ users, currentUserId }: UserRoleManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; newRole: Role } | null>(null);
  
  // Lọc users dựa trên từ khóa tìm kiếm
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xử lý thay đổi role
  const handleRoleChange = async (userId: string, newRole: Role) => {
    // Nếu đang cố thay đổi role của chính mình
    if (userId === currentUserId) {
      toast({
        title: "Không thể thay đổi vai trò",
        description: "Bạn không thể thay đổi vai trò của chính mình.",
        variant: "destructive",
      });
      return;
    }

    // Đặt state để hiện dialog xác nhận
    setPendingRoleChange({ userId, newRole });
    setShowConfirmDialog(true);
  };

  // Xác nhận và thực hiện thay đổi role
  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    
    const { userId, newRole } = pendingRoleChange;
    setIsLoading(userId);
    
    try {
      const response = await fetch("/api/users/change-role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đã xảy ra lỗi khi thay đổi vai trò");
      }

      toast({
        title: "Thành công",
        description: data.message || "Đã thay đổi vai trò người dùng thành công",
      });
      
      // Cập nhật lại state trong UI
      users.forEach(user => {
        if (user.id === userId) {
          user.role = newRole;
        }
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi thay đổi vai trò",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      setShowConfirmDialog(false);
      setPendingRoleChange(null);
    }
  };

  // Hàm để lấy icon phù hợp với role
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return <Shield className="h-4 w-4 text-emerald-500" />;
      case Role.TEACHER:
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case Role.STUDENT:
        return <UserCircle className="h-4 w-4 text-slate-500" />;
      default:
        return null;
    }
  };

  // Hàm để lấy màu badge dựa trên role
  const getRoleBadgeVariant = (role: Role): "default" | "outline" | "secondary" | "destructive" => {
    switch (role) {
      case Role.ADMIN:
        return "destructive";
      case Role.TEACHER:
        return "secondary";
      case Role.STUDENT:
        return "default";
      default:
        return "outline";
    }
  };

  // Hàm format ngày
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Lấy chữ cái đầu của tên để làm avatar fallback
  const getNameInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(part => part[0]).join("").toUpperCase();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Tổng cộng {users.length} người dùng trong hệ thống.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm theo tên, email hoặc vai trò..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">STT</TableHead>
                  <TableHead className="w-[250px]">Thông tin người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[150px]">Vai trò</TableHead>
                  <TableHead className="w-[120px]">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            {user.id === currentUserId && (
                              <span className="text-xs text-muted-foreground">(Bạn)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="w-fit">
                            <span className="flex items-center gap-1">
                              {getRoleIcon(user.role)} {user.role}
                            </span>
                          </Badge>
                          {user.id !== currentUserId && (
                            <Select
                              value={undefined}
                              onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                              disabled={isLoading === user.id}
                            >
                              <SelectTrigger className="h-8 w-[140px]">
                                <SelectValue placeholder="Đổi vai trò" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                                <SelectItem value={Role.TEACHER}>Giáo viên</SelectItem>
                                <SelectItem value={Role.STUDENT}>Học sinh</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog xác nhận thay đổi role */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi vai trò người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn thay đổi vai trò của người dùng này thành{" "}
              <span className="font-semibold">
                {pendingRoleChange?.newRole || ""}
              </span>
              ? Hành động này sẽ thay đổi quyền truy cập của họ trong hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={isLoading !== null}>
              {isLoading !== null ? "Đang xử lý..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 