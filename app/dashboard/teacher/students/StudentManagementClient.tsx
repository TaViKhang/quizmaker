"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { 
  BarChart, 
  PieChart,
  Filter, 
  GraduationCap,
  LineChart,
  Pencil,
  Search, 
  UserCircle, 
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Define interfaces
interface ClassInfo {
  id: string;
  name: string;
  type: string;
  subject?: string;
  studentCount: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  image: string | null;
  classes: {
    id: string;
    name: string;
    joinedAt: string;
  }[];
  recentActivity: {
    quizId: string;
    quizTitle: string;
    classId: string | null;
    score: number | null;
    completedAt: string | null;
  }[];
  averageScore: number | null;
}

interface StudentManagementClientProps {
  totalStudents: number;
  classes: ClassInfo[];
  initialStudents?: Student[];
}

export function StudentManagementClient({ totalStudents, classes, initialStudents = [] }: StudentManagementClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoading, setIsLoading] = useState(initialStudents.length === 0);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(totalStudents);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const itemsPerPage = 10;
  
  // Load students data
  useEffect(() => {
    // Nếu đã có dữ liệu từ server và đang ở trang đầu tiên, không cần fetch
    if (initialStudents.length > 0 && currentPage === 1 && !searchTerm && !classFilter) {
      console.log("Using server-side data for students");
      setStudents(initialStudents);
      setFilteredStudents(initialStudents);
      setIsLoading(false);
      return;
    }
    
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setApiError(null);
        
        let url = '/api/teacher/students';
        const queryParams = new URLSearchParams();
        
        if (classFilter && classFilter !== "all") {
          queryParams.append('classId', classFilter);
        }
        
        if (searchTerm) {
          queryParams.append('search', searchTerm);
        }
        
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', itemsPerPage.toString());
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        
        console.log("Fetching students from:", url);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          
          // Hiển thị lỗi cho người dùng
          setApiError(`Không thể tải dữ liệu học sinh (${response.status})`);
          
          // Nếu có dữ liệu ban đầu và lỗi xảy ra ở trang sau, sử dụng dữ liệu ban đầu
          if (initialStudents.length > 0) {
            console.log("Falling back to initial students data");
            setStudents(initialStudents);
            setFilteredStudents(initialStudents);
            return;
          }
          
          throw new Error(`Failed to load students: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        
        // Đảm bảo dữ liệu trả về đúng định dạng
        if (!data || !Array.isArray(data.students)) {
          console.error("Unexpected API response format:", data);
          throw new Error("Invalid data format received from server");
        }
        
        setStudents(data.students);
        setFilteredStudents(data.students);
        
        // Đảm bảo pagination data tồn tại
        if (data.pagination && typeof data.pagination.total === 'number') {
          setTotalCount(data.pagination.total);
        } else {
          setTotalCount(data.students.length);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load students. Please try again.",
          variant: "destructive",
        });
        
        // Thiết lập dữ liệu trống để tránh lỗi
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [toast, classFilter, searchTerm, currentPage]);
  
  // Handle view student details
  const handleViewStudentDetails = async (studentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teacher/students/${studentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load student details");
      }
      
      const data = await response.json();
      setSelectedStudent(data);
      setIsStudentDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast({
        title: "Error",
        description: "Failed to load student details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search input debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      // The search is applied in the API call, not locally
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  const pageCount = Math.ceil(totalCount / itemsPerPage);
  
  if (isLoading && students.length === 0) {
    return <StudentManagementSkeleton />;
  }
  
  // Compute the average score across all students
  const classAverages = new Map<string, { sum: number; count: number }>();
  students.forEach(student => {
    if (student.averageScore !== null) {
      student.classes.forEach(cls => {
        if (!classAverages.has(cls.id)) {
          classAverages.set(cls.id, { sum: 0, count: 0 });
        }
        const data = classAverages.get(cls.id)!;
        data.sum += student.averageScore || 0;
        data.count++;
      });
    }
  });
  
  return (
    <div className="space-y-6">
      {/* Actions and filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when search changes
              }}
            />
          </div>
          <Select
            value={classFilter || "all"}
            onValueChange={(value) => {
              setClassFilter(value === "all" ? null : value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Hiển thị cảnh báo khi có lỗi API nhưng vẫn có dữ liệu */}
      {apiError && students.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-700">
                {apiError} - Đang hiển thị dữ liệu có sẵn, một số thông tin có thể không được cập nhật.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Student listing */}
      {students.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Student</TableHead>
                  <TableHead className="hidden md:table-cell">Classes</TableHead>
                  <TableHead className="hidden md:table-cell">Performance</TableHead>
                  <TableHead className="hidden md:table-cell">Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  // Get the most recent activity
                  const latestActivity = student.recentActivity && student.recentActivity.length > 0
                    ? student.recentActivity[0]
                    : null;
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={student.image || undefined} />
                            <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          {student.classes.slice(0, 2).map(cls => (
                            <Badge key={cls.id} variant="outline" className="justify-start">
                              {cls.name}
                            </Badge>
                          ))}
                          {student.classes.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{student.classes.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {student.averageScore !== null ? (
                            <>
                              <div className="flex items-center justify-between text-sm">
                                <span>Score:</span>
                                <span className="font-medium">{student.averageScore}%</span>
                              </div>
                              <Progress value={student.averageScore} className="h-2" />
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">No data</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {latestActivity ? (
                          <div>
                            <div className="text-sm">{latestActivity.quizTitle}</div>
                            {latestActivity.score !== null && (
                              <div className="text-sm font-medium">
                                Score: {latestActivity.score}%
                              </div>
                            )}
                            {latestActivity.completedAt && (
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(latestActivity.completedAt), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No recent activity</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/teacher/students/${student.id}`)}
                        >
                          <UserCircle className="mr-2 h-4 w-4" />
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pageCount > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  // Logic to show 5 pages around current page
                  let pageNumber;
                  if (pageCount <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= pageCount - 2) {
                    pageNumber = pageCount - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNumber);
                        }}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {pageCount > 5 && currentPage < pageCount - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageCount);
                        }}
                      >
                        {pageCount}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < pageCount) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={currentPage === pageCount ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <EmptyState
          title="No students found"
          description={searchTerm || classFilter ? "Try adjusting your search or filter." : "Students will appear here when they join your classes."}
          action={
            searchTerm || classFilter ? (
              <Button variant="outline" onClick={() => { setSearchTerm(""); setClassFilter(null); }}>
                Clear filters
              </Button>
            ) : (
              <Button variant="outline" onClick={() => router.push("/dashboard/teacher/classes")}>
                Manage Classes
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action: React.ReactNode;
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <GraduationCap className="h-20 w-20 text-muted-foreground opacity-50" />
        <p className="mt-4 text-center text-muted-foreground">{description}</p>
        <div className="mt-6">
          {action}
        </div>
      </CardContent>
    </Card>
  );
}

function StudentManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-6 w-full" />
          </div>
          
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-t">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
              <Skeleton className="h-10 w-[120px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}