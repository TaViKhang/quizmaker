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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  BookOpen,
  Link as LinkIcon,
  ExternalLink,
  Download,
  Search,
  Filter,
  Loader2,
  File,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MaterialType } from "@prisma/client";
import { ClassMaterial } from "@/types/api-types";
import { format, formatDistance } from "date-fns";

// Material skeleton loading component
function MaterialsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Material icon component
function MaterialIcon({ type }: { type: MaterialType }) {
  switch (type) {
    case 'FILE':
      return <File className="h-4 w-4" />;
    case 'LINK':
      return <LinkIcon className="h-4 w-4" />;
    case 'VIDEO_EMBED':
      return <BookOpen className="h-4 w-4" />;
    case 'DOCUMENT':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

// Material type display component
function MaterialTypeDisplay({ type }: { type: MaterialType }) {
  let icon;
  let label;
  let bgColor;

  switch (type) {
    case 'FILE':
      icon = <File className="h-4 w-4" />;
      label = 'File';
      bgColor = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'LINK':
      icon = <LinkIcon className="h-4 w-4" />;
      label = 'Link';
      bgColor = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'VIDEO_EMBED':
      icon = <BookOpen className="h-4 w-4" />;
      label = 'Video';
      bgColor = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'DOCUMENT':
      icon = <FileText className="h-4 w-4" />;
      label = 'Document';
      bgColor = 'bg-green-50 text-green-700 border-green-200';
      break;
    default:
      icon = <FileText className="h-4 w-4" />;
      label = 'Unknown';
      bgColor = 'bg-gray-50 text-gray-700 border-gray-200';
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${bgColor}`}>
      {icon}
      <span className="ml-1">{label}</span>
    </div>
  );
}

// Main class materials component
export function ClassMaterials() {
  const params = useParams();
  const classId = params.classId as string;
  const { fetchClassMaterials, classMaterials, isLoading, error } = useClassApi();
  const { toast } = useToast();
  
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [materialType, setMaterialType] = useState<string | null>(null);
  const limit = 10;
  
  // Fetch materials on component mount and when filters change
  useEffect(() => {
    if (classId) {
      fetchClassMaterials(classId, {
        page,
        limit,
        search: search || undefined,
        type: materialType || undefined,
      });
    }
  }, [classId, fetchClassMaterials, page, search, materialType]);
  
  // Show error toast if there is an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading materials",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Handle material file/link open
  const handleOpenMaterial = (material: ClassMaterial) => {
    if (material.url) {
      window.open(material.url, '_blank');
    } else if (material.downloadUrl) {
      window.open(material.downloadUrl, '_blank');
    }
  };
  
  // Calculate total pages
  const totalPages = classMaterials ? Math.ceil(classMaterials.length / limit) : 0;
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  return (
    <div className="space-y-6">
      {isLoading && !classMaterials ? (
        <MaterialsSkeleton />
      ) : (
        <>
          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search materials..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>
            
            <Select value={materialType || ""} onValueChange={(value) => {
              setMaterialType(value || null);
              setPage(1); // Reset to first page on filter change
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="FILE">Files</SelectItem>
                <SelectItem value="LINK">Links</SelectItem>
                <SelectItem value="VIDEO_EMBED">Videos</SelectItem>
                <SelectItem value="DOCUMENT">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Materials list */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Materials</CardTitle>
              <CardDescription>
                Study materials and resources for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classMaterials && classMaterials.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.title}</TableCell>
                          <TableCell>
                            <MaterialTypeDisplay type={material.type} />
                          </TableCell>
                          <TableCell>{material.fileSizeFormatted || "—"}</TableCell>
                          <TableCell>
                            {format(new Date(material.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMaterial(material)}
                            >
                              {material.url ? (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => {
                                if (page > 1) {
                                  setPage(p => p - 1);
                                }
                              }}
                              aria-disabled={page === 1}
                              tabIndex={page === 1 ? -1 : undefined}
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
                              aria-disabled={page === totalPages}
                              tabIndex={page === totalPages ? -1 : undefined}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-20" />
                  {search || materialType ? (
                    <p>No materials match your search criteria</p>
                  ) : (
                    <p>No learning materials available for this class yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 