"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { 
  Clock, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  BookOpen, 
  BarChart, 
  Award,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { QuestionType } from '@prisma/client';
import { cn } from '@/lib/utils';
import ResultSummary from "../components/ResultSummary";

interface QuizResultPageProps {
  params: {
    id: string;
  };
}

interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
  order?: number;
  group?: string | null;
  matchId?: string | null;
  position?: number | null;
}

interface Question {
  id: string;
  type: string;
  content: string;
  explanation?: string;
  options: QuestionOption[];
  answer?: Answer;
  points?: number;
  metadata?: any;
}

interface Answer {
  id: string;
  isCorrect: boolean | null;
  selectedOptionId?: string;
  selectedOptions?: string[];
  textAnswer?: string;
  jsonData?: string;
  feedback?: string;
  score?: number | null;
}

interface Statistics {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  pendingGrading: number;
  accuracy: number;
  }
  
interface QuizAttempt {
  id: string;
  score: number | null;
  timeSpent: number | null;
  completedAt: string | null;
  isPassing: boolean | null;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number | null;
  timeLimit?: number;
}

interface QuizResult {
  attempt: QuizAttempt;
  quiz: Quiz;
  user: any;
  questions: Question[];
  statistics: Statistics;
}

export default function QuizResultPage({ params }: QuizResultPageProps) {
  const { id } = params;
  const router = useRouter();
  const { isStudent, isLoading: authLoading } = useAuth();
  
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptsInfo, setAttemptsInfo] = useState<{
    currentAttempts: number;
    maxAttempts: number | null;
  }>({ currentAttempts: 0, maxAttempts: null });
  const [isStartingNewAttempt, setIsStartingNewAttempt] = useState(false);
  
  useEffect(() => {
    const fetchQuizResult = async () => {
      try {
        const response = await fetch(`/api/users/me/quiz-results/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quiz result');
        }
        
        const data = await response.json();
        setResult(data.data);
        
        // Fetch quiz details to get attempt information
        if (data.data?.quiz?.id) {
          const quizDetailResponse = await fetch(`/api/users/me/quizzes/${data.data.quiz.id}`);
          if (quizDetailResponse.ok) {
            const quizData = await quizDetailResponse.json();
            if (quizData.success && quizData.data.quiz) {
              setAttemptsInfo({
                currentAttempts: quizData.data.quiz.currentAttempts || 0,
                maxAttempts: quizData.data.quiz.attemptLimit || null
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching quiz result:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        
        toast({
          title: 'Error',
          description: 'Failed to load quiz result. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && isStudent) {
      fetchQuizResult();
    }
  }, [id, authLoading, isStudent]);
  
  useEffect(() => {
    // Redirect non-students away
    if (!authLoading && !isStudent) {
      router.push('/dashboard');
    }
  }, [authLoading, isStudent, router]);
  
  // Handle retake quiz
  const handleRetakeQuiz = async () => {
    if (!result?.quiz?.id) return;
    
    try {
      setIsStartingNewAttempt(true);
      
      // Call API to start a new attempt with forceNew=true
      const response = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quizId: result.quiz.id,
          forceNew: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start new attempt');
      }

      if (data.success) {
        router.push(`/dashboard/student/quizzes/${result.quiz.id}/attempt?attemptId=${data.data.attemptId}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error starting new attempt:', error);
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsStartingNewAttempt(false);
    }
  };
  
  if (authLoading) {
    return <LoadingSkeleton />;
  }
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error || !result) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 pb-8 text-center">
            <div className="mb-4 text-destructive">
              <XCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Failed to Load Quiz Result</h2>
            <p className="text-muted-foreground mb-6">{error || 'The requested quiz result could not be loaded.'}</p>
            <Button onClick={() => router.push('/dashboard/student/results')}>
              Return to Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { attempt, quiz, questions, statistics } = result;
  
  // Calculate statistics for summary
  const correctAnswers = statistics.correctAnswers;
  const incorrectAnswers = statistics.incorrectAnswers;
  const pendingGrading = statistics.pendingGrading;
  
  // Calculate total points and earned points
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const earnedPoints = questions.reduce((sum, q) => {
    // Add the score from the answer if available
    if (q.answer && q.answer.score !== undefined && q.answer.score !== null) {
      return sum + q.answer.score;
    }
    return sum;
  }, 0);
  
  // Check if user can retake the quiz
  const canRetake = attemptsInfo.maxAttempts === null || attemptsInfo.currentAttempts < attemptsInfo.maxAttempts;
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
          
          {canRetake && (
            <Button 
              onClick={handleRetakeQuiz}
              disabled={isStartingNewAttempt}
              className="gap-2"
            >
              {isStartingNewAttempt ? (
                <>
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Retake Quiz</span>
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Result Summary */}
        <ResultSummary 
          quizTitle={quiz.title}
          quizDescription={quiz.description}
          score={attempt.score}
          passingScore={quiz.passingScore}
          completedAt={attempt.completedAt}
          timeSpent={attempt.timeSpent}
          timeLimit={quiz.timeLimit}
          totalQuestions={statistics.totalQuestions}
          correctAnswers={correctAnswers}
          incorrectAnswers={incorrectAnswers}
          pendingGrading={pendingGrading}
          totalPoints={totalPoints}
          earnedPoints={earnedPoints}
        />
        
        {canRetake && (
          <Card className="mt-4">
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <h3 className="text-base font-medium">Attempts remaining: {attemptsInfo.maxAttempts === null ? "Unlimited" : `${attemptsInfo.maxAttempts - attemptsInfo.currentAttempts} of ${attemptsInfo.maxAttempts}`}</h3>
                <p className="text-sm text-muted-foreground">You can retake this quiz to improve your score</p>
              </div>
              <Button 
                onClick={handleRetakeQuiz}
                disabled={isStartingNewAttempt}
                className="gap-2"
              >
                {isStartingNewAttempt ? (
                  <>
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Retake Quiz</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Questions Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Question Review</h2>
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="correct">Correct ({correctAnswers})</TabsTrigger>
            <TabsTrigger value="incorrect">Incorrect ({incorrectAnswers})</TabsTrigger>
            {pendingGrading > 0 && (
              <TabsTrigger value="pending">Pending ({pendingGrading})</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <QuestionList questions={questions} />
          </TabsContent>
          
          <TabsContent value="correct" className="mt-4">
            <QuestionList 
              questions={questions.filter(q => 
                q.answer?.isCorrect === true
              )} 
            />
          </TabsContent>
          
          <TabsContent value="incorrect" className="mt-4">
            <QuestionList 
              questions={questions.filter(q => 
                q.answer?.isCorrect === false
              )} 
            />
          </TabsContent>
          
          {pendingGrading > 0 && (
            <TabsContent value="pending" className="mt-4">
              <QuestionList 
                questions={questions.filter(q => 
                  q.answer && q.answer.isCorrect === null
                )} 
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function QuestionList({ questions }: { questions: Question[] }) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No questions in this category</h3>
        <p className="text-muted-foreground">Select a different filter to see other questions.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <QuestionCard key={question.id} question={question} index={index} />
      ))}
    </div>
  );
}

function QuestionCard({ question, index }: { question: Question, index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatQuestionType = (type: string) => {
    const types: Record<string, string> = {
      MULTIPLE_CHOICE: "Multiple Choice",
      TRUE_FALSE: "True/False",
      SHORT_ANSWER: "Short Answer",
      ESSAY: "Essay",
      MATCHING: "Matching",
      FILL_BLANK: "Fill in the Blank",
      CODE: "Code"
    };
    
    return types[type] || type;
  };
  
  // Determine question status
  const getQuestionStatus = () => {
    if (!question.answer) return { status: 'unanswered', icon: <HelpCircle className="h-5 w-5 text-gray-400" /> };
    
    if (question.answer.isCorrect === true) {
      return { 
        status: 'correct', 
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        label: 'Correct'
      };
    } else if (question.answer.isCorrect === false) {
      return { 
        status: 'incorrect', 
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        label: 'Incorrect'
      };
    } else {
      return { 
        status: 'pending', 
        icon: <HelpCircle className="h-5 w-5 text-amber-500" />,
        label: 'Pending Grading'
      };
    }
  };
  
  const questionStatus = getQuestionStatus();
  
  // Get question points and current score
  const questionPoints = question.points || 1;
  const currentScore = question.answer?.score ?? 0;
  
  return (
    <Card className={cn(
      "transition-all duration-200",
      isExpanded ? "border-primary" : "",
      questionStatus.status === 'correct' ? "border-green-200 dark:border-green-800" : "",
      questionStatus.status === 'incorrect' ? "border-red-200 dark:border-red-800" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">Question {index + 1}</span>
              <Badge variant="outline">{formatQuestionType(question.type)}</Badge>
              {questionStatus.status !== 'unanswered' && (
                <Badge 
                  variant={
                    questionStatus.status === 'correct' ? 'success' : 
                    questionStatus.status === 'incorrect' ? 'destructive' : 
                    'outline'
                  }
                  className="ml-auto"
                >
                  {questionStatus.label}
                </Badge>
              )}
              <span className="ml-auto text-sm font-medium">
                {questionStatus.status !== 'unanswered' && (
                  <span className={cn(
                    "px-2 py-0.5 rounded",
                    questionStatus.status === 'correct' ? "text-green-700 dark:text-green-300" :
                    questionStatus.status === 'incorrect' ? "text-red-700 dark:text-red-300" :
                    "text-gray-700 dark:text-gray-300"
                  )}>
                    Points: {currentScore}/{questionPoints}
                  </span>
                )}
              </span>
            </div>
            <div className="font-medium" dangerouslySetInnerHTML={{ __html: question.content }} />
          </div>
          <div className="ml-4 flex-shrink-0">
            {questionStatus.icon}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {isExpanded ? (
          question.answer ? (
            <AnswerDisplay question={question} answer={question.answer} />
          ) : (
            <div className="text-muted-foreground text-sm">No answer provided</div>
          )
        ) : (
          <Button 
            variant="ghost" 
            className="w-full justify-center" 
            onClick={() => setIsExpanded(true)}
          >
            Show Answer
          </Button>
        )}
      </CardContent>
      
      {isExpanded && (
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto" 
            onClick={() => setIsExpanded(false)}
          >
            Hide Answer
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function AnswerDisplay({ question, answer }: { question: Question, answer: Answer }) {
  const [showExplanation, setShowExplanation] = useState(false);
  
  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.TRUE_FALSE:
      return (
        <div className="mt-3">
          <div className="space-y-2">
            {question.options.map((option) => {
              // Handle both single and multiple selection formats
              const isSelected = answer.selectedOptionId === option.id || 
                (Array.isArray(answer.selectedOptions) && answer.selectedOptions.includes(option.id));
              const isCorrect = option.isCorrect;
              
              // Determine the style based on correctness and selection
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
            })}
          </div>
          
          {question.explanation && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </Button>
              
              {showExplanation && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Explanation:</h4>
                  <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              )}
            </div>
          )}
          
          {answer.feedback && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Teacher Feedback:</h4>
              <p>{answer.feedback}</p>
            </div>
          )}
        </div>
      );
      
    case QuestionType.SHORT_ANSWER:
      const correctShortAnswers = question.options.filter(opt => opt.isCorrect);
      return (
        <div className="mt-3 space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-1">Your Answer:</h4>
            <div className="whitespace-pre-wrap">{answer.textAnswer || "No answer provided"}</div>
          </div>
          
          {/* Display Correct Answers for SHORT_ANSWER */}
          {correctShortAnswers.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-1">
                {correctShortAnswers.length > 1 ? "Correct Answers:" : "Correct Answer:"}
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {correctShortAnswers.map(opt => (
                  <li key={opt.id} dangerouslySetInnerHTML={{ __html: opt.content }} />
                ))}
              </ul>
            </div>
          )}
          
          {question.explanation && (
            <div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </Button>
              
              {showExplanation && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Explanation:</h4>
                  <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              )}
            </div>
          )}
          
          {answer.feedback && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Teacher Feedback:</h4>
              <p>{answer.feedback}</p>
            </div>
          )}
          
          <div className="flex items-center">
            <Badge variant={answer.isCorrect === true ? "success" : answer.isCorrect === false ? "destructive" : "outline"}>
              {answer.isCorrect === true ? "Correct" : answer.isCorrect === false ? "Incorrect" : "Pending Grading"}
            </Badge>
            {answer.isCorrect !== null && (
              <span className="ml-2 text-sm font-medium">
                Score: {answer.score !== undefined ? answer.score : "N/A"}
              </span>
            )}
          </div>
        </div>
      );
      
    case QuestionType.ESSAY:
      const isRichText = question.metadata && typeof question.metadata === 'object' && 
        question.metadata.richText === true;
      
      return (
        <div className="mt-3 space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Your Essay:</h4>
            {answer.textAnswer ? (
              <div className={isRichText ? "prose prose-sm dark:prose-invert max-w-none" : "whitespace-pre-wrap"}>
                {isRichText ? (
                  <div dangerouslySetInnerHTML={{ __html: answer.textAnswer }} />
                ) : (
                  answer.textAnswer
                )}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No answer provided</p>
            )}
          </div>
          
          {answer.feedback && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Teacher Feedback:</h4>
              <p>{answer.feedback}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Badge variant={
              answer.isCorrect === null ? "outline" :
              answer.score && answer.score > (question.points || 10) / 2 ? "success" : "destructive"
            }>
              {answer.isCorrect === null ? "Pending Grading" : 
                answer.score && answer.score > (question.points || 10) / 2 ? "Passed" : "Needs Improvement"}
            </Badge>
            
            {answer.score !== null && answer.score !== undefined && (
              <span className="text-sm font-medium">
                Score: {answer.score} / {question.points || 10}
              </span>
            )}
          </div>
          
          {question.explanation && (
            <div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </Button>
              
              {showExplanation && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Explanation:</h4>
                  <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              )}
            </div>
          )}
        </div>
      );
      
    case QuestionType.MATCHING: {
      let userAnswers: Record<string, string> = {};
      let matchingError = false;
      
      // Xử lý dữ liệu JSON từ câu trả lời, cần xử lý chuỗi JSON
      if (question.answer?.jsonData && typeof question.answer.jsonData === 'string') {
        try {
          const parsedData = JSON.parse(question.answer.jsonData);
          if (parsedData && typeof parsedData === 'object') {
            userAnswers = Object.entries(parsedData).reduce((acc, [key, value]) => {
              if (typeof value === 'string') {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, string>);
          }
        } catch (e) {
          console.error('Error parsing matching answer JSON', e);
          matchingError = true;
        }
      }
      
      // Phân loại options theo premise và response
      const premiseOptions = question.options.filter(opt => 
        opt.group === 'premise' || opt.group === 'left');
      const responseOptions = question.options.filter(opt => 
        opt.group === 'response' || opt.group === 'right');
        
      if (matchingError) {
        return (
          <div className="mt-3 text-red-500">
            Lỗi hiển thị câu trả lời. Dữ liệu không hợp lệ.
          </div>
        );
      }
      
      // Tiếp tục với phần hiển thị câu trả lời
      return (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            {premiseOptions.map(leftOption => {
              const selectedRightId = userAnswers[leftOption.id];
              const selectedRight = responseOptions.find(r => r.id === selectedRightId);
              const correctRightOption = responseOptions.find(r => r.id === leftOption.matchId);
              const isCorrect = selectedRightId === leftOption.matchId;
              
              return (
                <div 
                  key={leftOption.id} 
                  className={`p-3 rounded-md border ${
                    isCorrect 
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
                      : "border-red-500 bg-red-50 dark:bg-red-950/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium" dangerouslySetInnerHTML={{ __html: leftOption.content }} />
                    <div className="mx-2">→</div>
                    <div className="text-right">
                      {selectedRight ? (
                        <span dangerouslySetInnerHTML={{ __html: selectedRight.content }} />
                      ) : (
                        <span className="text-gray-400">Not matched</span>
                      )}
                    </div>
                  </div>
                  
                  {!isCorrect && correctRightOption && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      <span className="font-medium">Correct match:</span>{" "}
                      <span dangerouslySetInnerHTML={{ __html: correctRightOption.content }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {question.explanation && (
            <div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </Button>
              
              {showExplanation && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-1">Explanation:</h4>
                  <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                </div>
              )}
            </div>
          )}
          
          {answer.feedback && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Teacher Feedback:</h4>
              <p>{answer.feedback}</p>
            </div>
          )}
        </div>
      );
    }
    
    // Add more question types as needed
    
    default:
      return (
        <div className="p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 rounded-md">
          <p>This question type ({question.type}) is not supported for display yet.</p>
        </div>
      );
  }
}

function LoadingSkeleton() {
      return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        </div>
      
      <Skeleton className="h-64" />
      
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
        </div>
      );
} 