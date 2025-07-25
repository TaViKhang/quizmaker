"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
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
import { format, subMonths, isBefore, isAfter, parseISO } from "date-fns";
import {
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
  Cell,
} from "recharts";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  AlarmClock,
  Brain,
  Search,
  SortAsc,
  SortDesc,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAnalyticsFilter, FilterOptions } from "@/hooks/use-analytics-filter";
import { useAnalytics } from "@/components/providers/analytics-provider";
import { TimePointScoreData, SubjectScorePerformance, TimeFrame } from "@/components/providers/analytics-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
import { AnalyticsSkeleton } from './AnalyticsSkeletons';

/**
 * ScoreAnalytics Component
 * Displays detailed score analytics visualization for the student
 */
export function ScoreAnalytics() {
  // --- Stage 1: Core State and Effect Hooks ---
  const { 
    scoreAnalyticsData,
    scoreAnalyticsError,
    isLoadingScoreAnalytics,
    timeFrame,
    setTimeFrame,
    fetchScoreAnalytics
  } = useAnalytics();
  
  const { isStudent } = useAuth();
  
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  useEffect(() => {
    if (!hasInitialFetch && isStudent && !isLoadingScoreAnalytics) {
      console.log('[ScoreAnalytics] Fetching initial score analytics data...');
      fetchScoreAnalytics().finally(() => {
        setHasInitialFetch(true);
      });
    }
  }, [fetchScoreAnalytics, hasInitialFetch, isStudent, isLoadingScoreAnalytics]);

  const handleTimeFrameChange = (value: string) => {
    console.log(`[ScoreAnalytics] Time frame changed to: ${value}`);
    setTimeFrame(value as TimeFrame);
  };

  // --- Stage 2: Memoization/Callback Hooks and Custom Hooks that depend on Stage 1 ---
  const timeSeriesDataForHooks = scoreAnalyticsData?.timeSeriesData || [];
  const subjectPerformanceForHooks = scoreAnalyticsData?.subjectPerformance || [];

  const filterTimeSeriesData = useCallback((data: TimePointScoreData[], filters: FilterOptions) => {
    let filteredData = [...data];
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.date.toLowerCase().includes(term)
      );
    }
    return filteredData;
  }, []); 
  
  const filterSubjectData = useCallback((data: SubjectScorePerformance[], filters: FilterOptions) => {
    let filteredData = [...data];
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.subject.toLowerCase().includes(term)
      );
    }
    filteredData.sort((a, b) => {
      return filters.sortDirection === "asc" 
        ? a.averageScore - b.averageScore 
        : b.averageScore - a.averageScore;
    });
    return filteredData;
  }, []);

  const {
    filters: timeFilters,
    filteredData: filteredTimeData, 
    updateFilter: updateTimeFilter,
    resetFilters: resetTimeFilters,
  } = useAnalyticsFilter(timeSeriesDataForHooks, filterTimeSeriesData);

  const {
    filters: subjectFilters,
    filteredData: filteredSubjectData, // Using this name for consistency with original chart
    updateFilter: updateSubjectFilter,
    resetFilters: resetSubjectFilters,
  } = useAnalyticsFilter(subjectPerformanceForHooks, filterSubjectData);

  const getActiveFilterCount = useCallback((filters: FilterOptions): number => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.sortDirection !== "desc") count++;
    return count;
  }, []);

  const sortedSubjects = useMemo(() => 
    [...filteredSubjectData].sort((a, b) => b.averageScore - a.averageScore), 
    [filteredSubjectData]
  );
  
  // --- Stage 3: Conditional rendering checks ---
  const isComponentLoading = isLoadingScoreAnalytics;
  if (isComponentLoading) {
    return <AnalyticsSkeleton type="score" title="Score Analytics" />;
  }

  if (scoreAnalyticsError) {
    return (
      <EmptyAnalyticsState
        variant="error"
        title="Error Loading Analytics"
        description={scoreAnalyticsError || "There was a problem loading your score analytics. Please try again later."}
        action={{
          label: "Try Again",
          onClick: () => fetchScoreAnalytics()
        }}
      />
    );
  }

  if (!isStudent) {
    return (
      <EmptyAnalyticsState
        variant="warning"
        title="Analytics not available"
        description="Score analytics are only available for student accounts."
      />
    );
  }
  
  if (scoreAnalyticsData === null) {
    return (
      <EmptyAnalyticsState
        variant="info"
        title="No Score Data Yet"
        description="Start completing quizzes and assessments to see your score analytics and track your progress here."
      />
    );
  }

  // --- Stage 4: Prepare data for rendering (scoreAnalyticsData is non-null here) ---
  const timeSeriesData = scoreAnalyticsData.timeSeriesData || [];
  const subjectPerformance = scoreAnalyticsData.subjectPerformance || [];
  // Use original default object for overallStats if scoreAnalyticsData.overallStats is missing
  const overallStats = scoreAnalyticsData.overallStats || {
    averageScore: 0,
    previousAverageScore: null,
    improvement: null,
    totalAssessments: 0,
    currentPeriodLabel: "No data available",
    previousPeriodLabel: null,
  };

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[ScoreAnalytics] Rendering with data:', {
      hasData: !!scoreAnalyticsData,
      timeSeriesLength: timeSeriesData.length,
      subjectPerformanceLength: subjectPerformance.length,
      averageScore: overallStats.averageScore,
      totalAssessments: overallStats.totalAssessments,
      currentPeriodLabel: overallStats.currentPeriodLabel
    });
  }

  const hasSubjectData = subjectPerformance.length > 0;
  const showImprovement = overallStats.improvement !== null && overallStats.previousAverageScore !== null;
  
  const improvementDisplay = showImprovement 
    ? overallStats.improvement! > 0 
      ? `+${overallStats.improvement!.toFixed(1)}%`
      : `${overallStats.improvement!.toFixed(1)}%`
    : null;
  
  const improvementColor = showImprovement 
    ? overallStats.improvement! > 0 
      ? "text-success"
      : overallStats.improvement! < 0 
        ? "text-destructive"
        : "text-muted-foreground"
    : "text-muted-foreground";

  const timePeriodLabels = {
    last7days: "Last 7 Days",
    last30days: "Last 30 Days",
    last90days: "Last 3 Months",
    allTime: "All Time"
  };

  const strongestSubject = sortedSubjects.length > 0 ? sortedSubjects[0] : null;
  const weakestSubject = sortedSubjects.length > 0 ? sortedSubjects[sortedSubjects.length - 1] : null;

  const colors = {
    score: "#10b981", // emerald-500
    average: "#94a3b8", // slate-400
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const formatTimeSeriesForChart = (data: TimePointScoreData[]) => {
    return data.map(item => ({
      date: item.date,
      score: item.averageScore,
      assessmentCount: item.assessmentCount
    }));
  };
  
  const availableSubjects = Array.from(
    new Set(subjectPerformance.map((item) => item.subject))
  );

  // --- Stage 5: Main JSX Return ---
  return (
    <div className="space-y-6">
      {/* Time frame selector and filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Score Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {overallStats.currentPeriodLabel}
          </p>
        </div>
        
        <div className="flex gap-2 self-start">
          <Tabs value={timeFrame} onValueChange={handleTimeFrameChange}>
            <TabsList>
              <TabsTrigger value="last7days">7 Days</TabsTrigger>
              <TabsTrigger value="last30days">30 Days</TabsTrigger>
              <TabsTrigger value="last90days">3 Months</TabsTrigger>
              <TabsTrigger value="allTime">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Average Score Card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Average Score</CardTitle>
              <CardDescription>
                {overallStats.currentPeriodLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold">
                    {Math.round(overallStats.averageScore)}%
                  </span>
                  {showImprovement && (
                    <div className={`flex items-center ${improvementColor}`}>
                      <span className="flex items-center mr-1">
                        {overallStats.improvement! > 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1 text-destructive" />
                        )}
                        {improvementDisplay}
                      </span>
                      {overallStats.previousPeriodLabel && `vs ${overallStats.previousPeriodLabel}`}
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <Progress
                value={Math.min(overallStats.averageScore, 100)}
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Strongest Subject Card */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Strongest Subject
              </CardTitle>
              <CardDescription>Your highest performing area</CardDescription>
            </CardHeader>
            <CardContent>
              {strongestSubject ? (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold">
                      {Math.round(strongestSubject.averageScore)}%
                    </span>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {strongestSubject.subject}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        {strongestSubject.assessmentCount} assessments
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-bold text-muted-foreground">No data available</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weakest Subject Card */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Focus Area
              </CardTitle>
              <CardDescription>Subject needing improvement</CardDescription>
            </CardHeader>
            <CardContent>
              {weakestSubject ? (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold">
                      {Math.round(weakestSubject.averageScore)}%
                    </span>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {weakestSubject.subject}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        {weakestSubject.assessmentCount} assessments
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-bold text-muted-foreground">No data available</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Over Time Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>
                  Your score trends for {overallStats.currentPeriodLabel}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 py-1">
                  <LineChartIcon className="h-3.5 w-3.5" />
                  <span>{timeSeriesData.length} data points</span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {timeSeriesData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatTimeSeriesForChart(timeSeriesData)}
                    margin={{ top: 5, right: 30, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "#fff", 
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        border: "none"
                      }}
                      formatter={(value: any) => [`${value}%`, "Score"]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Your Score"
                      stroke={colors.score}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <LineChartIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-2 text-lg font-medium">No data available for this period</p>
                  <p className="text-muted-foreground">
                    Complete more assessments to see your performance over time
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Subject Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>
                  Your performance across different subjects
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {/* Simplified Subject Filter Bar */}
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative w-[180px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search subjects..." 
                      className="pl-8 h-9 text-sm"
                      value={subjectFilters.searchTerm || ''}
                      onChange={(e) => updateSubjectFilter('searchTerm', e.target.value)} 
                    />
                  </div>
                  
                  {/* Sort Toggle Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSubjectFilter('sortDirection', subjectFilters.sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="h-9 px-3"
                    title={subjectFilters.sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                  >
                    {subjectFilters.sortDirection === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSubjectData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredSubjectData.map(item => ({
                      subject: item.subject,
                      score: Math.round(item.averageScore),
                      assessmentCount: item.assessmentCount,
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                    barSize={40}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="subject"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value: any, name: string, props: any) => {
                        if (name === "score") {
                          return [`${value}%`, "Average Score"];
                        }
                        return [value, name];
                      }}
                      contentStyle={{ 
                        backgroundColor: "#fff", 
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        border: "none"
                      }}
                      cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                    />
                    <Legend formatter={(value) => value === "score" ? "Average Score" : value} />
                    <Bar dataKey="score" name="score">
                      {filteredSubjectData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors.score}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-2 text-lg font-medium">
                    No subject data available
                  </p>
                  <p className="text-muted-foreground">
                    Complete assessments across different subjects to see analysis
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 