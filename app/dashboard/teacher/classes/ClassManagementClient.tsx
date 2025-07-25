"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format } from "date-fns";
import { 
  AlertCircle, 
  Book, 
  Clipboard, 
  Copy, 
  Edit, 
  Eye, 
  Filter, 
  Globe, 
  LinkIcon, 
  Lock,
  MoreHorizontal,
  Pencil,
  Plus, 
  Search, 
  Settings, 
  Trash, 
  Users,
} from "lucide-react";

// Class interface matching the Prisma schema
interface Class {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: 'PUBLIC' | 'PRIVATE';
  code: string | null;
  coverImage: string | null;
  isActive: boolean;
  maxStudents: number | null;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  quizCount: number;
}

interface ClassManagementClientProps {
  classesCount: number;
}

export function ClassManagementClient({ classesCount }: ClassManagementClientProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const itemsPerPage = 10;
  const pageCount = Math.ceil((Array.isArray(filteredClasses) ? filteredClasses.length : 0) / itemsPerPage);
  
  // Load classes data
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/teacher/classes");
        
        if (!response.ok) {
          throw new Error("Failed to load classes");
        }
        
        const data = await response.json();
        setClasses(data);
        setFilteredClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, [toast]);
  
  // Filter classes based on search term and status filter
  useEffect(() => {
    // Đảm bảo classes là một mảng
    if (!Array.isArray(classes)) {
      setFilteredClasses([]);
      return;
    }
    
    let filtered = classes;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.description && cls.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.subject && cls.subject.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      switch (statusFilter) {
        case "active":
          filtered = filtered.filter(cls => cls.isActive);
          break;
        case "inactive":
          filtered = filtered.filter(cls => !cls.isActive);
          break;
        case "public":
          filtered = filtered.filter(cls => cls.type === 'PUBLIC');
          break;
        case "private":
          filtered = filtered.filter(cls => cls.type === 'PRIVATE');
          break;
      }
    }
    
    setFilteredClasses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [classes, searchTerm, statusFilter]);
  
  // Calculate pagination display logic
  const paginatedClasses = Array.isArray(filteredClasses) 
    ? filteredClasses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];
  
  // Handle class deletion
  const handleDeleteClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete class");
      }
      
      // Update local state
      setClasses(classes.filter(cls => cls.id !== classId));
      
      toast({
        title: "Success",
        description: "Class deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle copying class code
  const handleCopyClassCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Success",
        description: "Class code copied to clipboard.",
      });
    } catch (error) {
      console.error("Error copying class code:", error);
      toast({
        title: "Error",
        description: "Failed to copy class code. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle toggling class active status
  const handleToggleActiveStatus = async (classId: string, isCurrentlyActive: boolean) => {
    try {
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isCurrentlyActive }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isCurrentlyActive ? "deactivate" : "activate"} class`);
      }
      
      // Update local state
      setClasses(classes.map(cls => 
        cls.id === classId ? { ...cls, isActive: !isCurrentlyActive } : cls
      ));
      
      toast({
        title: "Success",
        description: `Class ${isCurrentlyActive ? "deactivated" : "activated"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: `Failed to ${isCurrentlyActive ? "deactivate" : "activate"} class. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return <ClassManagementSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Actions and filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search classes..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]" forceMount>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("public")}>
                Public
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("private")}>
                Private
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button onClick={() => router.push("/dashboard/teacher/classes/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>
      
      {/* Class listing */}
      {filteredClasses.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedClasses.map((cls) => (
              <Card key={cls.id} className="overflow-hidden">
                <div 
                  className="h-32 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: cls.coverImage ? `url(${cls.coverImage})` : `linear-gradient(to right, #0f172a, #334155)`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '1rem',
                  }}
                >
                  <div className="flex w-full justify-between items-center">
                    <Badge variant={cls.isActive ? "default" : "secondary"}>
                      {cls.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={cls.type === 'PUBLIC' ? "outline" : "secondary"}>
                      {cls.type === 'PUBLIC' ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {cls.type === 'PUBLIC' ? "Public" : "Private"}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription>
                    {cls.subject || "No subject specified"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pb-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {cls.description || "No description provided"}
                  </p>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{cls.studentCount} students</span>
                    </div>
                    <div className="flex items-center">
                      <Clipboard className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{cls.quizCount} quizzes</span>
                    </div>
                  </div>
                  {cls.code && (
                    <div className="flex items-center space-x-2 pt-2">
                      <div className="text-sm font-medium">Class Code:</div>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {cls.code}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => handleCopyClassCode(cls.code!)}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy code</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/teacher/classes/${cls.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/teacher/classes/${cls.id}/edit`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" forceMount>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/classes/${cls.id}/students`)}>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Students
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/classes/${cls.id}/quizzes`)}>
                          <Clipboard className="mr-2 h-4 w-4" />
                          Manage Quizzes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActiveStatus(cls.id, cls.isActive)}>
                          {cls.isActive ? (
                            <>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the class "{cls.name}", all associated quizzes, and student enrollment records.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteClass(cls.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {pageCount > 1 && (
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
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  // Logic to show 5 pages around current page
                  let pageNumber;
                  if (pageCount <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= pageCount - 2) {
                    pageNumber = pageCount - 4 + i;
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
                
                {pageCount > 5 && currentPage < pageCount - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageCount);
                        }}
                      >
                        {pageCount}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < pageCount) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={currentPage === pageCount ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <EmptyState
          title="No classes found"
          description={searchTerm || statusFilter ? "Try adjusting your search or filter." : "Create your first class to get started."}
          action={
            searchTerm || statusFilter ? (
              <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter(null); }}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => router.push("/dashboard/teacher/classes/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action: React.ReactNode;
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <Book className="h-20 w-20 text-muted-foreground opacity-50" />
        <p className="mt-4 text-center text-muted-foreground">{description}</p>
        <div className="mt-6">
          {action}
        </div>
      </CardContent>
    </Card>
  );
}

function ClassManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2 pb-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Skeleton className="h-9 w-20" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-10" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 