"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Save } from "lucide-react";
import { QuestionType } from "@prisma/client";

// Programming languages supported by the code editor
const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "typescript", label: "TypeScript" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

interface CodeEditorProps {
  questionId?: string;
  initialData?: {
    content: string;
    points: number;
    order: number;
    explanation?: string | null;
    metadata?: {
      language?: string;
      starterCode?: string;
      expectedOutput?: string;
      testCases?: Array<{
        input: string;
        output: string;
        hidden?: boolean;
      }>;
    } | null;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CodeEditor({
  questionId,
  initialData,
  onSave,
  onCancel
}: CodeEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  const [content, setContent] = useState(initialData?.content || "");
  const [points, setPoints] = useState(initialData?.points || 10);
  const [order, setOrder] = useState(initialData?.order || 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  
  // Code-specific metadata
  const [language, setLanguage] = useState(initialData?.metadata?.language || "javascript");
  const [starterCode, setStarterCode] = useState(initialData?.metadata?.starterCode || "");
  const [expectedOutput, setExpectedOutput] = useState(initialData?.metadata?.expectedOutput || "");
  
  // Test cases
  const [testCases, setTestCases] = useState<Array<{
    input: string;
    output: string;
    hidden: boolean;
    id: string;
  }>>(
    initialData?.metadata?.testCases?.map(tc => ({
      ...tc,
      hidden: tc.hidden || false,
      id: Math.random().toString(36).substring(2),
    })) || [
      {
        input: "",
        output: "",
        hidden: false,
        id: Math.random().toString(36).substring(2),
      }
    ]
  );
  
  // Add a new test case
  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        input: "",
        output: "",
        hidden: false,
        id: Math.random().toString(36).substring(2),
      }
    ]);
  };
  
  // Remove a test case
  const removeTestCase = (id: string) => {
    if (testCases.length <= 1) return; // Keep at least one test case
    setTestCases(testCases.filter(tc => tc.id !== id));
  };
  
  // Update a test case
  const updateTestCase = (
    id: string, 
    field: "input" | "output" | "hidden", 
    value: string | boolean
  ) => {
    setTestCases(
      testCases.map(tc => {
        if (tc.id === id) {
          return { ...tc, [field]: value };
        }
        return tc;
      })
    );
  };
  
  // Handle saving the question
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Clean up test cases for saving (remove id)
      const cleanedTestCases = testCases.map(({ id, ...rest }) => rest);
      
      // Validate language selection
      if (!language) {
        alert("Please select a programming language.");
        setIsLoading(false);
        return;
      }
      
      // Create final data structure
      const finalData = {
        type: QuestionType.CODE,
        content,
        points,
        order,
        explanation,
        options: [], // Code questions don't use standard options, but API might expect an array
        language, // Add required field for API schema
        defaultCode: starterCode,
        solutionCode: expectedOutput || "// Expected solution would go here", // Required field for API schema
          testCases: cleanedTestCases,
      };
      
      console.log("CodeEditor submitting:", JSON.stringify(finalData, null, 2));
      await onSave(finalData);
    } catch (error) {
      console.error("Error saving code question:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{questionId ? "Edit Code Question" : "New Code Question"}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Question
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Question Content</TabsTrigger>
              <TabsTrigger value="code">Code Setup</TabsTrigger>
              <TabsTrigger value="testing">Test Cases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Question Content</Label>
                <RichTextEditor 
                  content={content}
                  onChange={setContent}
                  placeholder="Enter coding problem description..."
                  minHeight="200px"
                />
                <p className="text-sm text-muted-foreground">
                  Describe the problem students need to solve with code.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="language">Programming Language</Label>
                <Select 
                  value={language} 
                  onValueChange={setLanguage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the programming language for this question.
                </p>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label htmlFor="starterCode">Starter Code (Template)</Label>
                <Textarea
                  id="starterCode"
                  placeholder={`// Starter code that will be provided to students\nfunction solve() {\n  // TODO: Implement this function\n  \n}`}
                  className="font-mono h-40"
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Provide starter code for students to begin with. This template will be shown in the code editor.
                </p>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label htmlFor="expectedOutput">Expected Output Format (Optional)</Label>
                <Textarea
                  id="expectedOutput"
                  placeholder="Describe the expected output format, e.g. 'Return an integer representing...'"
                  className="h-24"
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Describe the expected format of the output or return value.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="testing" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">Test Cases</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTestCase}
                  >
                    Add Test Case
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Create test cases to verify student solutions. Hidden test cases are not shown to students.
                </p>
                
                <div className="space-y-4">
                  {testCases.map((testCase, index) => (
                    <div key={testCase.id} className="border rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Test Case {index + 1}</h3>
                        <div className="flex gap-2 items-center">
                          <Label htmlFor={`hidden-${testCase.id}`} className="text-sm">
                            Hidden
                          </Label>
                          <input
                            id={`hidden-${testCase.id}`}
                            type="checkbox"
                            checked={testCase.hidden}
                            onChange={(e) => updateTestCase(testCase.id, "hidden", e.target.checked)}
                            className="h-4 w-4"
                          />
                          {testCases.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestCase(testCase.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`input-${testCase.id}`}>Input</Label>
                        <Textarea
                          id={`input-${testCase.id}`}
                          placeholder="Enter test case input data"
                          className="font-mono h-20"
                          value={testCase.input}
                          onChange={(e) => updateTestCase(testCase.id, "input", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Input parameters or data for the test case. Format according to your language.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`output-${testCase.id}`}>Expected Output</Label>
                        <Textarea
                          id={`output-${testCase.id}`}
                          placeholder="Enter expected output"
                          className="font-mono h-20"
                          value={testCase.output}
                          onChange={(e) => updateTestCase(testCase.id, "output", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          The expected output or return value for this input.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label>Answer Explanation (Optional)</Label>
                <RichTextEditor 
                  content={explanation}
                  onChange={setExplanation}
                  placeholder="Enter explanation of the solution approach..."
                  minHeight="150px"
                />
                <p className="text-sm text-muted-foreground">
                  This will be shown to students after the quiz if "Show Results" is enabled
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 