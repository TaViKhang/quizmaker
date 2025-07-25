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
import { RoleType } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface UserNavProps {
  user: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
    role?: RoleType;
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
  const getAvatarClass = (role?: RoleType): string => {
    if (role === null) return "bg-muted";
    
    switch (role) {
      case Role.TEACHER:
        return "bg-info/20 text-info";
      case Role.STUDENT:
        return "bg-accent/20 text-accent";
      default:
        return "bg-muted";
    }
  };

  // Icon based on role
  const getRoleIcon = (role?: RoleType) => {
    if (role === null) return <UserIcon className="h-4 w-4 text-muted-foreground" />;
    
    switch (role) {
      case Role.TEACHER:
        return <GraduationCap className="h-4 w-4 text-info" />;
      case Role.STUDENT:
        return <UserCircle className="h-4 w-4 text-accent" />;
      default:
        return <UserIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Role label
  const getRoleLabel = (role?: RoleType): string => {
    if (role === null) return "User";
    
    switch (role) {
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
          <Avatar className={cn(getAvatarClass(user.role))}>
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