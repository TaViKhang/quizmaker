import { ClassType } from "@prisma/client";

/**
 * Query parameters for class endpoints
 */
export interface ClassQueryParams {
  page: number;
  limit: number;
  search?: string;
  type?: ClassType;
  isActive?: boolean;
  onlyJoined?: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'name';
  sortOrder: 'asc' | 'desc';
}

/**
 * Parse URL search parameters for class endpoints
 */
export function parseClassQueryParams(searchParams: URLSearchParams): ClassQueryParams {
  return {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
    search: searchParams.get("search") || undefined,
    type: searchParams.get("type") as ClassType | undefined,
    isActive: searchParams.has("isActive") 
      ? searchParams.get("isActive") === "true" 
      : undefined,
    onlyJoined: searchParams.get("onlyJoined") === "true",
    sortBy: (searchParams.get("sortBy") || "updatedAt") as 'createdAt' | 'updatedAt' | 'name',
    sortOrder: (searchParams.get("sortOrder") || "desc") as 'asc' | 'desc',
  };
}

/**
 * Build a Prisma OrderBy object from query parameters
 */
export function buildOrderByFromParams(
  sortBy: string = 'updatedAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Record<string, string> {
  const validSortFields = ['createdAt', 'updatedAt', 'name'];
  
  // Validate sortBy field
  const field = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
  
  // Create the orderBy object
  const orderBy: Record<string, string> = {};
  orderBy[field] = sortOrder;
  
  return orderBy;
}

/**
 * Build pagination parameters for Prisma queries
 */
export function buildPaginationParams(page: number, limit: number) {
  // Ensure positive values
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
  
  const skip = (validPage - 1) * validLimit;
  
  return {
    skip,
    take: validLimit
  };
}

/**
 * Generate a unique class code
 */
export function generateClassCode(length: number = 6): string {
  // Use characters that are less likely to be confused
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  // Ensure length is between 6-8 characters
  const codeLength = Math.min(Math.max(length, 6), 8);
  
  let result = '';
  for (let i = 0; i < codeLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Build search conditions for Prisma queries
 */
export function buildSearchConditions(search?: string) {
  if (!search || search.trim() === '') {
    return undefined;
  }
  
  return [
    { name: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } }
  ];
}

/**
 * Check if a user has permission to access a class
 */
export function hasClassAccess(
  userId: string,
  userRole: string,
  classTeacherId: string,
  classType: string,
  isEnrolled: boolean
): boolean {
  // Teacher of the class always has access
  if (userId === classTeacherId) {
    return true;
  }
  
  // Student access: must be enrolled or class is public
  if (userRole === 'STUDENT') {
    return isEnrolled || classType === 'PUBLIC';
  }
  
  // Admin always has access
  if (userRole === 'ADMIN') {
    return true;
  }
  
  return false;
} 