import { QuestionType } from "@prisma/client";
import { 
  MultipleChoiceMetadata,
  EssayMetadata,
  ShortAnswerMetadata,
  FillBlankMetadata,
  CodeMetadata,
  MatchingMetadata,
} from "@/app/api/schemas/question-metadata-schemas";

/**
 * Interface for Question data structure
 */
export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  points: number;
  order: number;
  explanation?: string | null;
  metadata?: any | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  options?: Option[];
}

/**
 * Interface for Option data structure
 */
export interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
  group?: string | null;
  matchId?: string | null;
  position?: number | null;
}

/**
 * Interface for Answer data structure
 */
export interface Answer {
  questionId: string;
  selectedOptions: string[];  // IDs of selected options
  textAnswer: string;         // Text answer for essay/short answer/code
  jsonData: string | null; // Complex data for matching/fill-blank questions (JSON string)
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (!array || array.length === 0) return [];
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Normalize metadata from string or object format
 */
export function normalizeMetadata<T = any>(metadata: any): T | null {
  if (!metadata) return null;
  
  // If metadata is already an object, return it
  if (typeof metadata === 'object' && !Array.isArray(metadata) && metadata !== null) {
    return metadata as T;
  }
  
  // If metadata is a string, try to parse it
  if (typeof metadata === 'string') {
    try {
      // Check if the string is valid JSON
      if (metadata.trim().startsWith('{') || metadata.trim().startsWith('[')) {
        return JSON.parse(metadata) as T;
      } else {
        console.warn("Metadata string is not valid JSON:", metadata);
        return null;
      }
    } catch (e) {
      console.error("Error parsing metadata string:", e);
      return null;
    }
  }
  
  // For unexpected types, log and return null
  console.warn("Unexpected metadata type:", typeof metadata);
  return null;
}

/**
 * Get default metadata structure based on question type
 */
export function getDefaultMetadata(questionType: QuestionType): any {
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      return { allowMultiple: false, shuffleOptions: false };
    
    case QuestionType.ESSAY:
      return { minWords: null, maxWords: null, placeholder: "", richText: false };
    
    case QuestionType.SHORT_ANSWER:
      return { caseSensitive: false, placeholder: "" };
    
    case QuestionType.FILL_BLANK:
      return { text: "", caseSensitive: false };
    
    case QuestionType.CODE:
      return { language: "javascript", initialCode: "", testCases: [] };
    
    case QuestionType.MATCHING:
      return { shuffleOptions: false };
    
    default:
      return {};
  }
}

/**
 * Normalize question data ensuring it has the correct metadata structure
 */
export function normalizeQuestion(question: Question): Question {
  // Clone question to avoid mutating the original
  const normalizedQuestion = { ...question };
  
  // Normalize metadata
  const normalizedMetadata = normalizeMetadata(question.metadata) || 
    getDefaultMetadata(question.type);
  
  return {
    ...normalizedQuestion,
    metadata: normalizedMetadata
  };
}

/**
 * Get type-specific metadata from a normalized question
 */
export function getTypedMetadata<T>(question: Question): T | null {
  if (!question.metadata) return null;
  
  try {
    const normalizedMetadata = normalizeMetadata<T>(question.metadata);
    return normalizedMetadata;
  } catch (e) {
    console.error("Error getting typed metadata:", e);
    return null;
  }
}

/**
 * Get multiple choice specific metadata
 * Improved to handle various metadata formats and provide stronger type safety
 */
export function getMultipleChoiceMetadata(question: Question): MultipleChoiceMetadata {
  // Default values for multiple choice metadata
  const defaultMetadata: MultipleChoiceMetadata = { 
    allowMultiple: false, 
    shuffleOptions: false, 
    allowPartialCredit: true 
  };
  
  // Guard clause for when metadata is completely absent
  if (!question || !question.metadata) {
    return defaultMetadata;
  }
  
  // Try to normalize the metadata first
  let metadata = normalizeMetadata<any>(question.metadata);
  
  // If normalization fails, return default
  if (!metadata) {
    return defaultMetadata;
  }
  
  // Create result by merging default with whatever we can extract
  const result: MultipleChoiceMetadata = { 
    ...defaultMetadata 
  };
  
  // Handle both naming conventions for multiple answers
  if (typeof metadata.allowMultiple !== 'undefined') {
    result.allowMultiple = Boolean(metadata.allowMultiple);
  } else if (typeof metadata.allowMultipleAnswers !== 'undefined') {
    result.allowMultiple = Boolean(metadata.allowMultipleAnswers);
    }
  
  // Handle shuffle options setting
  if (typeof metadata.shuffleOptions !== 'undefined') {
    result.shuffleOptions = Boolean(metadata.shuffleOptions);
  }
  
  // Handle partial credit setting, defaulting to true if undefined
  if (typeof metadata.allowPartialCredit !== 'undefined') {
    result.allowPartialCredit = Boolean(metadata.allowPartialCredit);
  }
  
  return result;
}

/**
 * Get essay specific metadata
 */
export function getEssayMetadata(question: Question): EssayMetadata {
  return getTypedMetadata<EssayMetadata>(question) || 
    { minWords: undefined, maxWords: undefined, placeholder: undefined, richText: false };
}

/**
 * Get short answer specific metadata
 */
export function getShortAnswerMetadata(question: Question): ShortAnswerMetadata {
  return getTypedMetadata<ShortAnswerMetadata>(question) || 
    { caseSensitive: false, placeholder: undefined };
}

/**
 * Get fill-blank specific metadata
 */
export function getFillBlankMetadata(question: Question): FillBlankMetadata {
  return getTypedMetadata<FillBlankMetadata>(question) || 
    { text: "", caseSensitive: false };
}

/**
 * Get code specific metadata
 */
export function getCodeMetadata(question: Question): CodeMetadata {
  return getTypedMetadata<CodeMetadata>(question) || 
    { language: "javascript", initialCode: undefined, testCases: undefined };
}

/**
 * Get matching specific metadata
 */
export function getMatchingMetadata(question: Question): MatchingMetadata {
  return getTypedMetadata<MatchingMetadata>(question) || 
    { shuffleOptions: false };
}

/**
 * Get the display label for a question type
 */
export function getQuestionTypeLabel(type: QuestionType): string {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE: return "Multiple Choice";
    case QuestionType.TRUE_FALSE: return "True/False";
    case QuestionType.ESSAY: return "Essay";
    case QuestionType.SHORT_ANSWER: return "Short Answer";
    case QuestionType.MATCHING: return "Matching";
    case QuestionType.FILL_BLANK: return "Fill in the Blanks";
    case QuestionType.CODE: return "Code";
    case QuestionType.FILE_UPLOAD: return "File Upload";
    default: return type;
  }
} 