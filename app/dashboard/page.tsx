import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { 
  BookOpen, 
  ClipboardCheck, 
  BarChart, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  PlusCircle
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/**
 * Root dashboard page that redirects based on user role
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // Redirect to role-specific dashboard
  switch (session.user.role) {
    case Role.STUDENT:
      redirect("/dashboard/student");
      break;
    case Role.TEACHER:
      redirect("/dashboard/teacher");
      break;
    default:
      // If no specific role or unexpected role, show role selection
      redirect("/auth/select-role");
  }
}

function StudentDashboard({ user }: { user: any }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No tests completed yet
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              No scores available yet
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No upcoming tests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0h</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Upcoming Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold">No upcoming tests</h3>
                    <p className="text-xs text-muted-foreground max-w-[16rem]">
                      You don't have any upcoming tests. When you're assigned tests, 
                      they will appear here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>
                  Your most recent test results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold">No results yet</h3>
                    <p className="text-xs text-muted-foreground max-w-[16rem]">
                      Your test results will appear here after you complete 
                      a test.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Tests</CardTitle>
              <CardDescription>
                Tests assigned to you that are ready to take
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                <div className="flex flex-col items-center gap-1 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <h3 className="font-semibold">No tests available</h3>
                  <p className="text-xs text-muted-foreground max-w-[16rem]">
                    You don't have any tests available. Please check back later.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Your completed test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                <div className="flex flex-col items-center gap-1 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                  <h3 className="font-semibold">No results available</h3>
                  <p className="text-xs text-muted-foreground max-w-[16rem]">
                    You haven't completed any tests yet. Your results will 
                    appear here after completing a test.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeacherDashboard({ user }: { user: any }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Information
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="w-16 h-16 border">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase() || "T"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-bold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs font-medium">
                  <span className="rounded-md bg-primary/10 text-primary px-1 py-0.5">
                    Teacher
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quizzes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No quizzes created yet
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/teacher/quizzes">
                View all
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Tests
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No active tests
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/teacher/tests">
                View all
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Students
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              No students yet
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/teacher/students">
                View list
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold">No recent activity</h3>
                    <p className="text-xs text-muted-foreground max-w-[16rem]">
                      Your recent activities will appear here as you create and manage quizzes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <BarChart className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold">No data available</h3>
                    <p className="text-xs text-muted-foreground max-w-[16rem]">
                      Student performance data will appear here once you have created tests and students have taken them.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Quizzes</CardTitle>
              <CardDescription>
                Manage the quizzes you've created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                <div className="flex flex-col items-center gap-1 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <h3 className="font-semibold">No quizzes created</h3>
                  <p className="text-xs text-muted-foreground max-w-[16rem]">
                    You haven't created any quizzes yet. Click the "Create Quiz" button to get started.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/teacher/create-quiz">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Quiz
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tests</CardTitle>
              <CardDescription>
                Tests you've scheduled for students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                <div className="flex flex-col items-center gap-1 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                  <h3 className="font-semibold">No tests scheduled</h3>
                  <p className="text-xs text-muted-foreground max-w-[16rem]">
                    You haven't scheduled any tests yet. Create a quiz first, then schedule a test.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from tests taken by students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 border rounded-md border-dashed">
                <div className="flex flex-col items-center gap-1 text-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  <h3 className="font-semibold">No results available</h3>
                  <p className="text-xs text-muted-foreground max-w-[16rem]">
                    No students have completed tests yet. Results will appear here after students complete tests.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 