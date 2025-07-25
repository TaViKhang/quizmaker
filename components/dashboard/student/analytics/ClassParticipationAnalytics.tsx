"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Clock,
  CalendarClock,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  MessageSquare,
  Calendar,
  AlertCircle,
  Timer,
  BarChart2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { 
  useAnalytics, 
  ClassParticipationData,
  generateEmptyClassParticipationData,
  TimeFrame,
  convertToLegacyFormat,
  LegacyClassParticipationData
} from "@/components/providers/analytics-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
import { AnalyticsSkeleton } from './AnalyticsSkeletons';

interface ClassParticipationAnalyticsProps {
  /**
   * Total number of classes joined (fallback value)
   */
  classesJoined?: number;
  /**
   * Loading state
   */
  isLoading?: boolean;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

// Helper function to format seconds into hours and minutes
const formatTimeSpent = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

// Helper to format dates for different time frames
const formatDateLabel = (dateStr: string, timeFrame: TimeFrame): string => {
  try {
    // Format depends on date format and time frame
    if (timeFrame === "last7days" || timeFrame === "last30days") {
      // For days format: "yyyy-MM-dd" to "MMM d"
      return format(parseISO(dateStr), "MMM d");
    } else if (timeFrame === "last90days") {
      // For weeks format: "yyyy-MM-dd" (start of week) to "MMM d"
      return format(parseISO(dateStr), "MMM d");
    } else {
      // For months format: "yyyy-MM" to "MMM yyyy"
      return format(parseISO(`${dateStr}-01`), "MMM yyyy");
    }
  } catch (e) {
    return dateStr;
  }
};

/**
 * Detailed class participation analytics component for student dashboard
 */
export function ClassParticipationAnalytics({
  classesJoined = 0,
}: ClassParticipationAnalyticsProps) {
  const { 
    classParticipationData: analyticsData,
    classParticipationError: error,
    isLoadingClassParticipation: isLoadingData,
    timeFrame,
    setTimeFrame,
    fetchClassParticipation
  } = useAnalytics();
  
  const { isStudent } = useAuth();
  
  // State to track if initial fetch has been done
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  
  // Fetch analytics data when component mounts - only if user is a student
  useEffect(() => {
    // Only try to fetch data if user is a student and we haven't fetched yet
    if (!hasInitialFetch && isStudent && !isLoadingData) {
      fetchClassParticipation().finally(() => {
        setHasInitialFetch(true);
      });
    }
  }, [fetchClassParticipation, hasInitialFetch, isStudent, isLoadingData]);
  
  // Handle time frame change
  const handleTimeFrameChange = useCallback((value: string) => {
    if (value !== timeFrame) {
      setTimeFrame(value as TimeFrame);
    }
  }, [timeFrame, setTimeFrame]);
  
  // Use fallback data if nothing is available
  const data = analyticsData || generateEmptyClassParticipationData();
  
  // Generate legacy format data for backward compatibility with existing charts
  const legacyData: LegacyClassParticipationData = convertToLegacyFormat(data);
  
  // Combined loading state
  const isDataLoading = isLoadingData;

  // Show loading state
  if (isDataLoading) {
    return <AnalyticsSkeleton type="class" title="Class Participation" />;
  }

  if (!isStudent) {
    return (
      <EmptyAnalyticsState
        variant="warning"
        title="Analytics not available"
        description="Class participation analytics are only available for student accounts."
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <EmptyAnalyticsState
        variant="error"
        title="Error loading class analytics"
        description={error || "There was a problem loading your class participation data."}
        action={{
          label: "Try Again",
          onClick: () => fetchClassParticipation()
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Key metrics cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.keyMetrics.activeClasses}</div>
            <p className="text-xs text-muted-foreground">
              Currently active classes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.keyMetrics.overallEngagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall quiz completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTimeSpent(data.keyMetrics.totalStudyTimeSeconds)}</div>
            <p className="text-xs text-muted-foreground">
              Time spent on quizzes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.classPerformanceBreakdown.length > 0 
                ? `${Math.round(data.classPerformanceBreakdown.reduce((sum, item) => sum + item.classCompletionRate, 0) / data.classPerformanceBreakdown.length)}%`
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average class completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Participation Over Time Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-blue-500" />
                Participation Over Time
              </CardTitle>
              <CardDescription>
                Your quiz completions over the selected time period
              </CardDescription>
            </div>
            
            <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select time frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="allTime">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {data.participationOverTime.length === 0 || data.participationOverTime.every(item => item.completedQuizzes === 0) ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
              <LineChartIcon className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
              <h3 className="text-lg font-semibold">No participation data yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Start completing quizzes to see your participation trends over time.
              </p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.participationOverTime}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} quizzes`, 'Completed']}
                    labelFormatter={(value, payload) => {
                      if (payload && payload.length > 0 && payload[0].payload) {
                        const originalDate = payload[0].payload.date;
                        return `Date: ${formatDateLabel(originalDate, timeFrame)}`;
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completedQuizzes"
                    name="Completed Quizzes"
                    stroke="#10b981"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="performance" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Class Performance</span>
              <span className="sm:hidden">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Activity Distribution</span>
              <span className="sm:hidden">Activities</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Class Performance Breakdown</CardTitle>
              <CardDescription>
                Your quiz completion rates across different classes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {data.classPerformanceBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                  <Users className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
                  <h3 className="text-lg font-semibold">No class data yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Start participating in your classes by taking quizzes to see your performance analytics here.
                  </p>
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.classPerformanceBreakdown}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} label={{ value: 'Completion Rate (%)', position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="className" type="category" width={100} />
                      <Tooltip formatter={(value, name) => {
                        if (name === "classCompletionRate") return [`${value}%`, 'Completion Rate'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Bar 
                        dataKey="classCompletionRate" 
                        name="Completion Rate" 
                        fill="#10b981" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Class Activity Distribution</CardTitle>
              <CardDescription>
                How your participation is distributed between active engagement and passive viewing
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {legacyData.classActivities.every(activity => activity.value === 0) ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                  <PieChartIcon className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
                  <h3 className="text-lg font-semibold">No activity data yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Start participating in your classes to see how your activities are distributed.
                  </p>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" className="max-w-[500px] mx-auto">
                    <PieChart>
                      <Pie
                        data={legacyData.classActivities}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {legacyData.classActivities.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class Time Spent Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-500" />
            Time Spent by Class
          </CardTitle>
          <CardDescription>
            Detailed breakdown of your study time across classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.classPerformanceBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
              <h3 className="text-lg font-semibold">No time data available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Once you spend time on quizzes, your study time by class will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Quizzes Completed</TableHead>
                  <TableHead>Quizzes Assigned</TableHead>
                  <TableHead className="text-right">Time Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.classPerformanceBreakdown.map((classData) => (
                  <TableRow key={classData.classId}>
                    <TableCell className="font-medium">{classData.className}</TableCell>
                    <TableCell>{classData.quizzesCompletedByStudent}</TableCell>
                    <TableCell>{classData.quizzesAssigned}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeSpent(classData.timeSpentInClassSeconds)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 