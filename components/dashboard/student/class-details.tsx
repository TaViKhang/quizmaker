"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  User,
  UserCheck,
  MessageCircle,
  Bookmark,
  ChevronRight,
  AlertCircle,
  FileIcon,
  ExternalLink,
  PlusCircle,
  Pencil,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from "next/image";
import { AnnouncementType, ClassDetailsType, MaterialType, QuizType } from "@/app/dashboard/student/types/types";
import { useState, useEffect } from "react";

// Loading skeleton for class detail
export function ClassDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-9 w-24" />
      </div>
      
      <div className="relative mb-6 rounded-lg overflow-hidden">
        <Skeleton className="h-48 w-full" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-[400px]" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for quiz cards
function QuizCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-4/5 mb-2" />
        <Skeleton className="h-4 w-3/5" />
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardContent className="pt-0">
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

// Component for quiz card in a class
function ClassQuizCard({ quiz, animationDelay = 0 }: { quiz: QuizType; animationDelay?: number }) {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Convert status to badge
  let statusBadge = null;
  if (quiz.status === "upcoming") {
    statusBadge = (
      <Badge variant="outline" className="bg-slate-100">
        <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
        <span>Upcoming</span>
      </Badge>
    );
  } else if (quiz.status === "ongoing") {
    statusBadge = (
      <Badge variant="success">
        <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
        <span>In progress</span>
      </Badge>
    );
  }

  // Convert isFormal to badge
  const formalBadge = quiz.isFormal ? (
    <Badge variant="default" className="bg-navy text-white">
      <Bookmark className="h-3 w-3 mr-1" aria-hidden="true" />
      <span>Official exam</span>
    </Badge>
  ) : null;

  // Set button variant and text based on status
  let buttonVariant: "default" | "outline" | "secondary" = "default";
  let buttonText = "Start quiz";
  let buttonDisabled = false;

  if (quiz.status === "upcoming") {
    buttonVariant = "outline";
    buttonText = "View details";
  } else if (quiz.status === "ongoing" && quiz.currentAttempts && quiz.currentAttempts > 0) {
    buttonText = "Continue quiz";
  }

  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-md"
      style={{ 
        opacity: 0,
        animation: `fadeIn 0.5s ease-out ${animationDelay}s forwards` 
      }}
    >
      <div className="h-32 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <FileText className="h-12 w-12 text-slate-400" aria-hidden="true" />
        <div className="absolute top-2 right-2 flex gap-2 flex-wrap">
          {formalBadge}
          {statusBadge}
        </div>
      </div>
      <CardHeader className="pt-3 pb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {formalBadge}
          {statusBadge}
        </div>
        <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
        <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 space-y-2 text-sm">
        <div className="flex items-start">
          <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
          <span>{quiz.startDate ? formatDate(quiz.startDate) : "No date"}{quiz.endDate ? ` - ${formatDate(quiz.endDate)}` : ""}</span>
        </div>
        <div className="flex items-start">
          <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
          <span>{quiz.durationMinutes} minutes</span>
        </div>
        <div className="flex items-start">
          <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
          <span>{quiz.totalQuestions} questions</span>
        </div>
        {quiz.attemptLimit && (
          <div className="flex items-start text-muted-foreground">
            <span>Attempts: {quiz.currentAttempts || 0}/{quiz.attemptLimit}</span>
          </div>
        )}
      </CardContent>
      <CardContent className="pt-0">
        <Button 
          variant={buttonVariant} 
          className="w-full"
          disabled={buttonDisabled}
          asChild
        >
          <Link href={`/dashboard/student/quizzes/${quiz.id}`}>
            <span>{buttonText}</span>
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Main component for class details
export function ClassDetails({ classData }: { classData: ClassDetailsType }) {
  useEffect(() => {
    // Debug log để kiểm tra dữ liệu
    console.log("ClassDetails - Received data:", classData);
    console.log("ClassDetails - Quizzes count:", classData.quizzes?.length || 0);
  }, [classData]);

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <>
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/student/classes">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>All classes</span>
          </Link>
        </Button>
      </div>
      
      {/* Class header with cover image */}
      <div className="relative mb-6 rounded-lg overflow-hidden">
        <div className={`h-48 w-full ${classData.coverImage ? 'bg-cover bg-center' : 'bg-gradient-to-r from-slate-100 to-slate-200'}`} 
          style={classData.coverImage ? { backgroundImage: `url(${classData.coverImage})` } : {}}>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="bg-white/20 text-white border-white/40">
              {classData.subject}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{classData.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="text-white/90">{classData.teacherName}</span>
            </div>
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="text-white/90">{classData.totalStudents} students</span>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="animate-fadeIn">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{classData.description}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start">
                    <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <span className="font-medium">Teacher:</span> {classData.teacherName}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <BookOpen className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <span className="font-medium">Subject:</span> {classData.subject}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <span className="font-medium">Joined:</span> {formatDate(classData.joinedDate)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Upcoming Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upcoming quizzes */}
                {classData.quizzes
                  .filter(quiz => quiz.status === "upcoming")
                  .slice(0, 3)
                  .map(quiz => (
                    <div key={quiz.id} className="flex items-start border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="rounded-full bg-slate-100 p-2 mr-3">
                        <FileText className="h-4 w-4 text-slate-600" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{quiz.title}</h4>
                        <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-x-3 gap-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
                            <span>{quiz.startDate ? formatDate(quiz.startDate) : "No date"}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                            <span>{quiz.durationMinutes} minutes</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="shrink-0 mt-0.5">
                        <Link href={`/dashboard/student/quizzes/${quiz.id}`}>
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  
                {/* New announcements */}
                {classData.announcements
                  .filter(ann => ann.isNew)
                  .map(announcement => (
                    <div key={announcement.id} className="flex items-start border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="rounded-full bg-blue-50 p-2 mr-3">
                        <MessageCircle className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="shrink-0 mt-0.5"
                        onClick={() => {
                          const tabsTrigger = document.querySelector('[data-state="inactive"][value="announcements"]') as HTMLButtonElement;
                          if (tabsTrigger) tabsTrigger.click();
                        }}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                  
                {classData.quizzes.filter(quiz => quiz.status === "upcoming").length === 0 && 
                 classData.announcements.filter(ann => ann.isNew).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <AlertCircle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No upcoming activities</h3>
                    <p className="text-sm text-muted-foreground">
                      There are currently no upcoming quizzes or new announcements.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Progress card on overview - new addition */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Class Summary</CardTitle>
                <CardDescription>Overview of activities in this class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Upcoming Quizzes</h4>
                    <div className="flex">
                      <div className="bg-slate-100 rounded-full h-16 w-16 flex items-center justify-center mr-4">
                        <span className="text-2xl font-bold">
                          {classData.quizzes.filter(q => q.status === "upcoming").length}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <Progress
                          value={
                            (classData.quizzes.filter(q => q.status === "upcoming").length / 
                            Math.max(classData.quizzes.length, 1)) * 100
                          }
                          className="h-2 w-24"
                          aria-label="Upcoming quizzes ratio"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {classData.quizzes.filter(q => q.status === "upcoming").length} / {classData.quizzes.length} quizzes
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Materials</h4>
                    <div className="flex">
                      <div className="bg-blue-50 rounded-full h-16 w-16 flex items-center justify-center mr-4">
                        <span className="text-2xl font-bold">
                          {classData.materials.length}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            <span className="text-xs text-muted-foreground">
                              {classData.materials.filter(m => m.type === "document").length} documents
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            <span className="text-xs text-muted-foreground">
                              {classData.materials.filter(m => m.type === "video" || m.type === "link").length} links
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Announcements</h4>
                    <div className="flex">
                      <div className="bg-emerald-50 rounded-full h-16 w-16 flex items-center justify-center mr-4">
                        <span className="text-2xl font-bold">
                          {classData.announcements.length}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-normal">
                            {classData.announcements.filter(a => a.isNew).length} new
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="quizzes" className="animate-fadeIn">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classData.quizzes.map((quiz, index) => (
              <ClassQuizCard 
                key={quiz.id} 
                quiz={quiz} 
                animationDelay={index * 0.05}
              />
            ))}
            
            {classData.quizzes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-secondary/50 p-4 mx-auto w-fit mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-medium mb-2">No quizzes found</h3>
                <div className="text-muted-foreground mt-1 max-w-md mx-auto mb-6">
                  This class does not have any quizzes yet.
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="materials" className="animate-fadeIn">
          <div className="grid gap-4 md:grid-cols-2">
            {classData.materials.map((material, index) => (
              <Card key={material.id} className="transition-all hover:shadow-md"
                style={{ 
                  opacity: 0,
                  animation: `fadeIn 0.5s ease-out ${index * 0.05}s forwards` 
                }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-md p-2 ${
                      material.type === 'document' ? 'bg-blue-50 text-blue-600' : 
                      material.type === 'video' ? 'bg-red-50 text-red-600' : 
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {material.type === 'document' ? (
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      ) : material.type === 'video' ? (
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <ExternalLink className="h-5 w-5" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{material.title}</CardTitle>
                      {material.description && (
                        <CardDescription className="mt-1">{material.description}</CardDescription>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Date posted: {formatDate(material.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild className="w-full mt-2" variant="outline">
                    <a href={material.url} target="_blank" rel="noopener noreferrer">
                      {material.type === 'document' ? 'Download' : 
                       material.type === 'video' ? 'Watch video' : 'Open link'}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {classData.materials.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-secondary/50 p-4 mx-auto w-fit mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-medium mb-2">No materials found</h3>
                <div className="text-muted-foreground mt-1 max-w-md mx-auto">
                  This class does not have any materials shared yet.
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="announcements" className="animate-fadeIn">
          <div className="space-y-4">
            {classData.announcements.map((announcement, index) => (
              <Card key={announcement.id} className="transition-all"
                style={{ 
                  opacity: 0,
                  animation: `fadeIn 0.5s ease-out ${index * 0.05}s forwards` 
                }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    {announcement.isNew && (
                      <Badge variant="secondary">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Date posted: {formatDate(announcement.createdAt)}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {classData.announcements.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-secondary/50 p-4 mx-auto w-fit mb-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-medium mb-2">No announcements found</h3>
                <div className="text-muted-foreground mt-1 max-w-md mx-auto">
                  This class does not have any announcements yet.
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
} 