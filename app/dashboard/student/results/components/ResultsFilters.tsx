"use client";

import { useRouter, usePathname } from "next/navigation";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultsFiltersProps {
  timeFrame: string;
  subjects: string[];
  currentSubject?: string;
}

export default function ResultsFilters({
  timeFrame = "last30days",
  subjects = [],
  currentSubject
}: ResultsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine if we have any active filters
  const hasActiveFilters = !!currentSubject || timeFrame !== "last30days";
  
  // Handler for time frame filter changes
  const handleTimeFrameChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("timeFrame", value);
    
    // Keep existing subject filter if present
    if (currentSubject) {
      params.set("subject", currentSubject);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handler for subject filter changes
  const handleSubjectChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    
    if (value === "all") {
      params.delete("subject");
    } else {
      params.set("subject", value);
    }
    
    // Keep existing time frame filter
    if (timeFrame) {
      params.set("timeFrame", timeFrame);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Handler to reset all filters
  const handleResetFilters = () => {
    // Navigate to page with default filters (just last30days)
    router.push(`${pathname}?timeFrame=last30days`);
  };
  
  // Unique subject list for filtering
  const uniqueSubjects = Array.from(new Set(subjects)).sort();
  
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Period:</span>
          <Select 
            value={timeFrame} 
            onValueChange={handleTimeFrameChange}
          >
            <SelectTrigger className="w-32 sm:w-40 h-9">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last90days">Last 90 days</SelectItem>
              <SelectItem value="last6months">Last 6 months</SelectItem>
              <SelectItem value="lastYear">Last year</SelectItem>
              <SelectItem value="allTime">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Subject:</span>
            <Select 
              value={currentSubject || "all"} 
              onValueChange={handleSubjectChange}
            >
              <SelectTrigger className="w-32 sm:w-40 h-9">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {uniqueSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleResetFilters}
          className={cn(
            "h-9 px-3 gap-1.5", 
            currentSubject && "border-primary/40 hover:border-primary"
          )}
        >
          <X className="h-3.5 w-3.5" />
          Reset filters
        </Button>
      )}
    </div>
  );
} 