import { Role } from "@prisma/client";
import { ClipboardCheck } from "lucide-react";
import { DashboardNavItem } from "./constants";

/**
 * Navigation adapter để thêm routes mới mà không ảnh hưởng đến hệ thống cũ
 * Dùng adapter pattern để ánh xạ các routes mới vào hệ thống navigation hiện tại
 */

// Map between old routes và new routes
const ROUTE_MAPPINGS = {
  // Student routes
  studentResults: {
    oldRoute: "/dashboard/student/results",
    newRoutePattern: "/dashboard/student/quizzes/results/",
  },
  // Teacher routes
  teacherResults: {
    oldRoute: "/dashboard/teacher/results", 
    newRoutePattern: "/dashboard/teacher/grading",
  }
};

/**
 * Function kiểm tra xem một route hiện tại có tương ứng với 
 * route mới nào không để hiển thị active state
 */
export function isActiveRoute(currentPath: string, navItemPath: string): boolean {
  // Kiểm tra exact match
  if (currentPath === navItemPath) return true;
  
  // Kiểm tra mapping
  for (const key in ROUTE_MAPPINGS) {
    const mapping = ROUTE_MAPPINGS[key as keyof typeof ROUTE_MAPPINGS];
    
    // Nếu đang ở route mới nhưng menu item là route cũ
    if (
      currentPath.startsWith(mapping.newRoutePattern) && 
      navItemPath === mapping.oldRoute
    ) {
      return true;
    }
    
    // Nếu đang ở route cũ nhưng menu item là route mới
    if (
      currentPath === mapping.oldRoute && 
      navItemPath.startsWith(mapping.newRoutePattern)
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Function để lấy nav items bổ sung cho các tính năng mới
 * mà không cần sửa đổi DASHBOARD_NAV_LINKS
 */
export function getAdditionalNavItems(): DashboardNavItem[] {
  return [
    {
      title: "Grading",
      href: "/dashboard/teacher/grading",
      icon: ClipboardCheck,
      roles: [Role.TEACHER],
      hideInTopNav: true, // Ẩn trên top nav, giữ chỉ trong sidebar
    },
  ];
}

/**
 * Function để lấy breadcrumb title cho các route mới
 */
export function getExtendedPathMap(): Record<string, string> {
  return {
    // Existing paths stay the same
    "dashboard": "Dashboard",
    "teacher": "Teacher",
    "student": "Student",
    "quizzes": "Quizzes",
    "results": "Results",
    "exams": "Exams",
    
    // New paths
    "grading": "Grading",
    "attempt": "Quiz Attempt",
  };
}

/**
 * Function ánh xạ từ route cũ sang route mới (cho navigation)
 */
export function mapToNewRoute(oldRoute: string): string {
  for (const key in ROUTE_MAPPINGS) {
    const mapping = ROUTE_MAPPINGS[key as keyof typeof ROUTE_MAPPINGS];
    if (oldRoute === mapping.oldRoute) {
      return mapping.newRoutePattern;
    }
  }
  return oldRoute; // Nếu không có mapping thì giữ nguyên
}

/**
 * Function ánh xạ từ route mới sang route cũ (cho breadcrumbs)
 */
export function mapToOldRoute(newRoute: string): string {
  for (const key in ROUTE_MAPPINGS) {
    const mapping = ROUTE_MAPPINGS[key as keyof typeof ROUTE_MAPPINGS];
    if (newRoute.startsWith(mapping.newRoutePattern)) {
      return mapping.oldRoute;
    }
  }
  return newRoute; // Nếu không có mapping thì giữ nguyên
} 