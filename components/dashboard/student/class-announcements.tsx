"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useClassApi } from "@/hooks/use-class-api";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Search,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassAnnouncement } from "@/types/api-types";
import { format, formatDistance } from "date-fns";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Announcements skeleton loading component
function AnnouncementsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full sm:w-2/3" />
      
      <div className="space-y-6">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Skeleton className="h-10 w-64 mx-auto" />
    </div>
  );
}

// Announcement card component
function AnnouncementCard({ 
  announcement, 
  expanded, 
  onToggle 
}: { 
  announcement: ClassAnnouncement; 
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{announcement.title}</CardTitle>
            <CardDescription>
              Posted {formatDistance(new Date(announcement.createdAt), new Date(), { addSuffix: true })}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="ml-2"
            aria-label={expanded ? "Collapse announcement" : "Expand announcement"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={expanded ? "" : "line-clamp-3"}>
          <p className="whitespace-pre-line text-sm">{announcement.content}</p>
        </div>
        
        {!expanded && announcement.content.length > 150 && (
          <Button 
            variant="link" 
            size="sm" 
            className="mt-2 p-0 h-auto" 
            onClick={onToggle}
          >
            Read more
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Main class announcements component
export function ClassAnnouncements() {
  const params = useParams();
  const classId = params.classId as string;
  const { fetchClassAnnouncements, classAnnouncements, isLoading, error } = useClassApi();
  const { toast } = useToast();
  
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Record<string, boolean>>({});
  const limit = 5;
  
  // Fetch announcements on component mount and when filters change
  useEffect(() => {
    if (classId) {
      fetchClassAnnouncements(classId, {
        page,
        limit,
        search: search || undefined,
      });
    }
  }, [classId, fetchClassAnnouncements, page, search]);
  
  // Show error toast if there is an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading announcements",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Toggle announcement expanded state
  const toggleAnnouncement = (id: string) => {
    setExpandedAnnouncements(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  // Calculate total pages
  const totalPages = classAnnouncements ? Math.ceil(classAnnouncements.length / limit) : 0;
  
  return (
    <div className="space-y-6">
      {isLoading && !classAnnouncements ? (
        <AnnouncementsSkeleton />
      ) : (
        <>
          {/* Search form */}
          <form onSubmit={handleSearch} className="w-full sm:w-2/3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search announcements..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>
          
          {/* Announcements list */}
          <div className="space-y-6">
            {classAnnouncements && classAnnouncements.length > 0 ? (
              <>
                {classAnnouncements.map(announcement => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    expanded={!!expandedAnnouncements[announcement.id]}
                    onToggle={() => toggleAnnouncement(announcement.id)}
                  />
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => {
                            if (page > 1) {
                              setPage(p => p - 1);
                            }
                          }}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={() => setPage(p)}
                            isActive={page === p}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => {
                            if (page < totalPages) {
                              setPage(p => p + 1);
                            }
                          }}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mb-3 opacity-20" />
                {search ? (
                  <p>No announcements match your search criteria</p>
                ) : (
                  <p>No announcements have been posted for this class yet</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 