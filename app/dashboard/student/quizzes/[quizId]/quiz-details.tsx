'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Lock,
  FileText,
  Timer,
  Award,
  Hourglass,
  CalendarDays,
  ListChecks
} from "lucide-react";
import { QuizType } from "@/app/dashboard/student/types/types";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface QuizDetailsProps {
  quizId: string;
}

export function QuizDetails({ quizId }: QuizDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch quiz details
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await fetch(`/api/users/me/quizzes/${quizId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch quiz details");
        }
        
        if (data.success) {
          setQuiz(data.data);
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
  
  // Handle quiz start or continue
  const handleStartQuiz = async () => {
    if (!quiz || quiz.isLocked) return;
    
    setIsStarting(true);
    
    try {
      // For an already started attempt
      if (quiz.status === "ongoing" && quiz.latestAttemptId && !quiz.isLatestAttemptComplete) {
        router.push(`/dashboard/student/quizzes/${quizId}/attempt?attemptId=${quiz.latestAttemptId}`);
        return;
      }
      
      // Start a new attempt
      const response = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to start quiz attempt");
      }
      
      if (data.success && data.data?.attemptId) {
        router.push(`/dashboard/student/quizzes/${quizId}/attempt?attemptId=${data.data.attemptId}`);
      } else {
        throw new Error("Failed to create quiz attempt");
      }
    } catch (err) {
      console.error("Error starting quiz:", err);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    
    try {
      return format(new Date(dateString), "PPP 'at' p");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "expired":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "";
    }
  };
  
  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Available Now";
      case "completed":
        return "Completed";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };
  
  // Get action button text
  const getActionText = () => {
    if (!quiz) return "Loading...";
    if (quiz.isLocked) return "Locked";
    
    switch (quiz.status) {
      case "upcoming":
        return "Quiz Not Available Yet";
      case "ongoing":
        return quiz.currentAttempts && quiz.currentAttempts > 0 && !quiz.isLatestAttemptComplete
          ? "Continue Quiz" 
          : "Start Quiz";
      case "completed":
        return "View Results";
      case "expired":
        return "Expired";
      default:
        return "View Quiz";
    }
  };
  
  // Handle action button click
  const handleActionClick = () => {
    if (!quiz) return;
    
    if (quiz.isLocked) return;
    
    switch (quiz.status) {
      case "upcoming":
        // Do nothing for upcoming quizzes
        return;
      case "ongoing":
        // Start or continue the quiz
        handleStartQuiz();
        return;
      case "completed":
        // Navigate to results page
        if (quiz.bestAttemptId) {
          router.push(`/dashboard/student/quizzes/results/${quiz.bestAttemptId}`);
        }
        return;
      case "expired":
      default:
        // Just view quiz details
        return;
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Quiz details */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
        
        {/* Right column - Quiz actions */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!quiz) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Quiz Not Found</AlertTitle>
        <AlertDescription>The quiz you're looking for could not be found.</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left column - Quiz details */}
      <div className="space-y-6">
        {/* Quiz status and badges */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status badge */}
          <Badge className={cn("text-xs", getStatusBadgeStyle(quiz.status))}>
            {getStatusText(quiz.status)}
          </Badge>
          
          {/* Formal badge if applicable */}
          {quiz.isFormal && (
            <Badge 
              variant="outline" 
              className="border-primary/40 text-primary dark:border-primary/30"
            >
              Formal Assessment
            </Badge>
          )}
          
          {/* Locked badge if applicable */}
          {quiz.isLocked && (
            <Badge variant="outline" className="border-destructive/40 text-destructive">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
        
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        
        {/* Quiz description */}
        {quiz.description && (
          <div className="text-muted-foreground">
            {quiz.description}
          </div>
        )}
        
        {/* Detailed info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiz Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Class info */}
            {quiz.className && (
              <div className="flex justify-between items-start text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Class</span>
                </div>
                <div className="text-right font-medium">
                  {quiz.className}
                  {quiz.subject && <div className="text-xs text-muted-foreground">{quiz.subject}</div>}
                </div>
              </div>
            )}
            
            {/* Teacher info */}
            {quiz.teacherName && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Teacher</span>
                </div>
                <div className="font-medium">
                  {quiz.teacherName}
                </div>
              </div>
            )}
            
            {/* Time limit */}
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>Time Limit</span>
              </div>
              <div className="font-medium">
                {quiz.durationMinutes} minutes
              </div>
            </div>
            
            {/* Question count */}
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListChecks className="h-4 w-4" />
                <span>Questions</span>
              </div>
              <div className="font-medium">
                {quiz.totalQuestions}
              </div>
            </div>
            
            {/* Start date */}
            {quiz.startDate && (
              <div className="flex justify-between items-start text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Opens</span>
                </div>
                <div className="text-right font-medium">
                  {formatDate(quiz.startDate)}
                </div>
              </div>
            )}
            
            {/* End date */}
            {quiz.endDate && (
              <div className="flex justify-between items-start text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>Closes</span>
                </div>
                <div className="text-right font-medium">
                  {formatDate(quiz.endDate)}
                </div>
              </div>
            )}
            
            {/* Attempts info */}
            {quiz.attemptLimit && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hourglass className="h-4 w-4" />
                  <span>Attempts</span>
                </div>
                <div className="font-medium">
                  {quiz.currentAttempts || 0} / {quiz.attemptLimit}
                </div>
              </div>
            )}
            
            {/* Highest score (if completed) */}
            {quiz.highestScore !== null && quiz.status === "completed" && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Best Score</span>
                </div>
                <div className="font-medium">
                  {quiz.highestScore}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Optional instructions */}
        {quiz.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {quiz.instructions}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Right column - Quiz actions */}
      <div className="space-y-6">
        {/* Action card */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Status</CardTitle>
            <CardDescription>
              {quiz.isLocked ? quiz.lockReason : getStatusText(quiz.status)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Different content based on status */}
            {quiz.status === "upcoming" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not Available Yet</AlertTitle>
                <AlertDescription>
                  This quiz will be available from {formatDate(quiz.startDate)}
                </AlertDescription>
              </Alert>
            )}
            
            {quiz.status === "ongoing" && !quiz.isLocked && (
              <Alert variant="info">
                <Clock className="h-4 w-4" />
                <AlertTitle>Quiz is Available</AlertTitle>
                <AlertDescription>
                  You can take this quiz now. Make sure you have enough time to complete it in one session.
                </AlertDescription>
              </Alert>
            )}
            
            {quiz.status === "completed" && (
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Quiz Completed</AlertTitle>
                <AlertDescription>
                  You have completed this quiz with a score of {quiz.highestScore}%.
                </AlertDescription>
              </Alert>
            )}
            
            {quiz.status === "expired" && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Quiz Expired</AlertTitle>
                <AlertDescription>
                  This quiz is no longer available for submissions.
                </AlertDescription>
              </Alert>
            )}
            
            {quiz.isLocked && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertTitle>Quiz Locked</AlertTitle>
                <AlertDescription>
                  {quiz.lockReason || "This quiz is not available to you at this time."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-4">
              {/* Primary action button */}
              <Button 
                className="w-full" 
                disabled={quiz.isLocked || quiz.status === "upcoming" || quiz.status === "expired"}
                onClick={handleActionClick}
                isLoading={isStarting}
              >
                {getActionText()}
              </Button>
              
              {/* Back to quizzes list */}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/student/quizzes">Back to My Quizzes</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 