"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Download, 
  Search, 
  ArrowRight, 
  Info, 
  Calendar, 
  ArrowUpDown,
  ExternalLink 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface QuizResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string | null;
  className: string | null;
  score: number;
  totalQuestions: number;
  correctQuestions: number;
  completedAt: string;
  timeTakenMinutes: number | null;
  feedbackAvailable: boolean;
  category?: string; // subject
}

interface ResultsTableProps {
  results: QuizResult[];
  selectedTimeFrame?: string;
  selectedSubject?: string;
  isLoading?: boolean;
}

export default function ResultsTable({ 
  results = [],
  selectedTimeFrame,
  selectedSubject,
  isLoading = false
}: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'score' | 'title';
    direction: 'asc' | 'desc';
  }>({
    key: 'date',
    direction: 'desc'
  });
  const pageSize = 5;
  
  // Filter results based on search term and selected filters
  const filteredResults = results.filter(result => {
    // Text search
    const matchesSearch = !searchTerm || 
      result.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.className?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (result.category?.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Subject filter - already filtered on the server, but just in case
    const matchesSubject = !selectedSubject || 
      result.category?.toLowerCase() === selectedSubject.toLowerCase();
    
    return matchesSearch && matchesSubject;
  });
  
  // Sort results based on sort config
  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;
    
    if (sortConfig.key === 'date') {
      comparison = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    } else if (sortConfig.key === 'score') {
      comparison = a.score - b.score;
    } else if (sortConfig.key === 'title') {
      comparison = a.quizTitle.localeCompare(b.quizTitle);
    }
    
    return sortConfig.direction === 'desc' ? -comparison : comparison;
  });
  
  // Paginate results
  const totalPages = Math.ceil(sortedResults.length / pageSize);
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle sort change
  const handleSortChange = (key: 'date' | 'score' | 'title') => {
    // If we're already sorting by this key, toggle direction
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Otherwise, sort by this key, descending
      setSortConfig({
        key,
        direction: 'desc'
      });
    }
  };
  
  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd MMM yyyy");
    } catch (e) {
      return dateStr;
    }
  };
  
  // Helper to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-500";
    if (score >= 60) return "text-amber-600 dark:text-amber-500";
    return "text-red-600 dark:text-red-500";
  };
  
  return (
    <Card className={cn(isLoading && "opacity-70 pointer-events-none")}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Assessment History</CardTitle>
            <CardDescription>
              Details of your completed assessments
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 self-start"
                  aria-label="Export results as CSV"
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export your results as CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search 
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" 
              aria-hidden="true"
            />
            <Input 
              type="search" 
              placeholder="Search results..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search assessment results"
            />
          </div>
        </div>
        
        <div className="relative w-full overflow-auto">
          <table 
            className="w-full caption-bottom text-sm"
            aria-label="Assessment results table"
          >
            <thead>
              <tr className="border-b">
                <th 
                  scope="col"
                  className="h-12 px-4 text-left align-middle font-medium"
                >
                  <button 
                    onClick={() => handleSortChange('title')}
                    className="flex items-center gap-1 hover:text-primary"
                    aria-label="Sort by assessment name"
                >
                  Assessment Name
                    {sortConfig.key === 'title' && (
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </th>
                <th 
                  scope="col"
                  className="h-12 px-4 text-left align-middle font-medium"
                >
                  Subject
                </th>
                <th 
                  scope="col"
                  className="h-12 px-4 text-left align-middle font-medium"
                >
                  <button 
                    onClick={() => handleSortChange('date')}
                    className={cn(
                      "flex items-center gap-1 hover:text-primary",
                      sortConfig.key === 'date' && "text-primary"
                    )}
                    aria-label="Sort by date"
                >
                  Date
                    {sortConfig.key === 'date' && (
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </th>
                <th 
                  scope="col"
                  className="h-12 px-4 text-right align-middle font-medium"
                >
                  <button 
                    onClick={() => handleSortChange('score')}
                    className="flex items-center gap-1 hover:text-primary ml-auto"
                    aria-label="Sort by score"
                >
                  Score
                    {sortConfig.key === 'score' && (
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </th>
                <th 
                  scope="col"
                  className="h-12 px-4 text-right align-middle font-medium"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.length > 0 ? (
                paginatedResults.map((result) => (
                  <tr 
                    key={result.attemptId} 
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 align-middle font-medium">
                      <div className="flex items-center gap-2">
                        {result.quizTitle}
                        {result.quizDescription && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{result.quizDescription}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {result.className && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> {result.className}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {result.category ? (
                        <Badge 
                          variant="outline"
                          className={cn(
                            "transition-colors",
                            result.score >= 80 && "border-green-200 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
                            result.score >= 60 && result.score < 80 && "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
                            result.score < 60 && "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                          )}
                        >
                          {result.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      <time dateTime={result.completedAt}>
                        {formatDate(result.completedAt)}
                      </time>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <span 
                        className={cn(
                          "font-bold transition-colors",
                          getScoreColor(result.score)
                        )}
                        aria-label={`Score: ${result.score.toFixed(1)}%`}
                      >
                        {result.score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link 
                              href={`/dashboard/student/quizzes/results/${result.attemptId}`}
                              aria-label={`View details for ${result.quizTitle}`}
                            >
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 transition-colors"
                              >
                                Details <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View detailed results and feedback</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={5} 
                    className="h-24 text-center"
                    aria-label="No results found"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <Info className="h-8 w-8 text-muted-foreground opacity-40" />
                      <p className="text-muted-foreground font-medium">No results found</p>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm ? "Try adjusting your search term or filters" : "Complete assessments to see your results"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-between items-center pt-6">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 