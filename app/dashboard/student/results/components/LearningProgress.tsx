"use client";

import { useEffect, useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  TooltipProps 
} from "recharts";
import { useAnalytics } from "@/components/providers/analytics-provider";
import { BookOpen, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

interface LearningProgressProps {
  timeFrame: string;
  selectedSubject?: string;
}

export default function LearningProgress({ 
  timeFrame, 
  selectedSubject 
}: LearningProgressProps) {
  const [activeTab, setActiveTab] = useState("progress");
  
  const { 
    quizCompletionData,
    isLoadingQuizCompletion,
    quizCompletionError,
    fetchQuizCompletion,
    timeFrame: currentAnalyticsTimeFrame,
    setTimeFrame: setAnalyticsTimeFrame
  } = useAnalytics();
  
  // Fetch data when timeFrame changes or on initial load
  useEffect(() => {
    // Update the analytics provider timeFrame when our prop changes
    if (currentAnalyticsTimeFrame !== timeFrame) {
      setAnalyticsTimeFrame(timeFrame as any);
    }
    
    // Always fetch fresh data when params change
    fetchQuizCompletion();
  }, [timeFrame, selectedSubject, fetchQuizCompletion, currentAnalyticsTimeFrame, setAnalyticsTimeFrame]);
  
  // Use Raw data or provide default if not available
  const completionTrends = quizCompletionData?.completionTrends || [];
  const categoryAnalysis = quizCompletionData?.categoryAnalysis || [];
  
  // Generate fallback data for visualizations if we have some data but not the exact visualization data
  let usableCompletionTrends = completionTrends;
  if (completionTrends.length === 0 && quizCompletionData?.keyMetrics && quizCompletionData.keyMetrics.completedQuizzes > 0) {
    // Generate minimal placeholder data based on overall metrics
    const today = new Date();
    usableCompletionTrends = [
      {
        period: format(today, 'yyyy-MM-dd'),
        completedCount: quizCompletionData.keyMetrics.completedQuizzes || 0,
        averageScore: quizCompletionData.keyMetrics.averageScore || 0
      }
    ];
  }
  
  // Filter data based on selected subject
  const filteredCategoryAnalysis = !selectedSubject 
    ? categoryAnalysis 
    : categoryAnalysis.filter(item => 
        item.category.toLowerCase() === selectedSubject.toLowerCase()
      );
  
  // Format date for X-axis
  const formatXAxis = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (timeFrame === 'last7days') {
        return format(date, 'EEE'); // Mon, Tue, etc.
      } else if (timeFrame === 'last30days') {
        return format(date, 'dd MMM'); // 01 Jan
      } else {
        return format(date, 'MMM yy'); // Jan 22
      }
    } catch (e) {
      return dateStr;
    }
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border rounded-md shadow-md">
          <p className="font-medium mb-1">{formatXAxis(label)}</p>
          {payload.map((entry, index) => (
            <p 
              key={`item-${index}`}
              className="text-sm flex items-center gap-1"
              style={{ color: entry.color }}
            >
              <span>{entry.name}: </span>
              <span className="font-medium">
                {entry.name?.includes('Rate') || entry.name?.includes('Score') 
                  ? `${entry.value}%` 
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Show loading state
  if (isLoadingQuizCompletion) {
    return (
      <>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>Your progress over time</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-8">
            <Skeleton className="h-10 w-60" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </CardContent>
      </>
    );
  }
  
  // Show error state
  if (quizCompletionError) {
    return (
      <>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>Your progress over time</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-[300px] flex flex-col items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-lg font-medium text-center mb-2">Unable to load progress data</p>
            <p className="text-muted-foreground text-center">
              There was an error loading your learning progress. Please try again later.
            </p>
          </div>
        </CardContent>
      </>
    );
  }
  
  // Empty state
  const noData = (completionTrends.length === 0 && categoryAnalysis.length === 0);
  if (noData) {
    return (
      <>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>Your progress over time</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-[300px] flex flex-col items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
            <p className="text-lg font-medium text-center mb-2">No progress data available</p>
            <p className="text-muted-foreground text-center max-w-md">
              Complete more assessments to track your learning progress over time.
            </p>
          </div>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Learning Progress</CardTitle>
        <CardDescription>Track your performance trends over time</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <Tabs defaultValue="progress" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Completion Trends</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Category Analysis</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress" className="mt-0">
            {usableCompletionTrends.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={usableCompletionTrends}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={formatXAxis}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                      domain={[0, 'dataMax + 2']}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="completedCount"
                      name="Completed Assessments"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      yAxisId="left"
                    />
                    <Area
                      type="monotone"
                      dataKey="averageScore"
                      name="Average Score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      yAxisId="right"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                <p className="text-lg font-medium text-center mb-2">Not enough trend data</p>
                <p className="text-muted-foreground text-center max-w-md">
                  Complete more assessments to see your progress trends over time.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="categories" className="mt-0">
            {filteredCategoryAnalysis.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredCategoryAnalysis}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }} 
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="quizCount" 
                      name="Total Quizzes" 
                      fill="#94a3b8" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="completedCount" 
                      name="Completed" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="completionRate" 
                      name="Completion Rate" 
                      fill="#f59e0b" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="averageScore" 
                      name="Average Score" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                <p className="text-lg font-medium text-center mb-2">
                  {selectedSubject 
                    ? `No data available for ${selectedSubject}` 
                    : "No category data available"}
                </p>
                <p className="text-muted-foreground text-center max-w-md">
                  {selectedSubject 
                    ? "Try selecting a different subject or time period"
                    : "Complete more assessments across different categories"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
} 