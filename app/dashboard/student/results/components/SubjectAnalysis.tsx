"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  assessmentCount: number;
  trend?: number | null; // Percentage change compared to previous period
}

interface SubjectAnalysisProps {
  subjectPerformance: SubjectPerformance[];
  selectedSubject?: string;
}

export default function SubjectAnalysis({ 
  subjectPerformance,
  selectedSubject
}: SubjectAnalysisProps) {
  // Check if we have valid data
  const hasData = Array.isArray(subjectPerformance) && subjectPerformance.length > 0;
  
  // Filter and sort subjects by average score (highest first)
  const sortedSubjects = hasData 
    ? [...subjectPerformance]
        .filter(s => !selectedSubject || s.subject === selectedSubject)
        .sort((a, b) => b.averageScore - a.averageScore)
    : [];
  
  // Helper to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "emerald";
    if (score >= 60) return "amber";
    return "red";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Performance</CardTitle>
        <CardDescription>
          Your scores and progress by subject
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedSubjects.length > 0 ? (
          <div className="space-y-4">
            {sortedSubjects.map((subject) => {
              const scoreColor = getScoreColor(subject.averageScore);
              
              return (
                <div key={subject.subject} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{subject.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{subject.averageScore.toFixed(1)}%</span>
                      {subject.trend !== undefined && subject.trend !== null && (
                        <Badge className={`${
                          subject.trend > 0 
                            ? "bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950 dark:text-green-300" 
                            : subject.trend < 0 
                              ? "bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-300"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {subject.trend > 0 ? "+" : ""}
                          {subject.trend.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={`bg-${scoreColor}-100 dark:bg-${scoreColor}-950 rounded-full h-2`}>
                    <Progress 
                      value={subject.averageScore} 
                      className={`bg-${scoreColor}-600 dark:bg-${scoreColor}-500`}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Based on {subject.assessmentCount} {subject.assessmentCount === 1 ? 'assessment' : 'assessments'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground font-medium">No subject data available</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {selectedSubject 
                ? `No data available for ${selectedSubject}. Try selecting a different subject or time period.`
                : "Complete assessments to see your subject performance breakdown."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 