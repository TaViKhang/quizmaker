"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useClassApi } from "@/hooks/use-class-api";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Users,
  FileText,
  BookOpen,
  Calendar,
  Bell,
  Loader2,
  ChevronRight,
  Award,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  BellOff,
  FileQuestion,
  LayoutDashboard,
  BellRing,
  FolderOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MaterialType } from "@prisma/client";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
import { ClassMaterials } from "@/components/dashboard/student/class-materials";
import { ClassAnnouncements } from "@/components/dashboard/student/class-announcements";

// Dashboard skeleton while loading
function ClassDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Material icon component
function MaterialIcon({ type }: { type: MaterialType }) {
  switch (type) {
    case 'FILE':
      return <FileText className="h-4 w-4" />;
    case 'LINK':
      return <LinkIcon className="h-4 w-4" />;
    case 'VIDEO_EMBED':
      return <BookOpen className="h-4 w-4" />;
    case 'DOCUMENT':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

// Quiz status badge component
function QuizStatusBadge({ status }: { status: 'upcoming' | 'ongoing' | 'ended' }) {
  switch (status) {
    case 'upcoming':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>;
    case 'ongoing':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Progress</Badge>;
    case 'ended':
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Ended</Badge>;
  }
}

// Main class dashboard component
export function ClassDashboard() {
  const params = useParams();
  const classId = params.classId as string;
  const { fetchClassDashboard, classDashboard, isLoading, error } = useClassApi();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch dashboard data on component mount
  useEffect(() => {
    if (classId) {
      fetchClassDashboard(classId);
    }
  }, [classId, fetchClassDashboard]);
  
  // Show error toast if there is an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading class dashboard",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Add debug logging for data received
  useEffect(() => {
    if (classDashboard) {
      console.log("Class Dashboard Data:", classDashboard);
      
      // Check specifically for quizzes data
      if (classDashboard.content && classDashboard.content.upcomingQuizzes) {
        console.log("Quizzes data:", classDashboard.content.upcomingQuizzes);
        console.log("Number of quizzes:", classDashboard.content.upcomingQuizzes.length);
        
        // Log each quiz's status and hasAttempted flag
        classDashboard.content.upcomingQuizzes.forEach((quiz, index) => {
          console.log(`Quiz ${index + 1} - ${quiz.title}:`);
          console.log(`  - Status: ${quiz.status}`);
          console.log(`  - Has attempted: ${quiz.hasAttempted}`);
          console.log(`  - Start date: ${quiz.startDate}`);
          console.log(`  - End date: ${quiz.endDate}`);
        });
      }
    }
  }, [classDashboard]);

  // Format dates for easy display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleString();
  };
  
  if (isLoading || !classDashboard) {
    return <ClassDashboardSkeleton />;
  }

  // Separate quizzes into categories
  const upcomingQuizzes = classDashboard.content.upcomingQuizzes.filter(
    quiz => quiz.status === 'upcoming' && !quiz.hasAttempted
  );
  
  const ongoingQuizzes = classDashboard.content.upcomingQuizzes.filter(
    quiz => quiz.status === 'ongoing' && !quiz.hasAttempted
  );
  
  const completedQuizzes = classDashboard.content.upcomingQuizzes.filter(
    quiz => quiz.hasAttempted || quiz.status === 'ended'
  );
  
  // Combine for "All Quizzes" display
  const allQuizzes = [
    ...upcomingQuizzes.map(quiz => ({...quiz, displayStatus: 'Upcoming' as const})), 
    ...ongoingQuizzes.map(quiz => ({...quiz, displayStatus: 'In Progress' as const})),
    ...completedQuizzes.map(quiz => ({...quiz, displayStatus: 'Completed' as const}))
  ];
  
  return (
    <div className="space-y-6">
      {/* Class header */}
      <div className="bg-card rounded-lg p-6 border shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold tracking-tight">{classDashboard.class.name}</h1>
              <Badge variant={(classDashboard as any).class.type === 'PUBLIC' ? 'default' : 'secondary'}>
                {(classDashboard as any).class.type || "PRIVATE"}
              </Badge>
            </div>
        <p className="text-muted-foreground">
          {classDashboard.class.subject || "No subject"} • Teacher: {classDashboard.teacher.name || "Unknown"}
        </p>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>
        
        {/* Class description (brief) */}
        {classDashboard.class.description && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {classDashboard.class.description}
          </div>
        )}
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Upcoming Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{upcomingQuizzes.length + ongoingQuizzes.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2" />
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{classDashboard.dashboard.recentAnnouncementCount}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">Learning Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">{classDashboard.dashboard.materialsCount}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">Classmates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{classDashboard.dashboard.classmateCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Content tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="bg-card border rounded-md p-1">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="overview" className="rounded-sm">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="rounded-sm">
              <FileQuestion className="h-4 w-4 mr-2" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-sm">
              <BellRing className="h-4 w-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="materials" className="rounded-sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="classmates" className="rounded-sm">
              <Users className="h-4 w-4 mr-2" />
              Classmates
            </TabsTrigger>
        </TabsList>
        </div>
        
        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Class information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Class Information</CardTitle>
                <CardDescription>Details about this class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {classDashboard.class.description || "No description provided"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Teacher</h3>
                  <div className="flex items-center gap-2">
                    {classDashboard.teacher.image ? (
                      <Avatar>
                        <AvatarImage 
                          src={classDashboard.teacher.image} 
                          alt={classDashboard.teacher.name || "Teacher"} 
                        />
                        <AvatarFallback>{classDashboard.teacher.name?.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar>
                        <AvatarFallback>{classDashboard.teacher.name?.slice(0, 2) || "T"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">{classDashboard.teacher.name}</p>
                      <p className="text-xs text-muted-foreground">{classDashboard.teacher.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Class Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Students:</span> {classDashboard.dashboard.classmateCount}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Materials:</span> {classDashboard.dashboard.materialsCount}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quizzes:</span> {classDashboard.dashboard.upcomingQuizCount}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span> {(classDashboard as any).class.type || "PRIVATE"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent announcements preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Latest Announcements</CardTitle>
                  <CardDescription>Recent announcements from this class</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("announcements")}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {classDashboard.content.recentAnnouncements.length > 0 ? (
                  <div className="space-y-4">
                    {classDashboard.content.recentAnnouncements.slice(0, 2).map(announcement => (
                      <div key={announcement.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{announcement.title}</h3>
                          <time className="text-xs text-muted-foreground">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </time>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {announcement.content || "No content provided"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-center">
                    <BellOff className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No announcements yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Quizzes tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Quizzes</CardTitle>
              <CardDescription>All quizzes available in this class</CardDescription>
            </CardHeader>
            <CardContent>
              {allQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {allQuizzes.map(quiz => (
                    <div key={quiz.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{quiz.title}</h3>
                        <Badge 
                          variant={
                            quiz.displayStatus === 'Completed' ? "outline" : 
                            quiz.displayStatus === 'In Progress' ? "default" : 
                            "secondary"
                          }
                          className={
                            quiz.displayStatus === 'Completed' ? "bg-gray-50 text-gray-700 border-gray-200" : 
                            quiz.displayStatus === 'In Progress' ? "bg-green-50 text-green-700 border-green-200" : 
                            "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {quiz.displayStatus}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {quiz.description || "No description provided"}
                      </p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        {quiz.startDate && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Opens: {formatDate(quiz.startDate)}</span>
                          </div>
                        )}
                        
                        {quiz.endDate && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Due: {formatDate(quiz.endDate)}</span>
                          </div>
                        )}
                        
                        {quiz.hasAttempted && quiz.attemptScore !== null && (
                          <div className="flex items-center text-emerald-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Score: {quiz.attemptScore}%</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <Button asChild size="sm">
                          <Link href={`/dashboard/student/quizzes/${quiz.id}`}>
                            {quiz.hasAttempted ? 'View Results' : 'View Quiz'}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <FileQuestion className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No quizzes available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
            
        {/* Announcements tab */}
        <TabsContent value="announcements" className="space-y-4">
            <Card>
              <CardHeader>
              <CardTitle className="text-lg">Announcements</CardTitle>
              <CardDescription>All announcements from this class</CardDescription>
              </CardHeader>
              <CardContent>
                {classDashboard.content.recentAnnouncements.length > 0 ? (
                  <div className="space-y-4">
                    {classDashboard.content.recentAnnouncements.map(announcement => (
                      <div key={announcement.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{announcement.title}</h3>
                        <time className="text-xs text-muted-foreground">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {announcement.content || "No content provided"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                        <span>Posted by: {classDashboard.teacher.name || "Unknown"}</span>
                        <span>Time: {new Date(announcement.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <BellOff className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No announcements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Materials tab */}
        <TabsContent value="materials">
          <ClassMaterials />
        </TabsContent>
        
        {/* Classmates tab */}
        <TabsContent value="classmates">
          <Card>
            <CardHeader>
              <CardTitle>Classmates</CardTitle>
              <CardDescription>All students enrolled in this class</CardDescription>
            </CardHeader>
            <CardContent>
              {classDashboard.content.classmates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {classDashboard.content.classmates.map(classmate => (
                    <div key={classmate.id} className="flex flex-col items-center space-y-2">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={classmate.image || undefined} alt={classmate.name || "Student"} />
                        <AvatarFallback>
                          {classmate.name ? classmate.name.charAt(0).toUpperCase() : "S"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-center">{classmate.name || "Student"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mb-3 opacity-20" />
                  <p>No other students in this class yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 