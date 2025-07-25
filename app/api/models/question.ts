import { QuestionType } from "../schemas/question-schemas";

/**
 * Model for Question Option - matches Prisma schema
 */
export interface QuestionOption {
  id: string;
  questionId: string;
  content: string;  // Changed from text to content
  isCorrect: boolean;
  order: number;
  group?: string;
  matchId?: string;
  position?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Model for Question - matches Prisma schema
 */
export interface Question {
  id: string;
  quizId?: string;
  content: string;
  type: QuestionType;
  points: number;
  order: number;
  category?: string;
  difficulty?: number;  // 1-5
  explanation?: string;
  mediaType?: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  mediaUrl?: string;
  metadata?: Record<string, any>;
  questionBankId?: string;
  quizTemplateId?: string;
  tags?: string[];
  options?: QuestionOption[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Model for attempt answer
 */
export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption?: string;
  textAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Model for quiz attempt
 */
export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  ipAddress?: string;
  timeSpent?: number;
  userAgent?: string;
  answers?: Answer[];
  createdAt?: Date;
  updatedAt?: Date;
} 