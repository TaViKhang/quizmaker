"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Search, 
  RefreshCw, 
  BarChart, 
  LineChart,
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Book,
  Filter,
  X,
  AlertCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ResultsTable from "../../results/components/ResultsTable";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ScoreChart from "../../results/components/ScoreChart";
import SubjectAnalysis from "../../results/components/SubjectAnalysis";
import LearningProgress from "../../results/components/LearningProgress";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string | null;
  className: string | null;
  score: number;
  totalQuestions: number;
  correctQuestions: number;
  completedAt: string;
  timeTakenMinutes: number | null;
  feedbackAvailable: boolean;
  category?: string; // subject
}

interface OverallStats {
  averageScore: number;
  previousAverageScore: number | null;
  improvement: number | null;
  totalAssessments: number;
  currentPeriodLabel: string;
  previousPeriodLabel: string | null;
}

interface CompletionData {
  totalQuizzes: number;
  completedQuizzes: number;
  completionRate: number;
  bestSubject: {
    name: string;
    score: number;
  };
  mostImprovedSubject?: {
    name: string;
    improvement: number;
  } | null;
}

interface TimePointScoreData {
  date: string; // ISO YYYY-MM-DD
  averageScore: number;
  assessmentCount: number;
}

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  assessmentCount: number;
  trend?: number | null; // Percentage change compared to previous period
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: number | null;
  trendLabel?: string | null;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  // Extract query parameters
  const timeFrameParam = searchParams.get('timeFrame');
  const subjectParam = searchParams.get('subject');
  
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrameParam || "last30days");
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(subjectParam || undefined);
  const [activeTab, setActiveTab] = useState("summary");
  
  // Analysis data states
  const [overallStats, setOverallStats] = useState<OverallStats>({
    averageScore: 0,
    previousAverageScore: null,
    improvement: null,
    totalAssessments: 0,
    currentPeriodLabel: "current period",
    previousPeriodLabel: null
  });
  const [completionData, setCompletionData] = useState<CompletionData>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    completionRate: 0,
    bestSubject: {
      name: "N/A",
      score: 0
    }
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimePointScoreData[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  const fetchResults = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/me/quiz-results?timeFrame=${selectedTimeFrame}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to load quiz results");
      }
      
      setResults(data.data?.results || []);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      setError(error instanceof Error ? error.message : "An error occurred while fetching results");
      toast({
        title: "Error",
        description: "Failed to load quiz results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    
    try {
      const response = await fetch(`/api/users/me/quiz-analytics?timeFrame=${selectedTimeFrame}${selectedSubject ? `&subject=${selectedSubject}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to load quiz analytics");
      }
      
      // Update all analytics states
      if (data.data) {
        setOverallStats(data.data.overallStats || overallStats);
        setCompletionData(data.data.completionData || completionData);
        setTimeSeriesData(data.data.timeSeriesData || []);
        setSubjectPerformance(data.data.subjectPerformance || []);
      }
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      toast({
        title: "Analytics Error",
        description: "Failed to load analytics data. The basic results are still available.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };
  
  // Update URL when filters change
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams();
    
    params.set('timeFrame', selectedTimeFrame);
    if (selectedSubject) params.set('subject', selectedSubject);
    
    router.push(`/dashboard/student/quizzes/results?${params.toString()}`, { scroll: false });
  };
  
  useEffect(() => {
    fetchResults();
    fetchAnalytics();
    updateUrlWithFilters();
  }, [selectedTimeFrame, selectedSubject]);
  
  // Extract unique subjects from results for filtering
  const subjects = [...new Set(results.map(result => result.category).filter(Boolean))];

  const filteredResults = selectedSubject 
    ? results.filter(result => result.category?.toLowerCase() === selectedSubject.toLowerCase())
    : results;
  
  // Determine if we have any active filters
  const hasActiveFilters = !!selectedSubject || selectedTimeFrame !== "last30days";
  
  // Handler to reset all filters
  const handleResetFilters = () => {
    setSelectedTimeFrame("last30days");
    setSelectedSubject(undefined);
  };

  // Score card component
  function StatCard({ 
    title, 
    value, 
    icon, 
    description, 
    trend = null, 
    trendLabel = null 
  }: StatCardProps) {
    // Get trend color
    const getTrendColor = (trendValue: number) => {
      if (trendValue > 0) return "text-emerald-600 dark:text-emerald-400";
      if (trendValue < 0) return "text-red-600 dark:text-red-400";
      return "text-amber-600 dark:text-amber-400";
    };
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {value}
          </div>
          {trend !== null ? (
            <p className={cn(
              "text-xs flex items-center gap-1 mt-1",
              getTrendColor(trend)
            )}>
              {trend > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : null}
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}% {trendLabel && `compared to ${trendLabel}`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Results</h1>
          <p className="text-muted-foreground">
            View and analyze your quiz performance
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select 
            value={selectedTimeFrame} 
            onValueChange={setSelectedTimeFrame}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Time period" />
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
          
          {subjects.length > 0 && (
            <Select 
              value={selectedSubject || "all"} 
              onValueChange={(value) => setSelectedSubject(value !== "all" ? value : undefined)}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                  subject ? (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ) : null
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button variant="outline" onClick={fetchResults}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-3 gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Reset filters
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b pb-0 mb-6">
          <TabsTrigger value="summary" className="flex items-center gap-1.5">
            <BarChart className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <LineChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6 mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Average Score" 
              value={`${overallStats.averageScore.toFixed(1)}%`}
              icon={<BarChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              trend={overallStats.improvement || 0}
              trendLabel={overallStats.previousPeriodLabel || undefined}
            />
            
            <StatCard
              title="Total Assessments"
              value={overallStats.totalAssessments}
              icon={<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              description={`${completionData.completionRate}% completion rate`}
            />
            
            <StatCard
              title="Best Subject"
              value={completionData.bestSubject?.name || "N/A"}
              icon={<Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              description={completionData.bestSubject?.score 
                ? `Average: ${completionData.bestSubject.score.toFixed(1)}%` 
                : "No data available"}
            />
            
            <StatCard
              title="Most Improved"
              value={completionData.mostImprovedSubject?.name || "N/A"}
              icon={<Book className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              trend={completionData.mostImprovedSubject?.improvement || 0}
              description="Need more data for analysis"
            />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>Your most recent assessments</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t">
                  {isLoading ? (
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : results.length > 0 ? (
                    <div>
                      {results.slice(0, 5).map((result) => (
                        <div 
                          key={result.attemptId} 
                          className="flex items-center justify-between p-4 border-b last:border-b-0"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.quizTitle}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              {result.category && (
                                <Badge variant="outline">{result.category}</Badge>
                              )}
                              <span>{new Date(result.completedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Badge 
                              variant={result.score >= 70 ? "default" : 
                                       result.score >= 50 ? "secondary" : "destructive"}
                            >
                              {result.score.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                      <p className="text-muted-foreground">No results available</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/40 py-3">
                <Button variant="outline" size="sm" className="w-full gap-1" asChild>
                  <div onClick={() => setActiveTab("history")}>View all results <span className="sr-only">View all results</span></div>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <ScoreChart 
                timeSeriesData={timeSeriesData} 
                timeFrame={selectedTimeFrame} 
              />
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <SubjectAnalysis 
                subjectPerformance={subjectPerformance} 
                selectedSubject={selectedSubject}
              />
            </Card>
            
            <Card>
              <LearningProgress 
                timeFrame={selectedTimeFrame}
                selectedSubject={selectedSubject}
              />
            </Card>
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          <ResultsTable 
            results={filteredResults} 
            selectedTimeFrame={selectedTimeFrame} 
            selectedSubject={selectedSubject} 
            isLoading={isLoading} 
          />
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <ScoreChart 
                timeSeriesData={timeSeriesData} 
                timeFrame={selectedTimeFrame} 
              />
            </Card>
            
            <Card>
              <SubjectAnalysis 
                subjectPerformance={subjectPerformance} 
                selectedSubject={selectedSubject}
              />
            </Card>
          </div>
          
          <Card>
            <LearningProgress 
              timeFrame={selectedTimeFrame}
              selectedSubject={selectedSubject}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 