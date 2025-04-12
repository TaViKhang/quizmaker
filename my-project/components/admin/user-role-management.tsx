"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
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

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  createdAt: Date;
}

interface UserRoleManagementProps {
  users: User[];
  currentUserId: string;
}

export function UserRoleManagement({ users, currentUserId }: UserRoleManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; newRole: Role } | null>(null);
  
  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: Role) => {
    // If trying to change your own role
    if (userId === currentUserId) {
      toast({
        title: "Cannot change role",
        description: "You cannot change your own role.",
        variant: "destructive",
      });
      return;
    }

    // Set state to show confirmation dialog
    setPendingRoleChange({ userId, newRole });
    setShowConfirmDialog(true);
  };

  // Confirm and process role change
  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    
    try {
      setIsLoading(pendingRoleChange.userId);
      
      const response = await fetch("/api/admin/users/change-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: pendingRoleChange.userId,
          newRole: pendingRoleChange.newRole,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to change user role");
      }
      
      toast({
        title: "Role updated",
        description: `User role has been updated to ${pendingRoleChange.newRole}.`,
      });
      
      // Refresh the page to see updated data
      window.location.reload();
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: "Failed to change user role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
      setShowConfirmDialog(false);
    }
  };

  // Get role icon based on role
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.TEACHER:
        return <GraduationCap className="h-4 w-4 text-blue-500" />;
      case Role.STUDENT:
        return <UserCircle className="h-4 w-4 text-slate-500" />;
      default:
        return null;
    }
  };

  // Function to get badge color based on role
  const getRoleBadgeVariant = (role: Role): "default" | "outline" | "secondary" | "destructive" => {
    switch (role) {
      case Role.TEACHER:
        return "secondary";
      case Role.STUDENT:
        return "default";
      default:
        return "outline";
    }
  };

  // Format date function
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get name initials for avatar fallback
  const getNameInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(part => part[0]).join("").toUpperCase();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            Total of {users.length} users in the system.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email or role..."
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
                  <TableHead className="w-[50px]">No.</TableHead>
                  <TableHead className="w-[250px]">User Info</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[150px]">Role</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found
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
                              <span className="text-xs text-muted-foreground">(You)</span>
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
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={Role.TEACHER}>Teacher</SelectItem>
                                <SelectItem value={Role.STUDENT}>Student</SelectItem>
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

      {/* Role change confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm User Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change this user's role to{" "}
              <span className="font-semibold">
                {pendingRoleChange?.newRole || ""}
              </span>
              ? This action will change their access permissions in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={isLoading !== null}>
              {isLoading !== null ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 