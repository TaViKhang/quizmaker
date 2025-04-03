"use client";

import { Role } from "@prisma/client";
import Link from "next/link";
import { 
  User as UserIcon, 
  CreditCard, 
  LogOut, 
  Settings, 
  Shield, 
  GraduationCap,
  UserCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface UserNavProps {
  user: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
    role?: Role;
  };
}

export function UserNav({ user }: UserNavProps) {
  const { toast } = useToast();
  const { logout } = useAuth();

  // Get initials from name for avatar fallback
  const getNameInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(part => part[0]).join("").toUpperCase();
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out error",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Avatar color based on role
  const getAvatarClass = (role?: Role): string => {
    switch (role) {
      case Role.ADMIN:
        return "bg-red-100 text-red-600";
      case Role.TEACHER:
        return "bg-blue-100 text-blue-600";
      case Role.STUDENT:
        return "bg-emerald-100 text-emerald-600";
      default:
        return "bg-slate-100";
    }
  };

  // Icon based on role
  const getRoleIcon = (role?: Role) => {
    switch (role) {
      case Role.ADMIN:
        return <Shield className="h-4 w-4 text-red-500" />;
      case Role.TEACHER:
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case Role.STUDENT:
        return <UserCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Role label
  const getRoleLabel = (role?: Role): string => {
    switch (role) {
      case Role.ADMIN:
        return "Administrator";
      case Role.TEACHER:
        return "Teacher";
      case Role.STUDENT:
        return "Student";
      default:
        return "User";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className={getAvatarClass(user.role)}>
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback>{getNameInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || ""}
            </p>
            <div className="flex items-center pt-1">
              {getRoleIcon(user.role)}
              <span className="ml-1 text-xs font-medium">{getRoleLabel(user.role)}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 