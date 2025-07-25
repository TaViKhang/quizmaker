import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Book, 
  Clock, 
  FileText, 
  Layers, 
  MoreHorizontal, 
  School, 
  Users 
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface ActivityItem {
  id: string;
  type: 'class' | 'quiz';
  title: string;
  subject?: string | null;
  date: Date;
  metadata: Record<string, any>;
}

interface ClassData {
  id: string;
  name: string;
  subject: string | null;
  type: string;
  isActive: boolean;
  studentCount: number;
  coverImage?: string | null;
  updatedAt: Date;
}

interface QuizData {
  id: string;
  title: string;
  isActive: boolean;
  isPublished: boolean;
  category: string | null;
  questionCount: number;
  attemptCount: number;
  className: string | null;
  classId: string | null;
  updatedAt: Date;
}

interface ActivitySectionProps {
  activityFeed: ActivityItem[];
  recentClasses: ClassData[];
  recentQuizzes: QuizData[];
}

export function ActivitySection({ activityFeed, recentClasses, recentQuizzes }: ActivitySectionProps) {
  const router = useRouter();
  
  // Function to get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'class':
        return <School className="h-6 w-6 text-blue-500" />;
      case 'quiz':
        return <FileText className="h-6 w-6 text-violet-500" />;
      default:
        return <Clock className="h-6 w-6 text-muted-foreground" />;
    }
  };
  
  // Function to format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const dateObj = new Date(date);
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 2) {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    }
    
    return format(dateObj, "MMM d, yyyy");
  };
  
  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All Activity</TabsTrigger>
        <TabsTrigger value="classes">Classes</TabsTrigger>
        <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
      </TabsList>
      
      {/* All Activity Tab */}
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest updates and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-8">
                {activityFeed.map((activity, index) => (
                  <div key={activity.id} className="flex">
                    <div className="relative mr-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      {index < activityFeed.length - 1 && (
                        <div className="absolute bottom-0 left-1/2 h-full w-0.5 -translate-x-1/2 translate-y-3 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.type === 'class' ? 'Class' : 'Quiz'} 
                            {activity.subject && ` • ${activity.subject}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.type === 'class' 
                              ? `${activity.metadata.studentCount} students` 
                              : `${activity.metadata.attemptCount} attempts`}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => router.push(`/dashboard/teacher/${activity.type === 'class' ? 'classes' : 'quizzes'}/${activity.id}`)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(activity.date))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Classes Tab */}
      <TabsContent value="classes">
        <Card>
          <CardHeader>
            <CardTitle>Recent Classes</CardTitle>
            <CardDescription>
              Your recently updated classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {recentClasses.map((classItem) => (
                <Card key={classItem.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/dashboard/teacher/classes/${classItem.id}`)}>
                  <CardContent className="p-4 flex">
                    <div className="w-12 h-12 mr-4 rounded-md overflow-hidden flex items-center justify-center bg-muted">
                      {classItem.coverImage ? (
                        <img src={classItem.coverImage} alt={classItem.name} className="w-full h-full object-cover" />
                      ) : (
                        <School className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{classItem.name}</h4>
                        <Badge variant={classItem.isActive ? "default" : "outline"} className="text-xs">
                          {classItem.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {classItem.subject || "No subject"} • {classItem.type}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" /> 
                        {classItem.studentCount} students
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Quizzes Tab */}
      <TabsContent value="quizzes">
        <Card>
          <CardHeader>
            <CardTitle>Recent Quizzes</CardTitle>
            <CardDescription>
              Your recently updated quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {recentQuizzes.map((quiz) => (
                <Card key={quiz.id} className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}`)}>
                  <CardContent className="p-4 flex">
                    <div className="w-12 h-12 mr-4 rounded-md overflow-hidden flex items-center justify-center bg-muted">
                      <Layers className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{quiz.title}</h4>
                        <div className="flex gap-1">
                          <Badge variant={quiz.isActive ? "default" : "outline"} className="text-xs">
                            {quiz.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {!quiz.isPublished && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {quiz.className || "No class"} • {quiz.category || "Uncategorized"}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>
                          <Book className="h-3 w-3 inline mr-1" /> 
                          {quiz.questionCount} questions
                        </span>
                        <span>
                          <Users className="h-3 w-3 inline mr-1" /> 
                          {quiz.attemptCount} attempts
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 