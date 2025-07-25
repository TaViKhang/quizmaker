'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, FileCheck, Loader2 } from 'lucide-react';

interface SubmitConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  totalQuestions: number;
  onSubmit: () => void;
}

export default function SubmitConfirmation({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  onSubmit
}: SubmitConfirmationProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate completion percentage
  const completionPercentage = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  
  // Reset loading state when dialog is closed
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
    }
  }, [open]);
  
  // Handle submit with loading state
  const handleSubmit = () => {
    setIsLoading(true);
    onSubmit();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Xác nhận nộp bài</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn nộp bài làm? Sau khi nộp, bạn sẽ không thể sửa lại bài làm.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 space-y-4">
          {/* Completion progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Tiến độ làm bài: {answeredCount}/{totalQuestions} câu
              </span>
              <span className="text-sm">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} />
          </div>
          
          {/* Status message */}
          {completionPercentage < 100 ? (
            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Bạn chưa hoàn thành tất cả các câu hỏi</p>
                <p className="text-sm">
                  Còn {totalQuestions - answeredCount} câu hỏi chưa được trả lời.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md p-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Bạn đã hoàn thành tất cả các câu hỏi</p>
                <p className="text-sm">
                  Tất cả {totalQuestions} câu hỏi đã được trả lời.
                </p>
              </div>
            </div>
          )}
        </div>
          
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Quay lại làm bài
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang nộp bài...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Nộp bài
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 