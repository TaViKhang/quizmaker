"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Settings, 
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  GraduationCap,
  School
} from "lucide-react";
import { Role } from "@prisma/client";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: Role | null;
  };
}

// Hàm để lấy emoji và màu sắc thích hợp cho từng role
const getRoleBadgeProps = (role?: Role | null) => {
  switch (role) {
    case Role.TEACHER:
      return { 
        icon: <School className="h-3 w-3 mr-1" />, 
        text: "Giáo viên", 
        className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" 
      };
    case Role.STUDENT:
      return { 
        icon: <GraduationCap className="h-3 w-3 mr-1" />, 
        text: "Học sinh", 
        className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" 
      };
    default:
      return { 
        icon: null, 
        text: "Chưa xác định", 
        className: "bg-muted text-muted-foreground" 
      };
  }
};

export function UserDropdown({ user }: UserDropdownProps) {
  const { icon, text, className } = getRoleBadgeProps(user.role);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 rounded-full"
          aria-label="Open user menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback className="bg-secondary">
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-2">
            <div>
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {user.email}
              </p>
            </div>
            <Badge variant="outline" className={`flex items-center w-fit ${className}`}>
              {icon}
              {text}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/exams">
            <FileText className="mr-2 h-4 w-4" />
            My Exams
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/results">
            <BookOpen className="mr-2 h-4 w-4" />
            Results
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/docs">
            <HelpCircle className="mr-2 h-4 w-4" />
            Help & Documentation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => await signOut({ callbackUrl: "/" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 