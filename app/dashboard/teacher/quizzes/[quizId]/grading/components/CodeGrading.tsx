"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Play, Check, X, Code, Terminal } from "lucide-react";

interface TestCase {
  input: string;
  output: string;
  hidden?: boolean;
  result?: {
    passed: boolean;
    actual?: string;
    expected?: string;
  };
}

interface CodeGradingProps {
  quizId: string;
  attemptId: string;
  answerId: string;
  questionContent: string;
  studentCode: string;
  questionPoints: number;
  existingScore?: number | null;
  existingFeedback?: string | null;
  language?: string;
  testCases?: TestCase[];
  solutionCode?: string;
  onSaveGrade: (score: number, feedback: string) => Promise<void>;
}

export function CodeGrading({
  quizId,
  attemptId,
  answerId,
  questionContent,
  studentCode,
  questionPoints,
  existingScore,
  existingFeedback = "",
  language = "javascript",
  testCases = [],
  solutionCode = "",
  onSaveGrade
}: CodeGradingProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [feedback, setFeedback] = useState(existingFeedback || "");
  const [score, setScore] = useState<number>(existingScore || 0);
  const [testResults, setTestResults] = useState<TestCase[]>(testCases);
  const [manualScore, setManualScore] = useState(existingScore || Math.floor(questionPoints / 2));
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [autoGradeEnabled, setAutoGradeEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("code");

  // Automatically calculate score based on test case results when autoGradeEnabled
  useEffect(() => {
    if (autoGradeEnabled && testResults.some(test => test.result)) {
      const passedTests = testResults.filter(test => test.result?.passed).length;
      const totalTests = testResults.length;
      
      if (totalTests > 0) {
        const calculatedScore = Math.round((passedTests / totalTests) * questionPoints);
        setScore(calculatedScore);
      }
    } else {
      setScore(manualScore);
    }
  }, [testResults, questionPoints, autoGradeEnabled, manualScore]);

  // Run the student code against test cases
  const runCode = async () => {
    setIsRunningCode(true);
    setCodeOutput("");
    
    try {
      // In a real implementation, this would call an API endpoint that can run the code safely
      const response = await fetch("/api/code-runner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: studentCode,
          language,
          testCases
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to run code");
      }
      
      const data = await response.json();
      
      setTestResults(data.testResults);
      setCodeOutput(data.output || "Code execution completed");
      
      toast({
        title: "Code execution completed",
        description: `${data.testResults.filter((t: TestCase) => t.result?.passed).length}/${data.testResults.length} tests passed`,
      });
    } catch (error) {
      console.error("Error running code:", error);
      setCodeOutput("Error running code. This could be due to syntax errors or execution timeout.");
      
      toast({
        title: "Error running code",
        description: "There was a problem executing the code",
        variant: "destructive",
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      await onSaveGrade(score, feedback);
      toast({
        title: "Grade saved",
        description: "The code submission has been graded successfully.",
      });
    } catch (error) {
      console.error("Error saving grade:", error);
      toast({
        title: "Error saving grade",
        description: "There was a problem saving the grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Code Grading</h2>
          <p className="text-muted-foreground">
            Grade the student's code submission and provide feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runCode} variant="secondary" disabled={isRunningCode}>
            {isRunningCode ? (
              <>Running...</>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Grade
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="code">
            <Code className="h-4 w-4 mr-2" />
            Student Code
          </TabsTrigger>
          <TabsTrigger value="tests">
            <Terminal className="h-4 w-4 mr-2" />
            Test Cases
          </TabsTrigger>
          <TabsTrigger value="solution">Solution</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between">
                <CardTitle className="text-lg">Question</CardTitle>
                <Badge>{language}</Badge>
              </div>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: questionContent }}
              />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <pre className="p-4 text-sm font-mono">{studentCode}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Results</CardTitle>
              <CardDescription>
                Run the code to see test results. {testCases.length} test case(s) available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {codeOutput && (
                <Alert className={testResults.every(t => t.result?.passed) ? "border-green-500" : "border-red-500"}>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Code Execution Output</AlertTitle>
                  <AlertDescription>
                    <pre className="mt-2 whitespace-pre-wrap text-sm">{codeOutput}</pre>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                {testResults.map((testCase, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className={`py-2 px-4 ${
                      testCase.result 
                        ? testCase.result.passed 
                          ? "bg-green-50 dark:bg-green-950" 
                          : "bg-red-50 dark:bg-red-950"
                        : ""
                    }`}>
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-sm">Test Case {index + 1} {testCase.hidden && "(Hidden)"}</h3>
                        {testCase.result && (
                          <Badge 
                            variant={testCase.result.passed ? "default" : "destructive"}
                            className="ml-auto"
                          >
                            {testCase.result.passed ? (
                              <><Check className="h-3 w-3 mr-1" /> Passed</>
                            ) : (
                              <><X className="h-3 w-3 mr-1" /> Failed</>
                            )}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="font-medium text-xs text-muted-foreground mb-1">Input:</p>
                          <pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap">{testCase.input}</pre>
                        </div>
                        <div>
                          <p className="font-medium text-xs text-muted-foreground mb-1">Expected Output:</p>
                          <pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap">{testCase.output}</pre>
                        </div>
                        {testCase.result && testCase.result.actual && (
                          <div className="col-span-2">
                            <p className="font-medium text-xs text-muted-foreground mb-1">Actual Output:</p>
                            <pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap">{testCase.result.actual}</pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="solution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Solution Code</CardTitle>
              <CardDescription>
                Sample solution for reference. This is not shown to students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <pre className="p-4 text-sm font-mono">{solutionCode || "No solution code provided."}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grade Assignment</CardTitle>
              <CardDescription>
                Assign a grade and provide feedback for this submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-grade">Auto-grade based on test results</Label>
                    <p className="text-sm text-muted-foreground">
                      Score will be calculated based on passed test cases
                    </p>
                  </div>
                  <Switch
                    id="auto-grade"
                    checked={autoGradeEnabled}
                    onCheckedChange={setAutoGradeEnabled}
                  />
                </div>
                <Separator className="my-4" />
              </div>
              
              {!autoGradeEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manual-score">Manual Score</Label>
                    <span className="font-medium">{manualScore} / {questionPoints}</span>
                  </div>
                  <Slider
                    id="manual-score"
                    min={0}
                    max={questionPoints}
                    step={1}
                    value={[manualScore]}
                    onValueChange={(value) => {
                      setManualScore(value[0]);
                      setScore(value[0]);
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback to the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              
              <div className="flex items-center justify-between bg-muted p-4 rounded-md">
                <span>Final Score:</span>
                <Badge variant="outline" className="text-lg">
                  {score} / {questionPoints} points
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 