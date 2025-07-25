import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { QuestionType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, FileSpreadsheet, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { getExtendedPathMap } from "@/lib/navigation-adapter";

export default async function GradingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'TEACHER') {
    redirect('/dashboard');
  }
  
  // Find all attempts that need manual grading
  // This could be attempts with essay questions or other manually graded types
  const attemptsNeedingGrading = await prisma.quizAttempt.findMany({
    where: {
      quiz: {
        authorId: session.user.id,
      },
      completedAt: {
        not: null, // Must be completed
      },
      // Join answers and check if any are null for isCorrect (meaning they need manual grading)
      answers: {
        some: {
          isCorrect: null,
          score: null,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      quiz: {
        select: {
          id: true,
          title: true,
        }
      },
      answers: {
        where: {
          isCorrect: null,
          score: null,
        },
        include: {
          question: {
            select: {
              id: true,
              type: true,
            }
          }
        }
      }
    },
    orderBy: {
      completedAt: 'desc',
    },
  });
  
  // Group questions by type to show statistics
  const questionTypeCounts: Record<QuestionType, number> = attemptsNeedingGrading.reduce((acc, attempt) => {
    attempt.answers.forEach(answer => {
      const type = answer.question.type;
      acc[type] = (acc[type] || 0) + 1;
    });
    return acc;
  }, {} as Record<QuestionType, number>);
  
  return (
    <div className="container px-4 py-6 space-y-6">
      <Breadcrumbs 
        pathMap={getExtendedPathMap()} 
        background="transparent"
      />
      <h1 className="text-2xl font-bold sm:text-3xl">Grading Dashboard</h1>
      
      {attemptsNeedingGrading.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No submissions need manual grading at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Submissions</CardTitle>
                <CardDescription>Needing manual grading</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{attemptsNeedingGrading.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Questions</CardTitle>
                <CardDescription>Questions to grade manually</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {attemptsNeedingGrading.reduce((sum, attempt) => sum + attempt.answers.length, 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Question Types</CardTitle>
                <CardDescription>Breakdown by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(questionTypeCounts).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="px-2 py-1">
                      {type.replace('_', ' ')}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            {attemptsNeedingGrading.map((attempt) => (
              <Card key={attempt.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{attempt.quiz.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <User className="h-3.5 w-3.5 mr-1" />
                        {attempt.user.name}
                      </CardDescription>
                    </div>
                    <Badge variant={attempt.score ? "default" : "outline"}>
                      {attempt.score ? `${attempt.score}%` : 'Needs Grading'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex flex-wrap gap-4 mb-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      {format(new Date(attempt.completedAt!), 'PPP')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(attempt.timeSpent || 0)}
                    </div>
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                      {attempt.answers.length} questions need grading
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mb-3">
                    {attempt.answers.map(answer => (
                      <Badge 
                        key={answer.id} 
                        variant="outline"
                        className="justify-start py-1"
                      >
                        {formatQuestionType(answer.question.type)}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    asChild 
                    className="mt-2"
                  >
                    <Link href={`/dashboard/teacher/grading/${attempt.id}`}>
                      Grade Submission
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function formatQuestionType(type: QuestionType): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
} 