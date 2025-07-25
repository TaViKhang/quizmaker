"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CheckCircle,
  Clock,
  BarChart2,
  LineChart as LineChartIcon,
  CalendarDays,
  Sigma,
  Calendar,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  Flame,
  Target,
  Clock3,
  AlertCircle,
  BookText,
  Award,
  School,
} from "lucide-react";
import { useAnalytics, TimeFrame, QuizCompletionAnalyticsData } from "@/components/providers/analytics-provider";
import { useAuth } from "@/hooks/use-auth";
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
import { AnalyticsSkeleton } from './AnalyticsSkeletons';
import { Button } from "@/components/ui/button";

// Chart colors
const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

/**
 * Detailed quiz completion analytics component for student dashboard
 * Shows completion rates, trends, categories and individual quiz breakdown
 */
export function QuizCompletionAnalytics() {
  const { 
    quizCompletionData: analyticsData,
    quizCompletionError: error,
    isLoadingQuizCompletion: isLoading,
    timeFrame,
    setTimeFrame,
    fetchQuizCompletion
  } = useAnalytics();
  
  const { isStudent } = useAuth();
  
  // State to track if initial fetch has been done
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  const { toast } = useToast();

  // Fetch analytics data when component mounts - only if user is a student
  useEffect(() => {
    // Only try to fetch data if user is a student and we haven't fetched yet and not already loading
    if (!hasInitialFetch && isStudent && !isLoading) {
      fetchQuizCompletion().finally(() => {
        setHasInitialFetch(true);
      });
    }
  }, [fetchQuizCompletion, hasInitialFetch, isStudent, isLoading]);

  // Use useCallback to memoize handler function
  const handleTimeFrameChange = useCallback((value: string) => {
    if (value !== timeFrame) {
      setTimeFrame(value as TimeFrame);
    }
  }, [timeFrame, setTimeFrame]);

  // Thêm chức năng debug để kiểm tra dữ liệu API trực tiếp
  const handleManualFetch = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/me/quiz-completion-analytics?timeFrame=${timeFrame}`);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      const data = await response.json();
      console.log("Direct API data:", data);
      if (data.success) {
        toast({
          title: "API Data Successfully Retrieved",
          description: "Check browser console for details.",
        });
      } else {
        toast({
          title: "API Error",
          description: data.message || "No data returned from API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Manual fetch error:", error);
      toast({
        title: "API Request Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [timeFrame, toast]);

  // Determine if we're in a loading state (either from context or local state)
  const showLoading = isLoading;

  // Transform time-series data for charts
  const completionTrendsData = useMemo(() => {
    if (!analyticsData?.completionTrends) return [];
    
    return analyticsData.completionTrends.map(item => {
      // Extract year and month from period (format: YYYY-MM)
      const [year, month] = item.period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      
      // Format based on time frame
      let displayFormat = "";
      if (timeFrame === "last7days" || timeFrame === "last30days") {
        displayFormat = format(date, "MMM d");
      } else if (timeFrame === "last90days") {
        displayFormat = format(date, "MMM d");
      } else {
        displayFormat = format(date, "MMM yyyy");
      }
      
      return {
        date: displayFormat,
        period: item.period,
        completedCount: item.completedCount,
        averageScore: item.averageScore
      };
    });
  }, [analyticsData?.completionTrends, timeFrame]);

  // Show skeleton during loading
  if (isLoading) {
    return <AnalyticsSkeleton type="quiz" title="Quiz Completion" />;
  }

  // Show not authenticated state for non-students
  if (!isStudent) {
    return (
      <EmptyAnalyticsState
        variant="warning"
        title="Analytics not available"
        description="Quiz completion analytics are only available for student accounts."
      />
    );
  }

  if (error) {
    return (
      <EmptyAnalyticsState
        variant="error"
        title="Error loading analytics data"
        description={error}
        action={{
          label: "Try Again",
          onClick: () => fetchQuizCompletion()
        }}
      />
    );
  }

  // No data state
  if (!analyticsData || !analyticsData.keyMetrics) {
    return (
      <div className="space-y-4">
        <EmptyAnalyticsState
          variant="info"
          title="No quiz completion data available"
          description="We couldn't find any quiz data for your account. This could be because you haven't completed any quizzes yet or there was an issue loading your data."
          action={{
            label: "Try Again",
            onClick: () => fetchQuizCompletion()
          }}
        />
        
        {/* Debug button for development only */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualFetch}
            className="text-xs"
          >
            Check API Directly (Debug)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time frame selection */}
      <div className="flex justify-end">
        <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
          <SelectTrigger className="w-[180px]" id="time-frame-trigger">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} avoidCollisions>
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
            <SelectItem value="last90days">Last 3 Months</SelectItem>
            <SelectItem value="allTime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Key metrics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="mr-2 h-4 w-4 text-emerald-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{analyticsData?.keyMetrics?.completionRate || 0}%</div>
              <Badge 
                variant={
                  !analyticsData?.keyMetrics ? "destructive" :
                  analyticsData.keyMetrics.completionRate >= 80 ? "success" : 
                  analyticsData.keyMetrics.completionRate >= 60 ? "warning" : 
                  "destructive"
                }
              >
                {
                  !analyticsData?.keyMetrics ? "Needs improvement" :
                  analyticsData.keyMetrics.completionRate >= 80 ? "Excellent" : 
                  analyticsData.keyMetrics.completionRate >= 60 ? "Good" : 
                  "Needs improvement"
                }
              </Badge>
            </div>
            <Progress 
              value={analyticsData?.keyMetrics?.completionRate || 0}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {analyticsData?.keyMetrics?.completedQuizzes} of {analyticsData?.keyMetrics?.totalQuizzes} assigned quizzes completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="mr-2 h-4 w-4 text-amber-500" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.keyMetrics?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Your average score on completed quizzes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BookText className="mr-2 h-4 w-4 text-purple-500" />
              Completed Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.keyMetrics?.completedQuizzes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Quizzes successfully completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <School className="mr-2 h-4 w-4 text-blue-500" />
              Average Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.keyMetrics?.averageAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Average attempts per quiz
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs defaultValue="time-series" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time-series" className="flex items-center gap-1">
            <AreaChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Progress Over Time</span>
            <span className="sm:hidden">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="by-category" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">By Category</span>
            <span className="sm:hidden">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="quiz-list" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Quizzes Breakdown</span>
            <span className="sm:hidden">Quizzes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time-series" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quiz Completion Over Time</CardTitle>
              <CardDescription>
                Number of quizzes completed by period
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                {completionTrendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={completionTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "completedCount") return [value, "Quizzes Completed"];
                          if (name === "averageScore") {
                            const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                            return [isNaN(numValue) ? value : numValue.toFixed(1) + "%", "Average Score"];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="completedCount" 
                        name="Completed Quizzes" 
                        stroke="#10b981" 
                        fill="rgba(16, 185, 129, 0.2)" 
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="averageScore"
                        name="Average Score"
                        stroke="#8b5cf6"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No completion data available</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                      Complete more quizzes to see your progress over time.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Completion by Category</CardTitle>
              <CardDescription>
                How well you're completing quizzes across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.categoryAnalysis && analyticsData.categoryAnalysis.length > 0 ? (
                <div className="space-y-6">
                  {analyticsData.categoryAnalysis.map((category, index) => {
                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="font-medium">{category.category}</div>
                            <Badge variant="outline" className="ml-2">{category.completedCount}/{category.quizCount}</Badge>
                          </div>
                          <div className={`text-sm font-semibold ${
                            category.completionRate >= 80 ? "text-green-600" : 
                            category.completionRate >= 60 ? "text-amber-600" : 
                            "text-red-600"
                          }`}>
                            {category.completionRate}%
                          </div>
                        </div>
                        <Progress 
                          value={category.completionRate} 
                          className={`h-2 ${
                            category.completionRate >= 80 ? "bg-green-600" :
                            category.completionRate >= 60 ? "bg-amber-600" :
                            "bg-red-600"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No category data available</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Complete more quizzes to see your performance breakdown by category.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz-list" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>
                Status and performance on individual quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.quizBreakdown && analyticsData.quizBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.quizBreakdown.map((quiz, index) => (
                    <Card key={`${quiz.quizId}-${index}`} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">{quiz.title}</h3>
                            <p className="text-xs text-muted-foreground">{quiz.className}</p>
                          </div>
                          <Badge
                            variant={
                              quiz.completionStatus === "completed" ? "success" :
                              quiz.completionStatus === "in_progress" ? "warning" :
                              "outline"
                            }
                          >
                            {quiz.completionStatus === "completed" ? "Completed" :
                             quiz.completionStatus === "in_progress" ? "In Progress" :
                             "Not Started"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Score: </span>
                            {quiz.bestScore !== null ? `${quiz.bestScore}%` : "N/A"}
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Attempts: </span>
                            {quiz.attemptCount}
                          </div>
                          <div className="col-span-2 text-xs">
                            <span className="text-muted-foreground">Last attempt: </span>
                            {quiz.lastAttemptDate ? format(new Date(quiz.lastAttemptDate), "MMM d, yyyy") : "N/A"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No quiz data available</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    You don't have any assigned quizzes in the selected time period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 