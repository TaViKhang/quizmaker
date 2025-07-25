import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { normalizeQuestion } from '@/lib/question-utils';
import { QuestionType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalendarDays, ChevronLeft, Clock, FileSpreadsheet, User, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import QuestionGrader from './question-grader';
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { getExtendedPathMap } from "@/lib/navigation-adapter";

export default async function AttemptGradingPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'TEACHER') {
    redirect('/dashboard');
  }
  
  const attemptId = params.id;
  
  // Get quiz attempt with all related data
  const attempt = await prisma.quizAttempt.findUnique({
    where: {
      id: attemptId,
      quiz: {
        authorId: session.user.id, // Ensure teacher owns this quiz
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
          description: true,
          passingScore: true,
        }
      },
      answers: {
        where: {
          isCorrect: null,
          score: null,
        },
        orderBy: {
          questionId: 'asc',
        },
        include: {
          question: {
            include: {
              options: true,
            }
          }
        }
      }
    },
  });
  
  if (!attempt) {
    notFound();
  }
  
  // Calculate current stats
  const totalQuestionsNeedingGrading = attempt.answers.length;
  const hasManualGradingQuestions = totalQuestionsNeedingGrading > 0;
  
  return (
    <div className="container px-4 py-6 space-y-6">
      <Breadcrumbs 
        pathMap={getExtendedPathMap()} 
        background="transparent"
      />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Grading: {attempt.quiz.title}</h1>
          <p className="text-muted-foreground">Student: {attempt.user.name}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/teacher/grading">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grading
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Quiz</CardTitle>
            <CardDescription>
              {attempt.quiz.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {attempt.user.name}
              </div>
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2" />
                {format(new Date(attempt.completedAt!), 'PPP')}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Progress</CardTitle>
            <CardDescription>Manual grading progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {totalQuestionsNeedingGrading}
            </div>
            <p className="text-sm text-muted-foreground">
              Questions remaining to grade
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Time Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Time spent: {formatTime(attempt.timeSpent || 0)}
              </div>
              <div className="flex items-center">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {attempt.quiz.passingScore ? `Passing score: ${attempt.quiz.passingScore}%` : 'No passing score set'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {!hasManualGradingQuestions ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              All questions have been graded for this submission.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/dashboard/teacher/grading">
                Return to Grading Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue={attempt.answers[0]?.id || "none"} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-2">Questions</h2>
            <TabsList className="grid grid-flow-col auto-cols-max gap-2">
              {attempt.answers.map((answer, index) => (
                <TabsTrigger key={answer.id} value={answer.id}>
                  Question {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {attempt.answers.map((answer) => {
            const normalizedQuestion = normalizeQuestion({
              id: answer.question.id,
              content: answer.question.content,
              type: answer.question.type as QuestionType,
              points: answer.question.points || 1,
              order: answer.question.order || 0,
              metadata: answer.question.metadata,
              options: answer.question.options.map(opt => ({
                id: opt.id,
                content: opt.content,
                isCorrect: opt.isCorrect,
                order: opt.order,
                group: opt.group,
                matchId: opt.matchId,
                position: opt.position
              }))
            });
            
            return (
              <TabsContent key={answer.id} value={answer.id} className="space-y-4">
                    <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">
                      {formatQuestionType(normalizedQuestion.type)}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {normalizedQuestion.points} {normalizedQuestion.points === 1 ? 'point' : 'points'}
                    </p>
                  </div>
                      <Badge variant="outline">
                    Question {normalizedQuestion.order || 'N/A'}
                      </Badge>
                    </div>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: normalizedQuestion.content }} />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Student's Answer:</h4>
                      
                      {answer.question.type === 'MULTIPLE_CHOICE' && (
                        <div>
                          {answer.selectedOption ? (
                            <div className="pl-4 border-l-2 border-muted">
                              {answer.question.options.find((o) => o.id === answer.selectedOption)?.content || 'Option not found'}
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic">No answer selected</div>
                          )}
                        </div>
                      )}
                      
                      {answer.question.type === 'TRUE_FALSE' && (
                        <div>
                          {answer.selectedOption ? (
                            <div className="pl-4 border-l-2 border-muted">
                              {answer.question.options.find((o) => o.id === answer.selectedOption)?.content || 'Option not found'}
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic">No answer selected</div>
                          )}
                        </div>
                      )}
                      
                      {(answer.question.type === 'SHORT_ANSWER' || answer.question.type === 'ESSAY') && (
                        <div>
                          {answer.textAnswer ? (
                            <div className="pl-4 border-l-2 border-muted whitespace-pre-wrap">
                              {answer.textAnswer}
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic">No answer provided</div>
                          )}
                        </div>
                      )}
                      
                      {answer.question.type === 'FILL_BLANK' && (
                        <div>
                          {answer.textAnswer ? (
                            <div className="pl-4 border-l-2 border-muted">
                              {(() => {
                                try {
                                  const parsedAnswer = tryParseJson(answer.textAnswer);
                                  return (
                                    <div className="space-y-2">
                                      {Object.entries(parsedAnswer).map(([position, value]) => (
                                        <div key={position}>
                                          <span className="font-medium">Blank {position}:</span> {String(value)}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                } catch (e) {
                                  return <div className="text-destructive">Error parsing answer: {answer.textAnswer}</div>;
                                }
                              })()}
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic">No answer provided</div>
                          )}
                        </div>
                      )}
                      
                      {answer.question.type === 'MATCHING' && (
                        <div>
                          {answer.textAnswer ? (
                            <div className="pl-4 border-l-2 border-muted">
                              {(() => {
                                try {
                                  const parsedAnswer = tryParseJson(answer.textAnswer);
                                  return (
                                    <div className="space-y-2">
                                      {Object.entries(parsedAnswer).map(([leftId, rightId]) => {
                                        const leftOption = answer.question.options.find((o) => o.id === leftId);
                                        const rightOption = answer.question.options.find((o) => o.id === rightId);
                                        return (
                                          <div key={leftId}>
                                            <span className="font-medium">{leftOption?.content || 'Unknown'}</span>
                                            {' → '}
                                            {rightOption?.content || 'Unknown'}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                } catch (e) {
                                  return <div className="text-destructive">Error parsing answer: {answer.textAnswer}</div>;
                                }
                              })()}
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic">No answer provided</div>
                          )}
                        </div>
                      )}
                      
                      {answer.question.type === 'CODE' && (
                        <div>
                          {answer.textAnswer ? (
                            <div className="pl-4 border-l-2 border-muted">
                              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                                <code>{answer.textAnswer}</code>
                              </pre>
                            </div>
                          ) : (
                            <div className="text-muted-foreground italic">No answer provided</div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <QuestionGrader 
                  answerId={answer.id} 
                  quizId={attempt.quiz.id} 
                  attemptId={attempt.id}
                  questionType={answer.question.type as QuestionType}
                  maxPoints={answer.question.points || 1}
                />
              </TabsContent>
            );
          })}
        </Tabs>
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
  return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
} 