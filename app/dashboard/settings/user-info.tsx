"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROLES, RoleType } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Helper to get role display name
const getRoleLabel = (role?: string): string => {
  switch (role) {
    case ROLES.TEACHER:
      return "Teacher";
    case ROLES.STUDENT:
      return "Student";
    default:
      return "User";
  }
};

// Helper to get avatar color class based on role
const getAvatarColorClass = (role?: string): string => {
  switch (role) {
    case ROLES.TEACHER:
      return "bg-info/20 text-info";
    case ROLES.STUDENT:
      return "bg-accent/20 text-accent";
    default:
      return "bg-muted text-muted-foreground";
  }
};

// Helper to get role icon
const getRoleIcon = (role?: string) => {
  switch (role) {
    case ROLES.TEACHER:
      return <Icons.teacher className="h-5 w-5" />;
    case ROLES.STUDENT:
      return <Icons.student className="h-5 w-5" />;
    default:
      return null;
  }
};

// Get initials from name for avatar fallback
const getNameInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name.split(" ").map(part => part[0]).join("").toUpperCase();
};

interface UserInfoProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function UserInfo({ user }: UserInfoProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    
    // In a real application, you would update the user's information here
    // This is just a placeholder for demonstration purposes
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-6">
        <Avatar className={cn("h-16 w-16", getAvatarColorClass(user.role))}>
          <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
          <AvatarFallback className="text-xl">{getNameInitials(user.name)}</AvatarFallback>
        </Avatar>
        
        <div>
          <h4 className="text-xl font-semibold">{user.name || "User"}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs">
              {getRoleIcon(user.role)}
              <span>{getRoleLabel(user.role)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                This is the name that will be displayed to other users.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your email address is managed through your Google account.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                {getRoleLabel(user.role)}
              </div>
              <p className="text-xs text-muted-foreground">
                Your role determines what features you can access. Contact an administrator to change your role.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 