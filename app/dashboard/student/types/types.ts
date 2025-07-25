// Types for quizzes/exams
export interface QuizType {
  id: string;
  title: string;
  description: string | null;
  classId?: string | null;
  className?: string | null;
  teacherName?: string | null;
  subject: string | null;
  startDate: string | null;
  endDate: string | null;
  durationMinutes: number;
  totalQuestions: number;
  status: "upcoming" | "ongoing" | "completed" | "expired";
  isLocked: boolean;
  lockReason?: string | null;
  isFormal: boolean;
  isPublic?: boolean;
  attemptLimit?: number | null;
  currentAttempts?: number;
  highestScore?: number | null;
  // Additional fields for quiz details
  bestAttemptId?: string | null;
  latestAttemptId?: string | null;
  isLatestAttemptComplete?: boolean;
  instructions?: string | null;
  // Thêm trường timeLeft nếu quiz đang được thực hiện
  timeLeft?: number | null;
  // Trường hiển thị đánh giá của giáo viên
  feedback?: string | null;
  // Link đến kết quả
  resultLink?: string | null;
}

// Types for classes
export interface ClassType {
  id: string;
  name: string;
  subject: string | null;
  description: string | null;
  teacherId?: string;
  teacher?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  teacherName?: string;
  totalStudents?: number;
  studentsCount?: number;
  newQuizCount?: number;
  newAnnouncementCount?: number;
  upcomingQuizCount?: number;
  recentAnnouncementCount?: number;
  coverImage?: string | null;
  joinedDate?: string;
  joinedAt?: string;
  type: 'PUBLIC' | 'PRIVATE';
  quizCount?: number;
  quizzesCount?: number;
  announcementsCount?: number;
  materialsCount?: number;
  isEnrolled?: boolean;
  enrollmentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassDetailsType {
  id: string;
  name: string;
  subject: string;
  description: string;
  teacherName: string;
  totalStudents: number;
  announcements: AnnouncementType[];
  quizzes: QuizType[];
  materials: MaterialType[];
  coverImage?: string;
  joinedDate: string;
}

export interface AnnouncementType {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isNew?: boolean;
}

export interface MaterialType {
  id: string;
  title: string;
  description?: string;
  type: "document" | "video" | "link";
  url: string;
  createdAt: string;
} 