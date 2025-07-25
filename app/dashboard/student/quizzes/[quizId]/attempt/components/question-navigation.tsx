'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  CheckCircle2, 
  Flag, 
  HelpCircle, 
  XCircle 
} from 'lucide-react';
import { 
  Question, 
  Answer 
} from './question-renderer';

interface QuestionNavigationProps {
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  flaggedQuestions: Set<string>;
  onQuestionSelect: (index: number) => void;
  isSubmitting: boolean;
}

export default function QuestionNavigation({
  questions,
  answers,
  currentQuestionIndex,
  flaggedQuestions,
  onQuestionSelect,
  isSubmitting
}: QuestionNavigationProps) {
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered' | 'flagged'>('all');

  // Calculate question stats
  const stats = useMemo(() => {
    const answered = questions.filter(q => 
      answers.some(a => 
        a.questionId === q.id && 
        (a.selectedOptions.length > 0 || a.textAnswer || a.jsonData)
      )
    ).length;
    
    return {
      total: questions.length,
      answered,
      unanswered: questions.length - answered,
      flagged: flaggedQuestions.size
    };
  }, [questions, answers, flaggedQuestions]);

  // Filter questions based on current filter
  const filteredQuestions = useMemo(() => {
    return questions.map((question, index) => {
      const answer = answers.find(a => a.questionId === question.id);
      const isAnswered = answer && (
        answer.selectedOptions.length > 0 || 
        answer.textAnswer || 
        answer.jsonData
      );
      const isFlagged = flaggedQuestions.has(question.id);
      
      let visible = true;
      if (filter === 'answered') visible = !!isAnswered;
      if (filter === 'unanswered') visible = !isAnswered;
      if (filter === 'flagged') visible = isFlagged;
      
      return { question, index, isAnswered, isFlagged, visible };
    });
  }, [questions, answers, filter, flaggedQuestions]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Câu hỏi</span>
          <div className="flex items-center gap-2 text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{stats.answered}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Đã trả lời
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-slate-500">
                    <XCircle className="h-4 w-4" />
                    <span>{stats.unanswered}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Chưa trả lời
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Flag className="h-4 w-4" />
                    <span>{stats.flagged}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Đã đánh dấu
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter tabs */}
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="answered">Đã làm</TabsTrigger>
            <TabsTrigger value="unanswered">Chưa làm</TabsTrigger>
            <TabsTrigger value="flagged">Đánh dấu</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Question number grid */}
        <div className="grid grid-cols-5 gap-2">
          {filteredQuestions.map(({ question, index, isAnswered, isFlagged, visible }) => (
            visible && (
              <QuestionButton
                key={question.id}
                number={index + 1}
                isActive={index === currentQuestionIndex}
                isAnswered={!!isAnswered}
                isFlagged={isFlagged}
                onClick={() => onQuestionSelect(index)}
                disabled={isSubmitting}
              />
            )
          ))}
        </div>
        
        {/* Show message if no questions match filter */}
        {filteredQuestions.filter(q => q.visible).length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <HelpCircle className="mx-auto h-5 w-5 mb-2" />
            Không có câu hỏi nào phù hợp với bộ lọc
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual question button component
interface QuestionButtonProps {
  number: number;
  isActive: boolean;
  isAnswered: boolean;
  isFlagged: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function QuestionButton({
  number,
  isActive,
  isAnswered,
  isFlagged,
  onClick,
  disabled
}: QuestionButtonProps) {
  let className = "flex items-center justify-center h-10 rounded-md font-medium relative";
  
  // Determine button styling based on state
  if (isActive) {
    className += " bg-primary text-primary-foreground";
  } else if (isAnswered) {
    className += " bg-emerald-100 border border-emerald-500 text-emerald-700";
  } else {
    className += " bg-slate-100 border border-slate-300 text-slate-700";
  }
  
  if (disabled) {
    className += " opacity-50 cursor-not-allowed";
  } else {
    className += " hover:bg-slate-200 cursor-pointer";
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={className}
            onClick={disabled ? undefined : onClick}
          >
            {number}
            
            {/* Flag indicator */}
            {isFlagged && (
              <div className="absolute -top-1 -right-1">
                <Flag className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            Câu {number}
            {isAnswered ? ' - Đã trả lời' : ' - Chưa trả lời'}
            {isFlagged && ' - Đã đánh dấu'}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 