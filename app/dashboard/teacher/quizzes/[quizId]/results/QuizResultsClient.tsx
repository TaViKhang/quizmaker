"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Download, Search, SortAsc, SortDesc, FileDown, Users, Calendar, BookOpen, ClipboardCheck, BarChart as BarChartIcon } from "lucide-react";
import { QuestionType, Quiz } from "@prisma/client";

interface AttemptType {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  answers: {
    id: string;
    questionId: string;
    score: number | null;
    question: {
      id: string;
      content: string;
      type: string;
    };
  }[];
}

interface QuestionWithStats {
  id: string;
  content: string;
  type: string;
  points: number;
  order: number;
  avgScore: number;
  correctPercentage: number;
  totalAnswers: number;
}

interface OverallStats {
  totalAttempts: number;
  overallAvgScore: number;
  passingCount: number;
  passingPercentage: number;
  passingScore: number | null;
}

interface QuizResultsClientProps {
  quiz: Quiz & {
    questions: {
      id: string;
      content: string;
      type: string;
      points: number;
      order: number;
    }[];
  };
  attempts: AttemptType[];
  questionsWithStats: QuestionWithStats[];
  overallStats: OverallStats;
}

export function QuizResultsClient({ 
  quiz, 
  attempts, 
  questionsWithStats,
  overallStats
}: QuizResultsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'startedAt',
    direction: 'descending'
  });

  // Filter attempts based on search term
  const filteredAttempts = attempts.filter(attempt => {
    const studentName = attempt.user.name?.toLowerCase() || "";
    const studentEmail = attempt.user.email?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    
    return studentName.includes(term) || studentEmail.includes(term);
  });

  // Sort attempts based on sort config
  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    if (sortConfig.key === 'name') {
      const aName = a.user.name?.toLowerCase() || "";
      const bName = b.user.name?.toLowerCase() || "";
      
      if (sortConfig.direction === 'ascending') {
        return aName.localeCompare(bName);
      } else {
        return bName.localeCompare(aName);
      }
    } else if (sortConfig.key === 'score') {
      const aScore = a.score || 0;
      const bScore = b.score || 0;
      
      if (sortConfig.direction === 'ascending') {
        return aScore - bScore;
      } else {
        return bScore - aScore;
      }
    } else if (sortConfig.key === 'startedAt') {
      const aDate = new Date(a.startedAt).getTime();
      const bDate = new Date(b.startedAt).getTime();
      
      if (sortConfig.direction === 'ascending') {
        return aDate - bDate;
      } else {
        return bDate - aDate;
      }
    }
    
    return 0;
  });

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) {
      return null;
    }
    
    return sortConfig.direction === 'ascending' 
      ? <SortAsc className="h-4 w-4 ml-1" /> 
      : <SortDesc className="h-4 w-4 ml-1" />;
  };

  // Prepare data for question performance chart
  const questionPerformanceData = questionsWithStats.map((q, index) => ({
    name: `Q${index + 1}`,
    correctRate: q.correctPercentage,
    avgScore: q.avgScore,
    questionType: q.type,
  }));

  // Prepare data for pie chart
  const passingData = [
    { name: "Passing", value: overallStats.passingCount },
    { name: "Not Passing", value: overallStats.totalAttempts - overallStats.passingCount }
  ];
  
  const COLORS = ['#22c55e', '#ef4444'];

  // Get the most difficult question (lowest correct percentage)
  const mostDifficultQuestion = [...questionsWithStats]
    .sort((a, b) => a.correctPercentage - b.correctPercentage)[0];

  // Get the easiest question (highest correct percentage)
  const easiestQuestion = [...questionsWithStats]
    .sort((a, b) => b.correctPercentage - a.correctPercentage)[0];

  // For clarity in content display
  const truncateText = (text: string, length: number) => {
    // Strip HTML tags
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    if (cleanText.length <= length) {
      return cleanText;
    }
    
    return cleanText.substring(0, length) + "...";
  };

  // Prepare question type distribution data
  const questionTypeCount: Record<string, number> = {};
  
  questionsWithStats.forEach(q => {
    questionTypeCount[q.type] = (questionTypeCount[q.type] || 0) + 1;
  });
  
  const questionTypeData = Object.entries(questionTypeCount).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // Clean up question type display
  const formatQuestionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Export results as CSV
  const exportResults = () => {
    // Create CSV header
    let csv = "Student,Email,Started At,Score,Status\n";
    
    // Add rows
    sortedAttempts.forEach(attempt => {
      const name = attempt.user.name || "Anonymous";
      const email = attempt.user.email || "N/A";
      const date = formatDate(attempt.startedAt);
      const score = attempt.score || 0;
      const status = quiz.passingScore && attempt.score 
        ? attempt.score >= quiz.passingScore ? "Pass" : "Fail"
        : "N/A";
      
      csv += `"${name}","${email}","${date}",${score},${status}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${quiz.title}-results.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChartIcon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="questions">
            <BookOpen className="h-4 w-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.overallAvgScore}%</div>
                <p className="text-xs text-muted-foreground">
                  Average score across {overallStats.totalAttempts} attempts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.passingPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {overallStats.passingCount} out of {overallStats.totalAttempts} passed {overallStats.passingScore ? `(${overallStats.passingScore}% required)` : ""}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalAttempts}</div>
                <p className="text-xs text-muted-foreground">
                  Students who completed the quiz
                </p>
              </CardContent>
            </Card>
          </div>
          
          {overallStats.totalAttempts > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Question Performance</CardTitle>
                  <CardDescription>
                    Average scores and success rates per question
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={questionPerformanceData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis unit="%" />
                        <Tooltip 
                          formatter={(value: number) => [`${value}%`, undefined]}
                          labelFormatter={(label) => `Question ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="correctRate" name="Success Rate" fill="#22c55e" />
                        <Bar dataKey="avgScore" name="Avg. Score" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Passing Distribution</CardTitle>
                  <CardDescription>
                    Students who passed vs. failed the quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={passingData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {passingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'Students']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Data Yet</h3>
                <p className="text-muted-foreground mt-2 text-center max-w-md">
                  Once students complete the quiz, you'll see analytics and insights here.
                </p>
              </CardContent>
            </Card>
          )}
          
          {overallStats.totalAttempts > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Most Difficult Question</CardTitle>
                  <CardDescription>
                    Lowest success rate among all questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mostDifficultQuestion ? (
                    <>
                      <Badge variant="outline">{formatQuestionType(mostDifficultQuestion.type)}</Badge>
                      <p className="text-sm">{truncateText(mostDifficultQuestion.content, 100)}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Success rate:</span>
                        <Badge variant="destructive">{mostDifficultQuestion.correctPercentage}%</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Average score:</span>
                        <span>{mostDifficultQuestion.avgScore}%</span>
                      </div>
                    </>
                  ) : (
                    <p>No data available</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Easiest Question</CardTitle>
                  <CardDescription>
                    Highest success rate among all questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {easiestQuestion ? (
                    <>
                      <Badge variant="outline">{formatQuestionType(easiestQuestion.type)}</Badge>
                      <p className="text-sm">{truncateText(easiestQuestion.content, 100)}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Success rate:</span>
                        <Badge variant="default">{easiestQuestion.correctPercentage}%</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Average score:</span>
                        <span>{easiestQuestion.avgScore}%</span>
                      </div>
                    </>
                  ) : (
                    <p>No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>
                Individual results for each student who completed the quiz
              </CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  <Search className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedAttempts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('name')}
                        >
                          <div className="flex items-center">
                            Student {getSortIndicator('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer"
                          onClick={() => requestSort('startedAt')}
                        >
                          <div className="flex items-center">
                            Completed {getSortIndicator('startedAt')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer text-right"
                          onClick={() => requestSort('score')}
                        >
                          <div className="flex items-center justify-end">
                            Score {getSortIndicator('score')}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAttempts.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell>
                            <div className="font-medium">{attempt.user.name || "Anonymous"}</div>
                            <div className="text-sm text-muted-foreground">{attempt.user.email || "N/A"}</div>
                          </TableCell>
                          <TableCell>
                            {formatDate(attempt.startedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {attempt.score !== null ? `${attempt.score}%` : "Not scored"}
                          </TableCell>
                          <TableCell className="text-right">
                            {attempt.score !== null && quiz.passingScore ? (
                              attempt.score >= quiz.passingScore ? (
                                <Badge className="bg-green-100 text-green-800">Pass</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-800">Fail</Badge>
                              )
                            ) : (
                              <Badge variant="outline">N/A</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p>No students found. Adjust your search or try again later.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Question Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics for each question
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                      <TableHead className="text-right">Avg. Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionsWithStats.map((question, index) => (
                      <TableRow key={question.id}>
                        <TableCell>
                          <div className="font-medium">Question {index + 1}</div>
                          <div className="text-sm text-muted-foreground">
                            {truncateText(question.content, 60)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatQuestionType(question.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{question.points}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div 
                              className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden"
                              title={`${question.correctPercentage}% success rate`}
                            >
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${question.correctPercentage}%` }}
                              />
                            </div>
                            <span>{question.correctPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {question.avgScore}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Question Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of question types in this quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={questionTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${formatQuestionType(name)}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {questionTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 50}, 60%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Questions']} />
                      <Legend formatter={(value) => formatQuestionType(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance by Question Type</CardTitle>
                <CardDescription>
                  Average scores grouped by question type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(questionTypeCount).map(([type, count]) => {
                        // Calculate average score for this question type
                        const questionsOfType = questionsWithStats.filter(q => q.type === type);
                        const avgScore = questionsOfType.reduce((sum, q) => sum + q.avgScore, 0) / count;
                        
                        return {
                          name: formatQuestionType(type),
                          score: Math.round(avgScore),
                          count
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Avg. Score']} />
                      <Bar dataKey="score" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Results</CardTitle>
              <CardDescription>
                Download quiz results in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-lg font-medium">CSV Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Export student results in CSV format for use in spreadsheet applications
                    </p>
                  </div>
                  <Button 
                    onClick={exportResults}
                    className="w-fit"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-lg font-medium">Quiz Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Key metrics about this quiz
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Quiz Title:</span>
                        <span className="font-medium">{quiz.title}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Questions:</span>
                        <span className="font-medium">{quiz.questions.length}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Total Submissions:</span>
                        <span className="font-medium">{overallStats.totalAttempts}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Average Score:</span>
                        <span className="font-medium">{overallStats.overallAvgScore}%</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Passing Score:</span>
                        <span className="font-medium">{quiz.passingScore ? `${quiz.passingScore}%` : "Not set"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Pass Rate:</span>
                        <span className="font-medium">{overallStats.passingPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 