"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  FileText,
  PlayCircle, // Icon for Start Quiz
  AlertTriangle, // Icon for urgency
} from "lucide-react";
import {
  format,
  differenceInHours,
  differenceInDays,
  formatDistanceToNowStrict,
  isPast,
  isFuture,
  isWithinInterval,
  addHours,
} from "date-fns";

interface UpcomingQuiz {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  timeLimit: number | null;
  class: {
    id: string;
    name: string;
  };
  _count: {
    questions: number;
  };
  // We might need a status from API later for "Continue Quiz" logic
  // status?: "not-started" | "in-progress" | "completed"; 
}

interface QuizListItemProps {
  quiz: UpcomingQuiz;
}

const formatDateToPrimary = (dateString: string) => {
  return format(new Date(dateString), "MMM d, yyyy h:mm a");
};

const getDynamicDateTimeDisplay = (startDateStr: string, endDateStr: string | null) => {
  const startDate = new Date(startDateStr);
  const endDate = endDateStr ? new Date(endDateStr) : null;
  const now = new Date();

  if (isFuture(startDate)) {
    const hoursUntilStart = differenceInHours(startDate, now);
    if (hoursUntilStart < 1) {
      return `Starts in ${formatDistanceToNowStrict(startDate, { unit: 'minute' })}`;
    } else if (hoursUntilStart < 48) { // Show hours up to 2 days
      return `Starts in ${formatDistanceToNowStrict(startDate, { unit: 'hour', roundingMethod: 'ceil' })}`;
    }
    return `Starts: ${formatDateToPrimary(startDateStr)}`;
  } else { // Quiz has started or is in the past
    if (endDate && isFuture(endDate)) {
      const hoursUntilEnd = differenceInHours(endDate, now);
      if (hoursUntilEnd < 1) {
        return `Ends in ${formatDistanceToNowStrict(endDate, { unit: 'minute' })}`;
      } else if (hoursUntilEnd < 48) {
        return `Ends in ${formatDistanceToNowStrict(endDate, { unit: 'hour', roundingMethod: 'ceil' })}`;
      }
      return `Ends: ${formatDateToPrimary(endDateStr!)}`;
    }
    if (endDate && isPast(endDate)) {
      return `Ended: ${formatDateToPrimary(endDateStr!)}`;
    }
    // If started and no end date, or end date is far, just show start
    return `Started: ${formatDateToPrimary(startDateStr)}`;
  }
};

export function QuizListItem({ quiz }: QuizListItemProps) {
  const now = new Date();
  const startDate = new Date(quiz.startDate);
  const endDate = quiz.endDate ? new Date(quiz.endDate) : null;

  const isUrgent = isFuture(startDate) && differenceInHours(startDate, now) <= 24;
  
  // Quiz can be started if its startDate has passed and it hasn't ended yet (if there's an endDate)
  const canStartQuiz = isPast(startDate) && (!endDate || isFuture(endDate));
  // For now, we assume if it's in the upcoming list and past startDate, it's not completed.
  // A more robust solution would involve an explicit 'status' or 'isAttempted' field for the quiz by this user.

  const dynamicDateTime = getDynamicDateTimeDisplay(quiz.startDate, quiz.endDate);

  return (
    <div 
      className={cn(
        "flex flex-col p-3 border rounded-md transition-colors",
        "hover:bg-accent/50",
        isUrgent ? "border-yellow-500/50 dark:border-yellow-400/40 bg-yellow-500/5 dark:bg-yellow-400/5" : "",
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium line-clamp-2 break-words">{quiz.title}</div>
          <div className="text-xs text-muted-foreground">
            {quiz.class.name} • {quiz._count.questions} questions
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          {isUrgent && (
            <Badge variant="outline" className="mb-1 border-yellow-600 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-700/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Urgent
            </Badge>
          )}
          <Badge variant="outline" className="whitespace-nowrap">
            {quiz.timeLimit ? `${quiz.timeLimit} min` : "No time limit"}
          </Badge>
        </div>
      </div>
      
      <div className="mt-2 flex items-center text-xs">
        <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
        <span title={`Starts: ${formatDateToPrimary(quiz.startDate)}${quiz.endDate ? ` | Ends: ${formatDateToPrimary(quiz.endDate)}` : ''}`}>
          {dynamicDateTime}
        </span>
      </div>
      
      <div className="mt-3 flex flex-col sm:flex-row gap-2 items-center">
        {canStartQuiz && (
          <Button variant="default" size="sm" asChild className="w-full sm:w-auto">
            <Link href={`/dashboard/student/exams/${quiz.id}`}>
              <PlayCircle className="h-4 w-4 mr-1.5" />
              Start Quiz
            </Link>
          </Button>
        )}
        <Button 
          variant={canStartQuiz ? "outline" : "default"} 
          size="sm" 
          asChild 
          className="w-full sm:w-auto"
        >
          <Link href={`/dashboard/student/exams/${quiz.id}`}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            View Details
          </Link>
        </Button>
      </div>
    </div>
  );
} 