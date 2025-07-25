"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { StatCard } from "@/components/dashboard/student/cards/StatCard";
import { 
  BookOpen, 
  BarChart, 
  ClipboardCheck,
  AlertCircle, 
  Calendar,
  CheckCircle, 
  Clock,
  FileText,
  PieChart,
  TrendingUp,
  Target,
  Award,
  ClipboardX,
  Search,
  ChevronRight,
  Filter,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { QuizListItem } from "@/components/dashboard/student/quiz-list-item";
import { ResultListItem } from "@/components/dashboard/student/result-list-item";
import { StatDetailDialog } from "@/components/dashboard/student/analytics/StatDetailDialog";
import { ScoreAnalytics } from "@/components/dashboard/student/analytics/ScoreAnalytics";
import { ClassParticipationAnalytics } from "@/components/dashboard/student/analytics/ClassParticipationAnalytics";
import { QuizCompletionAnalytics } from "@/components/dashboard/student/analytics/QuizCompletionAnalytics";
import { useScoreAnalytics } from "@/hooks/use-score-analytics";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { subDays, formatDistanceToNow } from "date-fns";
import { useAnalytics } from "@/components/providers/analytics-provider";

interface StudentStats {
  classesJoined: number;
  totalQuizzesCompleted: number;
  averageScore: number;
  assignedQuizCompletionRate: number;
  assignedAverageScorePreviousPeriod?: number;
  assignedPublishedQuizzesCurrentMonthCount?: number;
  assignedCompletedQuizzesCurrentMonthCount?: number;
}

interface UpcomingQuiz {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  timeLimit: number | null;
  class: {
    id: string;
    name: string;
  };
  _count: {
    questions: number;
  };
}

interface QuizResultItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string | null;
  className: string | null;
  category: string | null;
  score: number;
  maxScore?: number;
  totalQuestions: number;
  correctQuestions: number;
  completedAt: string;
  timeTakenMinutes: number | null;
  feedbackAvailable: boolean;
}

/**
 * Client component for student dashboard overview
 * Fetches and displays student statistics and upcoming quizzes
 */
export function StudentOverviewPageClient() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<UpcomingQuiz[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use refs to prevent duplicate fetches
  const fetchingStats = useRef(false);
  const fetchingQuizzes = useRef(false);
  const fetchingResults = useRef(false);
  const initialFetchDone = useRef(false);

  // Analytics dialogs state
  const [scoreAnalyticsOpen, setScoreAnalyticsOpen] = useState(false);
  const [classAnalyticsOpen, setClassAnalyticsOpen] = useState(false);
  const [completionAnalyticsOpen, setCompletionAnalyticsOpen] = useState(false);
  const scoreAnalytics = useScoreAnalytics();

  // Thêm state mới cho phân trang và filter của tab results
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsPageSize, setResultsPageSize] = useState(5);
  const [resultsTotalPages, setResultsTotalPages] = useState(1);
  const [resultsTotalItems, setResultsTotalItems] = useState(0);
  const [resultsSearchTerm, setResultsSearchTerm] = useState("");
  const [resultsTimeFrame, setResultsTimeFrame] = useState("last30days");
  const [filteredResults, setFilteredResults] = useState<QuizResultItem[]>([]);
  const [resultsSortConfig, setResultsSortConfig] = useState<{
    key: 'date' | 'score' | 'title';
    direction: 'asc' | 'desc';
  }>({
    key: 'date',
    direction: 'desc'
  });

  const [activeTab, setActiveTab] = useState<string>("all");
  const [quizzesData, setQuizzesData] = useState<any[]>([]);
  const [isLoadingQuizzesData, setIsLoadingQuizzesData] = useState(true);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);
  const [quizzesFilters, setQuizzesFilters] = useState({
    status: "upcoming",
    page: 1,
    pageSize: 5
  });

  // Get analytics methods directly from the provider
  const { 
    fetchQuizCompletion,
    isLoadingQuizCompletion,
    quizCompletionData,
    quizCompletionError
  } = useAnalytics();

  const fetchStudentStats = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingStats.current) return;
    
    fetchingStats.current = true;
    setIsLoadingStats(true);
    
    try {
      const response = await fetch("/api/users/me/dashboard-summary");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to load statistics");
      }
      
      setStats(data.data as StudentStats);
    } catch (err) {
      console.error("Error fetching student stats:", err);
      setError((prevError) => prevError || "Could not load some dashboard data. Please try again later.");
      toast({
        variant: "destructive",
        title: "Failed to load statistics",
        description: err instanceof Error ? err.message : "An unknown error occurred",
      });
    } finally {
      setIsLoadingStats(false);
      fetchingStats.current = false;
    }
  }, [toast]);

  const fetchUpcomingQuizzes = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingQuizzes.current) return;
    
    fetchingQuizzes.current = true;
    setIsLoadingQuizzes(true);
    
    try {
      const response = await fetch("/api/users/me/upcoming-assessments");
      if (!response.ok) {
        throw new Error(`Error fetching quizzes: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to load upcoming quizzes");
      }
      
      // Assign the quizzes from actual data
      setUpcomingQuizzes(data.data || []);
      setError("");
    } catch (error) {
      console.error("Failed to fetch upcoming quizzes:", error);
      setError("Could not load your upcoming quizzes. Please try again later.");
    } finally {
      setIsLoadingQuizzes(false);
      fetchingQuizzes.current = false;
    }
  }, []);

  const fetchQuizResults = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingResults.current) return;
    
    fetchingResults.current = true;
    setIsLoadingResults(true);
    
    try {
      const response = await fetch(`/api/users/me/quiz-results?timeFrame=${resultsTimeFrame}&page=${resultsPage}&pageSize=${resultsPageSize}`);
      if (!response.ok) {
        throw new Error(`Error fetching results: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to load quiz results");
      }
      
      // Properly handle the API response structure
      setQuizResults(data.data?.results || []);
      setResultsTotalPages(data.data?.pagination?.totalPages || 1);
      setResultsTotalItems(data.data?.pagination?.totalItems || 0);
      
      // Filtered results được tạo từ quizResults
      setFilteredResults(data.data?.results || []);
      
      setError("");
    } catch (error) {
      console.error("Failed to fetch quiz results:", error);
      setError("Could not load your quiz results. Please try again later.");
    } finally {
      setIsLoadingResults(false);
      fetchingResults.current = false;
    }
  }, [resultsTimeFrame, resultsPage, resultsPageSize]);

  // Function to fetch quizzes data using the same API as the dedicated quizzes page
  const fetchQuizzesData = useCallback(async () => {
    setIsLoadingQuizzesData(true);
    
    try {
      const params = new URLSearchParams();
      params.set('status', quizzesFilters.status);
      params.set('page', quizzesFilters.page.toString());
      params.set('pageSize', quizzesFilters.pageSize.toString());
      
      const response = await fetch(`/api/users/me/quizzes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching quizzes: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setQuizzesData(data.data.items || []);
      } else {
        throw new Error(data.message || "Failed to load quizzes");
      }
    } catch (error) {
      console.error("Error fetching quizzes data:", error);
      setQuizzesError((error as Error).message);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuizzesData(false);
    }
  }, [quizzesFilters, toast]);

  // Combined fetch function to load all dashboard data
  const fetchDashboardData = useCallback(() => {
    if (initialFetchDone.current) return;
    
    setError(null);
    Promise.all([
      fetchStudentStats(),
      fetchUpcomingQuizzes(),
      fetchQuizResults(),
      fetchQuizzesData()
    ]).then(() => {
      initialFetchDone.current = true;
    }).catch((err) => {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data");
    });
  }, [fetchStudentStats, fetchUpcomingQuizzes, fetchQuizResults, fetchQuizzesData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setError(null);
    initialFetchDone.current = false;
    fetchDashboardData();
  };

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "N/A";
    try {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid Date";
    }
  }, []);

  const monthlyAssignedQuizCompletionRate =
    stats && stats.assignedPublishedQuizzesCurrentMonthCount && stats.assignedPublishedQuizzesCurrentMonthCount > 0 && typeof stats.assignedCompletedQuizzesCurrentMonthCount === 'number'
      ? parseFloat(((stats.assignedCompletedQuizzesCurrentMonthCount / stats.assignedPublishedQuizzesCurrentMonthCount) * 100).toFixed(1))
    : 0;

  const isLoading = isLoadingStats;

  // Effect để lọc kết quả khi search term thay đổi
  useEffect(() => {
    if (quizResults.length === 0) return;
    
    const filtered = quizResults.filter(result => {
      if (!resultsSearchTerm) return true;
      return (
        result.quizTitle.toLowerCase().includes(resultsSearchTerm.toLowerCase()) ||
        (result.className?.toLowerCase().includes(resultsSearchTerm.toLowerCase())) ||
        (result.category?.toLowerCase().includes(resultsSearchTerm.toLowerCase()))
      );
    });
    
    setFilteredResults(filtered);
  }, [quizResults, resultsSearchTerm]);
  
  // Xử lý sắp xếp kết quả
  const handleResultsSort = (key: 'date' | 'score' | 'title') => {
    setResultsSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
    
    // Sắp xếp kết quả
    const sortedResults = [...filteredResults].sort((a, b) => {
      let comparison = 0;
      
      if (key === 'date') {
        comparison = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      } else if (key === 'score') {
        comparison = a.score - b.score;
      } else if (key === 'title') {
        comparison = a.quizTitle.localeCompare(b.quizTitle);
      }
      
      return resultsSortConfig.direction === 'desc' ? -comparison : comparison;
    });
    
    setFilteredResults(sortedResults);
  };
  
  // Xử lý thay đổi timeFrame cho results
  const handleResultsTimeFrameChange = (value: string) => {
    setResultsTimeFrame(value);
    setResultsPage(1); // Reset về trang 1
    fetchingResults.current = false; // Reset trạng thái fetching
    fetchQuizResults(); // Fetch lại kết quả với timeFrame mới
  };

  // Khai báo hàm để tạo các mục phân trang cho tab Results
  const generateResultsPagination = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Nút Previous
    items.push(
      <PaginationItem key="prev">
        <PaginationLink
          onClick={() => setResultsPage(p => Math.max(1, p - 1))}
          className={resultsPage === 1 || isLoadingResults ? "pointer-events-none opacity-50" : ""}
          aria-disabled={resultsPage === 1 || isLoadingResults}
        >
          <span className="sr-only">Previous</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </PaginationLink>
      </PaginationItem>
    );
    
    // Always show the first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink 
          isActive={resultsPage === 1} 
          onClick={() => setResultsPage(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    if (resultsTotalPages <= maxVisiblePages) {
      // If few pages, show all
      for (let i = 2; i <= resultsTotalPages; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink 
              isActive={resultsPage === i}
              onClick={() => setResultsPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // If many pages, show a subset
      // Display ellipsis if current page is far from the start
      if (resultsPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Display nearby pages
      const startPage = Math.max(2, resultsPage - 1);
      const endPage = Math.min(resultsTotalPages - 1, resultsPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink 
              isActive={resultsPage === i}
              onClick={() => setResultsPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Display ellipsis if current page is far from the end
      if (resultsPage < resultsTotalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Always show the last page
      if (resultsTotalPages > 1) {
        items.push(
          <PaginationItem key={`page-${resultsTotalPages}`}>
            <PaginationLink 
              isActive={resultsPage === resultsTotalPages}
              onClick={() => setResultsPage(resultsTotalPages)}
            >
              {resultsTotalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    // Nút Next
    items.push(
      <PaginationItem key="next">
        <PaginationLink
          onClick={() => setResultsPage(p => Math.min(resultsTotalPages, p + 1))}
          className={resultsPage === resultsTotalPages || isLoadingResults ? "pointer-events-none opacity-50" : ""}
          aria-disabled={resultsPage === resultsTotalPages || isLoadingResults}
        >
          <span className="sr-only">Next</span>
          <svg
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </PaginationLink>
      </PaginationItem>
    );
    
    return items;
  };

  // Thêm formatDateToPrimary để sử dụng trong QuizListItem
  const formatDateToPrimary = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid date";
    }
  };

  // Handle opening completion analytics dialog
  const handleOpenCompletionAnalytics = useCallback(async () => {
    try {
      // Attempt to fetch quiz completion data before opening the dialog
      await fetchQuizCompletion();
      setCompletionAnalyticsOpen(true);
    } catch (err) {
      console.error("Error fetching quiz completion data:", err);
      toast({
        title: "Error",
        description: "Failed to fetch quiz completion analytics data. Please try again.",
        variant: "destructive"
      });
    }
  }, [fetchQuizCompletion, toast]);

  return (
    <div className="grid gap-6">
      {error && !isLoadingStats && !isLoadingQuizzes && !isLoadingResults && !isLoadingQuizzesData && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Analytics Dialogs */}
      <StatDetailDialog
        open={scoreAnalyticsOpen}
        setOpen={setScoreAnalyticsOpen}
        title="Score Analytics"
        description="Detailed analysis of your academic performance"
        maxWidth="3xl"
      >
        <ScoreAnalytics />
      </StatDetailDialog>

      <StatDetailDialog
        open={classAnalyticsOpen}
        setOpen={setClassAnalyticsOpen}
        title="Class Participation Analytics"
        description="Detailed analysis of your class participation and activities"
        maxWidth="3xl"
      >
        <ClassParticipationAnalytics
          classesJoined={stats?.classesJoined ?? 0}
          isLoading={isLoading}
        />
      </StatDetailDialog>

      <StatDetailDialog
        open={completionAnalyticsOpen}
        setOpen={setCompletionAnalyticsOpen}
        title="Quiz Completion Analytics"
        description="Detailed analysis of your quiz completion patterns and rates"
        maxWidth="3xl"
      >
        <div className="relative">
          {isLoadingQuizCompletion && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading quiz completion data...</p>
              </div>
            </div>
          )}
          
          {quizCompletionError && !isLoadingQuizCompletion && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {quizCompletionError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchQuizCompletion()}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <QuizCompletionAnalytics />
        </div>
      </StatDetailDialog>
      
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Classes Joined"
          value={stats?.classesJoined ?? 0}
          icon={<BookOpen className="h-4 w-4" />}
          isLoading={isLoadingStats}
          description="Total classes you're enrolled in"
          iconColor="text-blue-500"
          interactive={true}
          onClick={() => setClassAnalyticsOpen(true)}
        />
        
        <StatCard
          title="Total Quizzes Completed"
          value={stats?.totalQuizzesCompleted ?? 0}
          unit=" quizzes"
          icon={<ClipboardCheck className="h-4 w-4" />}
          isLoading={isLoadingStats}
          description="All quizzes you've finished (public & assigned)"
          iconColor="text-emerald-500"
          interactive={true}
          onClick={handleOpenCompletionAnalytics}
        />
        
        <StatCard
          title="Average Score (Assigned)"
          value={stats?.averageScore ?? 0}
          unit="%"
          previousValue={stats?.assignedAverageScorePreviousPeriod}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={isLoadingStats}
          description="Your average score on assigned quizzes"
          iconColor="text-purple-500"
          interactive={true}
          onClick={() => setScoreAnalyticsOpen(true)}
        />

        <StatCard
          title="Assigned Quiz Completion Rate"
          value={stats?.assignedQuizCompletionRate ?? 0}
          unit="%"
          icon={<Target className="h-4 w-4" />}
          isLoading={isLoadingStats}
          description="Overall completion of your assigned quizzes"
          iconColor="text-orange-500"
          interactive={true}
          onClick={handleOpenCompletionAnalytics}
        />
      </div>
      
      {/* Overview Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Upcoming Assessments</CardTitle>
                  <CardDescription>
                    Quizzes you need to complete soon
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="h-8 gap-1">
                  <Link href="/dashboard/student/quizzes">
                    View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoadingQuizzes && (
                  <>
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </>
                )}
                {!isLoadingQuizzes && upcomingQuizzes.length === 0 && (
                  <div className="text-center text-muted-foreground py-6">
                    <CheckCircle className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">No upcoming assessments available</p>
                  </div>
                )}
                {!isLoadingQuizzes && upcomingQuizzes.slice(0, 3).map((quiz) => (
                  <QuizListItem key={quiz.id} quiz={quiz} />
                ))}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Monthly Progress</CardTitle>
                  <CardDescription>
                    Your completion rate for assigned quizzes
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleOpenCompletionAnalytics}>
                  Analytics
                  <BarChart className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingStats && (
                  <>
                    <Skeleton className="h-8 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </>
                )}
                {!isLoadingStats && stats && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-4xl font-bold text-primary">
                      {monthlyAssignedQuizCompletionRate}%
                    </div>
                    <div className="w-full mt-2">
                      <Progress 
                        value={monthlyAssignedQuizCompletionRate} 
                        max={100} 
                        className="h-2"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {stats.assignedCompletedQuizzesCurrentMonthCount} of {stats.assignedPublishedQuizzesCurrentMonthCount} assigned quizzes completed this month
                    </p>
                  </div>
                )}
                {!isLoadingStats && !stats && !error && (
                  <div className="text-center text-muted-foreground py-6">
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Available Assessments</CardTitle>
                <CardDescription>
                  Quizzes assigned to you and ready to take
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={quizzesFilters.status}
                  onValueChange={(value) => setQuizzesFilters(prev => ({...prev, status: value}))}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Available now</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => fetchQuizzesData()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingQuizzesData ? (
                <div className="space-y-3">
                  <Skeleton className="h-[125px] w-full rounded-md" />
                  <Skeleton className="h-[125px] w-full rounded-md" />
                </div>
              ) : quizzesError ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{quizzesError}</AlertDescription>
                </Alert>
              ) : quizzesData.length > 0 ? (
                <div className="space-y-3">
                  {quizzesData.slice(0, 3).map((quiz) => (
                    <div key={quiz.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{quiz.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {quiz.class?.name || quiz.category || "No class"}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {quiz._count?.questions || 0} questions
                        </Badge>
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">
                        {quiz.description || "No description available."}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-sm flex gap-2 items-center">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {new Date(quiz.startDate).toLocaleDateString()}
                            {quiz.endDate && ` - ${new Date(quiz.endDate).toLocaleDateString()}`}
                          </span>
                        </div>
                        <Button variant="default" size="sm" asChild>
                          <Link href={`/quiz/${quiz.id}`}>
                            {quiz.status === "completed" ? "View Results" : "Take Quiz"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border rounded-md border-dashed">
                  <ClipboardX className="h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No quizzes found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You don't have any {quizzesFilters.status === "all" ? "" : quizzesFilters.status} quizzes at this time
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {!isLoadingQuizzesData && quizzesData.length > 0 && (
                  <span>Showing {Math.min(3, quizzesData.length)} of {quizzesData.length} quizzes</span>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/student/quizzes">View all quizzes</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Assessment Results</CardTitle>
                  <CardDescription>
                    Results from your completed assessments
                  </CardDescription>
                </div>
                
                <Select 
                  value={resultsTimeFrame} 
                  onValueChange={handleResultsTimeFrameChange}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="last90days">Last 90 days</SelectItem>
                    <SelectItem value="last6months">Last 6 months</SelectItem>
                    <SelectItem value="lastYear">Last year</SelectItem>
                    <SelectItem value="allTime">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search 
                    className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" 
                    aria-hidden="true"
                  />
                  <Input 
                    type="search" 
                    placeholder="Search results..." 
                    className="pl-8"
                    value={resultsSearchTerm}
                    onChange={(e) => setResultsSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {isLoadingResults && (
                <div className="space-y-3">
                  <Skeleton className="h-[170px] w-full rounded-md" />
                  <Skeleton className="h-[170px] w-full rounded-md" />
                </div>
              )}
              
              {!isLoadingResults && filteredResults.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center h-48 border rounded-md border-dashed">
                  <ClipboardX className="h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No results yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You haven't completed any assessments{resultsSearchTerm ? " matching your search" : "" }
                  </p>
                </div>
              )}
              
              {!isLoadingResults && error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {!isLoadingResults && filteredResults.length > 0 && !error && (
                <>
                  <div className="relative w-full overflow-auto">
                    <table 
                      className="w-full caption-bottom text-sm"
                      aria-label="Assessment results table"
                    >
                      <thead>
                        <tr className="border-b">
                          <th 
                            scope="col"
                            className="h-12 px-4 text-left align-middle font-medium"
                          >
                            <button 
                              onClick={() => handleResultsSort('title')}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              Assessment
                              {resultsSortConfig.key === 'title' && (
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </th>
                          <th 
                            scope="col"
                            className="h-12 px-4 text-left align-middle font-medium"
                          >
                            Subject
                          </th>
                          <th 
                            scope="col"
                            className="h-12 px-4 text-left align-middle font-medium"
                          >
                            <button 
                              onClick={() => handleResultsSort('date')}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              Date
                              {resultsSortConfig.key === 'date' && (
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </th>
                          <th 
                            scope="col"
                            className="h-12 px-4 text-right align-middle font-medium"
                          >
                            <button 
                              onClick={() => handleResultsSort('score')}
                              className="flex items-center gap-1 hover:text-primary ml-auto"
                            >
                              Score
                              {resultsSortConfig.key === 'score' && (
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </th>
                          <th 
                            scope="col"
                            className="h-12 px-4 text-center align-middle font-medium"
                          >
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((result) => (
                          <tr 
                            key={result.attemptId} 
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <td className="p-4 align-middle">
                              <div className="font-medium">{result.quizTitle}</div>
                              <div className="text-xs text-muted-foreground">
                                {result.correctQuestions}/{result.totalQuestions} questions correct
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <Badge variant="outline">
                                {result.category || result.className || "No subject"}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                              {format(new Date(result.completedAt), "dd/MM/yyyy")}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <Badge
                                variant={result.score >= 70 ? "default" : result.score >= 50 ? "secondary" : "destructive"}
                              >
                                {result.score.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-center">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                asChild
                              >
                                <Link 
                                  href={`/dashboard/student/quizzes/results/${result.attemptId}`}
                                  aria-label={`View details for ${result.quizTitle}`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {resultsTotalPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        {generateResultsPagination()}
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="text-sm text-muted-foreground">
                {!isLoadingResults && filteredResults.length > 0 && (
                  <span>Showing {filteredResults.length} of {resultsTotalItems} results</span>
                )}
              </div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/student/quizzes/results">
                  View full results page
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 