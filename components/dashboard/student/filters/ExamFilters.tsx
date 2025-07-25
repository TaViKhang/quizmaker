"use client";

import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function ExamFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Lấy các giá trị từ URL search params hoặc dùng giá trị mặc định
  const [filters, setFilters] = useState({
    subject: searchParams.get('subject') || 'all',
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
  });

  // Hàm để cập nhật URL search params
  const updateSearchParams = useCallback((name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'all' && value.trim() !== '') {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    // Cập nhật URL mà không làm trang reload
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    updateSearchParams(name, value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Tìm kiếm bài kiểm tra..." 
          className="pl-9"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <Select 
          defaultValue={filters.subject} 
          value={filters.subject}
          onValueChange={(value) => handleFilterChange('subject', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Môn học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả môn</SelectItem>
            <SelectItem value="math">Toán học</SelectItem>
            <SelectItem value="physics">Vật lý</SelectItem>
            <SelectItem value="chemistry">Hóa học</SelectItem>
            <SelectItem value="biology">Sinh học</SelectItem>
            <SelectItem value="literature">Ngữ văn</SelectItem>
            <SelectItem value="english">Tiếng Anh</SelectItem>
            <SelectItem value="history">Lịch sử</SelectItem>
            <SelectItem value="geography">Địa lý</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          defaultValue={filters.status}
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
            <SelectItem value="ongoing">Đang diễn ra</SelectItem>
            <SelectItem value="completed">Đã hoàn thành</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => {
            // Reset tất cả bộ lọc
            setFilters({
              subject: 'all',
              status: 'all',
              search: '',
            });
            router.push('', { scroll: false });
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 