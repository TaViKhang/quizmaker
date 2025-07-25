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
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Edit, 
  Eye, 
  FileText, 
  Filter, 
  Link as LinkIcon, 
  Loader2, 
  MoreHorizontal,
  Plus, 
  Search, 
  Trash, 
  Users,
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category: string | null;
  questionsCount: number;
  attemptsCount: number;
  classId: string | null;
  className: string | null;
}

interface QuizManagementClientProps {
  quizzesCount: number;
}

export function QuizManagementClient({ quizzesCount }: QuizManagementClientProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const itemsPerPage = 10;
  const pageCount = Math.ceil(filteredQuizzes.length / itemsPerPage);
  
  // Load quizzes data
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/teacher/quizzes");
        
        if (!response.ok) {
          throw new Error("Failed to load quizzes");
        }
        
        const data = await response.json();
        setQuizzes(data);
        setFilteredQuizzes(data);
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
    
    fetchQuizzes();
  }, [toast]);
  
  // Filter quizzes based on search term and status filter
  useEffect(() => {
    let filtered = quizzes;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (quiz.category && quiz.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      switch (statusFilter) {
        case "published":
          filtered = filtered.filter(quiz => quiz.isPublished);
          break;
        case "draft":
          filtered = filtered.filter(quiz => !quiz.isPublished);
          break;
        case "active":
          filtered = filtered.filter(quiz => quiz.isActive);
          break;
        case "inactive":
          filtered = filtered.filter(quiz => !quiz.isActive);
          break;
      }
    }
    
    setFilteredQuizzes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [quizzes, searchTerm, statusFilter]);
  
  // Calculate pagination display logic
  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle quiz deletion
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete quiz");
      }
      
      // Update local state
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      
      toast({
        title: "Success",
        description: "Quiz deleted successfully.",
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
  
  // Handle quiz duplication
  const handleDuplicateQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}/duplicate`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to duplicate quiz");
      }
      
      const newQuiz = await response.json();
      
      // Update local state
      setQuizzes([newQuiz, ...quizzes]);
      
      toast({
        title: "Success",
        description: "Quiz duplicated successfully.",
      });
    } catch (error) {
      console.error("Error duplicating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate quiz. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle publishing/unpublishing quiz
  const handleTogglePublish = async (quizId: string, isCurrentlyPublished: boolean) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublished: !isCurrentlyPublished }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isCurrentlyPublished ? "unpublish" : "publish"} quiz`);
      }
      
      // Update local state
      setQuizzes(quizzes.map(quiz => 
        quiz.id === quizId ? { ...quiz, isPublished: !isCurrentlyPublished } : quiz
      ));
      
      toast({
        title: "Success",
        description: `Quiz ${isCurrentlyPublished ? "unpublished" : "published"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast({
        title: "Error",
        description: `Failed to ${isCurrentlyPublished ? "unpublish" : "publish"} quiz. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return <QuizManagementSkeleton />;
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
              placeholder="Search quizzes..."
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
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("published")}>
                Published
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button onClick={() => router.push("/dashboard/teacher/quizzes/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>
      
      {/* Quiz listing */}
      {filteredQuizzes.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Title</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Questions</TableHead>
                  <TableHead className="hidden md:table-cell">Attempts</TableHead>
                  <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">
                      <div>
                        {quiz.title}
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {quiz.description || "No description"}
                        </p>
                        {quiz.className && (
                          <Badge variant="outline" className="mt-1">
                            {quiz.className}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col space-y-1">
                        <Badge variant={quiz.isPublished ? "default" : "outline"}>
                          {quiz.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant={quiz.isActive ? "success" : "secondary"}>
                          {quiz.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {quiz.questionsCount}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {quiz.attemptsCount}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(quiz.updatedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}>
                            {quiz.isPublished ? (
                              <>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateQuiz(quiz.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the quiz "{quiz.title}" and all associated data.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteQuiz(quiz.id)}
                                >
                                  Delete
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
          title="No quizzes found"
          description={searchTerm || statusFilter ? "Try adjusting your search or filter." : "Create your first quiz to get started."}
          action={
            searchTerm || statusFilter ? (
              <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter(null); }}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => router.push("/dashboard/teacher/quizzes/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
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
        <FileText className="h-20 w-20 text-muted-foreground opacity-50" />
        <p className="mt-4 text-center text-muted-foreground">{description}</p>
        <div className="mt-6">
          {action}
        </div>
      </CardContent>
    </Card>
  );
}

function QuizManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="rounded-md border">
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-6 w-[300px]" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t">
              <div className="space-y-1">
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <Skeleton className="h-10 w-[300px]" />
      </div>
    </div>
  );
} 