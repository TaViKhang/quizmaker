"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  ArrowLeft,
  School,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  User,
  BookOpen
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define class details type
interface ClassDetails {
  id: string;
  name: string;
  subject: string;
  teacherName: string;
  totalStudents: number;
  coverImage?: string;
}

// Define join class response type
interface JoinClassResponse {
  success: boolean;
  classDetails: ClassDetails;
}

// Form validation schema
const joinClassSchema = z.object({
  classCode: z.string().min(6, {
    message: "Class code must be at least 6 characters",
  }).max(20, {
    message: "Class code cannot be longer than 20 characters",
  }),
});

// Mock join class function - would be replaced with real API call
const joinClassByCode = async (code: string): Promise<JoinClassResponse> => {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Match code pattern to simulate success/failure
      if (code.toLowerCase() === "math101" || code.toLowerCase() === "class001") {
        resolve({
          success: true,
          classDetails: {
            id: "class001",
            name: "Calculus I",
            subject: "Mathematics",
            teacherName: "Dr. Elara Vance",
            totalStudents: 32,
            coverImage: "/images/carousel/image1.jpg"
          }
        });
      } else if (code.toLowerCase() === "lit202" || code.toLowerCase() === "class002") {
        resolve({
          success: true,
          classDetails: {
            id: "class002",
            name: "World Literature",
            subject: "Literature",
            teacherName: "Prof. Lydia Montgomery",
            totalStudents: 24,
            coverImage: "/images/carousel/image2.jpg"
          }
        });
      } else {
        reject({
          success: false,
          error: "Class code doesn't exist or you don't have permission to join this class."
        });
      }
    }, 1500);
  });
};

export function JoinClassForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"idle" | "success" | "error">("idle");
  const [joinedClass, setJoinedClass] = useState<ClassDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Setup form
  const form = useForm<z.infer<typeof joinClassSchema>>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: {
      classCode: ""
    }
  });

  const onSubmit = async (values: z.infer<typeof joinClassSchema>) => {
    setIsSubmitting(true);
    setJoinStatus("idle");
    
    try {
      const result = await joinClassByCode(values.classCode);
      setJoinStatus("success");
      setJoinedClass(result.classDetails);
    } catch (error: any) {
      setJoinStatus("error");
      setErrorMessage(error.error || "An error occurred when trying to join the class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-lg mx-auto">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/student/classes">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>Back to class list</span>
          </Link>
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-full bg-secondary p-2">
              <School className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>Enter class code</CardTitle>
          </div>
          <CardDescription>
            Make sure the class code is entered correctly. The class code is usually shared by your teacher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {joinStatus === "idle" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="classCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Example: MATH101" 
                          {...field} 
                          autoComplete="off"
                          autoCapitalize="off"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the class code provided by your teacher.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Join class</>
                  )}
                </Button>
              </form>
            </Form>
          )}
          
          {joinStatus === "success" && joinedClass && (
            <div className="space-y-4">
              <Alert variant="success" className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  You have successfully joined the class.
                </AlertDescription>
              </Alert>
              
              <div className="border rounded-lg overflow-hidden">
                {joinedClass.coverImage ? (
                  <div className="relative h-40 w-full">
                    <Image 
                      src={joinedClass.coverImage}
                      alt={`Cover image for ${joinedClass.name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
                    <School className="h-12 w-12 text-slate-400" aria-hidden="true" />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{joinedClass.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span>Subject: {joinedClass.subject}</span>
                    </p>
                    <p className="flex items-center">
                      <User className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span>Teacher: {joinedClass.teacherName}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full" asChild>
                <Link href={`/dashboard/student/classes/${joinedClass.id}`}>
                  <span>Go to class</span>
                  <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
          
          {joinStatus === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
              
              <Button variant="secondary" className="w-full" onClick={() => {
                setJoinStatus("idle");
                form.reset();
              }}>
                Try again
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
          <p className="mb-2">Examples of valid class codes: MATH101, LIT202</p>
          <Alert variant="info" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              If you're having trouble joining a class, please contact your teacher for assistance.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
} 