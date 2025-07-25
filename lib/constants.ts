import { LucideIcon } from "lucide-react";
import { Role } from "@prisma/client";
import {
  BarChart,
  BookOpen,
  ClipboardCheck,
  FileText,
  Home,
  ListChecks,
  Settings,
  Users,
  LineChart,
  Plus,
  PlusCircle,
  Eye,
  School,
} from "lucide-react";

/**
 * Role definitions in the system
 */
export const ROLES = {
  TEACHER: "TEACHER",
  STUDENT: "STUDENT"
} as const;

/**
 * Type definition for Role
 */
export type RoleType = typeof ROLES[keyof typeof ROLES] | null;

/**
 * Interface for navigation items in dashboard
 */
export interface DashboardNavItem {
  /**
   * Display title
   */
  title: string;
  /**
   * Route path
   */
  href: string;
  /**
   * Icon component
   */
  icon: LucideIcon;
  /**
   * Roles that can access this item
   */
  roles: Role[];
  /**
   * Whether to hide this item in the top navigation
   * @default false
   */
  hideInTopNav?: boolean;
}

/**
 * Dashboard navigation links
 */
export const DASHBOARD_NAV_LINKS: DashboardNavItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
    roles: [Role.TEACHER, Role.STUDENT],
    hideInTopNav: false,
  },
  // TEACHER links
  {
    title: "Create Class",
    href: "/dashboard/teacher/classes/create",
    icon: PlusCircle,
    roles: [Role.TEACHER],
    hideInTopNav: false,
  },
  {
    title: "Create Quiz",
    href: "/dashboard/teacher/quizzes/create",
    icon: Plus,
    roles: [Role.TEACHER],
    hideInTopNav: false,
  },
  {
    title: "View Classes",
    href: "/dashboard/teacher/classes",
    icon: School,
    roles: [Role.TEACHER],
    hideInTopNav: false,
  },
  {
    title: "All Quizzes",
    href: "/dashboard/teacher/quizzes",
    icon: FileText,
    roles: [Role.TEACHER],
    hideInTopNav: false,
  },
  {
    title: "View Students",
    href: "/dashboard/teacher/students",
    icon: Users,
    roles: [Role.TEACHER],
    hideInTopNav: false,
  },
  // STUDENT links
  {
    title: "My Quizzes",
    href: "/dashboard/student/quizzes",
    icon: BookOpen,
    roles: [Role.STUDENT],
    hideInTopNav: false,
  },
  {
    title: "My Classes",
    href: "/dashboard/student/classes",
    icon: Users,
    roles: [Role.STUDENT],
    hideInTopNav: false,
  },
  {
    title: "My Results",
    href: "/dashboard/student/results",
    icon: ClipboardCheck,
    roles: [Role.STUDENT],
    hideInTopNav: false,
  },
  {
    title: "Analytics",
    href: "/dashboard/student/analytics/class-participation",
    icon: LineChart,
    roles: [Role.STUDENT],
    hideInTopNav: false,
  },
  // Shared links
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: [Role.TEACHER, Role.STUDENT],
    hideInTopNav: true,
  },
  // Links without role requirements
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: [],
    hideInTopNav: true,
  },
]; 