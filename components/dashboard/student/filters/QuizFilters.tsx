'use client';

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  ChevronDown, 
  Calendar as CalendarIcon, 
  Search, 
  X, 
  Filter 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface ClassOption {
  id: string;
  name: string;
}

export function QuizFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [classId, setClassId] = useState(searchParams.get('classId') || 'all');
  const [subject, setSubject] = useState(searchParams.get('subject') || 'all');
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get('startDateFrom') ? new Date(searchParams.get('startDateFrom') as string) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get('endDateTo') ? new Date(searchParams.get('endDateTo') as string) : undefined
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'startDate');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'asc');
  
  // UI states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  
  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes?limit=100');
        const data = await response.json();
        
        if (data.success) {
          setClasses(data.data.items.map((c: any) => ({
            id: c.id,
            name: c.name
          })));
          
          // Extract unique subjects
          const uniqueSubjects = Array.from(
            new Set(data.data.items.map((c: any) => c.subject).filter(Boolean))
          );
          setSubjects(uniqueSubjects as string[]);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, []);
  
  // Update URL when filters change
  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'all') {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    // Reset to first page when filters change
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle date filter changes
  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type === 'start') {
      setStartDate(date);
      if (date) {
        params.set('startDateFrom', date.toISOString().split('T')[0]);
      } else {
        params.delete('startDateFrom');
      }
    } else {
      setEndDate(date);
      if (date) {
        params.set('endDateTo', date.toISOString().split('T')[0]);
      } else {
        params.delete('endDateTo');
      }
    }
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', search);
  };
  
  // Reset all filters
  const handleReset = () => {
    setSearch('');
    setStatus('all');
    setClassId('all');
    setSubject('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setSortBy('startDate');
    setSortOrder('asc');
    
    router.push(pathname);
  };
  
  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (status !== 'all') count++;
    if (classId !== 'all') count++;
    if (subject !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (sortBy !== 'startDate' || sortOrder !== 'asc') count++;
    return count;
  };
  
  const activeFiltersCount = getActiveFiltersCount();
  
  return (
    <div className="w-full space-y-4">
      {/* Search and filter buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form 
          onSubmit={handleSearch} 
          className="flex-1 relative"
        >
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-8"
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-0 top-0 h-full"
          >
            <Search size={18} />
            <span className="sr-only">Search</span>
          </Button>
        </form>
        
        {/* Mobile filter toggle */}
        <div className="flex sm:hidden">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <span className="flex items-center gap-2">
              <Filter size={16} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </span>
            <ChevronDown
              size={16}
              className={cn(
                "transition-transform",
                showMobileFilters && "rotate-180"
              )}
            />
          </Button>
        </div>
        
        {/* Desktop filter controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Status filter */}
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              handleFilterChange('status', value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* Class filter */}
          <Select
            value={classId}
            onValueChange={(value) => {
              setClassId(value);
              handleFilterChange('classId', value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* More filters button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-1">
                More Filters
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Subject</h4>
                  <Select
                    value={subject}
                    onValueChange={(value) => {
                      setSubject(value);
                      handleFilterChange('subject', value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Start Date</h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => handleDateChange('start', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">End Date</h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => handleDateChange('end', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Sort By</h4>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      setSortBy(value);
                      handleFilterChange('sortBy', value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startDate">Start Date</SelectItem>
                      <SelectItem value="endDate">End Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Order</h4>
                  <Select
                    value={sortOrder}
                    onValueChange={(value) => {
                      setSortOrder(value);
                      handleFilterChange('sortOrder', value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="ghost" 
                  className="mt-2"
                  onClick={handleReset}
                >
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Reset button, visible if filters are active */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              title="Reset filters"
            >
              <X size={16} />
              <span className="sr-only">Reset filters</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile filters (expandable) */}
      {showMobileFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 sm:hidden"
        >
          <div className="grid grid-cols-2 gap-2">
            {/* Status filter */}
            <div>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  handleFilterChange('status', value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            {/* Class filter */}
            <div>
              <Select
                value={classId}
                onValueChange={(value) => {
                  setClassId(value);
                  handleFilterChange('classId', value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Subject filter */}
          <Select
            value={subject}
            onValueChange={(value) => {
              setSubject(value);
              handleFilterChange('subject', value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Start date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleDateChange('start', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* End date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => handleDateChange('end', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Sort by filter */}
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value);
                handleFilterChange('sortBy', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="endDate">End Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort order filter */}
            <Select
              value={sortOrder}
              onValueChange={(value) => {
                setSortOrder(value);
                handleFilterChange('sortOrder', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Reset button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleReset}
          >
            Reset Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
} 