'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { QuizFilters } from "@/components/dashboard/student/filters/QuizFilters";
import { QuizCard } from "@/components/dashboard/student/quiz-card";
import { QuizType } from "@/app/dashboard/student/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BookOpen, 
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Loading skeleton for quiz card
function QuizCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="space-y-5">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </Card>
  );
}

// Pagination component
function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  const pageNumbers = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Trước
      </Button>
      
      {/* First page */}
      {startPage > 1 && (
        <>
          <Button
            variant={1 === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {/* Page numbers */}
      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className="min-w-[40px]"
        >
          {page}
        </Button>
      ))}
      
      {/* Last page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <Button
            variant={totalPages === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}
      
      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1"
      >
        Tiếp
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function QuizzesPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [activeTab, setActiveTab] = useState<string>("all");
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
    // Fetch quizzes from API
  const fetchQuizzes = useCallback(async (page = 1, reset = false) => {
    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    if (reset) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      // Build the query string from search params
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      params.set('limit', '12'); // 12 items per page for pagination
      
      console.log("Fetching quizzes with params:", params.toString());
      const response = await fetch(`/api/users/me/quizzes?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch quizzes");
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("API response:", data);
        
        const newQuizzes = data.data.items || [];
        
        // Set quizzes for current page
        setQuizzes(newQuizzes);
        setCurrentPage(data.data.currentPage || page);
        setTotalPages(data.data.totalPages || 1);
        setTotalItems(data.data.totalItems || 0);
        
        // Show toast if no quizzes returned on first load
        if (reset && newQuizzes.length === 0) {
          toast({
            title: "Chưa có bài kiểm tra",
            description: "Hiện tại chưa có bài kiểm tra nào trong lớp học của bạn.",
            variant: "default",
          });
        }
      } else {
        throw new Error(data.message || "Failed to fetch quizzes");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was aborted, don't update state
      }
      
      console.error("Error fetching quizzes:", err);
      setError(err.message);
      
      if (reset) {
        toast({
          title: "Lỗi",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchParams, toast]);
    // Load initial data - lấy page từ URL nếu có hoặc mặc định là 1
  useEffect(() => {
    // Parse page from URL or default to 1
    const pageParam = searchParams.get('page');
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    
    // Don't reset to page 1 every time, respect the page parameter if it exists
    fetchQuizzes(initialPage, true);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchParams.toString().replace(/page=\d+/, '')]); // Ignore page changes in dependency array
    // Apply tab filtering when active tab or quizzes change
  useEffect(() => {
    filterQuizzesByTab(quizzes, activeTab);
  }, [activeTab, quizzes]);
    // Filter quizzes by tab
  const filterQuizzesByTab = (quizzes: QuizType[], tab: string) => {
    // Không cần lọc ở client nữa vì đã lọc bằng API
    setFilteredQuizzes(quizzes);
  };
  // Handle tab change
  const handleTabChange = (value: string) => {
    // Reset to page 1 when changing tab and update URL
    setActiveTab(value);
    setCurrentPage(1);
    
    // Update URL with status filter and remove page parameter when switching tabs
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // Remove page parameter
    
    // Add status filter to URL if not "all"
    if (value !== "all") {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      fetchQuizzes(page, false);
      
      // Update URL to reflect page change
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [currentPage, totalPages, fetchQuizzes, searchParams, router, pathname]);
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchQuizzes(1, true);
  };
  
  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Bài kiểm tra</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5"
          aria-label="Refresh list"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Quiz filters */}
      <QuizFilters />
      
      {/* Tabs for quick filtering */}      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-5 max-w-[750px]">
          <TabsTrigger value="all">
            Tất cả {totalItems > 0 && `(${totalItems})`}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Sắp tới {activeTab === "upcoming" && totalItems > 0 && `(${totalItems})`}
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            Có thể làm {activeTab === "ongoing" && totalItems > 0 && `(${totalItems})`}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Đã hoàn thành {activeTab === "completed" && totalItems > 0 && `(${totalItems})`}
          </TabsTrigger>
          <TabsTrigger value="expired">
            Đã hết hạn {activeTab === "expired" && totalItems > 0 && `(${totalItems})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>          ) : filteredQuizzes.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 text-foreground mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium">Không tìm thấy bài kiểm tra</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  {activeTab === "all" 
                    ? "Không có bài kiểm tra nào phù hợp với bộ lọc hiện tại." 
                    : `Không có bài kiểm tra nào ở trạng thái "${
                        activeTab === "upcoming" ? "sắp tới" : 
                        activeTab === "ongoing" ? "sẵn sàng" : 
                        activeTab === "completed" ? "đã hoàn thành" :
                        "đã hết hạn"
                      }".`}
                </p>
              </CardContent>
              <CardFooter className="justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => handleTabChange("all")} 
                  className="mt-2"
                >
                  Xem tất cả bài kiểm tra
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Quiz grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Render existing quizzes */}
                {filteredQuizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
                
                {/* Render loading skeletons during initial load */}
                {isLoading && (
                  <>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <QuizCardSkeleton key={i} />
                    ))}
                  </>
                )}
              </div>
              
              {/* Pagination controls */}
              {totalPages > 1 && !isLoading && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
