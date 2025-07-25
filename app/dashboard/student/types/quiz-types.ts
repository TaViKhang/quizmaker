// Type for quiz as returned by API
export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  shuffleQuestions: boolean;
  passingScore: number | null;
  maxAttempts: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isPublished: boolean;
  showResults: boolean;
  category: string | null;
  questions: Question[];
  classId: string | null;
  className?: string;
}

// Type for quiz attempt
export interface QuizAttempt {
  id: string;
  quizId: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  timeSpent: number | null;
  percentile: number | null;
  averageResponseTime: number | null;
}

// Type for question
export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  points: number;
  order: number;
  explanation?: string;
  mediaType?: string;
  mediaUrl?: string;
  options: Option[];
  metadata?: QuestionMetadata;
  category?: string;
  difficulty?: number;
}

// Type for question option
export interface Option {
  id: string;
  content: string;
  order: number;
  group?: string;    // For MATCHING questions
  position?: number; // For FILL_BLANK questions
  matchId?: string;  // For MATCHING questions
}

// Type for question metadata
export interface QuestionMetadata {
  // Multiple choice
  allowMultiple?: boolean;
  shuffleOptions?: boolean;
  
  // Essay
  minWords?: number;
  maxWords?: number;
  placeholder?: string;
  richText?: boolean;
  
  // Short answer
  caseSensitive?: boolean;
  
  // Fill-in-the-blank
  text?: string;
  
  // Code
  language?: string;
  initialCode?: string;
  testCases?: string[];
}

// Type for answer
export interface Answer {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
  jsonData?: Record<string, any> | null;
}

// Type for question type
export type QuestionType = 
  | 'MULTIPLE_CHOICE' 
  | 'ESSAY' 
  | 'TRUE_FALSE' 
  | 'SHORT_ANSWER' 
  | 'MATCHING' 
  | 'FILL_BLANK' 
  | 'CODE' 
  | 'FILE_UPLOAD';