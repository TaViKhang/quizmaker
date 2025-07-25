"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertCircle, 
  BookOpen,
  Calendar,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  FileText,
  Loader2, 
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users
} from "lucide-react";

interface Class {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  coverImage: string | null;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  quizCount: number;
}

/**
 * Client component for the Classes page
 * Displays a list of the teacher's classes and allows creation/management
 */
interface ClassesClientProps {
  initialClasses?: Class[];
}

export function ClassesClient({ initialClasses = [] }: ClassesClientProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [isLoading, setIsLoading] = useState(initialClasses.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  
  // Load classes data nếu không có initialClasses hoặc khi refresh
  useEffect(() => {
    if (initialClasses.length > 0) {
      setClasses(initialClasses);
      setIsLoading(false);
      return;
    }
    
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/teacher/classes");
        
        if (!response.ok) {
          throw new Error("Failed to load classes");
        }
        
        const data = await response.json();
        setClasses(data.classes);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClasses();
  }, [toast]);
  
  // Filter classes based on search query and active filter
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = 
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.subject && cls.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "active") return matchesSearch && cls.isActive;
    if (activeFilter === "inactive") return matchesSearch && !cls.isActive;
    
    return matchesSearch;
  });
  
  const handleCreateClass = () => {
    router.push("/dashboard/teacher/classes/create");
  };
  
  const handleCopyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Class code copied",
      description: "The class code has been copied to your clipboard.",
      duration: 3000,
    });
  };
  
  // Loading state
  if (isLoading) {
    return <ClassesSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search classes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs 
            value={activeFilter} 
            onValueChange={(value) => setActiveFilter(value as "all" | "active" | "inactive")}
            className="w-[320px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button onClick={handleCreateClass}>
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        </div>
      </div>
      
      {/* Classes grid */}
      {filteredClasses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <ClassCard 
              key={cls.id} 
              classData={cls}
              onCopyCode={handleCopyClassCode}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreateClass={handleCreateClass} />
      )}
    </div>
  );
}

interface ClassCardProps {
  classData: Class;
  onCopyCode: (code: string) => void;
}

function ClassCard({ classData, onCopyCode }: ClassCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const handleViewDetails = () => {
    router.push(`/dashboard/teacher/classes/${classData.id}`);
  };
  
  const handleEditClass = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/teacher/classes/${classData.id}/edit`);
  };
  
  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-md cursor-pointer" 
      onClick={handleViewDetails}
    >
      {/* Cover image or color header */}
      <div 
        className="h-24 bg-gradient-to-r from-primary to-primary/70 relative"
        style={classData.coverImage ? { backgroundImage: `url(${classData.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {!classData.isActive && (
          <Badge variant="secondary" className="absolute top-2 right-2 bg-background/80">
            Inactive
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute top-2 right-2 bg-background/50 hover:bg-background/80"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleViewDetails}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditClass}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Class
            </DropdownMenuItem>
            {classData.code && (
              <DropdownMenuItem onClick={() => onCopyCode(classData.code!)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Class Code
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => e.stopPropagation()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Class
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <CardHeader>
        <CardTitle className="line-clamp-1">{classData.name}</CardTitle>
        <CardDescription className="line-clamp-1">
          {classData.subject || "No subject"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-sm text-muted-foreground line-clamp-2 h-10">
          {classData.description || "No description"}
        </div>
        
        <div className="mt-4 flex justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            <span>{classData.studentCount} students</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <FileText className="mr-1 h-4 w-4" />
            <span>{classData.quizCount} quizzes</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/30 px-6 py-3">
        <div className="flex w-full justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handleViewDetails}>
            View
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          
          {classData.code && (
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-1">Code:</span>
              <code className="rounded bg-muted px-1 py-0.5">{classData.code}</code>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ onCreateClass }: { onCreateClass: () => void }) {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="mt-2">No Classes Yet</CardTitle>
        <CardDescription>Create your first class to get started.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pb-6">
        <Button className="mt-2" onClick={onCreateClass}>
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Class
        </Button>
      </CardContent>
    </Card>
  );
}

function ClassesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and filters skeleton */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <Skeleton className="h-10 w-full md:w-96" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[320px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </div>
      
      {/* Classes grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-24 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 