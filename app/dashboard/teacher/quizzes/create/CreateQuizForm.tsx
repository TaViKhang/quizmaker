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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus } from "lucide-react";

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

interface CreateQuizFormProps {
  classes: TeacherClass[];
  categories: string[];
}

export function CreateQuizForm({ classes, categories }: CreateQuizFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form with default values
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      timeLimit: 60,
      isActive: true,
      showResults: true,
      shuffleQuestions: false,
      isPublic: false,
      startDate: null,
      endDate: null,
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
      
      const response = await fetch("/api/teacher/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create quiz");
      }
      
      const quiz = await response.json();
      
      toast({
        title: "Success",
        description: "Quiz created successfully.",
      });
      
      // Redirect to the edit page for the newly created quiz
      router.push(`/dashboard/teacher/quizzes/${quiz.id}/edit`);
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
                <CardDescription>
                  Enter the basic information for your quiz.
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
                </div>
                
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
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
                        Assign this quiz to a specific class or keep it independent.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>
                          Is this quiz active and available to students?
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
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
                <CardDescription>
                  Configure additional settings for your quiz.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="70" 
                            min={0}
                            max={100}
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum percentage score required to pass.
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
                            placeholder="Leave blank for unlimited" 
                            min={1}
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          How many times a student can attempt this quiz.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                
                <FormField
                  control={form.control}
                  name="showResults"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Results</FormLabel>
                        <FormDescription>
                          Show students their results immediately after completing the quiz.
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
                  name="shuffleQuestions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Shuffle Questions</FormLabel>
                        <FormDescription>
                          Randomize the order of questions for each student.
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
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Quiz</FormLabel>
                        <FormDescription>
                          Make this quiz available to anyone with the link.
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
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <div className="flex space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Quiz
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                form.setValue("isPublic", true);
                form.handleSubmit(onSubmit)();
              }}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create and Publish
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
} 