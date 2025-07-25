"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatsSection } from "./stats-section";
import { ActivitySection } from "./activity-section";
import { PerformanceCharts } from "./performance-charts";
import { StudentSection } from "./student-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarRange,
  CheckCircle2,
  Clock,
  Layers,
  Users
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  overview: {
    activeClasses: number;
    totalStudents: number;
    activeQuizzes: number;
    completedQuizzes: number;
    engagementRate: number;
  };
  recentClasses: any[];
  recentQuizzes: any[];
  classPerformance: any[];
  activityFeed: any[];
  studentPerformance: any[];
  categoryDistribution: any[];
  upcomingDeadlines: any[];
}

interface TeacherDashboardContentProps {
  initialData?: DashboardData;
}

export default function TeacherDashboardContent({ initialData }: TeacherDashboardContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard data if no initial data was provided
  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, [initialData]);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/teacher/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh dashboard data
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state if no data available
  if (!dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Dashboard</CardTitle>
          <CardDescription>Unable to load dashboard data</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleRefresh}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for different dashboard views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Performance
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Activity
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Section */}
          <StatsSection overview={dashboardData.overview} />
          
          {/* Two Column Layout */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Performance Charts (2 columns on large screens) */}
            <div className="lg:col-span-2">
              <PerformanceCharts 
                classPerformance={dashboardData.classPerformance}
                categoryDistribution={dashboardData.categoryDistribution}
              />
            </div>
            
            {/* Activity and Students Section (1 column) */}
            <div className="space-y-4">
              {/* Top Students Section */}
              <StudentSection students={dashboardData.studentPerformance} />
              
              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.upcomingDeadlines.length > 0 ? (
                      dashboardData.upcomingDeadlines.map((deadline) => (
                        <div key={deadline.id} className="flex items-start space-x-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{deadline.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {deadline.class?.name || 'No class'} • 
                              {new Date(deadline.endDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PerformanceCharts 
              classPerformance={dashboardData.classPerformance}
              categoryDistribution={dashboardData.categoryDistribution}
              fullWidth
            />
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <ActivitySection 
            activityFeed={dashboardData.activityFeed}
            recentClasses={dashboardData.recentClasses}
            recentQuizzes={dashboardData.recentQuizzes}
          />
        </TabsContent>
      </Tabs>
      
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Button 
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-1"
          onClick={() => router.push('/dashboard/teacher/classes/create')}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Create Class</span>
        </Button>
        <Button 
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-1"
          onClick={() => router.push('/dashboard/teacher/quizzes/create')}
        >
          <Layers className="h-5 w-5" />
          <span className="text-xs">Create Quiz</span>
        </Button>
        <Button 
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-1"
          onClick={() => router.push('/dashboard/teacher/classes')}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">View Classes</span>
        </Button>
        <Button 
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-1"
          onClick={() => router.push('/dashboard/teacher/students')}
        >
          <CalendarRange className="h-5 w-5" />
          <span className="text-xs">View Students</span>
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      
      {/* Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
} 