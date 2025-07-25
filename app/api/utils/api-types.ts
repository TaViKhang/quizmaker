/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * API Response Types
 */
export type ErrorResponseOptions = {
  status?: number;
  code?: string;
  details?: Record<string, any>;
};

export type SuccessResponseOptions = {
  status?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
  cacheControl?: string;
};

/**
 * API Error Codes
 */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * API Response Messages
 */
export const API_MESSAGES = {
  NOT_FOUND: {
    QUESTION: 'Question not found',
    OPTION: 'Option not found',
    QUIZ: 'Quiz not found',
    USER: 'User not found',
    ATTEMPT: 'Attempt not found',
    ANSWER: 'Answer not found',
  },
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  ATTEMPT: {
    CREATED: 'Attempt created successfully',
    UPDATED: 'Attempt updated successfully',
    COMPLETED: 'Attempt completed successfully',
    DELETED: 'Attempt deleted successfully',
    MAX_ATTEMPTS_REACHED: 'Maximum attempts reached for this quiz',
    ALREADY_COMPLETED: 'This attempt is already completed',
    QUIZ_CLOSED: 'This quiz is no longer accepting submissions',
    INVALID_ANSWER: 'Invalid answer format',
    PARTIAL_SCORE: 'Some questions require manual grading',
  },
  ANALYTICS: {
    FORBIDDEN: 'You do not have permission to view this data',
    STUDENT_RESTRICTED: 'This data is only available to teachers',
  }
} as const; 