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
  Search, 
  Filter, 
  Calendar, 
  User, 
  UserCheck, 
  ChevronRight,
  PlusCircle,
  School,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useClassApi } from "@/hooks/use-class-api";
import { ClassListResponse } from "@/types/api-types";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Subject options for filtering
const subjects = [
  { value: "all", label: "All subjects" },
  { value: "mathematics", label: "Mathematics" },
  { value: "literature", label: "Literature" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "computer-science", label: "Computer Science" },
  { value: "biology", label: "Biology" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "english", label: "English" },
];

// Sort options
const sortOptions = [
  { value: "recent", label: "Recently joined" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "activity", label: "New activity" },
];

// Join class form schema
const joinClassSchema = z.object({
  code: z.string()
    .min(6, "Class code must be at least 6 characters")
    .max(8, "Class code cannot exceed 8 characters")
    .regex(/^[A-Z0-9]+$/, "Class code must contain only uppercase letters and numbers"),
});

// Loading skeleton for class card
function ClassCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-4/5 mb-2" />
        <Skeleton className="h-4 w-3/5" />
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

// Class card component
function ClassCard({ 
  classData, 
  animationDelay = 0,
  isLoading = false 
}: { 
  classData: ClassListResponse; 
  animationDelay?: number;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <ClassCardSkeleton />;
  }

  const hasNewItems = classData.upcomingQuizCount > 0 || classData.recentAnnouncementCount > 0;
  const formattedDate = classData.joinedAt 
    ? new Date(classData.joinedAt).toLocaleDateString('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not joined';
  
  const isPublic = classData.type === 'PUBLIC';
  const badgeVariant = isPublic ? 'default' : 'secondary';
  const badgeClasses = isPublic 
    ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' 
    : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200';
    
  // Card border color based on type
  const cardClasses = `overflow-hidden transition-all hover:shadow-md border-2 ${
    isPublic 
      ? 'border-green-100 hover:border-green-200' 
      : 'border-amber-100 hover:border-amber-200'
  }`;
  
  return (
    <Card 
      className={cardClasses}
      style={{ 
        opacity: 0,
        animation: `fadeIn 0.5s ease-out ${animationDelay}s forwards` 
      }}
    >
      {classData.coverImage ? (
        <div className="relative h-40 w-full overflow-hidden">
          <Image 
            src={classData.coverImage}
            alt={`Cover image for ${classData.name}`}
            fill
            className="object-cover transition-all hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-2 right-2">
            <Badge variant={badgeVariant} className={badgeClasses}>
              {isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          {classData.isEnrolled && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="bg-slate-100/80 backdrop-blur-sm">
                Enrolled
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className={`h-40 w-full flex items-center justify-center relative 
          ${isPublic 
            ? 'bg-gradient-to-br from-green-50 to-green-100' 
            : 'bg-gradient-to-br from-amber-50 to-amber-100'
          }`}>
          <School className={`h-12 w-12 ${isPublic ? 'text-green-300' : 'text-amber-300'}`} aria-hidden="true" />
          <div className="absolute top-2 right-2">
            <Badge variant={badgeVariant} className={badgeClasses}>
              {isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          {classData.isEnrolled && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="bg-slate-100/80 backdrop-blur-sm">
                Enrolled
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardHeader className={`pt-4 pb-2 ${isPublic ? 'bg-green-50/50' : 'bg-amber-50/50'}`}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1 mb-1">{classData.name}</CardTitle>
            <CardDescription className="line-clamp-1 font-medium">
              {classData.subject || "No subject"}
            </CardDescription>
          </div>
          {hasNewItems && (
            <Badge variant="secondary" className="ml-2">
              {classData.upcomingQuizCount + classData.recentAnnouncementCount} new
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 space-y-2 text-sm">
        <div className="line-clamp-2 text-muted-foreground mb-1">
          {classData.description || "No description"}
        </div>
        
        <div className="flex items-start">
          <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
          <div className="font-medium">{classData.teacher.name || "Unknown teacher"}</div>
        </div>
        
        <div className="flex items-start">
          <UserCheck className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
          <span>{classData.studentsCount} students</span>
        </div>
        
        <div className="flex items-start">
          <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
          <span>Joined: {formattedDate}</span>
        </div>
        
        {(classData.upcomingQuizCount > 0 || classData.recentAnnouncementCount > 0) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {classData.upcomingQuizCount > 0 && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {classData.upcomingQuizCount} new {classData.upcomingQuizCount === 1 ? 'quiz' : 'quizzes'}
              </Badge>
            )}
            
            {classData.recentAnnouncementCount > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {classData.recentAnnouncementCount} new {classData.recentAnnouncementCount === 1 ? 'announcement' : 'announcements'}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className={isPublic ? 'bg-green-50/30' : 'bg-amber-50/30'}>
        {classData.isEnrolled ? (
          <Button asChild className="w-full">
            <Link href={`/dashboard/student/classes/${classData.id}`}>
              <span>View class</span>
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button 
            variant={isPublic ? "default" : "secondary"} 
            className="w-full"
          >
            <span>Join class</span>
            <PlusCircle className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Join class form component
function JoinClassForm({ onSuccess }: { onSuccess: () => void }) {
  const { joinClass, isLoading } = useClassApi();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof joinClassSchema>>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: {
      code: ""
    }
  });
  
  async function onSubmit(data: z.infer<typeof joinClassSchema>) {
    try {
      const success = await joinClass(data.code);
      
      if (success) {
        toast({
          title: "Success",
          description: "You have successfully joined the class",
          variant: "default",
        });
        form.reset();
        onSuccess();
      }
    } catch (error) {
      console.error("Error joining class:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter class code (e.g. ABCD1234)" 
                  {...field}
                  autoComplete="off"
                  className="uppercase"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Class"
              )}
            </Button>
          </DialogFooter>
        </div>
      </form>
    </Form>
  );
}

// Main classes list component
export function ClassesList() {
  // States for filtering and sorting
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showEnrolled, setShowEnrolled] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassListResponse | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const { classes, fetchClasses, isLoading, error, joinClass } = useClassApi();
  const { toast } = useToast();
  
  // Fetch classes on initial load
  useEffect(() => {
    fetchClasses({
      onlyJoined: showEnrolled,
      limit: 50
    });
  }, [fetchClasses, showEnrolled]);
  
  // Handle class join success
  const handleJoinSuccess = () => {
    setIsJoinDialogOpen(false);
    setSelectedClass(null);
    fetchClasses({
      onlyJoined: showEnrolled,
      limit: 50
    });
  };

  // Handle join class button click
  const handleJoinClick = (classItem: ClassListResponse) => {
    if (classItem.type === 'PRIVATE') {
      setSelectedClass(classItem);
      setIsJoinDialogOpen(true);
    } else {
      // For public classes, attempt to join directly
      joinPublicClass(classItem);
    }
  };

  // Join a public class directly
  const joinPublicClass = async (classItem: ClassListResponse) => {
    if (!classItem.code) {
      toast({
        title: "Error",
        description: "No class code available",
        variant: "destructive",
      });
      return;
    }
    
    const success = await joinClass(classItem.code);
    
    if (success) {
      toast({
        title: "Success",
        description: `You have successfully joined "${classItem.name}"`,
        variant: "default",
      });
      fetchClasses({
        onlyJoined: showEnrolled,
        limit: 50
      });
    }
  };
  
  // Apply filters and sorting to the classes
  const filteredClasses = classes.filter(classItem => {
    if (subject !== "all" && classItem.subject?.toLowerCase() !== subject.toLowerCase()) {
      return false;
    }
    
    if (search && !classItem.name.toLowerCase().includes(search.toLowerCase()) && 
        !classItem.description?.toLowerCase().includes(search.toLowerCase()) &&
        !classItem.teacher.name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort the filtered classes
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "activity":
        return (b.upcomingQuizCount + b.recentAnnouncementCount) - (a.upcomingQuizCount + a.recentAnnouncementCount);
      case "recent":
      default:
        return a.joinedAt && b.joinedAt 
          ? new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime() 
          : 0;
    }
  });
  
  // Show error toast if there is an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input 
              type="search" 
              placeholder="Search classes..." 
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search classes"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center space-x-2">
            <Button 
              variant={showEnrolled ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowEnrolled(true)}
            >
              My Classes
            </Button>
            <Button 
              variant={!showEnrolled ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowEnrolled(false)}
            >
              Explore
            </Button>
          </div>

          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by subject">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subjectOption => (
                <SelectItem key={subjectOption.value} value={subjectOption.value}>
                  {subjectOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]" aria-label="Sort classes">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Sheet>
            <SheetTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Advanced filters">
                      <Filter className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Advanced filters
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Advanced filters</SheetTitle>
                <SheetDescription>
                  Filter classes by various criteria
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Advanced filter options would go here */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Status</h4>
                  <div className="space-y-1">
                    {["All", "With new activity", "No activity"].map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input type="radio" id={`status-${index}`} name="status" className="mr-2" />
                        <label htmlFor={`status-${index}`} className="text-sm">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Join date</h4>
                  <div className="space-y-1">
                    {["All time", "This month", "Last 3 months"].map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input type="radio" id={`date-${index}`} name="date" className="mr-2" />
                        <label htmlFor={`date-${index}`} className="text-sm">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline">Reset</Button>
                <Button>Apply</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {isLoading && !classes.length ? (
        <ClassesListSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedClasses.length > 0 ? (
            <>
              {sortedClasses.map((classItem, index) => (
                <div key={classItem.id} onClick={!classItem.isEnrolled ? () => handleJoinClick(classItem) : undefined}>
                  <ClassCard 
                    classData={classItem} 
                    animationDelay={index * 0.05}
                  />
                </div>
              ))}
              
              {/* Class join card - only show in "My Classes" view */}
              {showEnrolled && (
                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Card 
                      className="overflow-hidden transition-all hover:shadow-md border-dashed border-2 cursor-pointer"
                      style={{ 
                        opacity: 0,
                        animation: `fadeIn 0.5s ease-out ${sortedClasses.length * 0.05}s forwards` 
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label="Join a new class"
                      onClick={() => setIsJoinDialogOpen(true)}
                    >
                      <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[250px]">
                        <div className="rounded-full bg-secondary/50 p-4 mb-4">
                          <PlusCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-medium text-center mb-2">Join a new class</h3>
                        <p className="text-sm text-muted-foreground text-center mb-6">
                          Enter the class code provided by your teacher to join a new class
                        </p>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join a class</DialogTitle>
                      <DialogDescription>
                        Enter the class code provided by your teacher to join a new class
                      </DialogDescription>
                    </DialogHeader>
                    <JoinClassForm onSuccess={handleJoinSuccess} />
                  </DialogContent>
                </Dialog>
              )}
            </>
          ) : (
            // Empty state when no classes match filters
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-secondary/50 p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-medium mb-2">No classes found</h3>
              <p className="text-muted-foreground max-w-md mb-8">
                {showEnrolled && classes.length === 0 
                  ? "You're not enrolled in any classes yet. Try joining a class to get started."
                  : "No classes match your current filters. Try changing the filters or joining a new class."}
              </p>
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsJoinDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Join a new class</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a class</DialogTitle>
                    <DialogDescription>
                      Enter the class code provided by your teacher to join a new class
                    </DialogDescription>
                  </DialogHeader>
                  <JoinClassForm onSuccess={handleJoinSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      )}
      
      {/* Dialog for joining private classes */}
      {selectedClass && (
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join {selectedClass.name}</DialogTitle>
              <DialogDescription>
                This is a private class. Enter the class code provided by your teacher to join.
              </DialogDescription>
            </DialogHeader>
            <JoinClassForm onSuccess={handleJoinSuccess} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Skeleton loader for the entire classes list
export function ClassesListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array(6).fill(0).map((_, index) => (
        <ClassCardSkeleton key={index} />
      ))}
    </div>
  );
} 