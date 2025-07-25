"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { QuestionsList } from "./components/QuestionsList";
import { QuestionTypeSelector } from "./components/QuestionTypeSelector";
import { DynamicQuestionEditor } from "./components/DynamicQuestionEditor";
import { QuestionType } from "@prisma/client";
import { Loader2, Plus, Save, Eye } from "lucide-react";
import { normalizeMetadata } from "@/lib/utils";

// Định nghĩa interface cho câu hỏi
interface Question {
  id: string;
  type: QuestionType;
  content: string;
  order: number;
  explanation?: string | null;
  points: number;
  options?: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
  }>;
  metadata?: Record<string, any> | null;
  [key: string]: any;
}

// Define the form schema
const quizFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  description: z.string().optional(),
  timeLimit: z.union([
    z.coerce.number().int().min(1, { message: "Time limit must be at least 1 minute" }).max(240, { message: "Time limit must be less than 240 minutes" }),
    z.literal(null)
  ]),
  isActive: z.boolean().default(true),
  classId: z.string().optional(),
  category: z.string().optional(),
  passingScore: z.coerce.number().min(0, { message: "Passing score must be at least 0%" }).max(100, { message: "Passing score must be between 0-100%" }).optional(),
  maxAttempts: z.coerce.number().int().min(1, { message: "Max attempts must be at least 1" }).optional(),
  showResults: z.boolean().default(true),
  shuffleQuestions: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

interface TeacherClass {
  id: string;
  name: string;
  subject: string | null;
}

interface QuizEditFormProps {
  quiz: any; // Replace with proper type
  classes: TeacherClass[];
  categories: string[];
}

export function QuizEditForm({ quiz, classes, categories }: QuizEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showQuestionTypeSelector, setShowQuestionTypeSelector] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    id?: string;
    type: QuestionType;
    data?: any;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>(quiz.questions || []);
  
  // Initialize the form with quiz values
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: quiz.title || "",
      description: quiz.description || "",
      timeLimit: quiz.timeLimit || 60,
      isActive: quiz.isActive ?? true,
      classId: quiz.classId || undefined,
      category: quiz.category || undefined,
      passingScore: quiz.passingScore || undefined,
      maxAttempts: quiz.maxAttempts || undefined,
      showResults: quiz.showResults ?? true,
      shuffleQuestions: quiz.shuffleQuestions ?? false,
      isPublic: quiz.isPublic ?? false,
      startDate: quiz.startDate ? new Date(quiz.startDate).toISOString() : null,
      endDate: quiz.endDate ? new Date(quiz.endDate).toISOString() : null,
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: QuizFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Chuyển đổi classId từ "none" thành null
      const formData = {
        ...data,
        classId: data.classId === "none" ? null : data.classId
      };
      
      const response = await fetch(`/api/teacher/quizzes/${quiz.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update quiz");
      }
      
      toast({
        title: "Success",
        description: "Quiz updated successfully.",
      });
      
      router.refresh();
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to update quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle selecting a question type
  const handleSelectQuestionType = (type: QuestionType) => {
    setEditingQuestion({ type });
    setShowQuestionTypeSelector(false);
  };

  // Handle saving a question
  const handleSaveQuestion = async (questionData: any) => {
    try {
      // Prepare data for API
      const method = editingQuestion?.id ? "PUT" : "POST";
      const url = editingQuestion?.id 
        ? `/api/teacher/quizzes/${quiz.id}/questions/${editingQuestion.id}`
        : `/api/teacher/quizzes/${quiz.id}/questions`;
      
      // Ensure metadata is properly processed
      if (questionData.metadata) {
        // Let normalizeMetadata handle the data cleaning and formatting
        const normalizedMetadata = normalizeMetadata(questionData.metadata);
        questionData.metadata = normalizedMetadata;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Failed to ${editingQuestion?.id ? "update" : "create"} question (Status: ${response.status})`;
        console.error("API error response:", errorData);
        throw new Error(errorMessage);
      }
      
      const savedQuestion = await response.json();
      
      // Update the questions list - ensure complete replacement with server data
      if (editingQuestion?.id) {
        // For existing questions, completely replace the old question with the new one from server
        setQuestions(questions.map((q: Question) => 
          q.id === editingQuestion.id ? savedQuestion : q
        ));
      } else {
        // For new questions, add the complete server response to questions list
        setQuestions([...questions, savedQuestion]);
      }
      
      toast({
        title: "Success",
        description: `Question ${editingQuestion?.id ? "updated" : "added"} successfully.`,
      });
      
      setEditingQuestion(null);
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${editingQuestion?.id ? "update" : "create"} question. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Handle editing a question
  const handleEditQuestion = (questionId: string) => {
    const question = questions.find((q: Question) => q.id === questionId);
    if (question) {
      // Ensure metadata is an object, not a string
      const questionData = {
        ...question,
        metadata: typeof question.metadata === 'string' 
          ? JSON.parse(question.metadata)
          : question.metadata
      };
      
      setEditingQuestion({
        id: questionData.id,
        type: questionData.type as QuestionType,
        data: questionData,
      });
    }
  };

  // Handle deleting a question
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      // Kiểm tra xem có học sinh đã làm quiz này chưa
      const hasAttempts = quiz.attempts && quiz.attempts.length > 0;
      
      // Nếu có học sinh đã làm quiz, hiển thị cảnh báo mạnh hơn
      if (hasAttempts) {
        const confirmDelete = window.confirm(
          "WARNING: This quiz has been attempted by students. Deleting this question will also delete all student answers related to it and may affect their scores. This action cannot be undone. Are you sure you want to continue?"
        );
        
        if (!confirmDelete) {
          return; // User cancelled the deletion
        }
      }
      
      const response = await fetch(`/api/teacher/quizzes/${quiz.id}/questions/${questionId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete question");
      }
      
      // Update the questions list
      setQuestions(questions.filter((q: Question) => q.id !== questionId));
      
      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle reordering questions
  const handleReorderQuestions = async (newOrder: { id: string; order: number }[]) => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quiz.id}/questions/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: newOrder }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reorder questions");
      }
      
      // Update the questions list with new order
      const updatedQuestions = [...questions];
      newOrder.forEach(item => {
        const question = updatedQuestions.find((q: Question) => q.id === item.id);
        if (question) question.order = item.order;
      });
      updatedQuestions.sort((a, b) => a.order - b.order);
      setQuestions(updatedQuestions);
      
      toast({
        title: "Success",
        description: "Questions reordered successfully.",
      });
    } catch (error) {
      console.error("Error reordering questions:", error);
      toast({
        title: "Error",
        description: "Failed to reorder questions. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle publishing quiz
  const handlePublishQuiz = async () => {
    try {
      const response = await fetch(`/api/teacher/quizzes/${quiz.id}/publish`, {
        method: "PUT",
      });
      
      if (!response.ok) {
        throw new Error("Failed to publish quiz");
      }
      
      toast({
        title: "Success",
        description: "Quiz published successfully.",
      });
      
      router.push("/dashboard/teacher/quizzes");
    } catch (error) {
      console.error("Error publishing quiz:", error);
      toast({
        title: "Error",
        description: "Failed to publish quiz. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight">{quiz.title}</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/teacher/quizzes/${quiz.id}/preview`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          {!quiz.isPublished && (
            <Button 
              onClick={handlePublishQuiz}
              disabled={questions.length === 0}
            >
              Publish Quiz
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4 mt-4">
          <Form {...form}>
            <form className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Details</CardTitle>
                  <CardDescription>
                    Update the basic information for your quiz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter quiz title" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your quiz a clear and descriptive title.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter a brief description of the quiz" 
                            className="resize-none min-h-[100px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide more details about what this quiz covers.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value} 
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                                {/* Allow custom category input */}
                                <div className="p-2 border-t">
                                  <Input
                                    placeholder="Add custom category"
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </div>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Categorize your quiz for organization.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || "none"}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Independent Quiz (No Class)</SelectItem>
                                {classes.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name} {cls.subject ? `(${cls.subject})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Associate this quiz with a class or make it independent.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Details
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-4 mt-4">
          {editingQuestion ? (
            <DynamicQuestionEditor
              questionType={editingQuestion.type}
              questionId={editingQuestion.id}
              initialData={editingQuestion.data}
              onSave={handleSaveQuestion}
              onCancel={() => setEditingQuestion(null)}
            />
          ) : (
            <>
              {showQuestionTypeSelector ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Question Type</CardTitle>
                    <CardDescription>
                      Choose the type of question you want to add to your quiz.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QuestionTypeSelector onSelectType={handleSelectQuestionType} />
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setShowQuestionTypeSelector(true)}
                    className="mb-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              )}
              
              <QuestionsList
                questions={questions}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onReorderQuestions={handleReorderQuestions}
              />
            </>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Form {...form}>
            <form className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Settings</CardTitle>
                  <CardDescription>
                    Configure how your quiz will be presented to students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (minutes)</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                            <Input 
                              type="number" 
                              placeholder="60"
                              min={1}
                              max={240}
                                disabled={field.value === null}
                                value={field.value === null ? "" : field.value}
                                onChange={(e) => {
                                  if (e.target.value === "") {
                                    field.onChange(null);
                                  } else {
                                    field.onChange(parseInt(e.target.value));
                                  }
                                }}
                                className="flex-1"
                              />
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  id="unlimited-time" 
                                  checked={field.value === null}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked ? null : 60);
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor="unlimited-time" className="text-sm">Unlimited</label>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            How much time students have to complete the quiz (check "Unlimited" for practice quizzes).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Attempts</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Unlimited"
                              min={1}
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            How many times a student can take this quiz (leave empty for unlimited).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="No passing score"
                            min={0}
                            max={100}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value === "" ? null : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum percentage required to pass the quiz (leave empty if no passing score).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  id="enable-start-date" 
                                  checked={field.value !== null}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked ? new Date().toISOString() : null);
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor="enable-start-date" className="text-sm">Set a start date</label>
                              </div>
                              {field.value && (
                                <input 
                                  type="datetime-local" 
                                  value={field.value.split('.')[0]} 
                                  onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                                  className="w-full p-2 border rounded-md"
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Quiz will become available to students at this date and time.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  id="enable-end-date" 
                                  checked={field.value !== null}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked ? new Date().toISOString() : null);
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor="enable-end-date" className="text-sm">Set an end date</label>
                              </div>
                              {field.value && (
                                <input 
                                  type="datetime-local" 
                                  value={field.value.split('.')[0]} 
                                  onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                                  className="w-full p-2 border rounded-md"
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Quiz will become unavailable to students after this date and time.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="shuffleQuestions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Shuffle Questions</FormLabel>
                            <FormDescription>
                              Randomize the order of questions for each student
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="showResults"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Results</FormLabel>
                            <FormDescription>
                              Show students their results after completing the quiz
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public Quiz</FormLabel>
                          <FormDescription>
                            Make this quiz available to anyone with the link
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
} 