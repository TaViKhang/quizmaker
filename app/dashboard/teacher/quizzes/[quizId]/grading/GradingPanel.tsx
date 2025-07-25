"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EssayGrading } from "./components/EssayGrading";
import { CodeGrading } from "./components/CodeGrading";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Timer, Code, FileText, XCircle } from "lucide-react";
import { QuestionType } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Student {
  id: string;
  name: string | null;
  email: string | null;
}

interface Answer {
  id: string;
  questionId: string;
  textAnswer: string | null;
  score: number | null;
  feedback: string | null;
  selectedOption?: string | null;      // For single-choice MCQ backward compatibility
  selectedOptionIds?: string[];        // For multiple-choice MCQ
  jsonData?: any;                      // For matching, fill-in-blank questions
  question: {
    id: string;
    content: string;
    points: number;
    type: string;
    metadata: any;
    options?: any[];                  // Options for MCQ/true-false questions
  };
}

interface Attempt {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null;
  user: Student;
  answers: Answer[];
}

interface Question {
  id: string;
  content: string;
  points: number;
  type: string;
  metadata: any;
  options?: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
}

interface GradingPanelProps {
  quizId: string;
  quizTitle: string;
  questions: Question[];
  attempts: Attempt[];
  selectedAttempt: Attempt | undefined;
}

export function GradingPanel({ 
  quizId, 
  quizTitle,
  questions,
  attempts,
  selectedAttempt,
}: GradingPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | undefined>(selectedAttempt);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showGradedAttempts, setShowGradedAttempts] = useState(false);

  // Helper to get need-grading status
  const needsGrading = (attempt: Attempt) => 
    attempt.answers.some(answer => answer.score === null);
  
  // Get attempts that need grading
  const attemptsNeedingGrading = attempts.filter(needsGrading);
  const attemptFullyGraded = currentAttempt ? !needsGrading(currentAttempt) : false;
  
  // Filter attempts based on state
  const displayedAttempts = showGradedAttempts ? attempts : attemptsNeedingGrading;
  
  // Determine the current question/answer being graded
  const currentQuestion = currentAttempt?.answers[currentQuestionIndex]?.question;
  const currentAnswer = currentAttempt?.answers[currentQuestionIndex];
  
  // Handle attempt selection
  const handleAttemptSelect = (attemptId: string) => {
    const attempt = attempts.find(a => a.id === attemptId);
    setCurrentAttempt(attempt);
    setCurrentQuestionIndex(0);
    router.push(`/dashboard/teacher/quizzes/${quizId}/grading?attemptId=${attemptId}`);
  };
  
  // Navigate to previous or next question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < (currentAttempt?.answers.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Send notification to student
  const sendGradingNotification = async (attemptId: string, studentId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
                  body: JSON.stringify({
            userId: studentId,
            title: "Quiz Graded",
            message: `Your quiz "${quizTitle}" has been graded and is ready to review.`,
            category: "QUIZ_GRADED",
            resourceId: attemptId,
            resourceType: "quiz_attempt",
          }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send notification");
      }
      
      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  };
  
  // Save grade for the current answer
  const handleSaveGrade = async (score: number, feedback: string) => {
    if (!currentAnswer || !currentAttempt) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/teacher/grading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerId: currentAnswer.id,
          score,
          feedback,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save grade");
      }
      
      // Update local state with the new grade
      if (currentAttempt) {
        const updatedAnswers = [...currentAttempt.answers];
        updatedAnswers[currentQuestionIndex] = {
          ...updatedAnswers[currentQuestionIndex],
          score,
          feedback,
        };
        
        const updatedAttempt = {
          ...currentAttempt,
          answers: updatedAnswers,
        };
        
        setCurrentAttempt(updatedAttempt);
        
        // Check if all questions are now graded
        const allGraded = updatedAnswers.every(answer => answer.score !== null);
        
        if (allGraded) {
          // Send notification to student
          const notificationSent = await sendGradingNotification(
            currentAttempt.id, 
            currentAttempt.user.id
          );
          
          toast({
            title: "Grading completed",
            description: `All questions have been graded. ${notificationSent ? 'Student notified.' : 'Unable to notify student.'}`,
          });
        }
      }
      
      toast({
        title: "Grade saved",
        description: "The grade has been saved successfully.",
      });
      
      // Go to the next question if there is one
      if (currentQuestionIndex < (currentAttempt?.answers.length || 0) - 1) {
        goToNextQuestion();
      } else {
        // Refresh the page to get updated data
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving grade:", error);
      toast({
        title: "Error saving grade",
        description: "There was a problem saving the grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get the correct grading component based on question type
  const renderGradingComponent = () => {
    if (!currentQuestion || !currentAnswer) return null;
    
    switch (currentQuestion.type) {
      case QuestionType.ESSAY:
        return (
          <EssayGrading
            quizId={quizId}
            attemptId={currentAttempt?.id || ""}
            answerId={currentAnswer.id}
            questionContent={currentQuestion.content}
            studentAnswer={currentAnswer.textAnswer || ""}
            questionPoints={currentQuestion.points}
            existingScore={currentAnswer.score}
            existingFeedback={currentAnswer.feedback}
            rubric={currentQuestion.metadata?.rubric}
            gradingGuide={currentQuestion.metadata?.gradingGuide || null}
            exampleAnswer={currentQuestion.metadata?.exampleAnswer || null}
            isRichText={currentQuestion.metadata?.richText}
            onSaveGrade={handleSaveGrade}
          />
        );
      case QuestionType.CODE:
        return (
          <CodeGrading
            quizId={quizId}
            attemptId={currentAttempt?.id || ""}
            answerId={currentAnswer.id}
            questionContent={currentQuestion.content}
            studentCode={currentAnswer.textAnswer || ""}
            questionPoints={currentQuestion.points}
            existingScore={currentAnswer.score}
            existingFeedback={currentAnswer.feedback}
            language={currentQuestion.metadata?.language || "javascript"}
            testCases={currentQuestion.metadata?.testCases || []}
            solutionCode={currentQuestion.metadata?.solutionCode || ""}
            onSaveGrade={handleSaveGrade}
          />
        );
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        // Multiple choice questions typically get auto-graded, but we show their answers and allow feedback
        return (
          <div className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />
            </div>
            
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold">Student Answer:</h3>
              <div className="space-y-2">
                {/* Get options from the question */}
                {currentQuestion.options ? currentQuestion.options.map((option: any) => {
                  // Check if selected, either from selectedOption (single) or selectedOptionIds (multiple)
                  const isSelected = currentAnswer.selectedOption === option.id ||
                    (Array.isArray(currentAnswer.selectedOptionIds) && 
                     currentAnswer.selectedOptionIds.includes(option.id));
                  
                  const isCorrect = option.isCorrect;
                  
                  // Determine style based on selection and correctness
                  let optionClassName = "flex items-center p-3 rounded-md border";
                  let iconComponent = null;
                  
                  if (isSelected && isCorrect) {
                    // Selected and correct
                    optionClassName += " border-green-500 bg-green-50 dark:bg-green-950/20";
                    iconComponent = <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
                  } else if (isSelected && !isCorrect) {
                    // Selected but incorrect
                    optionClassName += " border-red-500 bg-red-50 dark:bg-red-950/20";
                    iconComponent = <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
                  } else if (!isSelected && isCorrect) {
                    // Not selected but correct (show as hint)
                    optionClassName += " border-amber-500 bg-amber-50 dark:bg-amber-950/10";
                    iconComponent = <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
                  } else {
                    // Not selected and incorrect
                    optionClassName += " border-gray-200 dark:border-gray-700";
                  }
                  
                  return (
                    <div key={option.id} className={optionClassName}>
                      <div className="flex-1 ml-3">
                        <div dangerouslySetInnerHTML={{ __html: option.content }} />
                      </div>
                      <div className="ml-2">
                        {iconComponent}
                      </div>
                    </div>
                  );
                }) : <div>No options available</div>}
              </div>
            </div>
            
            {/* Feedback section for MCQ */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Feedback (Optional):</h3>
              <form 
                className="space-y-4 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Keep the existing auto-calculated score, just update feedback
                  const form = e.target as HTMLFormElement;
                  const feedback = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value;
                  handleSaveGrade(currentAnswer.score || 0, feedback);
                }}
              >
                <Textarea
                  id="feedback"
                  name="feedback"
                  placeholder="Add feedback for the student..."
                  defaultValue={currentAnswer.feedback || ""}
                  rows={4}
                  className="w-full"
                />
                
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Feedback'
                  )}
                </Button>
              </form>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 text-center">
            <p>Unsupported question type for manual grading: {currentQuestion.type}</p>
            <p className="mt-2 text-muted-foreground">
              This question type is auto-graded or not supported for manual grading.
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar: Attempts list */}
        <Card className="w-full lg:w-80 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">
              Student Submissions ({attemptsNeedingGrading.length} need grading)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 py-2 border-b">
              <div className="flex items-center">
                <Switch
                  id="show-graded"
                  checked={showGradedAttempts}
                  onCheckedChange={setShowGradedAttempts}
                />
                <Label htmlFor="show-graded" className="ml-2 text-sm">
                  {showGradedAttempts ? "Showing all submissions" : "Showing only ungraded submissions"}
                </Label>
              </div>
            </div>
            <div className="divide-y">
              {displayedAttempts.length === 0 ? (
                <div className="px-6 py-4 text-center text-muted-foreground">
                  No submissions yet
                </div>
              ) : (
                displayedAttempts.map((attempt) => (
                  <div 
                    key={attempt.id}
                    className={`
                      px-6 py-4 hover:bg-slate-50 cursor-pointer
                      ${currentAttempt?.id === attempt.id ? "bg-slate-50" : ""}
                    `}
                    onClick={() => handleAttemptSelect(attempt.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{attempt.user.name || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">{attempt.user.email}</p>
                      </div>
                      {needsGrading(attempt) ? (
                        <Badge variant="secondary">Needs Grading</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Graded
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      <span>Submitted: {formatDate(attempt.startedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Main content: Grading area */}
        <div className="flex-1">
          {!currentAttempt ? (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No submission selected</h3>
                <p className="text-muted-foreground mt-1">
                  Select a student submission from the list to start grading
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {currentAttempt.user.name || "Anonymous"}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentAttempt.answers.length} question(s) to grade • 
                    Submitted {formatDate(currentAttempt.startedAt)}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Select 
                    value={currentQuestionIndex.toString()} 
                    onValueChange={(value) => setCurrentQuestionIndex(parseInt(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select question" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentAttempt.answers.map((answer, index) => (
                        <SelectItem key={answer.id} value={index.toString()}>
                          <div className="flex items-center">
                            <div className="mr-2">
                              {answer.question.type === QuestionType.ESSAY && <FileText className="h-4 w-4" />}
                              {answer.question.type === QuestionType.CODE && <Code className="h-4 w-4" />}
                            </div>
                            Question {index + 1} 
                            {answer.score !== null && " ✓"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === currentAttempt.answers.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {renderGradingComponent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 