import { NextResponse } from "next/server";
import { 
  ErrorResponseOptions, 
  SuccessResponseOptions,
  HTTP_STATUS,
  API_ERROR_CODES,
  API_MESSAGES
} from "./api-types";

/**
 * Class representing an API error
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, message: string, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || API_ERROR_CODES.INTERNAL_ERROR;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Create a standard API response
 */
export function createApiResponse<T>(data: T, options?: SuccessResponseOptions) {
  return NextResponse.json({
    success: true,
    data,
    ...(options?.pagination && { meta: options.pagination }),
  }, 
  { 
    status: options?.status || HTTP_STATUS.OK,
    headers: options?.cacheControl ? { 'Cache-Control': options.cacheControl } : undefined
  });
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  options?: SuccessResponseOptions
) {
  const response = NextResponse.json(
    {
      success: true,
      data,
      ...(options?.pagination && { pagination: options.pagination }),
    },
    { status: options?.status || HTTP_STATUS.OK }
  );

  // Set cache headers if provided
  if (options?.cacheControl) {
    response.headers.set("Cache-Control", options.cacheControl);
  }

  return response;
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  options?: ErrorResponseOptions
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: options?.code || API_ERROR_CODES.INTERNAL_ERROR,
        ...(options?.details && { details: options.details }),
      },
    },
    { status: options?.status || HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse() {
  return errorResponse(API_MESSAGES.UNAUTHORIZED, {
    status: HTTP_STATUS.UNAUTHORIZED,
    code: API_ERROR_CODES.UNAUTHORIZED,
  });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse() {
  return errorResponse(API_MESSAGES.FORBIDDEN, {
    status: HTTP_STATUS.FORBIDDEN,
    code: API_ERROR_CODES.FORBIDDEN,
  });
}

/**
 * Create a not found response
 */
export function notFoundResponse(message: string) {
  return errorResponse(message, {
    status: HTTP_STATUS.NOT_FOUND,
    code: API_ERROR_CODES.NOT_FOUND,
  });
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(details: Record<string, any>) {
  return errorResponse(API_MESSAGES.VALIDATION_ERROR, {
    status: HTTP_STATUS.BAD_REQUEST,
    code: API_ERROR_CODES.VALIDATION_ERROR,
    details,
  });
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: any) {
  const details = error.errors.reduce((acc: Record<string, any>, err: any) => {
    const path = err.path.join('.');
    acc[path] = err.message;
    return acc;
  }, {});

  return validationErrorResponse(details);
}

/**
 * Create a server error response
 */
export function serverErrorResponse(message: string = API_MESSAGES.INTERNAL_ERROR) {
  return errorResponse(message, {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: API_ERROR_CODES.INTERNAL_ERROR,
  });
} 