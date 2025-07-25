import { 
  Role, 
  ClassType, 
  MaterialType, 
  QuestionType, 
  MediaType 
} from "@prisma/client";

// Common types
export interface BaseUser {
  id: string;
  name: string | null;
  email?: string;
  image: string | null;
}

export interface BaseClass {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  coverImage: string | null;
}

// Class list API types
export interface ClassListResponse {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: ClassType;
  coverImage: string | null;
  isActive: boolean;
  maxStudents: number | null;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
  studentsCount: number;
  quizzesCount: number;
  announcementsCount: number;
  materialsCount: number;
  upcomingQuizCount: number;
  recentAnnouncementCount: number;
  isEnrolled: boolean;
  enrollmentId?: string;
  joinedAt?: string;
  code?: string; // Only for teachers
}

// Class details API types
export interface TeacherClassDetails {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: ClassType;
  coverImage: string | null;
  isActive: boolean;
  maxStudents: number | null;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
  studentsCount: number;
  quizzesCount: number;
  announcementsCount: number;
  materialsCount: number;
  code: string | null;
  students: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    enrollmentId: string;
    joinedAt: string;
  }>;
}

export interface StudentClassDetails {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  type: ClassType;
  coverImage: string | null;
  isActive: boolean;
  maxStudents: number | null;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
  studentsCount: number;
  quizzesCount: number;
  announcementsCount: number;
  materialsCount: number;
  upcomingQuizCount: number;
  recentAnnouncementCount: number;
  isEnrolled: boolean;
  enrollmentId?: string;
  joinedAt?: string;
}

// Class dashboard API types
export interface StudentClassDashboard {
  class: BaseClass;
  teacher: BaseUser;
  enrollment: {
    id: string;
    joinedAt: string;
  } | null;
  dashboard: {
    upcomingQuizCount: number;
    recentAnnouncementCount: number;
    materialsCount: number;
    classmateCount: number;
  };
  content: {
    upcomingQuizzes: Array<{
      id: string;
      title: string;
      description: string | null;
      startDate: string | null;
      endDate: string | null;
      timeLimit: number;
      status: 'upcoming' | 'ongoing' | 'ended';
      hasAttempted: boolean;
      attemptId: string | null;
      attemptScore: number | null;
    }>;
    recentAnnouncements: Array<{
      id: string;
      title: string;
      content: string;
      createdAt: string;
    }>;
    materials: Array<{
      id: string;
      title: string;
      type: MaterialType;
      createdAt: string;
    }>;
    classmates: Array<{
      id: string;
      name: string | null;
      image: string | null;
    }>;
  };
}

export interface TeacherClassDashboard {
  class: BaseClass;
  teacher: BaseUser;
  stats: {
    studentCount: number;
    quizCount: number;
    materialCount: number;
    announcementCount: number;
  };
  recentActivity: {
    enrollments: Array<{
      id: string;
      student: BaseUser;
      joinedAt: string;
    }>;
    quizzes: Array<{
      id: string;
      title: string;
      startDate: string | null;
      endDate: string | null;
      isPublished: boolean;
      attemptCount: number;
    }>;
  };
}

// Material API types
export interface ClassMaterial {
  id: string;
  title: string;
  description: string | null;
  type: MaterialType;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileSizeFormatted: string | null;
  mimeType: string | null;
  createdAt: string;
  updatedAt: string;
  uploader: {
    id: string;
    name: string | null;
    image: string | null;
  };
  downloadUrl: string | null;
}

export interface CreateMaterialRequest {
  title: string;
  description?: string;
  type: MaterialType;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

// Announcement API types
export interface ClassAnnouncement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
}

// API response wrapper types
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    [key: string]: any;
  };
}

export interface SuccessResponse<T> {
  success: boolean;
  data: T;
}

export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
  };
} 