"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";

export interface ScoreAnalyticsData {
  timeSeriesData: {
    period: string;
    score: number | null;
    average: number | null;
  }[];
  subjectPerformance: {
    subject: string;
    score: number;
    trend: number;
    quizCount: number;
  }[];
  strengthWeakness: {
    strongestSubject: string;
    strongestScore: number;
    weakestSubject: string;
    weakestScore: number;
  };
  overallStats: {
    averageScore: number;
    previousAverageScore: number;
    improvement: number;
    totalAssessments: number;
  };
  classComparison?: {
    averageClassScore: number;
    percentile: number;
  } | null;
}

export interface ScoreAnalyticsMetadata {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  timeFrame: string;
  filters: {
    subject?: string;
    minScore?: string;
    maxScore?: string;
  };
}

export interface ScoreAnalyticsFilters {
  timeFrame?: string;
  subject?: string;
  minScore?: string;
  maxScore?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortDirection?: string;
}

/**
 * Hook to fetch and manage student score analytics data
 * @param initialFilters - Initial filter values
 * @returns Score analytics data, state, and pagination controls
 */
export function useScoreAnalytics(initialFilters?: ScoreAnalyticsFilters) {
  const [data, setData] = useState<ScoreAnalyticsData | null>(null);
  const [metadata, setMetadata] = useState<ScoreAnalyticsMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Use URL query params with parsers for persistent filters
  const [timeFrame, setTimeFrame] = useQueryState('timeFrame', 
    parseAsString.withDefault(initialFilters?.timeFrame || 'last30days')
  );
  const [subject, setSubject] = useQueryState('subject', 
    parseAsString.withDefault('')
  );
  const [minScore, setMinScore] = useQueryState('minScore', 
    parseAsString.withDefault('')
  );
  const [maxScore, setMaxScore] = useQueryState('maxScore', 
    parseAsString.withDefault('')
  );
  const [page, setPage] = useQueryState('page', 
    parseAsString.withDefault(initialFilters?.page || '1')
  );
  const [limit, setLimit] = useQueryState('limit', 
    parseAsString.withDefault(initialFilters?.limit || '10')
  );
  const [sortBy, setSortBy] = useQueryState('sortBy', 
    parseAsString.withDefault(initialFilters?.sortBy || 'completedAt')
  );
  const [sortDirection, setSortDirection] = useQueryState('sortDirection', 
    parseAsString.withDefault(initialFilters?.sortDirection || 'desc')
  );

  /**
   * Builds the query string from current filters
   */
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (timeFrame) params.append('timeFrame', timeFrame);
    if (subject) params.append('subject', subject);
    if (minScore) params.append('minScore', minScore);
    if (maxScore) params.append('maxScore', maxScore);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortDirection) params.append('sortDirection', sortDirection);
    return params.toString();
  }, [timeFrame, subject, minScore, maxScore, page, limit, sortBy, sortDirection]);

  /**
   * Updates filters and fetches data
   */
  const updateFilters = useCallback((newFilters: Partial<ScoreAnalyticsFilters>) => {
    // Update all the filters that were provided
    const updatePromises = [];
    if ('timeFrame' in newFilters) updatePromises.push(setTimeFrame(newFilters.timeFrame || ''));
    if ('subject' in newFilters) updatePromises.push(setSubject(newFilters.subject || ''));
    if ('minScore' in newFilters) updatePromises.push(setMinScore(newFilters.minScore || ''));
    if ('maxScore' in newFilters) updatePromises.push(setMaxScore(newFilters.maxScore || ''));
    if ('page' in newFilters) updatePromises.push(setPage(newFilters.page || '1'));
    if ('limit' in newFilters) updatePromises.push(setLimit(newFilters.limit || '10'));
    if ('sortBy' in newFilters) updatePromises.push(setSortBy(newFilters.sortBy || 'completedAt'));
    if ('sortDirection' in newFilters) updatePromises.push(setSortDirection(newFilters.sortDirection || 'desc'));
    
    // Wait for all updates to complete before fetching data
    Promise.all(updatePromises).then(() => {
      fetchData();
    });
  }, [setTimeFrame, setSubject, setMinScore, setMaxScore, setPage, setLimit, setSortBy, setSortDirection]);

  /**
   * Fetches analytics data with current filters
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/users/me/score-analytics?${queryString}`, {
        cache: 'no-store', // Don't cache this request client-side
        headers: {
          'Cache-Control': 'no-cache', // Don't cache this request server-side
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching score analytics: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load score analytics");
      }

      setData(result.data);
      setMetadata(result.meta);
    } catch (err) {
      console.error("Error fetching score analytics:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching score analytics"
      );
      toast({
        variant: "destructive",
        title: "Failed to load analytics",
        description:
          err instanceof Error
            ? err.message
            : "Could not load your score analytics. Please try again later.",
      });
      
      // Return fallback data during development to avoid UI breakage
      if (process.env.NODE_ENV !== "production") {
        setData(getFallbackData());
      }
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString, toast]);

  /**
   * Pagination controls
   */
  const gotoPage = useCallback((newPage: number) => {
    updateFilters({ page: newPage.toString() });
  }, [updateFilters]);

  const nextPage = useCallback(() => {
    if (metadata && metadata.page < metadata.totalPages) {
      gotoPage(metadata.page + 1);
    }
  }, [metadata, gotoPage]);

  const prevPage = useCallback(() => {
    if (metadata && metadata.page > 1) {
      gotoPage(metadata.page - 1);
    }
  }, [metadata, gotoPage]);

  // Reset page when filters change
  useEffect(() => {
    if (page !== '1') {
      setPage('1');
    }
  }, [timeFrame, subject, minScore, maxScore, sortBy, sortDirection, setPage]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    metadata,
    isLoading,
    error,
    // Filter controls
    filters: {
      timeFrame,
      subject,
      minScore,
      maxScore,
      page,
      limit,
      sortBy,
      sortDirection,
    },
    updateFilters,
    // Pagination controls
    gotoPage,
    nextPage,
    prevPage,
    // Manual refetch
    refetch: fetchData,
  };
}

/**
 * Generate fallback data for development environment when API fails
 * This helps developers see the UI even when the backend is not working
 */
function getFallbackData(): ScoreAnalyticsData {
  return {
    timeSeriesData: Array.from({ length: 6 }, (_, i) => ({
      period: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
      score: Math.floor(Math.random() * 30) + 70,
      average: Math.floor(Math.random() * 20) + 70,
    })),
    subjectPerformance: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Literature",
      "History",
    ].map((subject) => ({
      subject,
      score: Math.floor(Math.random() * 30) + 70,
      trend: Math.floor(Math.random() * 20) - 10,
      quizCount: Math.floor(Math.random() * 5) + 1,
    })),
    strengthWeakness: {
      strongestSubject: "Mathematics",
      strongestScore: 92,
      weakestSubject: "History",
      weakestScore: 75,
    },
    overallStats: {
      averageScore: 85,
      previousAverageScore: 82,
      improvement: 3.7,
      totalAssessments: 24,
    },
    classComparison: {
      averageClassScore: 79,
      percentile: 85,
    }
  };
}

// PHASE 1: SCORE ANALYTICS API UPGRADE - COMPLETED
// Successfully migrated from basic API to advanced implementation with filtering, pagination, caching
// Key improvements:
// - Added filtering by timeFrame, subject, score range
// - Added pagination support
// - Added data caching for performance
// - Added real class comparison data
// - Implemented auto-generated analytics for faster access
// - Enhanced time series data to support different time frames 