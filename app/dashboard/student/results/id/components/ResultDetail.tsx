"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock3,
  BookCopy,
  HelpCircle,
  Info
} from "lucide-react";

interface AttemptData {
  attemptId: string;
  score: number;
  passed: boolean | null;
  passingScore: number | null;
  timeSpent: number | null;
  startedAt: string;
  completedAt: string;
  quiz: {
    id: string;
    title: string;
    description: string | null;
    author: {
      id: string;
      name: string | null;
    };
  };
  answers: Array<{
    id: string;
    questionId: string;
    isCorrect: boolean | null;
    score: number | null;
    question: {
      id: string;
      content: string;
      type: string;
      points: number;
      explanation: string | null;
    };
    correctOptions: Array<{
      id: string;
      content: string;
    }>;
    selectedOptionDetails?: {
      id: string;
      content: string;
    } | null;
  }>;
}

interface ResultDetailProps {
  data: AttemptData;
}

export default function ResultDetail({ data }: ResultDetailProps) {
  // Calculate percentage score
  const scorePercentage = data.score || 0;
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  // Determine score color
  const scoreColor = 
    scorePercentage >= 80 ? "text-green-600" :
    scorePercentage >= 60 ? "text-amber-600" :
    "text-red-600";
  
  // Count of correct answers
  const correctAnswersCount = data.answers.filter(answer => answer.isCorrect).length;
  
  // Calculate time spent
  const formattedTimeSpent = data.timeSpent ? 
    `${Math.floor(data.timeSpent / 60)}m ${data.timeSpent % 60}s` : 
    "Not recorded";
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard/student/results">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
        </Link>
        
        <div className="flex flex-wrap items-center gap-2">
          {data.quiz.author && (
            <Badge variant="outline" className="px-2 py-1">
              <BookCopy className="mr-1 h-3 w-3" />
              {data.quiz.author.name || "Unknown Author"}
            </Badge>
          )}
          <Badge variant="outline" className="px-2 py-1">
            <Calendar className="mr-1 h-3 w-3" />
            {formatDate(data.completedAt)}
          </Badge>
        </div>
      </div>
      
      {/* Result Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{data.quiz.title}</CardTitle>
          {data.quiz.description && (
            <CardDescription>{data.quiz.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Summary */}
          <div className="rounded-lg bg-muted/50 p-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className={`text-2xl font-bold ${scoreColor}`}>
                {scorePercentage.toFixed(1)}%
              </p>
              {data.passed !== null && (
                <Badge variant={data.passed ? "success" : "destructive"}>
                  {data.passed ? "Passed" : "Failed"}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="text-2xl font-bold">{data.answers.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Correct Answers</p>
              <p className="text-2xl font-bold text-emerald-600">
                {correctAnswersCount}
              </p>
              <p className="text-sm text-muted-foreground">
                of {data.answers.length}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Time Taken</p>
              <p className="text-2xl font-bold flex items-center">
                <Clock3 className="h-4 w-4 mr-2 text-muted-foreground" />
                {formattedTimeSpent}
              </p>
            </div>
          </div>
          
          {/* Questions and Answers */}
          <Separator className="my-6" />
          
          <h3 className="text-lg font-medium mb-4">Questions & Answers</h3>
          
          <div className="space-y-8">
            {data.answers.map((answer, index) => (
              <div key={answer.id} className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-muted text-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{answer.question.content}</p>
                    
                    {/* Question points */}
                    <p className="text-xs text-muted-foreground mt-1">
                      {answer.question.points} {answer.question.points === 1 ? 'point' : 'points'}
                    </p>
                    
                    {/* User's answer */}
                    <div className="mt-3 flex items-start">
                      <div className="flex-shrink-0 mt-0.5 mr-2">
                        {answer.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Your answer:</p>
                        <p className="text-sm">
                          {answer.selectedOptionDetails 
                            ? answer.selectedOptionDetails.content 
                            : "No answer provided"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Correct answer (if user answered incorrectly) */}
                    {!answer.isCorrect && answer.correctOptions.length > 0 && (
                      <div className="mt-2 ml-7 pl-0.5">
                        <p className="text-sm font-medium text-green-600">Correct answer:</p>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {answer.correctOptions.map(option => (
                            <li key={option.id}>{option.content}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Explanation */}
                    {answer.question.explanation && (
                      <div className="mt-3 ml-7 pl-0.5 flex items-start">
                        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          {answer.question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard/student/results">
            <Button>Back to Results</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 