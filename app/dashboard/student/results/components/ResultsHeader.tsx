"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  LineChart, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Book
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OverallStats {
  averageScore: number;
  previousAverageScore: number | null;
  improvement: number | null;
  totalAssessments: number;
  currentPeriodLabel: string;
  previousPeriodLabel: string | null;
}

interface CompletionData {
  totalQuizzes: number;
  completedQuizzes: number;
  completionRate: number;
  bestSubject: {
    name: string;
    score: number;
  };
  mostImprovedSubject?: {
    name: string;
    improvement: number;
  } | null;
}

interface ResultsHeaderProps {
  overallStats: OverallStats;
  completionData: CompletionData;
}

export default function ResultsHeader({ 
  overallStats, 
  completionData 
}: ResultsHeaderProps) {
  // Determine improvement trend direction and icon
  const showImprovement = overallStats.improvement !== null && 
    overallStats.previousAverageScore !== null;
  
  // Trend colors
  const getTrendColor = (value: number) => {
    if (value > 0) return "text-emerald-600 dark:text-emerald-400";
    if (value < 0) return "text-red-600 dark:text-red-400";
    return "text-amber-600 dark:text-amber-400";
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Average Score Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 flex items-center justify-center">
            <BarChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {overallStats.averageScore.toFixed(1)}%
          </div>
          {showImprovement ? (
            <p className={cn(
              "text-xs flex items-center gap-1 mt-1",
              getTrendColor(overallStats.improvement!)
            )}>
              {overallStats.improvement! > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : overallStats.improvement! < 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : null}
              {overallStats.improvement! > 0 ? "+" : ""}
              {overallStats.improvement!.toFixed(1)}% compared to{" "}
              {overallStats.previousPeriodLabel}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              During {overallStats.currentPeriodLabel}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Total Assessments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallStats.totalAssessments}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <span className="truncate">
              {completionData.completionRate > 0 && `${completionData.completionRate}% completion rate`}
              {completionData.completionRate === 0 && "No assessments completed yet"}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Best Subject Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
          <div className="h-8 w-8 rounded-full bg-purple-100/80 dark:bg-purple-900/30 flex items-center justify-center">
            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold line-clamp-1">
            {completionData.bestSubject?.name || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {completionData.bestSubject?.score 
              ? `Average score: ${completionData.bestSubject.score.toFixed(1)}%` 
              : "Complete assessments to see your best subject"}
          </p>
        </CardContent>
      </Card>
      
      {/* Most Improved Subject Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Improved</CardTitle>
          <div className="h-8 w-8 rounded-full bg-amber-100/80 dark:bg-amber-900/30 flex items-center justify-center">
            <Book className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold line-clamp-1">
            {completionData.mostImprovedSubject?.name || "N/A"}
          </div>
          {completionData.mostImprovedSubject ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              +{completionData.mostImprovedSubject.improvement.toFixed(1)}% improvement
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Need more data to calculate improvement
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 