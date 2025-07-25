"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ChevronLeft, ChevronRight, Eye, List, Settings } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { QuestionPreview } from "./components/QuestionPreview";
import { Quiz, Question, QuestionType } from "@prisma/client";

interface QuizPreviewClientProps {
  quiz: Quiz & {
    questions: (Question & {
      options: {
        id: string;
        content: string;
        isCorrect: boolean;
        order: number;
        group?: string | null;
        matchId?: string | null;
      }[];
    })[];
  };
}

export function QuizPreviewClient({ quiz }: QuizPreviewClientProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"question" | "list" | "settings">("question");
  
  // Get current question
  const currentQuestion = useMemo(() => {
    return quiz.questions[currentQuestionIndex] || null;
  }, [quiz.questions, currentQuestionIndex]);

  // Calculate progress
  const progress = useMemo(() => {
    return quiz.questions.length > 0
      ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100
      : 0;
  }, [currentQuestionIndex, quiz.questions.length]);

  // Handle navigation
  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
    setViewMode("question");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          {quiz.description && (
            <p className="text-muted-foreground mt-1">{quiz.description}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <CardTitle>Preview Mode</CardTitle>
              <CardDescription>
                This is how students will see your quiz. Questions are displayed in their set order.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Limit:</span>
              <span className="px-2 py-1 rounded-md bg-slate-100 text-sm">
                {formatDuration(quiz.timeLimit * 60 * 1000)}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <div className="flex justify-end mb-6">
              <TabsList className="grid w-72 grid-cols-3">
                <TabsTrigger value="question">
                  <Eye className="h-4 w-4 mr-2" />
                  Question
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Info
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="question" className="mt-0">
              {quiz.questions.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold">No questions added yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Go back to the quiz editor to add questions to this quiz.
                  </p>
                  <Button className="mt-4" asChild>
                    <a href={`/dashboard/teacher/quizzes/${quiz.id}/edit`}>Add Questions</a>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                      <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                      <span>{currentQuestion?.points || 0} points</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {currentQuestion && (
                    <div className="mt-6">
                      <QuestionPreview question={currentQuestion} />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-8">
                    <Button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      variant="outline"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === quiz.questions.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <div className="grid gap-2">
                {quiz.questions.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold">No questions added yet</h3>
                    <p className="text-muted-foreground mt-2">
                      Go back to the quiz editor to add questions to this quiz.
                    </p>
                  </div>
                ) : (
                  quiz.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleQuestionSelect(index)}
                    >
                      <div className="flex items-center">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium mr-3">
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium line-clamp-1">
                            {question.content.replace(/<[^>]*>/g, '').substring(0, 60)}
                            {question.content.length > 60 ? "..." : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">{question.type} • {question.points} points</span>
                        </div>
                      </div>
                      
                      {index === currentQuestionIndex && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Quiz Settings</h3>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Time Limit:</span>
                      <span>{formatDuration(quiz.timeLimit * 60 * 1000)}</span>
                      
                      <span className="text-muted-foreground">Total Points:</span>
                      <span>{quiz.questions.reduce((sum, q) => sum + q.points, 0)} points</span>
                      
                      <span className="text-muted-foreground">Total Questions:</span>
                      <span>{quiz.questions.length} questions</span>
                      
                      <span className="text-muted-foreground">Shuffle Questions:</span>
                      <span>{quiz.shuffleQuestions ? "Yes" : "No"}</span>
                      
                      <span className="text-muted-foreground">Max Attempts:</span>
                      <span>{quiz.maxAttempts || "Unlimited"}</span>
                      
                      <span className="text-muted-foreground">Passing Score:</span>
                      <span>{quiz.passingScore ? `${quiz.passingScore}%` : "None"}</span>
                      
                      <span className="text-muted-foreground">Show Results:</span>
                      <span>{quiz.showResults ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Question Types</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(QuestionType).map(type => {
                      const count = quiz.questions.filter(q => q.type === type).length;
                      return count > 0 ? (
                        <div key={type} className="flex items-center gap-2 p-2 border rounded-md">
                          <div className="h-4 w-4 rounded-full bg-primary/20"></div>
                          <span>{type}: {count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline" asChild>
            <a href={`/dashboard/teacher/quizzes/${quiz.id}/edit`}>
              Back to Editor
            </a>
          </Button>
          
          <Button asChild disabled={!quiz.isPublished}>
            <a href={quiz.isPublished ? `/dashboard/teacher/quizzes/${quiz.id}/results` : '#'}>
              {quiz.isPublished ? "View Results" : "Not Published Yet"}
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 