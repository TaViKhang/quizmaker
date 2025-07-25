"use client";

import { useState, useMemo, useCallback } from "react";

export type TimeFrame = "last7days" | "last30days" | "last3months" | "last6months" | "lastYear" | "allTime";
export type SortDirection = "asc" | "desc";
export type GroupBy = "day" | "week" | "month" | "subject" | "quizType";

export type FilterOptions = {
  /**
   * Time frame for filtering data
   */
  timeFrame: TimeFrame;
  /**
   * Specific subjects to filter by (empty means all)
   */
  subjects: string[];
  /**
   * Sort direction for data
   */
  sortDirection: SortDirection;
  /**
   * Optional search term
   */
  searchTerm?: string;
  /**
   * Group data by
   */
  groupBy: GroupBy;
  /**
   * Include public quizzes
   */
  includePublicQuizzes: boolean;
  /**
   * Set minimum score threshold
   */
  minScoreThreshold?: number;
  /**
   * Set maximum score threshold
   */
  maxScoreThreshold?: number;
};

const defaultFilters: FilterOptions = {
  timeFrame: "last30days",
  subjects: [],
  sortDirection: "desc",
  searchTerm: "",
  groupBy: "month",
  includePublicQuizzes: true,
  minScoreThreshold: undefined,
  maxScoreThreshold: undefined,
};

export interface UseAnalyticsFilterResult<T> {
  /**
   * Current filter options
   */
  filters: FilterOptions;
  /**
   * Filtered data
   */
  filteredData: T[];
  /**
   * Update a single filter option
   */
  updateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  /**
   * Reset all filters to default values
   */
  resetFilters: () => void;
}

/**
 * Hook for filtering analytics data
 * @param data - The source data array to filter
 * @param filterFn - Function that applies filters to data
 * @returns Filtered data and filter controls
 */
export function useAnalyticsFilter<T>(
  data: T[],
  filterFn: (data: T[], filters: FilterOptions) => T[]
): UseAnalyticsFilterResult<T> {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  // Memoize update function to prevent unnecessary rerenders
  const updateFilter = useCallback(<K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Reset filters to default values
  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  // Apply filters to data
  const filteredData = useMemo(() => {
    return filterFn(data, filters);
  }, [data, filters, filterFn]);

  return {
    filters,
    filteredData,
    updateFilter,
    resetFilters,
  };
} 