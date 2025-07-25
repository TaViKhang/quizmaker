import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard response structure for paginated data
 */
export interface PaginatedResponseData<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  meta?: Record<string, any>;
}

/**
 * Standard response structure for single item data
 */
export interface SingleResponseData<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseData {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Create a successful response with pagination
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  meta?: Record<string, any>,
  headers?: HeadersInit
): NextResponse {
  const response: PaginatedResponseData<T> = {
    success: true,
    data: {
      items: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { headers });
}

/**
 * Create a successful response for a single item
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, any>,
  headers?: HeadersInit
): NextResponse {
  const response: SingleResponseData<T> = { 
    success: true,
    data 
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return NextResponse.json(response, { status, headers });
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse {
  const response: ErrorResponseData = {
    success: false,
    error: {
      code,
      message
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * Format Zod validation errors
 */
export function formatZodError(error: ZodError) {
  return {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }))
  };
}

/**
 * Create an authenticated error response (401)
 */
export function createAuthenticationError(): NextResponse {
  return createErrorResponse(
    "UNAUTHENTICATED",
    "You must be logged in to access this resource",
    undefined,
    401
  );
}

/**
 * Create a permission error response (403)
 */
export function createPermissionError(message: string = "You don't have permission to access this resource"): NextResponse {
  return createErrorResponse(
    "UNAUTHORIZED", 
    message,
    undefined,
    403
  );
}

/**
 * Create a not found error response (404)
 */
export function createNotFoundError(resource: string = "Resource"): NextResponse {
  return createErrorResponse(
    "NOT_FOUND",
    `${resource} not found`,
    undefined,
    404
  );
}

/**
 * Create a server error response (500)
 */
export function createServerError(error?: Error): NextResponse {
  console.error("Server error:", error);
  
  return createErrorResponse(
    "SERVER_ERROR",
    "An unexpected error occurred",
    process.env.NODE_ENV === 'development' ? error?.message : undefined,
    500
  );
}

/**
 * Create a validation error response (400)
 */
export function createValidationError(details?: any): NextResponse {
  return createErrorResponse(
    "VALIDATION_ERROR",
    "Invalid input data",
    details,
    400
  );
} 