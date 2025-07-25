import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  BookOpen
} from "lucide-react";
import { format } from 'date-fns';

interface ResultSummaryProps {
  quizTitle: string;
  quizDescription?: string | null;
  score: number | null;
  passingScore: number | null;
  completedAt: string | null;
  timeSpent: number | null;
  timeLimit?: number | null;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  pendingGrading: number;
  subject?: string | null;
  totalPoints?: number;
  earnedPoints?: number;
}

export default function ResultSummary({
  quizTitle,
  quizDescription,
  score,
  passingScore,
  completedAt,
  timeSpent,
  timeLimit,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  pendingGrading,
  subject,
  totalPoints = totalQuestions, // Default each question is worth 1 point
  earnedPoints
}: ResultSummaryProps) {
  // Format time spent
  const formatTimeSpent = (seconds: number) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };
  
  // Determine if the quiz was passed
  const isPassed = score !== null && passingScore !== null 
    ? score >= passingScore 
    : null;
  
  // Calculate percentage of questions answered correctly
  const answeredQuestions = correctAnswers + incorrectAnswers + pendingGrading;
  const answeredPercentage = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100) 
    : 0;
  
  // Calculate accuracy based on total questions
  const gradedQuestions = correctAnswers + incorrectAnswers;
  const accuracy = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{quizTitle}</h1>
        {quizDescription && <p className="text-muted-foreground">{quizDescription}</p>}
        {subject && (
          <Badge variant="outline" className="mt-2">
            <BookOpen className="h-3 w-3 mr-1" />
            {subject}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2 text-primary" />
              Final Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {score !== null ? `${score}%` : 'Pending'}
                </div>
                {earnedPoints !== undefined && totalPoints !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {earnedPoints}/{totalPoints} points
                  </p>
                )}
              </div>
              {isPassed !== null && (
                <Badge variant={isPassed ? "success" : "destructive"}>
                  {isPassed ? "Passed" : "Failed"}
                </Badge>
              )}
            </div>
            {passingScore !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Passing score: {passingScore}%
              </p>
            )}
            {answeredQuestions < totalQuestions && (
              <p className="text-xs text-amber-500 font-medium mt-1">
                Score based on all {totalQuestions} questions, including unattempted ones.
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Time Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeSpent ? formatTimeSpent(timeSpent) : 'N/A'}
            </div>
            {timeLimit && (
              <p className="text-xs text-muted-foreground mt-1">
                Time limit: {timeLimit} minutes
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Completion Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedAt ? format(new Date(completedAt), 'MMM d, yyyy') : 'Incomplete'}
            </div>
            {completedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(completedAt), 'h:mm a')}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Accuracy Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accuracy}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {correctAnswers} correct of {totalQuestions} total
            </p>
            {gradedQuestions < totalQuestions && (
              <p className="text-xs text-amber-500 mt-1">
                {totalQuestions - gradedQuestions} questions not attempted
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Progress Bars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Questions Answered */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Questions Answered</span>
              <span className="text-sm">{answeredQuestions}/{totalQuestions} ({answeredPercentage}%)</span>
            </div>
            <Progress value={answeredPercentage} className="h-2" />
          </div>
          
          {/* Question Status */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
              <div className="flex items-center mb-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium">Correct</span>
              </div>
              <span className="text-xl font-bold">{correctAnswers}</span>
            </div>
            
            <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
              <div className="flex items-center mb-1">
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm font-medium">Incorrect</span>
              </div>
              <span className="text-xl font-bold">{incorrectAnswers}</span>
            </div>
            
            <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
              <div className="flex items-center mb-1">
                <HelpCircle className="h-4 w-4 text-amber-500 mr-1" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <span className="text-xl font-bold">{pendingGrading}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 