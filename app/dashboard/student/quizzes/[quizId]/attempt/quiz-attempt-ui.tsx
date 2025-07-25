'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, NavigationIcon, Save, ChevronLeft, Check, Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Import custom question components
import { MultipleChoiceQuestion } from "./multiple-choice-question";
import { MatchingQuestion } from "./matching-question";
import { FillBlankQuestion } from "./fill-blank-question";
import { EssayQuestion } from "./essay-question";
import { CodeQuestion } from "./code-question";
import { Label } from "@/components/ui/label";

interface QuizAttemptUIProps {
  quizId: string;
  attemptId: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  options?: Option[];
  metadata?: QuestionMetadata;
  mediaType?: string;
  mediaUrl?: string;
}

interface Option {
  id: string;
  content: string;
  order: number;
  group?: string;       // For MATCHING questions
  position?: number;    // For FILL_BLANK questions
}

interface QuestionMetadata {
  // MULTIPLE_CHOICE
  allowMultiple?: boolean;
  shuffleOptions?: boolean;
  
  // ESSAY
  minWords?: number;
  maxWords?: number;
  placeholder?: string;
  richText?: boolean;
  
  // SHORT_ANSWER
  caseSensitive?: boolean;
  
  // FILL_BLANK
  text?: string;  // Text with blanks marked
  
  // CODE
  language?: string; // Programming language
  initialCode?: string; // Initial code snippet
  testCases?: string[]; // Test cases for auto-grading
}

interface AttemptInfo {
  quizId: string;
  quizTitle: string;
  timeLimit: number;
  startedAt: string;
  questionCount: number;
  currentQuestion: number;
  completed: boolean;
}

export function QuizAttemptUI({ quizId, attemptId }: QuizAttemptUIProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptInfo, setAttemptInfo] = useState<AttemptInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // For multiple selection
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [jsonAnswer, setJsonAnswer] = useState<Record<string, any> | null>(null); // For complex questions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingQuiz, setIsCompletingQuiz] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Load attempt and first question
  useEffect(() => {
    const loadAttempt = async () => {
      try {
        // Fetch attempt information
        const response = await fetch(`/api/attempts/${attemptId}/details`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to load attempt");
        }
        
        if (data.success) {
          setAttemptInfo(data.data);
          
          // If the attempt is already completed, redirect to results
          if (data.data.completed) {
            toast({
              title: "Attempt already completed",
              description: "Redirecting to results page...",
            });
            router.push(`/dashboard/student/results/${attemptId}`);
            return;
          }
          
          // Calculate remaining time
          const startTime = new Date(data.data.startedAt).getTime();
          const timeLimit = data.data.timeLimit * 60 * 1000; // Convert minutes to milliseconds
          const endTime = startTime + timeLimit;
          const now = Date.now();
          const remaining = Math.max(0, endTime - now);
          
          setRemainingTime(Math.floor(remaining / 1000)); // Convert to seconds
          
          // Load the current question
          loadCurrentQuestion(data.data.currentQuestion);
        } else {
          throw new Error(data.message || "Failed to load attempt");
        }
      } catch (err) {
        console.error("Error loading attempt:", err);
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
    
    loadAttempt();
  }, [attemptId, router, toast]);
  
  // Timer countdown
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) return;
    
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          autoSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime]);
  
  // Setup auto-save interval
  useEffect(() => {
    if (attemptInfo && !attemptInfo.completed && currentQuestion) {
      // Auto-save every 30 seconds
      const autoSaveInterval = setInterval(() => {
        if (isSubmitting || isCompletingQuiz) return; // Don't auto-save if already submitting
        
        setIsAutoSaving(true);
        saveAnswer().finally(() => {
          setIsAutoSaving(false);
        });
      }, 30000); // 30 seconds
      
      return () => {
        clearInterval(autoSaveInterval);
      };
    }
  }, [attemptInfo, currentQuestion, isSubmitting, isCompletingQuiz]);
  
  // Format remaining time
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--:--";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Load a specific question
  const loadCurrentQuestion = async (questionNumber: number) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/attempts/${attemptId}/questions?number=${questionNumber}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to load question");
      }
      
      if (data.success) {
        setCurrentQuestion(data.data.question);
        
        // Set current answer if there is one
        if (data.data.answer) {
          // Reset all answer states first
          setSelectedOption(null);
          setSelectedOptions([]);
          setTextAnswer("");
          setJsonAnswer(null);
          
          // Then set the appropriate state based on question type
          const questionType = data.data.question.type;
          const answer = data.data.answer;
          
          if (answer.selectedOption) {
            setSelectedOption(answer.selectedOption);
            
            // For multiple choice with multiple answers
            if (questionType === "MULTIPLE_CHOICE" && 
                data.data.question.metadata?.allowMultiple) {
              // Ưu tiên sử dụng selectedOptionIds nếu có, nó là mảng các ID đã được chọn
              if (answer.selectedOptionIds && Array.isArray(answer.selectedOptionIds)) {
                setSelectedOptions(answer.selectedOptionIds);
              } else {
                // Fallback cho trường hợp cũ khi selectedOption chứa JSON
                try {
                  const selectedOpts = JSON.parse(answer.selectedOption);
                  if (Array.isArray(selectedOpts)) {
                    setSelectedOptions(selectedOpts);
                  }
                } catch (e) {
                  console.error("Error parsing multiple options:", e);
                  // Nếu parse JSON thất bại, coi như single option
                  setSelectedOptions(answer.selectedOption ? [answer.selectedOption] : []);
                }
              }
            }
          }
          
          if (answer.textAnswer) {
            // For simple text answers
            if (["ESSAY", "SHORT_ANSWER"].includes(questionType)) {
              setTextAnswer(answer.textAnswer);
            }
            
            // For complex JSON answers
            if (["MATCHING", "FILL_BLANK", "CODE"].includes(questionType)) {
              try {
                if (answer.jsonData) {
                  setJsonAnswer(answer.jsonData);
                } else {
                  setJsonAnswer(JSON.parse(answer.textAnswer));
                }
              } catch (e) {
                console.error(`Error parsing JSON for ${questionType}:`, e);
              }
            }
          }
        } else {
          // Reset all answer states if no answer exists
          setSelectedOption(null);
          setSelectedOptions([]);
          setTextAnswer("");
          setJsonAnswer(null);
        }
        
        // Update attempt info if needed
        if (attemptInfo && attemptInfo.currentQuestion !== questionNumber) {
          setAttemptInfo({
            ...attemptInfo,
            currentQuestion: questionNumber
          });
        }
      } else {
        throw new Error(data.message || "Failed to load question");
      }
    } catch (err) {
      console.error("Error loading question:", err);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save the current answer
  const saveAnswer = async () => {
    if (!currentQuestion) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the answer data based on question type
      let answerData: any = {
        questionId: currentQuestion.id,
        answer: {
          selectedOptions: [],
          textAnswer: undefined,
          jsonData: undefined
        }
      };
      
      switch (currentQuestion.type) {
        case "MULTIPLE_CHOICE":
        case "TRUE_FALSE":
          // Cung cấp mảng selectedOptions theo đúng định dạng API
          if (currentQuestion.metadata?.allowMultiple) {
            answerData.answer.selectedOptions = selectedOptions;
          } else {
            // Với single choice, vẫn đảm bảo gửi đi dạng mảng chỉ có 1 phần tử
            answerData.answer.selectedOptions = selectedOption ? [selectedOption] : [];
          }
          break;
          
        case "ESSAY":
        case "SHORT_ANSWER":
        case "CODE":
          answerData.answer.textAnswer = textAnswer;
          break;
          
        case "MATCHING":
        case "FILL_BLANK":
          if (jsonAnswer) {
            answerData.answer.jsonData = JSON.stringify(jsonAnswer);
          }
          break;
          
        default:
          break;
      }
      
      const response = await fetch(`/api/attempts/${attemptId}/validate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to save answer");
      }
      
      if (!data.success) {
        throw new Error(data.message || "Failed to save answer");
      }
      
      setLastSaved(new Date());
      
      // Chỉ hiển thị toast khi người dùng chủ động lưu câu trả lời
      if (!isAutoSaving) {
        toast({
          title: "Answer saved",
          description: "Your answer has been saved successfully.",
          variant: "default",
        });
      }
      
    } catch (err) {
      console.error("Error saving answer:", err);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigate to the next question
  const goToNextQuestion = async () => {
    if (!attemptInfo) return;
    
    // Save the current answer first
    await saveAnswer();
    
    // Then move to the next question
    const nextQuestion = attemptInfo.currentQuestion + 1;
    if (nextQuestion <= attemptInfo.questionCount) {
      loadCurrentQuestion(nextQuestion);
    }
  };
  
  // Navigate to the previous question
  const goToPrevQuestion = async () => {
    if (!attemptInfo) return;
    
    // Save the current answer first
    await saveAnswer();
    
    // Then move to the previous question
    const prevQuestion = attemptInfo.currentQuestion - 1;
    if (prevQuestion >= 1) {
      loadCurrentQuestion(prevQuestion);
    }
  };
  
  // Complete the quiz
  const completeQuiz = async () => {
    if (!attemptInfo) return;
    
    try {
      setIsCompletingQuiz(true);
      
      // Save the current answer first
      await saveAnswer();
      
      // Then complete the quiz
      const response = await fetch(`/api/attempts/${attemptId}/complete`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to complete quiz");
      }
      
      if (data.success) {
        toast({
          title: "Quiz completed",
          description: "Your quiz has been submitted successfully.",
          variant: "default",
        });
        
        // Redirect to results page
        router.push(`/dashboard/student/results/${attemptId}`);
      } else {
        throw new Error(data.message || "Failed to complete quiz");
      }
    } catch (err) {
      console.error("Error completing quiz:", err);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsCompletingQuiz(false);
      setConfirming(false);
    }
  };
  
  // Auto-submit quiz when time is up
  const autoSubmitQuiz = async () => {
    toast({
      title: "Time's up!",
      description: "The quiz is being automatically submitted.",
      variant: "destructive",
    });
    
    await completeQuiz();
  };
  
  // Handle multiple choice selection change
  const handleMultipleChoiceChange = (selection: string | string[]) => {
    if (Array.isArray(selection)) {
      setSelectedOptions(selection);
    } else {
      setSelectedOption(selection);
    }
  };
  
  // Handle essay/short answer change
  const handleTextChange = (text: string) => {
    setTextAnswer(text);
  };
  
  // Handle complex json answers
  const handleJsonChange = (data: Record<string, any>) => {
    setJsonAnswer(data);
  };
  
  // Render the current question
  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    return (
      <div className="space-y-6">
        {/* Question media (if available) */}
        {currentQuestion.mediaUrl && (
          <div className="mb-4">
            {currentQuestion.mediaType === 'IMAGE' && (
              <img 
                src={currentQuestion.mediaUrl} 
                alt="Question media" 
                className="max-w-full rounded-md"
              />
            )}
            {currentQuestion.mediaType === 'VIDEO' && (
              <video 
                src={currentQuestion.mediaUrl} 
                controls 
                className="max-w-full rounded-md"
              />
            )}
            {currentQuestion.mediaType === 'AUDIO' && (
              <audio 
                src={currentQuestion.mediaUrl} 
                controls 
                className="w-full"
              />
            )}
          </div>
        )}
        
        {/* Question content */}
        <div className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />
        </div>
        
        {/* Multiple choice questions */}
        {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
          <MultipleChoiceQuestion 
            question={{ 
              id: currentQuestion.id,
              content: currentQuestion.content, 
              options: currentQuestion.options as unknown as import('@/lib/question-utils').Option[] 
            }}
            selectedOptions={currentQuestion.metadata?.allowMultiple === true ? selectedOptions : selectedOption ? [selectedOption] : []}
            onChange={handleMultipleChoiceChange}
            allowMultiple={Boolean(currentQuestion.metadata?.allowMultiple)}
            shuffleOptionsEnabled={Boolean(currentQuestion.metadata?.shuffleOptions)}
            disabled={false}
          />
        )}
        
        {/* True/False questions */}
        {currentQuestion.type === "TRUE_FALSE" && currentQuestion.options && (
          <MultipleChoiceQuestion 
            question={{ 
              id: currentQuestion.id,
              content: currentQuestion.content, 
              options: currentQuestion.options as unknown as import('@/lib/question-utils').Option[] 
            }}
            selectedOptions={selectedOption ? [selectedOption] : []}
            onChange={handleMultipleChoiceChange}
            allowMultiple={false}
            shuffleOptionsEnabled={false}
            disabled={false}
          />
        )}
        
        {/* Short answer questions */}
        {currentQuestion.type === "SHORT_ANSWER" && (
          <div className="space-y-2">
            <Label htmlFor="short-answer-input" className="text-sm font-medium">
              Your Answer:
            </Label>
            <div className="relative flex items-center">
              <MessageSquare className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="short-answer-input"
                type="text"
                value={textAnswer}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={currentQuestion.metadata?.placeholder || "Enter your concise answer..."}
                className="w-full pl-10 pr-3 py-3 text-base rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                aria-describedby="case-sensitive-note"
              />
            </div>
            {currentQuestion.metadata?.caseSensitive && (
              <p id="case-sensitive-note" className="mt-1 text-xs text-muted-foreground">
                Note: This answer is case-sensitive.
              </p>
            )}
          </div>
        )}
        
        {/* Essay questions */}
        {currentQuestion.type === "ESSAY" && (
          <EssayQuestion
            minWords={currentQuestion.metadata?.minWords}
            maxWords={currentQuestion.metadata?.maxWords}
            placeholder={currentQuestion.metadata?.placeholder}
            richText={currentQuestion.metadata?.richText}
            value={textAnswer}
            onChange={handleTextChange}
          />
        )}
        
        {/* Matching questions */}
        {currentQuestion.type === "MATCHING" && currentQuestion.options && (
          <MatchingQuestion
            options={currentQuestion.options as any}
            existingAnswer={jsonAnswer as Record<string, string> | undefined}
            onChange={handleJsonChange}
          />
        )}
        
        {/* Fill in the blank questions */}
        {currentQuestion.type === "FILL_BLANK" && currentQuestion.metadata?.text && (
          <FillBlankQuestion
            text={currentQuestion.metadata.text}
            options={currentQuestion.options || [] as any}
            caseSensitive={currentQuestion.metadata.caseSensitive}
            existingAnswer={jsonAnswer as Record<string, string> | undefined}
            onChange={handleJsonChange}
          />
        )}
        
        {/* Code questions */}
        {currentQuestion.type === "CODE" && (
          <CodeQuestion
            language={currentQuestion.metadata?.language || "javascript"}
            placeholder={currentQuestion.metadata?.placeholder || "// Write your code here..."}
            initialCode={currentQuestion.metadata?.initialCode || ""}
            value={textAnswer}
            onChange={handleTextChange}
          />
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-1/4" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
          </CardContent>
          <CardFooter>
            <div className="w-full flex justify-between">
              <Skeleton className="h-10 w-1/4" />
              <Skeleton className="h-10 w-1/4" />
            </div>
          </CardFooter>
        </Card>
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
  
  if (!attemptInfo || !currentQuestion) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Could not load quiz attempt information.</AlertDescription>
      </Alert>
    );
  }
  
  const isFirstQuestion = attemptInfo.currentQuestion === 1;
  const isLastQuestion = attemptInfo.currentQuestion === attemptInfo.questionCount;
  
  return (
    <div className="space-y-8">
      {/* Header with timer and progress */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{attemptInfo.quizTitle}</h1>
          <p className="text-muted-foreground">
            Question {attemptInfo.currentQuestion} of {attemptInfo.questionCount}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span 
            className={`font-mono text-lg ${remainingTime !== null && remainingTime < 300 ? 'text-red-500 font-bold' : ''}`}
          >
            {formatTime(remainingTime)}
          </span>
        </div>
      </div>
      
      {/* Question card */}
      <Card>
        <CardHeader>
          <CardTitle>Question {attemptInfo.currentQuestion}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderQuestion()}
        </CardContent>
        <CardFooter>
          <div className="w-full flex justify-between items-center gap-3">
            <Button
              variant="outline"
              onClick={goToPrevQuestion}
              disabled={isFirstQuestion || isSubmitting}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={saveAnswer}
              disabled={isSubmitting}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            {isLastQuestion ? (
              <Button
                onClick={() => setConfirming(true)}
                variant="default"
                disabled={isSubmitting || isCompletingQuiz}
              >
                Finish Quiz
              </Button>
            ) : (
              <Button
                onClick={goToNextQuestion}
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Confirmation dialog */}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to finish this quiz? You won't be able to change your answers after submitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={isCompletingQuiz}>
              Cancel
            </Button>
            <Button onClick={completeQuiz} disabled={isCompletingQuiz} isLoading={isCompletingQuiz}>
              Submit Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPrevQuestion}
          disabled={!attemptInfo || attemptInfo.currentQuestion <= 1 || isSubmitting || isCompletingQuiz}
        >
          Previous
        </Button>
        
        <div className="flex items-center">
          {lastSaved && (
            <div className="text-xs text-muted-foreground mr-4 flex items-center">
              <Save className="h-3 w-3 mr-1" />
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </div>
          )}
          
          {attemptInfo && attemptInfo.currentQuestion === attemptInfo.questionCount ? (
            <Button 
              onClick={() => setConfirming(true)}
              disabled={isSubmitting || isCompletingQuiz}
            >
              {isCompletingQuiz && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Finish Quiz
            </Button>
          ) : (
            <Button
              onClick={goToNextQuestion}
              disabled={isSubmitting}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 