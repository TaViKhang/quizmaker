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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowUpDown, 
  Clipboard, 
  Copy, 
  Eye, 
  FileText, 
  Filter, 
  GraduationCap, 
  Layers, 
  MoreHorizontal, 
  Pencil, 
  Plus, 
  Search, 
  Trash2, 
  Users 
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: string;
  isActive: boolean;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  quizCount: number;
  activeQuizCount: number;
  averageScore: number | null;
  lastActiveDate: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ClassManagementClientProps {
  initialData: {
    classes: ClassData[];
    pagination: PaginationData;
  };
}

export default function ClassManagementClient({ initialData }: ClassManagementClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [classes, setClasses] = useState<ClassData[]>(initialData.classes);
  const [pagination, setPagination] = useState<PaginationData>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassData | null>(null);
  
  // Form state
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    subject: "",
    type: "PRIVATE",
    isActive: true,
  });
  
  // Load classes when filters change
  useEffect(() => {
    fetchClasses();
  }, [statusFilter, sortBy, sortOrder, currentPage]);
  
  // Search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchClasses();
      }
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Function to fetch classes with current filters
  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "10");
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      if (sortBy) {
        params.append("sortBy", sortBy);
      }
      
      if (sortOrder) {
        params.append("sortOrder", sortOrder);
      }
      
      // Fetch classes from API
      const response = await fetch(`/api/teacher/classes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }
      
      const data = await response.json();
      setClasses(data.classes);
      setPagination(data.pagination);
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
  
  // Create a new class
  const createClass = async () => {
    try {
      const response = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.message || "Failed to create class";
        const errorDetails = responseData?.details ? `: ${JSON.stringify(responseData.details)}` : "";
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      toast({
        title: "Class Created",
        description: "New class has been created successfully.",
      });
      
      // Reset form and close dialog
      setNewClass({
        name: "",
        description: "",
        subject: "",
        type: "PRIVATE",
        isActive: true,
      });
      setIsCreateDialogOpen(false);
      
      // Refresh classes
      fetchClasses();
    } catch (error) {
      console.error("Error creating class:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create class. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Update class
  const updateClass = async () => {
    if (!currentClass) return;
    
    try {
      const response = await fetch(`/api/teacher/classes/${currentClass.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentClass.name,
          description: currentClass.description,
          subject: currentClass.subject,
          type: currentClass.type,
          isActive: currentClass.isActive,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update class");
      }
      
      toast({
        title: "Class Updated",
        description: "Class has been updated successfully.",
      });
      
      setIsEditDialogOpen(false);
      fetchClasses();
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: "Failed to update class. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Delete class
  const deleteClass = async (classId: string) => {
    if (!confirm(
      "Are you sure you want to delete this class permanently?\n\n" +
      "This action CANNOT be undone and will delete:\n" +
      "- All student enrollments\n" +
      "- All quizzes in this class\n" +
      "- All quiz attempts and student data"
    )) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete class");
      }
      
      toast({
        title: "Class Deleted",
        description: "Class has been permanently deleted.",
      });
      
      // Remove from local state
      setClasses(classes.filter(cls => cls.id !== classId));
      setPagination({
        ...pagination,
        total: pagination.total - 1,
        totalPages: Math.ceil((pagination.total - 1) / pagination.limit),
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
  
  // Copy invite code to clipboard
  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to Clipboard",
      description: "Class invite code has been copied to clipboard.",
    });
  };
  
  // Toggle sort order
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };
  
  // Render loading skeleton
  if (isLoading && classes.length === 0) {
    return <ClassesTableSkeleton />;
  }
  
  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search classes..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to your teacher dashboard. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Class Name*</Label>
                <Input 
                  id="name" 
                  value={newClass.name} 
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  placeholder="e.g. Algebra 101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  value={newClass.subject} 
                  onChange={(e) => setNewClass({...newClass, subject: e.target.value})}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={newClass.description} 
                  onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                  placeholder="Class description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Class Type</Label>
                <Select 
                  value={newClass.type} 
                  onValueChange={(value) => setNewClass({...newClass, type: value})}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private (Requires code to join)</SelectItem>
                    <SelectItem value="PUBLIC">Public (Open to all students)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newClass.type === "PRIVATE" ? 
                    "Students will need an invite code to join this class." :
                    "Any student can find and join this class without a code."
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newClass.isActive}
                  onChange={(e) => setNewClass({...newClass, isActive: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-focus"
                />
                <Label htmlFor="isActive">Active Class</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                onClick={createClass}
                disabled={!newClass.name.trim()}
              >
                Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Classes Table or Empty State */}
      {classes.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%] cursor-pointer" onClick={() => toggleSort("name")}>
                  <div className="flex items-center">
                    Class Name
                    {sortBy === "name" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead className="hidden md:table-cell" onClick={() => toggleSort("studentCount")}>
                  <div className="flex items-center cursor-pointer">
                    Students
                    {sortBy === "studentCount" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell" onClick={() => toggleSort("updatedAt")}>
                  <div className="flex items-center cursor-pointer">
                    Last Activity
                    {sortBy === "updatedAt" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem.id} className="group">
                  <TableCell className="font-medium">
                    <div className="max-w-md">
                      <div className="font-medium flex items-center">
                        {classItem.name}
                        {!classItem.isActive && (
                          <Badge variant="outline" className="ml-2">Inactive</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span>{classItem.subject || "No subject"}</span>
                        <span className="text-xs">•</span>
                        <Badge variant={classItem.type === "PUBLIC" ? "secondary" : "outline"} className="text-xs py-0 h-5">
                          {classItem.type === "PUBLIC" ? "Public" : "Private"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{classItem.quizCount} Quizzes</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({classItem.activeQuizCount} active)
                        </span>
                      </div>
                      {classItem.type === "PRIVATE" && (
                        <div className="flex items-center text-sm mt-1">
                          <Clipboard className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-mono text-xs mr-1">Invite code:</span>
                          <span className="font-mono text-xs font-bold">
                            {classItem.inviteCode}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="ml-1 h-5 w-5"
                            onClick={() => copyInviteCode(classItem.inviteCode)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {classItem.type === "PUBLIC" && (
                        <div className="flex items-center text-sm mt-1">
                          <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-xs">Public class - students can join freely</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{classItem.studentCount}</span>
                      {classItem.averageScore !== null && (
                        <div className="ml-2 flex items-center">
                          <span className="text-xs">•</span>
                          <div className={`ml-2 w-2 h-2 rounded-full ${
                            classItem.averageScore >= 80 ? "bg-emerald-500" :
                            classItem.averageScore >= 70 ? "bg-blue-500" :
                            classItem.averageScore >= 60 ? "bg-amber-500" : "bg-red-500"
                          }`} />
                          <span className="text-xs ml-1">{classItem.averageScore}% avg</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {format(new Date(classItem.lastActiveDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/classes/${classItem.id}`)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/classes/${classItem.id}/quizzes`)}>
                          <FileText className="h-4 w-4 mr-2" /> Manage Quizzes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/classes/${classItem.id}/students`)}>
                          <Users className="h-4 w-4 mr-2" /> Manage Students
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentClass(classItem);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Edit Class
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteClass(classItem.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, idx) => {
                    let pageNumber;
                    
                    if (pagination.totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + idx;
                    } else {
                      pageNumber = currentPage - 2 + idx;
                    }
                    
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink 
                          isActive={currentPage === pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(pagination.totalPages)}>
                          {pagination.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(currentPage < pagination.totalPages ? currentPage + 1 : pagination.totalPages)}
                      className={currentPage >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      ) : (
        <EmptyClassesState />
      )}
      
      {/* Edit Class Dialog */}
      {currentClass && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>
                Update class details. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Class Name*</Label>
                <Input 
                  id="edit-name" 
                  value={currentClass.name} 
                  onChange={(e) => setCurrentClass({...currentClass, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Input 
                  id="edit-subject" 
                  value={currentClass.subject || ""} 
                  onChange={(e) => setCurrentClass({...currentClass, subject: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={currentClass.description || ""} 
                  onChange={(e) => setCurrentClass({...currentClass, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Class Type</Label>
                <Select 
                  value={currentClass.type} 
                  onValueChange={(value) => setCurrentClass({...currentClass, type: value})}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private (Requires code to join)</SelectItem>
                    <SelectItem value="PUBLIC">Public (Open to all students)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {currentClass.type === "PRIVATE" ? 
                    "Students will need an invite code to join this class." :
                    "Any student can find and join this class without a code."
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={currentClass.isActive}
                  onChange={(e) => setCurrentClass({...currentClass, isActive: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-focus"
                />
                <Label htmlFor="edit-isActive">Active Class</Label>
              </div>
              {currentClass.type === "PRIVATE" && (
                <div className="grid gap-2">
                  <Label htmlFor="inviteCode">Class Invite Code</Label>
                  <div className="flex items-center">
                    <Input
                      id="inviteCode"
                      value={currentClass.inviteCode}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => copyInviteCode(currentClass.inviteCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Students need this code to join your private class
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                onClick={updateClass}
                disabled={!currentClass.name.trim()}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EmptyClassesState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
        <CardTitle className="text-xl">No Classes Found</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <GraduationCap className="h-20 w-20 text-muted-foreground opacity-50" />
        <p className="mt-4 text-center text-muted-foreground">
          You haven't created any classes yet.
        </p>
        <p className="text-center text-muted-foreground">
          Start by creating your first class to add quizzes and students.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-6">
              <Plus className="h-4 w-4 mr-2" /> Create Your First Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to your teacher dashboard. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Class Name*</Label>
                <Input id="name" placeholder="e.g. Algebra 101" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g. Mathematics" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Class description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Class Type</Label>
                <Select defaultValue="PRIVATE">
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private (Requires code to join)</SelectItem>
                    <SelectItem value="PUBLIC">Public (Open to all students)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button type="submit">Create Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ClassesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <Skeleton className="h-10 w-full md:w-64" />
          <Skeleton className="h-10 w-full md:w-40" />
        </div>
        
        <Skeleton className="h-10 w-32" />
      </div>
      
      <Card className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-6 w-full" />
          </div>
          
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t">
              <div className="space-y-1">
                <Skeleton className="h-5 w-[300px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 