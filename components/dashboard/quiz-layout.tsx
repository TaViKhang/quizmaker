'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-breakpoint"
import { breakpointQueries } from "@/hooks/use-breakpoint"
import { Button } from "@/components/ui/button"
import { Timer, ChevronLeft, ChevronRight, LayoutGrid, X, CheckCircle2 } from "lucide-react"
import { Typography } from "@/components/ui/typography"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"

interface QuizLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The main content of the quiz (current question)
   */
  children: React.ReactNode
  /**
   * Title of the quiz
   */
  title: string
  /**
   * Optional description or instruction
   */
  description?: string
  /**
   * Current question number
   */
  currentQuestion: number
  /**
   * Total number of questions
   */
  totalQuestions: number
  /**
   * Handler for navigating to previous question
   */
  onPrevious?: () => void
  /**
   * Handler for navigating to next question
   */
  onNext?: () => void
  /**
   * Handler for showing the question grid/overview
   */
  onShowOverview?: () => void
  /**
   * Optional time remaining in seconds
   */
  timeRemaining?: number
  /**
   * Optional footer content
   */
  footer?: React.ReactNode
  /**
   * Optional questions sidebar
   */
  sidebarContent?: React.ReactNode
  /**
   * Whether the previous button should be disabled
   */
  isPreviousDisabled?: boolean
  /**
   * Whether the next button should be disabled
   */
  isNextDisabled?: boolean
  /**
   * Optional array of question statuses (for progress indicator)
   */
  questionStatuses?: ('unanswered' | 'answered' | 'flagged' | 'current')[]
}

/**
 * Responsive layout for quizzes and exams with mobile-friendly navigation
 */
export function QuizLayout({
  children,
  title,
  description,
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onShowOverview,
  timeRemaining,
  footer,
  sidebarContent,
  isPreviousDisabled = false,
  isNextDisabled = false,
  questionStatuses,
  className,
  ...props
}: QuizLayoutProps) {
  // Use Sheet component for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const isDesktop = useMediaQuery(breakpointQueries.lg)
  
  // Format time remaining
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    let formattedTime = ""
    if (hours > 0) formattedTime += `${hours.toString().padStart(2, "0")}:`
    formattedTime += `${minutes.toString().padStart(2, "0")}:`
    formattedTime += `${secs.toString().padStart(2, "0")}`
    
    return formattedTime
  }

  // Calculate progress percentage
  const progressPercentage = ((currentQuestion - 1) / (totalQuestions - 1)) * 100

  return (
    <div className={cn("flex min-h-[100dvh] flex-col", className)} {...props}>
      {/* Quiz header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Typography variant="h4" className="truncate">
                {title}
              </Typography>
              
              {/* Quiz description - only visible on larger screens */}
              {description && (
                <Typography variant="muted" className="mt-1 hidden md:block">
                  {description}
                </Typography>
              )}
            </div>

            {/* Right side elements - timer and overview button */}
            <div className="flex items-center gap-2">
              {timeRemaining !== undefined && (
                <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-medium">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="tabular-nums">{formatTime(timeRemaining)}</span>
                </div>
              )}
              
              {/* Question overview toggle */}
              <Button 
                variant="outline" 
                size={isDesktop ? "default" : "icon"}
                onClick={() => isDesktop ? onShowOverview?.() : setSidebarOpen(true)}
                aria-label="Show question overview"
              >
                <LayoutGrid className={cn("h-4 w-4", isDesktop && "mr-2")} />
                {isDesktop && "Overview"}
              </Button>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-3 mb-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div>Question {currentQuestion} of {totalQuestions}</div>
              <div>{Math.round(progressPercentage)}% complete</div>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Main question content */}
        <main className="relative flex-1 container mx-auto px-4 py-6 md:px-6 md:py-8">
          {/* Description for small screens */}
          {description && (
            <Typography variant="muted" className="mb-6 md:hidden">
              {description}
            </Typography>
          )}
          
          {/* Actual question content */}
          <div className="min-h-[50vh]">
            {children}
          </div>
          
          {/* Navigation buttons */}
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isPreviousDisabled}
              className="flex-1 sm:flex-initial"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span>Previous</span>
            </Button>
            <Button
              onClick={onNext}
              disabled={isNextDisabled}
              className="flex-1 sm:flex-initial"
            >
              <span>Next</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          {/* Optional footer content */}
          {footer && (
            <div className="mt-8 border-t pt-6">
              {footer}
            </div>
          )}
        </main>
        
        {/* Desktop sidebar */}
        {sidebarContent && isDesktop && (
          <aside className="hidden lg:block lg:w-80 lg:border-l lg:bg-muted/30">
            <div className="sticky top-0 h-[calc(100vh-1px)] overflow-y-auto p-4">
              <Typography variant="h4" className="mb-4">Questions</Typography>
              {sidebarContent}
            </div>
          </aside>
        )}
        
        {/* Mobile sidebar as Sheet */}
        {sidebarContent && !isDesktop && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-[85%] sm:max-w-md p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Questions</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto p-4">
                {sidebarContent}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  )
} 