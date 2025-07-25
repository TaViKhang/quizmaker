/**
 * Standardized error handling for API routes
 */

import { NextResponse } from "next/server";
import { createErrorResponse, createServerError } from "./api-response";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Format ZodError to user-friendly format
 */
export function formatZodError(error: ZodError) {
  const errors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
  
  return { errors };
}

/**
 * Process database errors into standard format
 */
export function handleDatabaseError(error: unknown) {
  // Handle Prisma-specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint failed
        return createErrorResponse(
          "DUPLICATE_RECORD",
          "A record with this information already exists",
          { fields: error.meta?.target || [] }
        );
      
      case 'P2003': // Foreign key constraint failed
        return createErrorResponse(
          "INVALID_RELATION",
          "Referenced record does not exist",
          { field: error.meta?.field_name || "" }
        );
      
      case 'P2025': // Record not found
        return createErrorResponse(
          "NOT_FOUND",
          "The requested record does not exist",
          { details: error.meta?.cause || "" }
        );
      
      default:
        return createErrorResponse(
          "DATABASE_ERROR",
          "A database error occurred",
          { code: error.code }
        );
    }
  } 
  
  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Invalid data provided to database operation",
      { message: error.message }
    );
  }
  
  // Other unknown errors
  return createServerError(error instanceof Error ? error : new Error("Unknown database error"));
}

/**
 * API route wrapper with standardized error handling
 */
export function withErrorHandling(handler: Function) {
  return async (req: Request, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API error:", error);
      
      // Handle different error types
      if (error instanceof ZodError) {
        return createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid data format",
          formatZodError(error)
        );
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError || 
          error instanceof Prisma.PrismaClientValidationError) {
        return handleDatabaseError(error);
      }
      
      // Generic error response for other errors
      return createServerError(error instanceof Error ? error : new Error("Unknown error"));
    }
  };
}

/**
 * Validate request body against schema with error handling
 */
export async function validateRequest(request: Request, schema: any) {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new Error("Failed to parse request body");
  }
}

/**
 * Helper to check if a user has permission for an operation
 */
export function ensurePermission(condition: boolean, message: string = "Permission denied") {
  if (!condition) {
    return createErrorResponse("PERMISSION_ERROR", message);
  }
  return null;
}

/**
 * Extract and validate URL parameter with proper error handling
 */
export function validateParam(param: string | null, name: string, required: boolean = true) {
  if (required && !param) {
    throw new Error(`Missing required parameter: ${name}`);
  }
  return param;
} 