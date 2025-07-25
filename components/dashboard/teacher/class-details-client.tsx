"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend 
} from "recharts";
import { 
  AlertCircle,
  ArrowRight, 
  Calendar, 
  Clipboard, 
  Copy, 
  Edit, 
  Eye, 
  FileText, 
  GraduationCap, 
  LayoutDashboard, 
  Pencil, 
  Settings, 
  Trash2, 
  User, 
  Users,
  Bell,
  Send,
  Key,
  Trophy
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface StudentData {
  id: string;
  name: string;
  email: string;
  attemptCount: number;
  averageScore: number | null;
  lastActive: string | null;
}

interface QuizData {
  id: string;
  title: string;
  isActive: boolean;
  updatedAt: string;
  questionCount: number;
  attemptCount: number;
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: string;
  isActive: boolean;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  stats?: {
    students?: {
      total: number;
      active: number;
      participationRate: number;
    };
    quizzes?: {
      total: number;
      active: number;
      drafts: number;
      inactive: number;
    };
    performance?: {
      averageScore: number | null;
      completedAttempts: number;
    };
  };
  recentActivity?: {
    quizzes?: {
      id: string;
      title: string;
      isActive: boolean;
      isPublished: boolean;
      updatedAt: string;
    }[];
    enrollments?: {
      id: string;
      student: {
        id: string;
        name: string;
        email: string;
      };
      joinedAt: string;
    }[];
  };
  studentCount?: number;
  quizCount?: number;
  activeQuizCount?: number;
  topStudents?: StudentData[];
  recentQuizzes?: QuizData[];
}

interface Announcement {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ClassDetailsClientProps {
  classData: ClassData;
}

export default function ClassDetailsClient({ classData }: ClassDetailsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [currentClass, setCurrentClass] = useState<{
    name: string;
    description: string | null;
    subject: string | null;
    type: string;
    isActive: boolean;
  }>({
    name: classData.name,
    description: classData.description,
    subject: classData.subject,
    type: classData.type,
    isActive: classData.isActive,
  });
  
  // Fetch announcements when tab changes
  useEffect(() => {
    // Example function to fetch announcements
    const fetchAnnouncements = async () => {
      if (!classData || !classData.id) return;
      
      try {
        setIsLoadingAnnouncements(true);
        // API call would go here
        // const response = await fetch(`/api/teacher/classes/${classData.id}/announcements`);
        // if (response.ok) {
        //   const data = await response.json();
        //   setAnnouncements(data);
        // }
        
        // For demo, use empty array
        setAnnouncements([]);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast({
          title: "Error",
          description: "Failed to load announcements. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, [classData.id, toast]);
  
  // Copy invite code to clipboard
  const copyInviteCode = () => {
    navigator.clipboard.writeText(classData.inviteCode);
    toast({
      title: "Copied to Clipboard",
      description: "Class invite code has been copied to clipboard.",
    });
  };
  
  // Memoize form data to prevent unnecessary re-renders
  const initialClassData = useMemo(() => ({
    name: classData?.name || '',
    description: classData?.description || null,
    subject: classData?.subject || null,
    type: classData?.type || 'Regular',
    isActive: classData?.isActive || false,
  }), [classData]);

  // Use useCallback to prevent unnecessary re-renders
  const handleUpdateClass = useCallback(async () => {
    if (!currentClass.name.trim()) {
      toast({
        title: "Error",
        description: "Class name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/teacher/classes/${classData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentClass),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update class");
      }
      
      toast({
        title: "Class Updated",
        description: "Class details have been updated successfully.",
      });
      
      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update class. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentClass, classData?.id, router, toast]);

  // Use useCallback for input handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback((field: string, value: any) => {
    setCurrentClass(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Delete class
  const deleteClass = async () => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone and will delete all associated quizzes and student data.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teacher/classes/${classData.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete class");
      }
      
      toast({
        title: "Class Deleted",
        description: "Class has been deleted successfully.",
      });
      
      router.push("/dashboard/teacher/classes");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Get top students with safe handling for undefined
  const getTopStudents = () => {
    // Check if topStudents is available directly from API response
    if (classData.topStudents && Array.isArray(classData.topStudents) && classData.topStudents.length > 0) {
      return classData.topStudents;
    }
    
    // Fallback to original logic if needed
    if (!classData.topStudents || !Array.isArray(classData.topStudents)) {
      return [];
    }
    return classData.topStudents;
  };
  
  // Get grade distribution with improved null handling
  const getGradeDistribution = () => {
    // Get top students with safe access
    const topStudents = getTopStudents();
    
    // Default/empty data structure
    const emptyDistribution = [
      { name: 'A', value: 0, color: '#10b981' },
      { name: 'B', value: 0, color: '#3b82f6' },
      { name: 'C', value: 0, color: '#f59e0b' },
      { name: 'D', value: 0, color: '#f97316' },
      { name: 'F', value: 0, color: '#ef4444' },
    ];
    
    // Fallback if no data
    if (!topStudents || topStudents.length === 0) {
      return emptyDistribution;
    }
    
    // Process grades with improved null checks
    const validScores = topStudents
      .filter(student => 
        student && 
        student.averageScore !== null && 
        student.averageScore !== undefined && 
        !isNaN(student.averageScore)
      )
      .map(student => student.averageScore as number);
    
    if (validScores.length === 0) {
      return emptyDistribution;
    }
      
    const distribution = {
      A: 0, // 90-100
      B: 0, // 80-89
      C: 0, // 70-79
      D: 0, // 60-69
      F: 0, // 0-59
    };
    
    validScores.forEach(score => {
      if (score >= 90) distribution.A++;
      else if (score >= 80) distribution.B++;
      else if (score >= 70) distribution.C++;
      else if (score >= 60) distribution.D++;
      else distribution.F++;
    });
    
    return [
      { name: 'A', value: distribution.A, color: '#10b981' },
      { name: 'B', value: distribution.B, color: '#3b82f6' },
      { name: 'C', value: distribution.C, color: '#f59e0b' },
      { name: 'D', value: distribution.D, color: '#f97316' },
      { name: 'F', value: distribution.F, color: '#ef4444' },
    ];
  };
  
  const gradeDistribution = getGradeDistribution();
  
  // Get student count với xử lý null/undefined
  const getStudentCount = () => {
    return classData?.studentCount || classData?.stats?.students?.total || 0;
  };

  // Get quiz count với xử lý null/undefined
  const getQuizCount = () => {
    return classData?.quizCount || classData?.stats?.quizzes?.total || 0;
  };

  // Get active quiz count với xử lý null/undefined
  const getActiveQuizCount = () => {
    return classData?.activeQuizCount || classData?.stats?.quizzes?.active || 0;
  };

  // Get average score với xử lý null/undefined
  const getAverageScore = () => {
    if (classData?.stats?.performance?.averageScore !== undefined) {
      return classData.stats.performance.averageScore;
    }
    return null;
  };

  // Get engagement rate với xử lý null/undefined
  const getEngagementRate = () => {
    return classData?.stats?.students?.participationRate || 0;
  };
  
  // Get recent quizzes với xử lý null/undefined và cải thiện data mapping
  const getRecentQuizzes = () => {
    if (classData?.recentQuizzes && Array.isArray(classData.recentQuizzes)) {
      return classData.recentQuizzes;
    }
    if (classData?.recentActivity?.quizzes && Array.isArray(classData.recentActivity.quizzes)) {
      // Map correct quiz data from API response
      return classData.recentActivity.quizzes.map(quiz => {
        // Fetch the quiz information from API
        const quizWithDetails = {
          id: quiz.id,
          title: quiz.title,
          isActive: quiz.isActive,
          updatedAt: quiz.updatedAt,
          // Use real data for question count by accessing the correct properties
          questionCount: 0, // Will be updated via API
          attemptCount: 0   // Will be updated via API
        };
        
        // Fetch quiz details asynchronously and update the local state
        fetch(`/api/teacher/quizzes/${quiz.id}/stats`)
          .then(response => {
            if (response.ok) return response.json();
            return null;
          })
          .then(data => {
            if (data) {
              // Update the quizzes array with the fetched data
              setQuizzes(currentQuizzes => 
                currentQuizzes.map(q => 
                  q.id === quiz.id 
                    ? { 
                        ...q, 
                        questionCount: data.questionCount || 0, 
                        attemptCount: data.attemptCount || 0 
                      }
                    : q
                )
              );
            }
          })
          .catch(error => {
            console.error(`Error fetching quiz stats for ${quiz.id}:`, error);
          });
          
        return quizWithDetails;
      });
    }
    return [];
  };
  
  // State to store updated quiz data
  const [quizzes, setQuizzes] = useState<QuizData[]>(getRecentQuizzes());
  
  // Use effect to load quiz data when component mounts
  useEffect(() => {
    setQuizzes(getRecentQuizzes());
  }, [classData]);

  // Handle create announcement
  const createAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    
    try {
      // API call would go here
      // const response = await fetch(`/api/teacher/classes/${classData.id}/announcements`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     content: newAnnouncement,
      //   }),
      // });
      
      // if (!response.ok) {
      //   throw new Error("Failed to create announcement");
      // }
      
      // const data = await response.json();
      
      // Simulated response for demo
      const newAnnouncementObj: Announcement = {
        id: Date.now().toString(),
        content: newAnnouncement,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update local state
      setAnnouncements([newAnnouncementObj, ...announcements]);
      
      toast({
        title: "Announcement Created",
        description: "Your announcement has been sent to all students.",
      });
      
      setIsAnnouncementDialogOpen(false);
      setNewAnnouncement("");
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Error",
        description: "Failed to create announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle delete announcement
  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }
    
    try {
      // API call would go here
      // const response = await fetch(`/api/teacher/classes/${classData.id}/announcements/${id}`, {
      //   method: "DELETE",
      // });
      
      // if (!response.ok) {
      //   throw new Error("Failed to delete announcement");
      // }
      
      // Update local state
      setAnnouncements(announcements.filter(a => a.id !== id));
      
      toast({
        title: "Announcement Deleted",
        description: "The announcement has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update Edit Class Dialog to use a more efficient rendering approach
  const renderEditClassDialog = () => (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>
            Update class details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Class Name*</Label>
            <Input 
              id="edit-name" 
              value={currentClass.name} 
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-subject">Subject</Label>
            <Input 
              id="edit-subject" 
              value={currentClass.subject || ""} 
              onChange={(e) => handleInputChange('subject', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea 
              id="edit-description" 
              value={currentClass.description || ""} 
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-type">Class Type</Label>
            <select 
              id="edit-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={currentClass.type} 
              onChange={(e) => handleInputChange('type', e.target.value)}
            >
              <option value="Regular">Regular</option>
              <option value="Honor">Honor</option>
              <option value="AP">Advanced Placement</option>
              <option value="Elective">Elective</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-active"
              checked={currentClass.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="edit-active">Active Class</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button 
            type="submit" 
            onClick={handleUpdateClass}
            disabled={!currentClass.name.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={copyInviteCode}
          >
            <span className="font-mono mr-2">{classData.inviteCode}</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <TabsContent value="overview" className="space-y-6">
        {/* Stats Row - Cải thiện với màu sắc */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-emerald-50 dark:bg-emerald-950/20">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{getStudentCount()}</div>
              <p className="text-xs text-muted-foreground">
                Enrolled in this class
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50 dark:bg-blue-950/20">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Total Quizzes
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{getQuizCount()}</div>
              <p className="text-xs text-muted-foreground">
                {getActiveQuizCount()} active quizzes
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50 dark:bg-amber-950/20">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Average Score
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {getAverageScore() !== null ? `${getAverageScore()}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Class average performance
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50 dark:bg-purple-950/20">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Engagement Rate
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{getEngagementRate()}%</div>
              <p className="text-xs text-muted-foreground">
                Student participation
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Section Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Class Details</span>
          </div>
        </div>
        
        {/* Class Info & Description */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-slate-50 dark:bg-slate-950/20 border-b">
            <CardTitle className="flex items-center justify-between">
              Class Information
              <Badge variant={classData.isActive ? "default" : "secondary"} className="ml-2">
                {classData.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Basic details about this class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {classData.description && (
              <div className="bg-muted/50 p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {classData.description}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-md">
                <h4 className="text-sm font-medium">Type</h4>
                <div className="flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Badge variant="outline" className="font-normal">
                    {classData.type}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-md">
                <h4 className="text-sm font-medium">Subject</h4>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Badge variant="outline" className="font-normal">
                    {classData.subject || "Not specified"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-md">
                <h4 className="text-sm font-medium">Join Code</h4>
                <div className="flex items-center">
                  <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {classData.inviteCode}
                  </code>
                  <Button variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={copyInviteCode}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950/10 rounded-md">
                <h4 className="text-sm font-medium">Created</h4>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <p className="text-sm">
                    {format(new Date(classData.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Section Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Performance Analytics</span>
          </div>
        </div>
        
        {/* Performance & Top Students */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Performance Chart */}
          <Card className="md:col-span-1 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
            <CardHeader className="bg-slate-50 dark:bg-slate-950/20 border-b">
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-primary/80" />
                Grade Distribution
              </CardTitle>
              <CardDescription>
                Overview of student performance in this class
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-6">
              {gradeDistribution.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} students`, 'Count']}
                      labelFormatter={(label) => `Grade ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No grade data available yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This chart will populate as students complete quizzes
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Top Students */}
          <Card className="md:col-span-1 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50 dark:bg-slate-950/20 border-b">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                <div>
                  <CardTitle>Top Students</CardTitle>
                  <CardDescription>
                    Students with the highest average scores
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {getTopStudents().length > 0 ? (
                <div className="space-y-4">
                  {getTopStudents().map((student, index) => (
                    <div key={student.id} className="flex items-center p-3 rounded-md bg-slate-50 dark:bg-slate-950/10 hover:bg-slate-100 dark:hover:bg-slate-950/20 transition-colors">
                      <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mr-2 bg-muted">
                        <span className="text-xs font-medium">#{index + 1}</span>
                      </div>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://avatar.vercel.sh/${student.email}`} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.attemptCount} {student.attemptCount === 1 ? 'quiz' : 'quizzes'} completed
                        </p>
                      </div>
                      <div className="ml-auto flex items-center">
                        {student.averageScore !== null && (
                          <div className="flex items-center">
                            <Badge className={`${
                              student.averageScore >= 90 ? "bg-emerald-500" :
                              student.averageScore >= 80 ? "bg-blue-500" :
                              student.averageScore >= 70 ? "bg-amber-500" :
                              student.averageScore >= 60 ? "bg-orange-500" : "bg-red-500"
                            }`}>
                              {student.averageScore}%
                            </Badge>
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="text-center">
                    <User className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No student data available yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Data will appear when students take quizzes
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Section Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Recent Content</span>
          </div>
        </div>
        
        {/* Recent Quizzes section with improved visualization */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-slate-50 dark:bg-slate-950/20 border-b">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary/80" />
              <div>
                <CardTitle>Recent Quizzes</CardTitle>
                <CardDescription>
                  Recently updated quizzes in this class
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/dashboard/teacher/classes/${classData.id}/quizzes`)}
            >
              View All Quizzes
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {quizzes.length > 0 ? (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between border border-border p-3 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${quiz.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{quiz.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            {quiz.questionCount} questions
                          </Badge>
                          <Badge variant="outline" className="text-xs font-normal">
                            {quiz.attemptCount} attempts
                          </Badge>
                          <Badge variant={quiz.isActive ? "default" : "secondary"} className="text-xs">
                            {quiz.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-muted-foreground mr-4">
                        {formatDistanceToNow(new Date(quiz.updatedAt), { addSuffix: true })}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No quizzes available yet
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => router.push(`/dashboard/teacher/quizzes/create?classId=${classData.id}`)}
                  >
                    Create Your First Quiz
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="announcements" className="space-y-6">
        {/* Section Header */}
        <div className="relative my-2">
          <div className="relative flex justify-center text-sm">
            <div className="bg-muted px-4 py-2 rounded-full text-foreground font-medium inline-flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Announcements for your class
            </div>
          </div>
        </div>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-slate-50 dark:bg-slate-950/20 border-b">
            <div>
              <CardTitle>Class Announcements</CardTitle>
              <CardDescription>
                Create and manage announcements for this class
              </CardDescription>
            </div>
            <Button onClick={() => setIsAnnouncementDialogOpen(true)}>
              <Bell className="h-4 w-4 mr-2" /> New Announcement
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingAnnouncements ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="bg-muted/40 border-l-2 border-l-blue-400 shadow-sm">
                    <CardContent className="pt-6">
                      <p className="text-sm">{announcement.content}</p>
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => deleteAnnouncement(announcement.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-950/10 rounded-lg border border-dashed">
                <Bell className="h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">No announcements yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first announcement to notify students
                </p>
                <Button className="mt-4" onClick={() => setIsAnnouncementDialogOpen(true)}>
                  Create Announcement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-6">
        {/* Section Header */}
        <div className="relative my-2">
          <div className="relative flex justify-center text-sm">
            <div className="bg-muted px-4 py-2 rounded-full text-foreground font-medium inline-flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Class Settings and Configuration
            </div>
          </div>
        </div>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="bg-slate-50 dark:bg-slate-950/20 border-b">
            <CardTitle>Class Settings</CardTitle>
            <CardDescription>
              Manage class details and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 p-4 bg-slate-50 dark:bg-slate-950/10 rounded-md">
              <div className="grid gap-2">
                <Label htmlFor="class-name" className="font-medium">Class Name</Label>
                <Input 
                  id="class-name" 
                  value={currentClass.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class-subject" className="font-medium">Subject</Label>
                <Input 
                  id="class-subject" 
                  value={currentClass.subject || ""} 
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="border-slate-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class-description" className="font-medium">Description</Label>
                <Textarea 
                  id="class-description" 
                  value={currentClass.description || ""} 
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="border-slate-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class-type" className="font-medium">Class Type</Label>
                <select 
                  id="class-type"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={currentClass.type} 
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="Regular">Regular</option>
                  <option value="Honor">Honor</option>
                  <option value="AP">Advanced Placement</option>
                  <option value="Elective">Elective</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  The class type affects how this class is categorized and may impact analytics.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="class-active"
                  checked={currentClass.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="class-active" className="font-medium">Active Class</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4 bg-slate-50/50 dark:bg-slate-950/5">
            <div className="flex items-center space-x-2">
              <Label htmlFor="invite-code" className="font-medium">Invite Code:</Label>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                {classData.inviteCode}
              </code>
              <Button variant="ghost" size="icon" onClick={copyInviteCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={deleteClass}>
                Delete Class
              </Button>
              <Button onClick={handleUpdateClass}>
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Edit Class Dialog */}
      {renderEditClassDialog()}
      
      {/* New Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>
              Create a new announcement for all students in this class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="announcement">Announcement Content</Label>
              <Textarea 
                id="announcement"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Write your announcement here..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit"
              disabled={!newAnnouncement.trim()}
              onClick={createAnnouncement}
            >
              <Send className="h-4 w-4 mr-2" /> Send Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
} 