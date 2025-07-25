"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  BookOpen, 
  Calendar, 
  User, 
  UserCheck, 
  ChevronRight,
  PlusCircle,
  School,
  AlertCircle,
  Loader
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
import { ClassType } from "../types/types";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { debounce } from "lodash";

// Interface for API response data
interface ApiClassData {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: 'PUBLIC' | 'PRIVATE';
  coverImage: string | null;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
  studentsCount: number;
  quizzesCount: number;
  announcementsCount: number;
  materialsCount: number;
  upcomingQuizCount: number;
  recentAnnouncementCount: number;
  isEnrolled: boolean;
  joinedAt?: string;
  [key: string]: any; // For any other properties
}

const subjects = [
  { value: "all", label: "All Subjects" },
  { value: "mathematics", label: "Mathematics" },
  { value: "literature", label: "Literature" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "computer-science", label: "Computer Science" },
];

const sortOptions = [
  { value: "updatedAt:desc", label: "Recently Updated" },
  { value: "createdAt:desc", label: "Recently Joined" },
  { value: "name:asc", label: "Name A-Z" },
  { value: "name:desc", label: "Name Z-A" },
];

export function ClassesPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Extract current URL parameters
  const currentSearch = searchParams.get("search") || "";
  const currentSubject = searchParams.get("subject") || "all";
  const currentSort = searchParams.get("sort") || "updatedAt:desc";
  const currentPage = Number(searchParams.get("page") || "1");
  
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClasses, setTotalClasses] = useState(0);
  
  // Update URL with search parameters
  const updateSearchParams = useCallback((newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove each parameter
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    // Always reset to page 1 when filters change (unless page is explicitly set)
    if (!newParams.hasOwnProperty('page')) {
      params.set('page', '1');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);
  
  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      updateSearchParams({ search: value || null });
    }, 300),
    [updateSearchParams]
  );
  
  // Handle input change for search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };
  
  // Handle subject filter change
  const handleSubjectChange = (value: string) => {
    updateSearchParams({ 
      subject: value === "all" ? null : value 
    });
  };
  
  // Handle sort option change
  const handleSortChange = (value: string) => {
    updateSearchParams({ sort: value });
  };
  
  // Handle pagination
  const handlePageChange = (pageNumber: number) => {
    updateSearchParams({ page: pageNumber.toString() });
  };
  
  // Fetch classes based on URL parameters
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams();
        
        // Always filter to only joined classes for student
        params.set("onlyJoined", "true");
        
        // Add search parameter if exists
        if (currentSearch) {
          params.set("search", currentSearch);
        }
        
        // Add subject filter if not "all"
        if (currentSubject && currentSubject !== "all") {
          params.set("subject", currentSubject);
        }
        
        // Add pagination
        params.set("page", currentPage.toString());
        params.set("limit", "9"); // Show 9 classes per page (3x3 grid)
        
        // Add sorting
        if (currentSort) {
          const [sortBy, sortOrder] = currentSort.split(":");
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
        }
        
        // Fetch classes with filters
        const response = await fetch(`/api/classes?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const data = await response.json();
          console.error('API Error Response:', data);
          throw new Error(data.error?.message || data.message || 'Failed to fetch classes');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Debug data received from API
          console.log('Classes data from API:', data.data);
          
          // Map API data to ClassType format if needed
          const mappedClasses = (data.data.items || []).map((apiClass: ApiClassData) => {
            return {
              ...apiClass,
              // Add mapped fields
              teacherName: apiClass.teacher?.name || null,
              totalStudents: apiClass.studentsCount,
              newQuizCount: apiClass.upcomingQuizCount || 0,
              newAnnouncementCount: apiClass.recentAnnouncementCount || 0,
              joinedDate: apiClass.joinedAt,
              quizCount: apiClass.quizzesCount || 0
            };
          });
          
          setClasses(mappedClasses);
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalClasses(data.data.pagination.total || 0);
        } else {
          console.error('API Success=false Response:', data);
          throw new Error(data.error?.message || 'Failed to fetch classes');
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError((err as Error).message);
        toast({
          title: "Error",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, [currentSearch, currentSubject, currentSort, currentPage, toast]);
  
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a class code",
        variant: "destructive",
      });
      return;
    }
    
    setIsJoining(true);
    
    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: classCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to join class');
      }
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Successfully joined the class",
        });
        
        // Refresh the current page
        router.refresh();
        
        // Clear class code
        setClassCode("");
      } else {
        throw new Error(data.error?.message || 'Failed to join class');
      }
    } catch (err) {
      console.error('Error joining class:', err);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
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
              defaultValue={currentSearch}
              onChange={handleSearchChange}
              aria-label="Search classes"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={currentSubject} onValueChange={handleSubjectChange}>
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
          
          <Select value={currentSort} onValueChange={handleSortChange}>
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
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  Filter classes by various criteria
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Status</h4>
                  <div className="space-y-1">
                    {["All", "With new activity", "No new activity"].map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input type="radio" id={`status-${index}`} name="status" className="mr-2" />
                        <label htmlFor={`status-${index}`} className="text-sm">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Join Date</h4>
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
                <Button variant="outline" onClick={() => updateSearchParams({
                  search: null,
                  subject: null,
                  sort: "updatedAt:desc",
                  page: "1"
                })}>
                  Reset All
                </Button>
                <Button onClick={() => router.push(pathname)}>Apply</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Showing results summary */}
      {!isLoading && !error && (
        <div className="text-sm text-muted-foreground">
          {totalClasses > 0 ? (
            <p>
              Showing {classes.length} of {totalClasses} class{totalClasses !== 1 ? 'es' : ''}
              {currentSearch && ` matching "${currentSearch}"`}
              {currentSubject !== 'all' && ` in ${subjects.find(s => s.value === currentSubject)?.label || currentSubject}`}
            </p>
          ) : (
            <p>No classes found{currentSearch && ` matching "${currentSearch}"`}</p>
          )}
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, index) => (
              <ClassCardSkeleton key={index} />
            ))}
          </>
        ) : error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-medium mb-2">Error loading classes</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              {error}
            </p>
            <Button onClick={() => router.refresh()}>
              Try Again
            </Button>
          </div>
        ) : classes.length > 0 ? (
          <>
            {classes.map((classItem, index) => (
              <ClassCard 
                key={classItem.id} 
                classData={classItem} 
                animationDelay={index * 0.05}
                isLoading={isLoading}
              />
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <Card 
                  className="overflow-hidden transition-all hover:shadow-md border-dashed border-2 cursor-pointer"
                  style={{ 
                    opacity: 0,
                    animation: `fadeIn 0.5s ease-out ${classes.length * 0.05}s forwards` 
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Join new class"
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[250px]">
                    <div className="rounded-full bg-secondary/50 p-4 mb-4">
                      <PlusCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-medium text-center mb-2">Join New Class</h3>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                      Enter the class code provided by your teacher to join a new class
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Class</DialogTitle>
                  <DialogDescription>
                    Enter the class code provided by your teacher to join a new class
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="classCode" className="text-sm font-medium">
                      Class Code
                    </label>
                    <Input 
                      id="classCode" 
                      placeholder="Enter class code (e.g. ABCD1234)" 
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isJoining || !classCode.trim()} 
                    onClick={handleJoinClass}
                  >
                    {isJoining ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : "Join"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-secondary/50 p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-medium mb-2">No classes found</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              No classes match your current filters. Try changing your filters or join a new class.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span>Join New Class</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Class</DialogTitle>
                  <DialogDescription>
                    Enter the class code provided by your teacher to join a new class
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="classCode" className="text-sm font-medium">
                      Class Code
                    </label>
                    <Input 
                      id="classCode" 
                      placeholder="Enter class code (e.g. ABCD1234)" 
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isJoining || !classCode.trim()} 
                    onClick={handleJoinClass}
                  >
                    {isJoining ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : "Join"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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

function ClassCard({ 
  classData, 
  animationDelay = 0,
  isLoading = false 
}: { 
  classData: ClassType; 
  animationDelay?: number;
  isLoading?: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  if (isLoading) {
    return <ClassCardSkeleton />;
  }

  const hasNewItems = (classData.newQuizCount || 0) > 0 || (classData.newAnnouncementCount || 0) > 0;
  
  // Format date properly with error handling
  const formattedDate = (() => {
    try {
      // Check for both joinedDate and joinedAt fields
      const dateValue = classData.joinedDate || classData.joinedAt;
      if (!dateValue) return "Unknown date";
      
      return new Date(dateValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  })();

  // Handle student leaving a class
  const handleLeaveClass = async () => {
    setIsLeaving(true);
    
    try {
      const response = await fetch(`/api/classes/${classData.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave class');
      }
      
      toast({
        title: "Success",
        description: data.message || "Successfully left the class",
      });
      
      // Refresh the page to update the class list
      router.refresh();
    } catch (err) {
      console.error('Error leaving class:', err);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
      setShowConfirmLeave(false);
    }
  };
  
  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-md group relative"
      style={{ 
        opacity: 0,
        animation: `fadeIn 0.5s ease-out ${animationDelay}s forwards` 
      }}
    >
      {/* Class type badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge variant={classData.type === "PUBLIC" ? "secondary" : "outline"} className="opacity-80">
          {classData.type === "PUBLIC" ? "Public" : "Private"}
        </Badge>
      </div>
      
      {classData.coverImage ? (
        <div className="relative h-40 w-full overflow-hidden">
          <Image 
            src={classData.coverImage}
            alt={`Cover image for ${classData.name}`}
            fill
            className="object-cover transition-all group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <School className="h-12 w-12 text-slate-400" aria-hidden="true" />
        </div>
      )}
      
      <CardHeader className="pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1 mb-1">{classData.name}</CardTitle>
            <CardDescription className="line-clamp-1 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> 
              {classData.subject || "No subject"}
            </CardDescription>
          </div>
          {hasNewItems && (
            <Badge variant="default" className="ml-2 bg-green-500 hover:bg-green-600">
              {(classData.newQuizCount || 0) + (classData.newAnnouncementCount || 0)} new
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 space-y-2 text-sm">
        <div className="line-clamp-2 text-muted-foreground mb-1">
          {classData.description || "No description provided"}
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="flex items-start">
            <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <span className="line-clamp-1">
              {classData.teacherName || 
               (classData.teacher && classData.teacher.name) || 
               "Unknown teacher"}
            </span>
          </div>
          <div className="flex items-start">
            <UserCheck className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <span>{classData.totalStudents || classData.studentsCount || 0} students</span>
          </div>
          <div className="flex items-start col-span-2">
            <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <span>Joined: {formattedDate}</span>
          </div>
        </div>

        {/* Activity indicators */}
        <div className="flex flex-wrap gap-1 mt-2">
          {((classData.newQuizCount || classData.upcomingQuizCount) || 0) > 0 && (
            <div className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
              {classData.newQuizCount || classData.upcomingQuizCount} new {(classData.newQuizCount || classData.upcomingQuizCount) === 1 ? 'quiz' : 'quizzes'}
            </div>
          )}
          {((classData.newAnnouncementCount || classData.recentAnnouncementCount) || 0) > 0 && (
            <div className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded-full">
              {classData.newAnnouncementCount || classData.recentAnnouncementCount} new {(classData.newAnnouncementCount || classData.recentAnnouncementCount) === 1 ? 'announcement' : 'announcements'}
            </div>
          )}
          {(typeof classData.quizCount === 'number' || typeof classData.quizzesCount === 'number') && (classData.quizCount || classData.quizzesCount || 0) > 0 && (
            <div className="text-purple-600 font-medium text-xs bg-purple-50 px-2 py-0.5 rounded-full">
              {classData.quizCount || classData.quizzesCount} {(classData.quizCount || classData.quizzesCount) === 1 ? 'quiz' : 'quizzes'}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full" asChild>
          <Link href={`/dashboard/student/classes/${classData.id}`}>
            View Class <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Link>
        </Button>
        
        <Dialog open={showConfirmLeave} onOpenChange={setShowConfirmLeave}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              Leave Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Class</DialogTitle>
              <DialogDescription>
                Are you sure you want to leave this class? You will lose access to all class materials and quizzes.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/30 p-3 rounded-md my-2">
              <p className="font-medium">{classData.name}</p>
              <p className="text-sm text-muted-foreground">{classData.subject}</p>
              <p className="text-xs mt-1 text-muted-foreground">Teacher: {classData.teacherName}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmLeave(false)} disabled={isLeaving}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleLeaveClass}
                disabled={isLeaving}
              >
                {isLeaving ? 
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Leaving...
                  </> : 
                  'Leave Class'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
} 