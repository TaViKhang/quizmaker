import { createSearchParamsCache, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs/server';

/**
 * Định nghĩa các search params có thể sử dụng trong server components
 * với các loại dữ liệu và giá trị mặc định
 */             
export const searchParamsCache = createSearchParamsCache({
  // Score analytics filters
  timeFrame: parseAsString.withDefault('last30days'),
  subject: parseAsString.withDefault(''),
  minScore: parseAsString.withDefault(''),
  maxScore: parseAsString.withDefault(''),
  page: parseAsString.withDefault('1'),
  limit: parseAsString.withDefault('10'),
  sortBy: parseAsString.withDefault('completedAt'),
  sortDirection: parseAsString.withDefault('desc'),
  
  // Other params can be added here
  q: parseAsString.withDefault(''),
  category: parseAsArrayOf(parseAsString).withDefault([]),
}); 