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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar, 
  Clock, 
  Copy, 
  Edit, 
  FileText, 
  Layers, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  Users, 
  BarChart3, 
  ClipboardCheck 
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClassData {
  id: string;
  name: string;
  subject: string | null;
  description: string | null;
  type: string;
  isActive: boolean;
  studentCount: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isPublished: boolean;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  endDate: string | null;
  timeLimit: number | null;
  passingScore: number | null;
  questionCount: number;
  attemptCount: number;
  averageScore: number | null;
  completionRate: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ClassQuizzesClientProps {
  initialData: {
    quizzes: QuizData[];
    class: ClassData;
    pagination: PaginationData;
  };
  classId: string;
}

export default function ClassQuizzesClient({ initialData, classId }: ClassQuizzesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [quizzes, setQuizzes] = useState<QuizData[]>(initialData.quizzes);
  const [classData, setClassData] = useState<ClassData>(initialData.class);
  const [pagination, setPagination] = useState<PaginationData>(initialData.pagination);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Load quizzes when filters change
  useEffect(() => {
    fetchQuizzes();
  }, [statusFilter, sortBy, sortOrder, currentPage]);
  
  // Search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchQuizzes();
      }
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Function to fetch quizzes with current filters
  const fetchQuizzes = async () => {
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
      
      // Fetch quizzes from API
      const response = await fetch(`/api/teacher/classes/${classId}/quizzes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }
      
      const data = await response.json();
      setQuizzes(data.quizzes);
      setClassData(data.class);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast({
        title: "Error",
        description: "Failed to load quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle quiz active status
  const toggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update quiz status");
      }
      
      // Update local state
      setQuizzes(quizzes.map(quiz => 
        quiz.id === quizId ? { ...quiz, isActive: !currentStatus } : quiz
      ));
      
      toast({
        title: "Quiz Updated",
        description: `Quiz is now ${!currentStatus ? "active" : "inactive"}.`,
      });
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to update quiz status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Duplicate a quiz
  const duplicateQuiz = async (quizId: string, title: string) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Copy of ${title}`,
          classId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to duplicate quiz");
      }
      
      const data = await response.json();
      
      toast({
        title: "Quiz Duplicated",
        description: "Quiz has been duplicated successfully.",
      });
      
      // Refresh quizzes
      fetchQuizzes();
    } catch (error) {
      console.error("Error duplicating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate quiz. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Delete a quiz
  const deleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete quiz");
      }
      
      toast({
        title: "Quiz Deleted",
        description: "Quiz has been deleted successfully.",
      });
      
      // Remove from local state
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      setPagination({
        ...pagination,
        total: pagination.total - 1,
        totalPages: Math.ceil((pagination.total - 1) / pagination.limit),
      });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
        variant: "destructive",
      });
    }
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
  if (isLoading && quizzes.length === 0) {
    return <QuizzesTableSkeleton />;
  }
  
  return (
    <div className="space-y-4">
      {/* Class Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{classData.name}</CardTitle>
              <CardDescription>
                {classData.subject || "No subject"} • {classData.type} Class
                {classData.isActive ? (
                  <span className="inline-flex ml-2"><Badge variant="default">Active</Badge></span>
                ) : (
                  <span className="inline-flex ml-2"><Badge variant="outline">Inactive</Badge></span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Users className="mr-1 h-4 w-4" /> 
                  {classData.studentCount} Students
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/dashboard/teacher/classes/${classId}`)}
              >
                View Class
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Filters and Actions */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quizzes..."
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
              <SelectValue placeholder="All Quizzes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={() => router.push(`/dashboard/teacher/quizzes/create?classId=${classId}`)}
          >
            <Plus className="h-4 w-4 mr-2" /> Create Quiz
          </Button>
        </div>
      </div>
      
      {/* Quizzes Table or Empty State */}
      {quizzes.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%] cursor-pointer" onClick={() => toggleSort("title")}>
                  <div className="flex items-center">
                    Quiz Title
                    {sortBy === "title" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Questions</TableHead>
                <TableHead className="hidden lg:table-cell" onClick={() => toggleSort("averageScore")}>
                  <div className="flex items-center cursor-pointer">
                    Performance
                    {sortBy === "averageScore" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell" onClick={() => toggleSort("updatedAt")}>
                  <div className="flex items-center cursor-pointer">
                    Last Updated
                    {sortBy === "updatedAt" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id} className="group">
                  <TableCell className="font-medium">
                    <div className="max-w-md">
                      <div className="font-medium truncate">
                        {quiz.title}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {quiz.category || "No category"} • {quiz.attemptCount} attempts
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      {quiz.isPublished ? (
                        <Badge variant={quiz.isActive ? "default" : "outline"}>
                          {quiz.isActive ? "Active" : "Inactive"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          Draft
                        </Badge>
                      )}
                      
                      {quiz.startDate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(quiz.startDate), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{quiz.questionCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {quiz.averageScore !== null ? (
                      <div className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          quiz.averageScore >= 80 ? "bg-emerald-500" :
                          quiz.averageScore >= 70 ? "bg-blue-500" :
                          quiz.averageScore >= 60 ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        <span>{quiz.averageScore}% avg.</span>
                        <span className="text-xs text-muted-foreground">
                          ({quiz.completionRate}% completion)
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No data</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {format(new Date(quiz.updatedAt), "MMM d, yyyy")}
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
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}`)}>
                          <FileText className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit Quiz
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/results`)}>
                          <BarChart3 className="h-4 w-4 mr-2" /> View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/grading`)}>
                          <ClipboardCheck className="h-4 w-4 mr-2" /> Grade Submissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleQuizStatus(quiz.id, quiz.isActive)}>
                          {quiz.isActive ? (
                            <>
                              <Clock className="h-4 w-4 mr-2" /> Deactivate
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-2" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => duplicateQuiz(quiz.id, quiz.title)}>
                          <Copy className="h-4 w-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteQuiz(quiz.id)}
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
        <EmptyQuizzesState classId={classId} />
      )}
    </div>
  );
}

function EmptyQuizzesState({ classId }: { classId: string }) {
  const router = useRouter();
  
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
        <CardTitle className="text-xl">No Quizzes Found</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <Layers className="h-20 w-20 text-muted-foreground opacity-50" />
        <p className="mt-4 text-center text-muted-foreground">
          No quizzes have been created for this class yet.
        </p>
        <p className="text-center text-muted-foreground">
          Start by creating your first quiz.
        </p>
        <div className="mt-6">
          <Button onClick={() => router.push(`/dashboard/teacher/quizzes/create?classId=${classId}`)}>
            <Plus className="h-4 w-4 mr-2" /> Create Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuizzesTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[120px] w-full" />
      
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <Skeleton className="h-10 w-full md:w-64" />
          <Skeleton className="h-10 w-full md:w-40" />
        </div>
        
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-6 w-full" />
          </div>
          
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t">
              <div className="space-y-1">
                <Skeleton className="h-5 w-[400px]" />
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