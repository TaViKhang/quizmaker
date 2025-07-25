"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Hourglass,
  LineChart,
  School,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

// Define types for the component
interface ClassStats {
  classId: string;
  className: string;
  subject: string;
  type: string;
  isActive: boolean;
  enrollmentId: string;
  joinedAt: string;
  lastActive: string | null;
  attemptCount: number;
  completedCount: number;
  averageScore: number | null;
  passRate: number | null;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  classId: string;
  className: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  passed: boolean | null;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  classes: ClassStats[];
  quizAttempts: QuizAttempt[];
}

interface OverallStats {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  classesEnrolled: number;
  lastActive: string | null;
}

interface StudentDetailsClientProps {
  student: StudentData;
  stats: OverallStats;
}

export default function StudentDetailsClient({
  student,
  stats,
}: StudentDetailsClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Prepare data for score distribution chart
  const prepareScoreDistribution = () => {
    const completedAttempts = student.quizAttempts.filter(
      (attempt) => attempt.completedAt && attempt.score !== null
    );
    
    if (completedAttempts.length === 0) return [];
    
    const scoreRanges = [
      { name: "0-20", min: 0, max: 20, count: 0 },
      { name: "21-40", min: 21, max: 40, count: 0 },
      { name: "41-60", min: 41, max: 60, count: 0 },
      { name: "61-80", min: 61, max: 80, count: 0 },
      { name: "81-100", min: 81, max: 100, count: 0 },
    ];
    
    completedAttempts.forEach(attempt => {
      if (attempt.score !== null) {
        const range = scoreRanges.find(
          range => attempt.score! >= range.min && attempt.score! <= range.max
        );
        if (range) range.count++;
      }
    });
    
    return scoreRanges;
  };

  // Prepare data for class performance chart
  const prepareClassPerformance = () => {
    return student.classes
      .filter(cls => cls.averageScore !== null)
      .map(cls => ({
        name: cls.className,
        score: cls.averageScore,
        attempts: cls.attemptCount,
      }));
  };

  const renderActivityTimeline = () => {
    // Sort attempts by date (newest first)
    const sortedAttempts = [...student.quizAttempts].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    
    if (sortedAttempts.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No activity recorded yet</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {sortedAttempts.slice(0, 10).map(attempt => (
          <div key={attempt.id} className="flex items-start gap-4 border-b pb-4">
            <div className="rounded-full bg-primary/10 p-2">
              {attempt.completedAt ? 
                attempt.passed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> 
                : <XCircle className="h-4 w-4 text-red-500" />
                : <Hourglass className="h-4 w-4 text-amber-500" />
              }
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {attempt.completedAt ? 
                  (attempt.passed ? "Completed and passed" : "Completed but failed") 
                  : "Started"} quiz: {attempt.quizTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                Class: {attempt.className}
              </p>
              <p className="text-xs text-muted-foreground">
                {attempt.completedAt ? 
                  `Completed ${formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true })}` 
                  : `Started ${formatDistanceToNow(new Date(attempt.startedAt), { addSuffix: true })}`
                }
              </p>
              {attempt.score !== null && (
                <Badge className={attempt.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  Score: {attempt.score}%
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Classes Enrolled
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classesEnrolled}</div>
            <p className="text-xs text-muted-foreground">
              Active in {student.classes.filter(c => c.isActive).length} classes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quiz Attempts
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAttempts} completed ({Math.round((stats.completedAttempts / Math.max(stats.totalAttempts, 1)) * 100)}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageScore !== null ? `${stats.averageScore}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAttempts > 0 
                ? `Based on ${stats.completedAttempts} completed quizzes` 
                : "No completed quizzes yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Last Active
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastActive 
                ? formatDistanceToNow(new Date(stats.lastActive), { addSuffix: true }) 
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastActive 
                ? `On ${format(new Date(stats.lastActive), 'MMM d, yyyy')}` 
                : "Student has not been active yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since:</span>
                    <span className="font-medium">{format(new Date(student.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classes Enrolled:</span>
                    <span className="font-medium">{stats.classesEnrolled}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px]">
                {stats.completedAttempts > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={prepareScoreDistribution()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip formatter={(value) => [`${value} attempts`, 'Count']} />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Quiz Attempts" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No quiz data available yet
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent quiz attempts and class activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderActivityTimeline()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>
                Average scores across enrolled classes
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {prepareClassPerformance().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareClassPerformance()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#8884d8" name="Average Score (%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <LineChart className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No class performance data available yet
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Classes</CardTitle>
              <CardDescription>
                Classes this student is enrolled in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quiz Attempts</TableHead>
                    <TableHead>Avg. Score</TableHead>
                    <TableHead>Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.classes.map((cls) => (
                    <TableRow key={cls.classId}>
                      <TableCell className="font-medium">
                        <a href={`/dashboard/teacher/classes/${cls.classId}`} className="text-blue-600 hover:underline">
                          {cls.className}
                        </a>
                      </TableCell>
                      <TableCell>{cls.subject}</TableCell>
                      <TableCell>{format(new Date(cls.joinedAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={cls.isActive ? "default" : "secondary"}>
                          {cls.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cls.completedCount}/{cls.attemptCount}
                      </TableCell>
                      <TableCell>
                        {cls.averageScore !== null ? `${cls.averageScore}%` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {cls.passRate !== null ? `${cls.passRate}%` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Attempts</CardTitle>
              <CardDescription>
                All quiz attempts by this student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.quizAttempts.length > 0 ? (
                    student.quizAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">
                          <a href={`/dashboard/teacher/quizzes/${attempt.quizId}`} className="text-blue-600 hover:underline">
                            {attempt.quizTitle}
                          </a>
                        </TableCell>
                        <TableCell>
                          <a href={`/dashboard/teacher/classes/${attempt.classId}`} className="text-blue-600 hover:underline">
                            {attempt.className}
                          </a>
                        </TableCell>
                        <TableCell>{format(new Date(attempt.startedAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {attempt.completedAt ? format(new Date(attempt.completedAt), 'MMM d, yyyy') : "-"}
                        </TableCell>
                        <TableCell>
                          {attempt.completedAt ? (
                            attempt.passed ? (
                              <Badge className="bg-green-100 text-green-800">Passed</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Failed</Badge>
                            )
                          ) : (
                            <Badge variant="outline">In Progress</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.score !== null ? `${attempt.score}%` : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No quiz attempts recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Recent student activity and quiz attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderActivityTimeline()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 