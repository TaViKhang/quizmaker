'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Flag, 
  HelpCircle, 
  Loader2, 
  XCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

// Components for different question types
import QuestionRenderer from './components/question-renderer';
import QuestionNavigation from './components/question-navigation';
import TimeDisplay from './components/time-display';
import OfflineIndicator from './components/offline-indicator';
import SubmitConfirmation from './components/submit-confirmation';

// Types
import { 
  Quiz, 
  Question, 
  Answer, 
  QuizAttempt 
} from '@/app/dashboard/student/types/quiz-types';

interface QuizTakeProps {
  quizId: string;
  attemptId?: string | null;
}

export default function QuizTake({ quizId, attemptId: initialAttemptId }: QuizTakeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const saveAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useLocalStorage<Set<string>>(`flaggedQuestions_${attemptId}`, new Set());
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  // Store answers in local storage as backup
  const [localAnswers, setLocalAnswers] = useLocalStorage<Record<string, any>>(
    `quiz-answers-${quizId}`,
    {}
  );

  // Initialize attempt
  useEffect(() => {
    const startAttempt = async () => {
      try {
        setIsLoading(true);
        
        // Nếu đã có attemptId được truyền vào, sử dụng nó
        if (attemptId) {
          // Tải câu trả lời đã lưu
          loadSavedAnswers(attemptId);
          
          // Tải chi tiết bài kiểm tra
          fetchQuizDetails(quizId);
          return;
        }
        
        // Nếu không có attemptId, tạo một attempt mới
        const response = await fetch(`/api/attempts/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quizId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to start attempt');
        }

        const data = await response.json();
        
        if (data.success) {
          setAttemptId(data.data.attemptId);
          
          // If continuing an attempt, load saved answers
          if (!data.data.isNew) {
            loadSavedAnswers(data.data.attemptId);
          }
          
          // Load quiz details
          fetchQuizDetails(quizId);
        } else {
          throw new Error(data.message || 'Failed to start attempt');
        }
      } catch (err) {
        console.error('Error starting attempt:', err);
        setError((err as Error).message);
        toast({
          title: 'Lỗi',
          description: (err as Error).message,
          variant: 'destructive',
        });
      }
    };

    startAttempt();
  }, [quizId, attemptId, toast]);

  // Load quiz details
  const fetchQuizDetails = async (quizId: string) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load quiz details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setQuiz(data.data);
        
        // Initialize time limit if applicable
        if (data.data.timeLimit) {
          // Convert time limit from minutes to seconds
          setRemainingTime(data.data.timeLimit * 60);
        }
        
        setIsLoading(false);
      } else {
        throw new Error(data.message || 'Failed to load quiz details');
      }
    } catch (err) {
      console.error('Error loading quiz details:', err);
      setError((err as Error).message);
      toast({
        title: 'Lỗi',
        description: (err as Error).message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Load saved answers for a continuing attempt
  const loadSavedAnswers = async (attemptId: string) => {
    try {
      const response = await fetch(`/api/attempts/${attemptId}/answers`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load saved answers');
      }
      
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Transform API data into Answer objects
        const loadedAnswers: Answer[] = data.data.map((item: any) => ({
          questionId: item.questionId,
          selectedOptions: item.selectedOption ? [item.selectedOption] : [],
          textAnswer: item.textAnswer || '',
          jsonData: item.jsonData ? JSON.parse(item.jsonData) : null,
        }));
        
        setAnswers(loadedAnswers);
        
        // Also save to local storage as backup
        const answersMap: Record<string, any> = {};
        loadedAnswers.forEach(answer => {
          answersMap[answer.questionId] = {
            selectedOptions: answer.selectedOptions,
            textAnswer: answer.textAnswer,
            jsonData: answer.jsonData,
          };
        });
        
        setLocalAnswers(answersMap);
      }
    } catch (err) {
      console.error('Error loading saved answers:', err);
      // Try to recover from local storage
      recoverFromLocalStorage();
    }
  };

  // Attempt to recover answers from local storage if server fetch fails
  const recoverFromLocalStorage = () => {
    if (Object.keys(localAnswers).length > 0 && quiz) {
      const recoveredAnswers: Answer[] = [];
      
      quiz.questions.forEach(question => {
        if (localAnswers[question.id]) {
          recoveredAnswers.push({
            questionId: question.id,
            selectedOptions: localAnswers[question.id].selectedOptions || [],
            textAnswer: localAnswers[question.id].textAnswer || '',
            jsonData: localAnswers[question.id].jsonData || null,
          });
        }
      });
      
      if (recoveredAnswers.length > 0) {
        setAnswers(recoveredAnswers);
        toast({
          title: 'Khôi phục câu trả lời',
          description: 'Đã khôi phục câu trả lời từ bộ nhớ cục bộ.',
        });
      }
    }
  };

  // Save answer with debounce to prevent excessive API calls
  const saveAnswer = useCallback(async (answer: Answer) => {
    if (!attemptId) {
      return; // Không thể lưu mà không có attemptId
    }

    // Lưu vào local storage như một bản sao dự phòng
    setLocalAnswers(prev => ({
      ...prev,
      [answer.questionId]: {
        selectedOptions: answer.selectedOptions,
        textAnswer: answer.textAnswer,
        jsonData: answer.jsonData,
      },
    }));

    // Clear existing timeout
    if (saveAnswerTimeoutRef.current) {
      clearTimeout(saveAnswerTimeoutRef.current);
    }

    // Set new timeout (500ms debounce)
    saveAnswerTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/attempts/${attemptId}/answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: answer.questionId,
            // Đảm bảo selectedOptions luôn là một mảng, ngay cả khi rỗng hoặc chỉ có 1 phần tử
            selectedOptions: Array.isArray(answer.selectedOptions) 
              ? answer.selectedOptions 
              : (answer.selectedOptions ? [answer.selectedOptions] : []),
            textAnswer: answer.textAnswer || null,
            jsonData: answer.jsonData || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save answer');
        }

        const data = await response.json();
        
        if (data.success) {
          // Update last saved timestamp
          setLastSavedTimestamp(new Date());
        } else {
          throw new Error(data.message || 'Failed to save answer');
        }
      } catch (err) {
        console.error('Error saving answer:', err);
        toast({
          title: 'Lỗi lưu câu trả lời',
          // Hiển thị thông báo lỗi cụ thể từ server nếu có
          description: (err as Error).message || 'Không thể lưu câu trả lời của bạn. Vui lòng kiểm tra kết nối mạng.',
          variant: 'destructive',
        });
      }
    }, 500);
  }, [attemptId, setLocalAnswers, toast]);

  // Thiết lập tự động lưu định kỳ mọi câu trả lời hiện có
  useEffect(() => {
    if (!attemptId || answers.length === 0) return;

    // Tự động lưu mọi 30 giây
    autoSaveIntervalRef.current = setInterval(() => {
      // Chỉ lưu khi có câu trả lời và không đang trong quá trình nộp bài
      if (answers.length > 0 && !isSubmitting) {
        // Lưu tất cả câu trả lời hiện tại
        answers.forEach(answer => {
          saveAnswer(answer);
        });
        
        // Hiển thị thông báo nhỏ
        toast({
          title: 'Tự động lưu',
          description: 'Câu trả lời của bạn đã được lưu tự động.',
        });
      }
    }, 30000); // 30 giây

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [attemptId, answers, isSubmitting, saveAnswer, toast]);

  // Handle timer countdown
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev === null) return null;
        
        // Show warning when 5 minutes remaining
        if (prev === 300 && !showTimeWarning) {
          setShowTimeWarning(true);
          toast({
            title: 'Cảnh báo',
            description: 'Chỉ còn 5 phút nữa là hết giờ làm bài!',
            variant: 'destructive',
          });
        }
        
        // Show warning when 1 minute remaining
        if (prev === 60) {
          toast({
            title: 'Cảnh báo',
            description: 'Chỉ còn 1 phút nữa là hết giờ làm bài!',
            variant: 'destructive',
          });
        }
        
        // Auto-submit when time runs out
        if (prev <= 1) {
          submitQuiz('auto');
          return 0;
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, isSubmitting, showTimeWarning, toast]);

  // Update answer when changed by student
  const handleAnswerChange = useCallback((answer: Answer) => {
    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === answer.questionId);
      
      if (existingIndex >= 0) {
        // Update existing answer
        const updated = [...prev];
        updated[existingIndex] = answer;
        return updated;
      } else {
        // Add new answer
        return [...prev, answer];
      }
    });
    
    // Save answer to server
    saveAnswer(answer);
  }, [saveAnswer]);

  // Toggle flag status on a question
  const handleToggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Navigate to next question
  const handleNextQuestion = useCallback(() => {
    if (!quiz) return;
    
    setCurrentQuestionIndex(prev => {
      if (prev < quiz.questions.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [quiz]);

  // Navigate to previous question
  const handlePrevQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Submit quiz
  const submitQuiz = async (type: 'manual' | 'auto' = 'manual') => {
    if (!attemptId || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Try to save any pending answers first
      await Promise.all(
        answers.map(answer => 
          fetch(`/api/attempts/${attemptId}/answers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questionId: answer.questionId,
              selectedOptions: answer.selectedOptions || [],
              textAnswer: answer.textAnswer || null,
              jsonData: answer.jsonData || null,
            }),
          })
        )
      );
      
      // Complete the attempt
      const response = await fetch(`/api/attempts/${attemptId}/complete`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit quiz');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Clear local storage
        setLocalAnswers({});
        
        toast({
          title: type === 'auto' ? 'Tự động nộp bài' : 'Nộp bài thành công',
          description: 'Bài làm của bạn đã được nộp.',
        });
        
        // Redirect to results page - Fixed path to use correct URL format
        router.push(`/dashboard/student/quizzes/results/${attemptId}`);
      } else {
        throw new Error(data.message || 'Failed to submit quiz');
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast({
        title: 'Lỗi',
        description: (err as Error).message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  // Show confirmation dialog before manually submitting
  const handleSubmitConfirmation = () => {
    if (!quiz) return;
    
    // Check for unanswered questions
    const answeredCount = answers.filter(a => 
      a.selectedOptions.length > 0 || a.textAnswer || a.jsonData
    ).length;
    
    const unansweredCount = quiz.questions.length - answeredCount;
    
    // Show different content based on answer status
    setShowSubmitConfirmation(true);
  };

  // If still loading, show skeleton
  if (isLoading) {
    return <QuizTakeSkeleton />;
  }

  // If error, show error message
  if (error || !quiz) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {error || 'Không thể tải bài kiểm tra. Vui lòng thử lại sau.'}
          </AlertDescription>
          <Button className="mt-4" onClick={() => router.push('/dashboard/student/quizzes')}>
            Quay lại danh sách bài kiểm tra
          </Button>
        </Alert>
      </div>
    );
  }

  // Get current question
  const currentQuestion = quiz.questions[currentQuestionIndex];

  // Check if current question has been answered
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      {/* Thêm hiển thị thời gian lưu cuối cùng */}
      {lastSavedTimestamp && (
        <div className="text-xs text-muted-foreground flex items-center">
          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
          Lưu lần cuối: {lastSavedTimestamp.toLocaleTimeString()}
        </div>
      )}

      {/* Time warning dialog */}
      <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Cảnh báo thời gian</DialogTitle>
            <DialogDescription>
              Chỉ còn 5 phút nữa là hết giờ làm bài. Hãy kiểm tra lại bài làm của bạn và nộp bài kịp thời!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowTimeWarning(false)}>Đã hiểu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit confirmation dialog */}
      <SubmitConfirmation
        open={showSubmitConfirmation}
        onOpenChange={setShowSubmitConfirmation}
        answeredCount={answers.filter(a => a.selectedOptions.length > 0 || a.textAnswer || a.jsonData).length}
        totalQuestions={quiz?.questions.length || 0}
        onSubmit={() => submitQuiz('manual')}
      />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{quiz?.title}</h1>
          {quiz?.description && <p className="text-muted-foreground">{quiz.description}</p>}
        </div>
        
        {/* Timer */}
        <TimeDisplay remainingTime={remainingTime} isSubmitting={isSubmitting} />
      </div>

      {/* Main quiz content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question area - 2/3 width on larger screens */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="h-full">
            <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Câu {currentQuestionIndex + 1}/{quiz?.questions.length || 0}
                </Badge>
                
                {quiz && flaggedQuestions.has(quiz.questions[currentQuestionIndex].id) && (
                  <Badge className="bg-yellow-500 text-white">
                    <Flag className="h-3 w-3 mr-1" />
                    Đánh dấu
                  </Badge>
                )}
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => quiz && handleToggleFlag(quiz.questions[currentQuestionIndex].id)}
                      disabled={!quiz}
                    >
                      <Flag 
                        className={quiz && flaggedQuestions.has(quiz.questions[currentQuestionIndex].id) 
                          ? "h-4 w-4 text-yellow-500" 
                          : "h-4 w-4"
                        } 
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {quiz && flaggedQuestions.has(quiz.questions[currentQuestionIndex].id) 
                      ? 'Bỏ đánh dấu' 
                      : 'Đánh dấu'} câu hỏi này
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            
            <CardContent className="pt-6">
              <ScrollArea className="h-[calc(100vh-350px)]">
                {quiz && currentQuestionIndex < quiz.questions.length ? (
                  <QuestionRenderer
                    question={quiz.questions[currentQuestionIndex] as unknown as import('@/lib/question-utils').Question}
                    answer={answers.find(a => a.questionId === quiz.questions[currentQuestionIndex].id) as unknown as import('@/lib/question-utils').Answer | null}
                    onAnswerChange={handleAnswerChange}
                  />
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-600">
                      Không thể tải câu hỏi. Vui lòng thử lại sau.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0 || isSubmitting || !quiz}
              >
                Câu trước
              </Button>
              
              {quiz && currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button
                  onClick={handleSubmitConfirmation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang nộp bài...
                    </>
                  ) : (
                    'Nộp bài'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting || !quiz}
                >
                  Câu tiếp theo
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Navigation sidebar - 1/3 width on larger screens */}
        <div className="lg:col-span-4">
          {/* Show on mobile as a sheet */}
          <div className="block lg:hidden w-full">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  Điều hướng câu hỏi
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Câu hỏi</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  {quiz && (
                    <QuestionNavigation
                      questions={quiz.questions}
                      answers={answers}
                      currentQuestionIndex={currentQuestionIndex}
                      flaggedQuestions={flaggedQuestions}
                      onQuestionSelect={setCurrentQuestionIndex}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Show directly on desktop */}
          <div className="hidden lg:block">
            {quiz && (
              <QuestionNavigation
                questions={quiz.questions}
                answers={answers}
                currentQuestionIndex={currentQuestionIndex}
                flaggedQuestions={flaggedQuestions}
                onQuestionSelect={setCurrentQuestionIndex}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
          
          {/* Submit button at bottom of navigation */}
          <Button 
            className="w-full mt-4"
            onClick={handleSubmitConfirmation}
            disabled={isSubmitting || !quiz}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang nộp bài...
              </>
            ) : (
              'Nộp bài'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component
function QuizTakeSkeleton() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-md animate-pulse" />
          <div className="h-4 w-96 bg-slate-200 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-md animate-pulse" />
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="h-[60vh] bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-[50vh] bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded-md animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );
} 