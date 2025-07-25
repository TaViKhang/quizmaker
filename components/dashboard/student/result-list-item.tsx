"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Award,
  CalendarCheck2,
  Clock3,
  FileText,
  MessageSquare,
  BookCopy,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2, // For correct answers
  ListChecks // For total questions
} from "lucide-react";

// Updated interface to match API response
interface QuizResultItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string | null;
  className: string | null;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctQuestions: number;
  completedAt: string;
  timeTakenMinutes: number | null;
  feedbackAvailable: boolean;
}

interface ResultListItemProps {
  result: QuizResultItem;
  formatDate: (dateString: string) => string;
}

export function ResultListItem({ result, formatDate }: ResultListItemProps) {
  // Calculate percentage score for color coding
  const scorePercentage = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
  
  const scoreColor = scorePercentage >= 70 ? "text-green-600 dark:text-green-500" 
                   : scorePercentage >= 40 ? "text-yellow-600 dark:text-yellow-500" 
                   : "text-red-600 dark:text-red-500";
  
  const ScoreIcon = scorePercentage >= 70 ? TrendingUp 
                  : scorePercentage >= 40 ? Minus 
                  : TrendingDown;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2 leading-tight">
                {result.quizTitle}
            </CardTitle>
            <div className={cn(
                "flex items-center justify-center rounded-full w-10 h-10 flex-shrink-0 ",
                scorePercentage >= 70 ? "bg-green-100 dark:bg-green-900/50" 
                : scorePercentage >= 40 ? "bg-yellow-100 dark:bg-yellow-900/50" 
                : "bg-red-100 dark:bg-red-900/50"
            )}>
                <ScoreIcon className={cn("w-5 h-5", scoreColor)} />
            </div>
        </div>
        {result.className && (
          <CardDescription className="flex items-center text-xs pt-1">
            <BookCopy className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            {result.className}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="py-3 space-y-2 text-sm">
        <div className="flex items-center">
          <Award className={cn("h-4 w-4 mr-2 flex-shrink-0", scoreColor)} />
          <span className="font-semibold">Score:</span>
          <span className={cn("ml-1 font-bold", scoreColor)}>
            {result.score} / {result.maxScore} ({scorePercentage.toFixed(1)}%)
          </span>
        </div>
        
        <div className="flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Correct: <span className="font-medium">{result.correctQuestions} of {result.totalQuestions} questions</span>
          </span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <CalendarCheck2 className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Completed: {formatDate(result.completedAt)}</span>
        </div>
        
        {result.timeTakenMinutes !== null && (
          <div className="flex items-center text-muted-foreground">
            <Clock3 className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Time taken: {result.timeTakenMinutes} min</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/50 py-2.5 px-4 border-t">
        <div className="flex w-full justify-end items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/student/results/${result.attemptId}`}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              View Details
            </Link>
          </Button>
          {result.feedbackAvailable && (
             <Button variant="secondary" size="sm" asChild>
                <Link href={`/dashboard/student/results/${result.attemptId}/feedback`}> 
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    View Feedback
                </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 