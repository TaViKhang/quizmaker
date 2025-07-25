"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface AttemptDetailProps {
  params: {
    id: string;
  };
}

export default function AttemptDetailPage({ params }: AttemptDetailProps) {
  const { id } = params;
  const router = useRouter();
  
  useEffect(() => {
    // Chuyển hướng người dùng đến trang kết quả chi tiết mới
    router.push(`/dashboard/student/quizzes/results/${id}`);
  }, [router, id]);
  
  return (
    <div className="container py-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-6 w-[350px]" />
      </div>
      <p className="mt-4 text-muted-foreground">Redirecting to new result view...</p>
    </div>
  );
} 