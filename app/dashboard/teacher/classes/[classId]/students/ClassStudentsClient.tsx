"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card,
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Search, MoreHorizontal, UserPlus, Trash, ArrowUpDown, Mail, Download, Trophy, BookOpen } from "lucide-react";

// Define types
interface ClassInfo {
  id: string;
  name: string;
  subject: string | null;
  type: string;
  inviteCode: string | null;
  isActive: boolean;
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentId: string;
  joinedAt: string;
  lastActive: string | null;
  attemptCount: number;
  averageScore: number | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ClassStudentsClientProps {
  initialData: {
    class: ClassInfo;
    students: Student[];
    pagination: PaginationInfo;
  };
}

export default function ClassStudentsClient({ initialData }: ClassStudentsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [classData, setClassData] = useState<ClassInfo>(initialData.class);
  const [students, setStudents] = useState<Student[]>(initialData.students);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(initialData.pagination.page);
  const [totalPages, setTotalPages] = useState(initialData.pagination.totalPages);
  const [totalStudents, setTotalStudents] = useState(initialData.pagination.total);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  useEffect(() => {
    // Load students for the current page
    const fetchStudents = async () => {
      if (currentPage === initialData.pagination.page && !searchTerm) {
        // Use initial data for first page if no search
        return;
      }
      
      setIsLoading(true);
      
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
        });
        
        if (searchTerm) {
          queryParams.append("search", searchTerm);
        }
        
        const response = await fetch(`/api/teacher/classes/${classData.id}/students?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch students");
        }
        
        const data = await response.json();
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
        setTotalStudents(data.pagination.total);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [currentPage, searchTerm, classData.id, initialData.pagination.page, toast]);
  
  const handleAddStudent = async () => {
    if (!emailToAdd.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    
    try {
      const response = await fetch(`/api/teacher/classes/${classData.id}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToAdd }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add student");
      }
      
      const data = await response.json();
      
      // Update students list
      setStudents([data.student, ...students]);
      setTotalStudents(prev => prev + 1);
      
      // Reset form
      setEmailToAdd("");
      setShowAddDialog(false);
      
      toast({
        title: "Success",
        description: "Student added to class successfully",
      });
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleRemoveStudent = async (enrollmentId: string, studentName: string) => {
    try {
      const response = await fetch(`/api/teacher/classes/${classData.id}/students/${enrollmentId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove student");
      }
      
      // Update students list
      setStudents(students.filter(s => s.enrollmentId !== enrollmentId));
      setTotalStudents(prev => prev - 1);
      
      toast({
        title: "Success",
        description: `${studentName} was removed from the class`,
      });
    } catch (error) {
      console.error("Error removing student:", error);
      toast({
        title: "Error",
        description: "Failed to remove student. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleShareInvite = async () => {
    if (!classData.inviteCode) {
      toast({
        title: "Error",
        description: "No invite code available for this class",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const inviteUrl = `${window.location.origin}/join-class?code=${classData.inviteCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      
      toast({
        title: "Success",
        description: "Class invite link copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying invite link:", error);
      toast({
        title: "Error",
        description: "Failed to copy invite link. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Render loading state
  if (isLoading && students.length === 0) {
    return <StudentsTableSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          {classData.inviteCode && (
            <Button variant="outline" onClick={handleShareInvite}>
              Share Invite Link
            </Button>
          )}
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Student to Class</DialogTitle>
                <DialogDescription>
                  Enter the email address of the student you want to add to {classData.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Student Email
                    </label>
                    <Input
                      id="email"
                      placeholder="student@example.com"
                      type="email"
                      value={emailToAdd}
                      onChange={(e) => setEmailToAdd(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent} disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add Student"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            {totalStudents} student{totalStudents !== 1 ? "s" : ""} enrolled in this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Avg. Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.enrollmentId}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{format(new Date(student.joinedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {student.lastActive
                          ? formatDistanceToNow(new Date(student.lastActive), { addSuffix: true })
                          : "Never"}
                      </TableCell>
                      <TableCell>{student.attemptCount}</TableCell>
                      <TableCell>
                        {student.averageScore !== null ? `${student.averageScore}%` : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" forceMount>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}>
                              <BookOpen className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/students/${student.id}/progress?classId=${classData.id}`)}>
                              <Trophy className="mr-2 h-4 w-4" />
                              View Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `mailto:${student.email}`;
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Email Student
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:bg-destructive/10"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Remove from Class
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove {student.name} from {classData.name}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveStudent(student.enrollmentId, student.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to show 5 pages around current page
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNumber);
                              }}
                              isActive={currentPage === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(totalPages);
                              }}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm
                  ? "Try a different search term or clear the search."
                  : "Add students to your class to get started."}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              )}
              {!searchTerm && (
                <Button
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentsTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[130px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-[100px]" />
          <Skeleton className="h-5 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-6 w-[80px]" />
              <Skeleton className="h-6 w-[80px]" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-6 w-[170px]" />
                <Skeleton className="h-6 w-[100px]" />
                <Skeleton className="h-6 w-[120px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-6 w-[40px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 