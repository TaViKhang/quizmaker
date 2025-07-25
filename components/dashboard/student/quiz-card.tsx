'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Clock, CalendarClock, AlertTriangle, CheckCircle, Lock, FileText, BarChart } from "lucide-react";
import { QuizType } from "@/app/dashboard/student/types/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

interface QuizCardProps {
  quiz: QuizType;
  animationDelay?: number;
}

export function QuizCard({ quiz, animationDelay = 0 }: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date set";
    
    try {
      const date = new Date(dateString);
      return format(date, "PPP 'at' p");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Format relative date
  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "";
    }
  };
  
  // Get badge styles based on quiz status
  const getBadgeStyle = () => {
    switch (quiz.status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "expired":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "";
    }
  };
  
  // Get badge icon based on quiz status
  const getBadgeIcon = () => {
    switch (quiz.status) {
      case "upcoming":
        return <CalendarClock className="h-3.5 w-3.5 mr-1" />;
      case "ongoing":
        return <Clock className="h-3.5 w-3.5 mr-1" />;
      case "completed":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      case "expired":
        return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      default:
        return null;
    }
  };
  
  // Get human-readable status text
  const getStatusText = () => {
    switch (quiz.status) {
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Available Now";
      case "completed":
        return "Completed";
      case "expired":
        return "Expired";
      default:
        return quiz.status;
    }
  };
  
  // Get action button text and link
  const getActionDetails = () => {
    if (quiz.isLocked) {
      return { text: "Locked", href: null };
    }
    
    switch (quiz.status) {
      case "upcoming":
        return { text: "View Details", href: `/dashboard/student/quizzes/${quiz.id}` };
      case "ongoing":
        return { 
          text: quiz.currentAttempts && quiz.currentAttempts > 0 ? "Continue" : "Start Quiz", 
          href: `/dashboard/student/quizzes/${quiz.id}`
        };
      case "completed":
        // Direct link to results if bestAttemptId is available
        return { 
          text: "View Results", 
          href: quiz.bestAttemptId 
            ? `/dashboard/student/results/${quiz.bestAttemptId}` 
            : `/dashboard/student/quizzes/${quiz.id}`
        };
      case "expired":
        return { text: "View Details", href: `/dashboard/student/quizzes/${quiz.id}` };
      default:
        return { text: "View Quiz", href: `/dashboard/student/quizzes/${quiz.id}` };
    }
  };
  
  // Define if card should be muted
  const isMuted = quiz.status === "expired" || (quiz.status === "completed" && !quiz.isLocked);
  
  // Get the action details
  const actionDetails = getActionDetails();
  
  // Determine card border color based on status and formal flag
  const getCardBorderStyle = () => {
    if (quiz.isFormal) {
      return "border-primary/30 dark:border-primary/20";
    }
    
    switch (quiz.status) {
      case "ongoing":
        return "border-green-200 dark:border-green-900/30";
      case "completed":
        return "border-purple-200 dark:border-purple-900/30";
      case "upcoming":
        return "border-blue-200 dark:border-blue-900/30";
      case "expired":
        return "border-amber-200 dark:border-amber-900/30";
      default:
        return "";
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full transition-all duration-300 overflow-hidden",
          isHovered && "shadow-md",
          isMuted && "opacity-90",
          getCardBorderStyle()
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("mb-2", getBadgeStyle())}>
                <div className="flex items-center">
                  {getBadgeIcon()}
                  {getStatusText()}
                </div>
              </Badge>
              
              {/* Formal quiz indicator */}
              {quiz.isFormal && (
                <Badge 
                  variant="outline" 
                  className="mb-2 border-primary/40 text-primary dark:border-primary/30"
                >
                  Formal
                </Badge>
              )}
              
              {/* Public/Private quiz indicator */}
              {quiz.isPublic !== undefined && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "mb-2",
                    quiz.isPublic 
                      ? "border-green-500/40 text-green-600 dark:border-green-500/30" 
                      : "border-amber-500/40 text-amber-600 dark:border-amber-500/30"
                  )}
                >
                  {quiz.isPublic ? "Public" : "Private"}
                </Badge>
              )}
            </div>
            
            {/* Locked indicator */}
            {quiz.isLocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-muted-foreground">
                    <Lock size={16} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{quiz.lockReason || "This quiz is locked"}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
          
          {quiz.className && (
            <CardDescription className="flex items-center gap-1 mt-1">
              {quiz.className}
              {quiz.subject && ` • ${quiz.subject}`}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="text-sm space-y-3">
          <div className="space-y-3">
            {/* Quiz description */}
            {quiz.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {quiz.description}
              </p>
            )}
            
            {/* Quiz stats */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{quiz.durationMinutes} min</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{quiz.totalQuestions} questions</span>
              </div>
              
              {quiz.startDate && quiz.status === "upcoming" && (
                <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Opens: {formatDate(quiz.startDate)} ({formatRelativeDate(quiz.startDate)})</span>
                </div>
              )}
              
              {quiz.endDate && (quiz.status === "upcoming" || quiz.status === "ongoing") && (
                <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Closes: {formatDate(quiz.endDate)} ({formatRelativeDate(quiz.endDate)})</span>
                </div>
              )}
            </div>
            
            {/* Attempt info */}
            {quiz.attemptLimit && (
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                Attempts: <span className="font-medium">{quiz.currentAttempts || 0} / {quiz.attemptLimit}</span>
              </div>
            )}
            
            {/* Score info (when completed) */}
            {quiz.status === "completed" && quiz.highestScore !== null && quiz.highestScore !== undefined && (
              <div className="text-sm font-medium flex items-center gap-1.5">
                <BarChart className="h-4 w-4 text-purple-600" />
                Highest score: {quiz.highestScore}%
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 pb-4">
          <Button
            className="w-full"
            variant={quiz.isLocked ? "outline" : (quiz.status === "completed" ? "secondary" : "default")}
            disabled={quiz.isLocked}
            asChild={!quiz.isLocked && !!actionDetails.href}
          >
            {!quiz.isLocked && actionDetails.href ? (
              <Link href={actionDetails.href}>
                {actionDetails.text}
              </Link>
            ) : (
              <>{actionDetails.text}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 