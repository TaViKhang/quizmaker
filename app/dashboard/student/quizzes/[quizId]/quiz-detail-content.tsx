'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { QuizType } from "@/app/dashboard/student/types/types";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  FileQuestion, 
  Info, 
  AlertCircle, 
  User, 
  Pencil, 
  BookOpen, 
  RotateCcw,
  Eye,
  Award,
  List,
  CalendarClock,
  Calendar,
  HelpCircle
} from "lucide-react";

interface QuizDetailContentProps {
  quizId: string;
}

interface QuizDetail extends QuizType {
  class?: {
    id: string;
    name: string;
    subject: string | null;
  };
  teacher?: {
    id: string;
    name: string;
  };
  attempts: QuizAttempt[];
  topics?: TopicCoverage[];
  instructionsList?: string[];
}

interface QuizAttempt {
  id: string;
  startedAt: string;
  completedAt?: string;
  completed: boolean;
  score: number | null;
}

interface TopicCoverage {
  topic: string;
  questions: number;
  percentage: number;
}

export function QuizDetailContent({ quizId }: QuizDetailContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("instructions");
  
  // Fetch quiz details
  useEffect(() => {
    const fetchQuizDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/users/me/quizzes/${quizId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch quiz details");
        }
        
        if (data.success) {
          setQuiz(data.data.quiz);
        } else {
          throw new Error(data.message || "Failed to fetch quiz details");
        }
      } catch (err) {
        console.error("Error fetching quiz details:", err);
        setError((err as Error).message);
        toast({
          title: "Error",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizDetails();
  }, [quizId, toast]);
  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    
    try {
      const date = new Date(dateString);
      return format(date, "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return format(date, "p");
    } catch (e) {
      return "";
    }
  };
  
  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` 
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  };
  
  // Format time spent in attempt
  const formatTimeSpent = (startDate: string, endDate?: string) => {
    if (!endDate) return "In progress";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffMin = Math.round(diffMs / 60000);
    
    if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };
  
  // Get the most recent attempt
  const getLatestAttempt = () => {
    if (!quiz?.attempts || quiz.attempts.length === 0) return null;
    return quiz.attempts[0]; // Already ordered by the API
  };
  
  // Handle start quiz action
  const handleStartQuiz = async (forceNew = false) => {
    try {
      if (forceNew) {
        // Call API to start a new attempt with forceNew=true
        const response = await fetch('/api/attempts/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quizId,
            forceNew: true
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to start new attempt');
        }

        if (data.success) {
          // Đảm bảo điều hướng đến trang QuizTake
          router.push(`/dashboard/student/quizzes/${quizId}/attempt?attemptId=${data.data.attemptId}`);
        } else {
          throw new Error(data.message);
        }
      } else {
        // For normal start (not force new), check if there's an incomplete attempt
        const latestAttempt = getLatestAttempt();
        if (latestAttempt && !latestAttempt.completed) {
          // Continue existing incomplete attempt
          router.push(`/dashboard/student/quizzes/${quizId}/attempt?attemptId=${latestAttempt.id}`);
        } else {
          // Start a new attempt without forceNew flag
          const response = await fetch('/api/attempts/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quizId
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to start quiz attempt');
          }

          if (data.success) {
            // Đảm bảo điều hướng đến trang QuizTake
            router.push(`/dashboard/student/quizzes/${quizId}/attempt?attemptId=${data.data.attemptId}`);
          } else {
            throw new Error(data.message);
          }
        }
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };
  
  // Get the highest scoring attempt
  const getBestAttempt = () => {
    if (!quiz?.attempts || quiz.attempts.length === 0) return null;
    
    let bestAttempt = null;
    let highestScore = -1;
    
    for (const attempt of quiz.attempts) {
      if (attempt.completed && attempt.score !== null && attempt.score > highestScore) {
        highestScore = attempt.score;
        bestAttempt = attempt;
      }
    }
    
    return bestAttempt;
  };
  
  // UI rendering helpers
  const getBadgeForStatus = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">Upcoming</Badge>;
      case "ongoing":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">Available Now</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">Completed</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">Expired</Badge>;
      default:
        return null;
    }
  };
  
  // Render skeleton while loading
  if (isLoading) {
    return <QuizDetailSkeleton />;
  }
  
  // Render error state
  if (error || !quiz) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Failed to load quiz details"}</AlertDescription>
      </Alert>
    );
  }
  
  // Get latest and best attempts
  const latestAttempt = getLatestAttempt();
  const bestAttempt = getBestAttempt();
  
  // Define button text and state based on quiz status
  let actionText = "Start Quiz";
  let isButtonDisabled = false;
  let buttonVariant: "default" | "secondary" | "outline" = "default";
  let canStartNewAttempt = true;
  
  if (quiz.isLocked) {
    actionText = "Locked";
    isButtonDisabled = true;
    buttonVariant = "outline";
    canStartNewAttempt = false;
  } else if (quiz.status === "upcoming") {
    actionText = "Not Available Yet";
    isButtonDisabled = true;
    buttonVariant = "outline";
    canStartNewAttempt = false;
  } else if (quiz.status === "expired") {
    actionText = "Expired";
    isButtonDisabled = true;
    buttonVariant = "outline";
    canStartNewAttempt = false;
  } else if (quiz.status === "completed") {
    actionText = "View Results";
    isButtonDisabled = false;
    buttonVariant = "secondary";
    canStartNewAttempt = quiz.attemptLimit ? (quiz.currentAttempts || 0) < quiz.attemptLimit : true;
  } else if (latestAttempt && !latestAttempt.completed) {
    actionText = "Continue Quiz";
    isButtonDisabled = false;
  } else if (quiz.attemptLimit && (quiz.currentAttempts || 0) >= quiz.attemptLimit) {
    actionText = "Attempt Limit Reached";
    isButtonDisabled = true;
    buttonVariant = "outline";
    canStartNewAttempt = false;
  }
  
  // Generate default instructions if none provided
  const defaultInstructions = [
    "Read all questions carefully before answering.",
    "You must complete the quiz within the time limit.",
    "You can review your answers before submission.",
    "Once submitted, you cannot change your answers."
  ];
  
  const displayInstructions = quiz.instructionsList && quiz.instructionsList.length > 0 
    ? quiz.instructionsList 
    : quiz.instructions 
      ? [quiz.instructions]
      : defaultInstructions;
  
  // Default topics if none provided
  const displayTopics = quiz.topics && quiz.topics.length > 0 
    ? quiz.topics 
    : [
        { topic: "Quiz Content", questions: quiz.totalQuestions, percentage: 100 }
      ];

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4" 
          asChild
        >
          <Link href="/dashboard/student/quizzes">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Quizzes
          </Link>
        </Button>
      </div>
      
      {/* Quiz header */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {getBadgeForStatus(quiz.status)}
          {quiz.isFormal && (
            <Badge variant="outline" className="border-primary/40 text-primary dark:border-primary/30">
              Formal
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{quiz.title}</h1>
        <p className="text-muted-foreground">
          {quiz.class?.name && (
            <>
              <span>{quiz.class.name}</span>
              {quiz.class.subject && <> • {quiz.class.subject}</>}
              {quiz.teacher?.name && <> • Teacher: {quiz.teacher.name}</>}
            </>
          )}
        </p>
      </div>
      
      {/* Quiz details and actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
            <CardDescription>Details and requirements for this quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Time Limit</div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{formatDuration(quiz.durationMinutes)}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Questions</div>
                <div className="flex items-center">
                  <FileQuestion className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{quiz.totalQuestions} questions</span>
                </div>
              </div>
              
              {quiz.startDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Available From</div>
                  <div className="flex items-center">
                    <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>
                      {formatDate(quiz.startDate)} at {formatTime(quiz.startDate)}
                    </span>
                  </div>
                </div>
              )}
              
              {quiz.endDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Available Until</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>
                      {formatDate(quiz.endDate)} at {formatTime(quiz.endDate)}
                    </span>
                  </div>
                </div>
              )}
              
              {quiz.attemptLimit && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Attempt Limit</div>
                  <div className="flex items-center">
                    <RotateCcw className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>
                      {quiz.attemptLimit - (quiz.currentAttempts || 0)} attempts remaining
                    </span>
                  </div>
                </div>
              )}
              
              {bestAttempt && bestAttempt.score !== null && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Your Best Score</div>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-1 text-purple-500" />
                    <span className="font-medium">{bestAttempt.score}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            {quiz.status === "completed" && bestAttempt?.id ? (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/student/quizzes/results/${bestAttempt.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Results
                </Link>
              </Button>
            ) : (
              <div /> // Empty div to maintain layout with justify-between
            )}
            
            <div className="flex gap-2">
              {canStartNewAttempt && quiz.status === "completed" && (
                <Button 
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    const forceNew = true;
                    handleStartQuiz(forceNew);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  New Attempt
                </Button>
              )}
              <Button 
                disabled={isButtonDisabled}
                variant={buttonVariant}
                onClick={(e) => {
                  e.preventDefault();
                  const forceNew = false;
                  handleStartQuiz(forceNew);
                }}
              >
                {actionText}
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Description and attempts */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              {quiz.currentAttempts ? `${quiz.currentAttempts} attempt(s) made` : "No attempts yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.attempts && quiz.attempts.length > 0 ? (
              <div className="space-y-4">
                {quiz.attempts.slice(0, 3).map((attempt, index) => (
                  <div key={attempt.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-sm">
                        Attempt {quiz.attempts.length - index}
                      </div>
                      {attempt.completed ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {format(new Date(attempt.startedAt), "MMM d, yyyy")}
                      </span>
                      <span>
                        {formatTimeSpent(attempt.startedAt, attempt.completedAt)}
                      </span>
                    </div>
                    {attempt.completed && attempt.score !== null && (
                      <div className="pt-1">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span>Score</span>
                          <span className="font-medium">{attempt.score}%</span>
                        </div>
                        <Progress 
                          value={attempt.score} 
                          className={`h-2 ${
                            attempt.score >= 80 ? "[&>div]:bg-green-500" :
                            attempt.score >= 60 ? "[&>div]:bg-amber-500" :
                            "[&>div]:bg-red-500"
                          }`}
                        />
                      </div>
                    )}
                    <div className="pt-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        asChild
                      >
                        <Link 
                          href={attempt.completed 
                            ? `/dashboard/student/quizzes/results/${attempt.id}` 
                            : `/dashboard/student/quizzes/${quizId}/attempt`
                          }
                        >
                          {attempt.completed ? "View Results" : "Continue"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {quiz.attempts.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    asChild
                  >
                    <Link href={`/dashboard/student/quiz-attempts?quizId=${quizId}`}>
                      View All Attempts ({quiz.attempts.length})
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Pencil className="h-12 w-12 mb-3 opacity-20" />
                <p>No attempts yet</p>
                <p className="text-xs mt-1">Start the quiz to make your first attempt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for details, outline, etc. */}
      <Tabs defaultValue="instructions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          {quiz.description && (
            <TabsTrigger value="description">Description</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="instructions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Quiz Instructions
              </CardTitle>
              <CardDescription>
                Please read these instructions carefully before starting the quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {displayInstructions.map((instruction, index) => (
                  <li key={index} className="flex">
                    <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* Start quiz action */}
          {(quiz.status === "ongoing" || (quiz.status === "completed" && canStartNewAttempt)) && !quiz.isLocked && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">Ready to start?</h3>
                    <p className="text-sm text-muted-foreground">
                      You have {formatDuration(quiz.durationMinutes)} to complete this quiz
                    </p>
                  </div>
                  <Button onClick={() => handleStartQuiz()}>
                    {latestAttempt && !latestAttempt.completed ? "Continue Quiz" : "Start Quiz"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="topics" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <List className="h-5 w-5 mr-2" />
                Topics Covered
              </CardTitle>
              <CardDescription>
                Breakdown of topics covered in this quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayTopics.map((topic, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-sm">{topic.topic}</div>
                      <div className="text-sm text-muted-foreground">
                        {topic.questions} question{topic.questions !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Progress value={topic.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {quiz.description && (
          <TabsContent value="description" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Quiz Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p>{quiz.description}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function QuizDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
      </div>
      
      <div className="space-y-1">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div>
        <Skeleton className="h-10 w-80 mb-6" />
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 