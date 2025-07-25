import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
  image: string | null;
  averageScore: number;
  attemptCount: number;
}

interface StudentSectionProps {
  students: Student[];
}

export function StudentSection({ students }: StudentSectionProps) {
  const router = useRouter();
  
  // Function to get performance badge and color
  const getPerformanceBadge = (score: number) => {
    if (score >= 90) {
      return { label: "Outstanding", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" };
    } else if (score >= 80) {
      return { label: "Excellent", color: "bg-green-500/10 text-green-700 dark:text-green-400" };
    } else if (score >= 70) {
      return { label: "Good", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" };
    } else if (score >= 60) {
      return { label: "Satisfactory", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
    } else {
      return { label: "Needs Improvement", color: "bg-red-500/10 text-red-700 dark:text-red-400" };
    }
  };
  
  // Function to get progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top Performing Students</CardTitle>
        <CardDescription>
          Students with highest average scores
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          {students.length > 0 ? (
            <>
              {students.map((student) => {
                const performanceBadge = getPerformanceBadge(student.averageScore);
                const progressColor = getProgressColor(student.averageScore);
                
                return (
                  <div 
                    key={student.id}
                    className="flex items-center p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}
                  >
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarImage src={student.image || undefined} />
                      <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {student.name}
                        </p>
                        <div className="flex items-center">
                          <Badge variant="outline" className={`text-xs mr-2 ${performanceBadge.color}`}>
                            {performanceBadge.label}
                          </Badge>
                          <p className="text-sm font-semibold whitespace-nowrap">
                            {student.averageScore}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={student.averageScore} className={`h-1.5 ${progressColor}`} />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {student.attemptCount} quizzes
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <Button 
                variant="ghost" 
                className="w-full justify-between py-2 px-3 h-auto"
                onClick={() => router.push('/dashboard/teacher/students')}
              >
                <span className="text-sm">View all students</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No student data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 