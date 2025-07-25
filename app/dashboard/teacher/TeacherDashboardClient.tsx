"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertCircle, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Layers, 
  LayoutDashboard, 
  LineChart, 
  LinkIcon, 
  Loader2, 
  LucideIcon, 
  Plus, 
  ScrollText, 
  Users 
} from "lucide-react";

/**
 * Client component for Teacher Dashboard
 * Displays a summary of classes, quizzes, and student performance
 */
export function TeacherDashboardClient() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    activeClasses: 0,
    totalStudents: 0,
    activeQuizzes: 0,
    completedQuizzes: 0,
    recentClasses: [],
    recentQuizzes: [],
    classPerformance: [],
    studentEngagement: 0,
    messages: [],
  });
  
  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/teacher/dashboard");
        
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
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
    
    fetchDashboardData();
  }, [toast]);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Top metrics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Classes"
          value={dashboardData.activeClasses}
          description="Classes you're currently teaching"
          icon={Layers}
          color="bg-emerald-100 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-400"
          onClick={() => router.push("/dashboard/teacher/classes")}
        />
        
        <MetricCard
          title="Total Students"
          value={dashboardData.totalStudents}
          description="Students enrolled in your classes"
          icon={Users}
          color="bg-blue-100 text-blue-700 dark:bg-blue-700/20 dark:text-blue-400"
        />
        
        <MetricCard
          title="Active Quizzes"
          value={dashboardData.activeQuizzes}
          description="Quizzes available to students"
          icon={FileText}
          color="bg-purple-100 text-purple-700 dark:bg-purple-700/20 dark:text-purple-400"
          onClick={() => router.push("/dashboard/teacher/quizzes")}
        />
        
        <MetricCard
          title="Student Engagement"
          value={`${dashboardData.studentEngagement}%`}
          description="Average student participation"
          icon={LineChart}
          color="bg-amber-100 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400"
        />
      </div>
      
      {/* Main content tabs */}
      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="quizzes">Recent Quizzes</TabsTrigger>
          <TabsTrigger value="performance">Class Performance</TabsTrigger>
        </TabsList>
        
        {/* Classes tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Classes</h2>
            <Button onClick={() => router.push("/dashboard/teacher/classes/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          </div>
          
          {dashboardData.recentClasses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Class cards would go here */}
              <Card>
                <CardHeader>
                  <CardTitle>No classes yet</CardTitle>
                  <CardDescription>Create your first class to get started</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/teacher/classes/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No classes yet</CardTitle>
                <CardDescription>Create your first class to get started</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/teacher/classes/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Class
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Quizzes tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Quizzes</h2>
            <Button onClick={() => router.push("/dashboard/teacher/quizzes/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </div>
          
          {dashboardData.recentQuizzes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Quiz cards would go here */}
              <Card>
                <CardHeader>
                  <CardTitle>No quizzes yet</CardTitle>
                  <CardDescription>Create your first quiz to get started</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/teacher/quizzes/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quiz
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No quizzes yet</CardTitle>
                <CardDescription>Create your first quiz to get started</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/teacher/quizzes/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Performance tab */}
        <TabsContent value="performance" className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Class Performance</h2>
          
          {dashboardData.classPerformance.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Performance charts would go here */}
              <Card>
                <CardHeader>
                  <CardTitle>No performance data yet</CardTitle>
                  <CardDescription>Performance data will appear once students complete quizzes</CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No performance data yet</CardTitle>
                <CardDescription>Performance data will appear once students complete quizzes</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Quick actions section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            title="Create a Class"
            description="Set up a new class for your students"
            icon={Users}
            onClick={() => router.push("/dashboard/teacher/classes/create")}
          />
          
          <ActionCard
            title="Create a Quiz"
            description="Develop assessments for your classes"
            icon={FileText}
            onClick={() => router.push("/dashboard/teacher/quizzes/create")}
          />
          
          <ActionCard
            title="Question Bank"
            description="Manage your question collections"
            icon={BookOpen}
            onClick={() => router.push("/dashboard/teacher/questions")}
          />
          
          <ActionCard
            title="View Analytics"
            description="Detailed performance metrics"
            icon={LineChart}
            onClick={() => router.push("/dashboard/teacher/analytics")}
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

function MetricCard({ title, value, description, icon: Icon, color, onClick }: MetricCardProps) {
  return (
    <Card className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-full p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

function ActionCard({ title, description, icon: Icon, onClick }: ActionCardProps) {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
      <CardHeader className="pb-2">
        <Icon className="h-5 w-5 mb-2 text-primary" />
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top metrics skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Quick actions skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-5 mb-2" />
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 