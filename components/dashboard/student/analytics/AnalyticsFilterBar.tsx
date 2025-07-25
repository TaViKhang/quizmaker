"use client";

import { useState, useCallback } from "react";
import { TimeFrame, useAnalytics } from "@/components/providers/analytics-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Clock, Calendar } from "lucide-react";

interface AnalyticsFilterBarProps {
  /**
   * Optional title for the filter bar
   */
  title?: string;
  /**
   * Show reset button
   */
  showReset?: boolean;
  /**
   * Custom time frame options
   */
  timeFrameOptions?: {
    value: TimeFrame;
    label: string;
  }[];
  /**
   * Right side content
   */
  rightContent?: React.ReactNode;
  /**
   * Left side content
   */
  leftContent?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function AnalyticsFilterBar({
  title = "Analytics",
  showReset = false,
  timeFrameOptions,
  rightContent,
  leftContent,
  className,
}: AnalyticsFilterBarProps) {
  const { timeFrame, setTimeFrame, fetchClassParticipation, fetchScoreAnalytics, fetchQuizCompletion } = useAnalytics();

  const handleTimeFrameChange = useCallback(
    (value: string) => {
      if (value !== timeFrame) {
        setTimeFrame(value as TimeFrame);
      }
    },
    [timeFrame, setTimeFrame]
  );

  const handleRefresh = useCallback(() => {
    // Refresh all analytics data
    fetchClassParticipation();
    fetchScoreAnalytics();
    fetchQuizCompletion();
  }, [fetchClassParticipation, fetchScoreAnalytics, fetchQuizCompletion]);

  const defaultTimeFrameOptions = [
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "last90days", label: "Last 90 Days" },
    { value: "allTime", label: "All Time" },
  ];

  const options = timeFrameOptions || defaultTimeFrameOptions;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className || ""}`}>
      <div className="flex items-center gap-2">
        {leftContent || (
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{title}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
          <Select value={timeFrame} onValueChange={handleTimeFrameChange}>
            <SelectTrigger
              className="w-[120px] sm:w-[160px] h-9"
              aria-label="Select time frame"
            >
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground sm:hidden" />
              <SelectValue placeholder="Select time frame" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showReset && (
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        )}
        
        {rightContent}
      </div>
    </div>
  );
} 