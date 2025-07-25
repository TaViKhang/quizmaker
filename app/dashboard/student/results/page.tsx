"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavigationCompatibilityWrapper } from "../../components/navigation-compatibility-wrapper";

export default function StudentResultsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Chuyển hướng người dùng đến trang kết quả mới
    router.push('/dashboard/student/quizzes/results');
  }, [router]);
  
  return (
    <NavigationCompatibilityWrapper redirectToNewRoutes={true}>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Redirecting to new results system...</h1>
        <p>Please wait while we redirect you to the new results view.</p>
      </div>
    </NavigationCompatibilityWrapper>
  );
} 