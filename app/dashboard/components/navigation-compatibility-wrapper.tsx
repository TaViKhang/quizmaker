"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { mapToOldRoute, mapToNewRoute } from "@/lib/navigation-adapter";

interface NavigationCompatibilityWrapperProps {
  children: ReactNode;
  /**
   * Nếu true, sẽ tự động chuyển hướng từ route cũ sang route mới
   * Ví dụ: nếu user truy cập "/dashboard/teacher/results"
   * họ sẽ được chuyển hướng đến "/dashboard/teacher/grading"
   */
  redirectToNewRoutes?: boolean;
  /**
   * Nếu true, sẽ tự động chuyển hướng từ route mới sang route cũ
   * Chỉ dùng trong trường hợp đặc biệt khi cần rollback
   */
  redirectToOldRoutes?: boolean;
}

/**
 * Component wrapper để đảm bảo tính tương thích giữa route cũ và mới
 * Sử dụng cho các trang cần điều hướng tự động hoặc tích hợp với hệ thống cũ
 */
export function NavigationCompatibilityWrapper({
  children,
  redirectToNewRoutes = false,
  redirectToOldRoutes = false,
}: NavigationCompatibilityWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    // Điều hướng từ route cũ sang route mới nếu cần
    if (redirectToNewRoutes) {
      const newRoute = mapToNewRoute(pathname);
      if (newRoute !== pathname) {
        router.replace(newRoute);
      }
    }
    
    // Điều hướng từ route mới sang route cũ nếu cần (rollback)
    if (redirectToOldRoutes) {
      const oldRoute = mapToOldRoute(pathname);
      if (oldRoute !== pathname) {
        router.replace(oldRoute);
      }
    }
  }, [pathname, router, redirectToNewRoutes, redirectToOldRoutes]);
  
  return <>{children}</>;
} 