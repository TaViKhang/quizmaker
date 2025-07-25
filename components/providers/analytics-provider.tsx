"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { format } from "date-fns";

// Types for Class Participation Analytics
export interface KeyMetrics {
  activeClasses: number;
  overallEngagementRate: number;
  totalStudyTimeSeconds: number;
}

export interface ClassPerformanceDetail {
  classId: string;
  className: string;
  quizzesAssigned: number;
  quizzesCompletedByStudent: number;
  classCompletionRate: number;
  timeSpentInClassSeconds: number;
}

export interface ParticipationTimePoint {
  date: string;
  completedQuizzes: number;
}

export interface ClassParticipationData {
  keyMetrics: KeyMetrics;
  classPerformanceBreakdown: ClassPerformanceDetail[];
  participationOverTime: ParticipationTimePoint[];
}

// Backward compatibility types (for legacy UI components that might still use old structure)
export interface ClassCounts {
  total: number;
  active: number;
  completed: number;
  upcoming: number;
}

export interface ClassActivity {
  name: string;
  value: number;
}

export interface ClassEngagement {
  name: string;
  quizzes: number;
  assignments: number;
  discussions: number;
}

export interface RecentActivity {
  id: string;
  className: string;
  activityType: string;
  date: string;
  score?: number;
  durationMinutes?: number;
}

export interface LegacyClassParticipationData {
  classCounts: ClassCounts;
  classActivities: ClassActivity[];
  classEngagement: ClassEngagement[];
  recentActivities: RecentActivity[];
}

// Available time frames for filtering data
export type TimeFrame = "last7days" | "last30days" | "last90days" | "allTime";

// Types for Score Analytics
export interface OverallScoreStats {
  averageScore: number;
  previousAverageScore: number | null;
  improvement: number | null; // Percentage
  totalAssessments: number;
  currentPeriodLabel: string; // e.g., "Last 30 Days", "Mar 2023 - May 2023"
  previousPeriodLabel: string | null; // e.g., "Previous 30 Days"
}

export interface TimePointScoreData {
  date: string; // ISO YYYY-MM-DD (representing day, start of week, or start of month)
  averageScore: number;
  assessmentCount: number;
}

export interface SubjectScorePerformance {
  subject: string; // Category name
  averageScore: number;
  assessmentCount: number;
}

export interface ScoreAnalyticsData {
  overallStats: OverallScoreStats;
  timeSeriesData: TimePointScoreData[];
  subjectPerformance: SubjectScorePerformance[];
}

// Types for Quiz Completion Analytics
export interface QuizCompletionMetrics {
  totalQuizzes: number;
  completedQuizzes: number;
  completionRate: number;
  averageScore: number;
  averageAttempts: number;
}

export interface QuizBreakdownItem {
  quizId: string;
  title: string;
  className: string;
  completionStatus: "completed" | "in_progress" | "not_started";
  bestScore: number | null;
  attemptCount: number;
  lastAttemptDate: string | null;
}

export interface CompletionTrendPoint {
  period: string;
  completedCount: number;
  averageScore: number;
}

export interface CategoryAnalysisItem {
  category: string;
  quizCount: number;
  completedCount: number;
  completionRate: number;
  averageScore: number;
}

export interface QuizCompletionAnalyticsData {
  keyMetrics: QuizCompletionMetrics;
  quizBreakdown: QuizBreakdownItem[];
  completionTrends: CompletionTrendPoint[];
  categoryAnalysis: CategoryAnalysisItem[];
}

// Interface for cache data with timestamps
interface CachedData<T> {
  data: T;
  timestamp: number;
  timeFrame: TimeFrame;
}

// Context Interface
interface AnalyticsContextType {
  // Class Participation Analytics
  classParticipationData: ClassParticipationData | null;
  classParticipationError: string | null;
  isLoadingClassParticipation: boolean;
  timeFrame: TimeFrame;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  fetchClassParticipation: () => Promise<ClassParticipationData | null>;
  
  // Score Analytics (can be expanded as needed)
  scoreAnalyticsData: ScoreAnalyticsData | null;
  scoreAnalyticsError: string | null;
  isLoadingScoreAnalytics: boolean;
  fetchScoreAnalytics: () => Promise<ScoreAnalyticsData | null>;

  // Quiz Completion Analytics
  quizCompletionData: QuizCompletionAnalyticsData | null;
  quizCompletionError: string | null;
  isLoadingQuizCompletion: boolean;
  fetchQuizCompletion: () => Promise<QuizCompletionAnalyticsData | null>;
}

// Helper to generate empty class participation data
export const generateEmptyClassParticipationData = (): ClassParticipationData => {
  return {
    keyMetrics: {
      activeClasses: 0,
      overallEngagementRate: 0,
      totalStudyTimeSeconds: 0,
    },
    classPerformanceBreakdown: [],
    participationOverTime: [],
  };
};

// Helper to generate empty score analytics data
export const generateEmptyScoreAnalyticsData = (): ScoreAnalyticsData => {
  return {
    overallStats: {
      averageScore: 0,
      previousAverageScore: null,
      improvement: null,
      totalAssessments: 0,
      currentPeriodLabel: "No data available",
      previousPeriodLabel: null,
    },
    timeSeriesData: [],
    subjectPerformance: [],
  };
};

// Helper to convert new data format to legacy format for backward compatibility
export const convertToLegacyFormat = (data: ClassParticipationData): LegacyClassParticipationData => {
  // Create dummy class counts
  const classCounts: ClassCounts = {
    total: data.keyMetrics.activeClasses,
    active: data.keyMetrics.activeClasses,
    completed: 0,
    upcoming: 0,
  };

  // Create active vs passive participation
  const classActivities: ClassActivity[] = [
    { 
      name: "Active Participation", 
      value: data.keyMetrics.overallEngagementRate 
    },
    { 
      name: "Passive Viewing", 
      value: 100 - data.keyMetrics.overallEngagementRate
    }
  ];

  // Create class engagement data
  const classEngagement: ClassEngagement[] = data.classPerformanceBreakdown.map(cls => ({
    name: cls.className,
    quizzes: cls.quizzesCompletedByStudent,
    assignments: 0, // Not available in new format
    discussions: 0, // Not available in new format
  }));

  // Create dummy recent activities (not available in new format)
  const recentActivities: RecentActivity[] = [];

  return {
    classCounts,
    classActivities,
    classEngagement,
    recentActivities,
  };
};

// Helper to generate empty quiz completion analytics data
export const generateEmptyQuizCompletionAnalyticsData = (): QuizCompletionAnalyticsData => {
  return {
    keyMetrics: {
      totalQuizzes: 0,
      completedQuizzes: 0,
      completionRate: 0,
      averageScore: 0,
      averageAttempts: 0,
    },
    quizBreakdown: [],
    completionTrends: [],
    categoryAnalysis: [],
  };
};

// Helper to transform API quiz completion data to expected format
const transformQuizCompletionAPIData = (apiData: any): QuizCompletionAnalyticsData => {
  if (!apiData) return generateEmptyQuizCompletionAnalyticsData();

  // Extract data for keyMetrics
  const keyMetrics: QuizCompletionMetrics = {
    totalQuizzes: apiData.totalQuizzes || 0,
    completedQuizzes: apiData.completedQuizzes || 0,
    completionRate: apiData.completionRate || 0,
    averageScore: apiData.averageScore || 0,
    averageAttempts: apiData.averageAttempts || 1,
  };

  // Transform subjectStats to categoryAnalysis
  const categoryAnalysis: CategoryAnalysisItem[] = (apiData.subjectStats || []).map((stat: any) => ({
    category: stat.subject || "Uncategorized",
    quizCount: stat.totalQuizzes || 0,
    completedCount: stat.completedQuizzes || 0,
    completionRate: stat.completionRate || 0,
    averageScore: stat.averageScore || 0,
  }));

  // Use the actual completionTrends data if available
  const completionTrends: CompletionTrendPoint[] = apiData.completionTrends || [];
  
  // Use the actual quiz breakdown data if available
  const quizBreakdown: QuizBreakdownItem[] = apiData.quizBreakdown || [];
  
  return {
    keyMetrics,
    categoryAnalysis,
    completionTrends,
    quizBreakdown,
  };
};

// Create context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Provider props
interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Add session check
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const userRole = session?.user?.role as Role | undefined;
  const hasAccess = isAuthenticated && userRole !== undefined;

  // User initialization state tracking
  const [isUserInitialized, setIsUserInitialized] = useState(false);
  
  // Reference to track initial mounting
  const isInitialMount = useRef(true);

  // Track if analytics are needed
  const shouldEnableAnalytics = useMemo(() => {
    // Only enable if authenticated and has a role
    return hasAccess && isUserInitialized;
  }, [hasAccess, isUserInitialized]);

  // Initialize user state once auth status is settled
  useEffect(() => {
    if (status !== "loading") {
      setIsUserInitialized(true);
      
      // In development, log the analytics state
      if (process.env.NODE_ENV === 'development') {
        console.info(`Analytics provider initialized with auth status: ${status}, role: ${userRole || 'none'}`);
      }
    }
  }, [status, userRole]);

  // Class Participation state
  const [classParticipationData, setClassParticipationData] = useState<ClassParticipationData | null>(null);
  const [classParticipationError, setClassParticipationError] = useState<string | null>(null);
  const [isLoadingClassParticipation, setIsLoadingClassParticipation] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("last30days");
  
  // Score Analytics state
  const [scoreAnalyticsData, setScoreAnalyticsData] = useState<ScoreAnalyticsData | null>(null);
  const [scoreAnalyticsError, setScoreAnalyticsError] = useState<string | null>(null);
  const [isLoadingScoreAnalytics, setIsLoadingScoreAnalytics] = useState(false);
  
  // Quiz Completion Analytics state
  const [quizCompletionData, setQuizCompletionData] = useState<QuizCompletionAnalyticsData | null>(null);
  const [quizCompletionError, setQuizCompletionError] = useState<string | null>(null);
  const [isLoadingQuizCompletion, setIsLoadingQuizCompletion] = useState(false);
  
  // Cache refs to store data with timestamps
  const classParticipationCache = useRef<Map<TimeFrame, CachedData<ClassParticipationData>>>(new Map());
  const quizCompletionCache = useRef<Map<TimeFrame, CachedData<QuizCompletionAnalyticsData>>>(new Map());
  const scoreAnalyticsCache = useRef<Map<TimeFrame, CachedData<ScoreAnalyticsData>>>(new Map());
  
  // Fetch operation tracking refs with AbortController support
  const fetchingClassParticipation = useRef<{isLoading: boolean, controller?: AbortController}>({isLoading: false});
  const fetchingScoreAnalytics = useRef<{isLoading: boolean, controller?: AbortController}>({isLoading: false});
  const fetchingQuizCompletion = useRef<{isLoading: boolean, controller?: AbortController}>({isLoading: false});
  
  const { toast } = useToast();
  
  // Clear cache when session changes
  useEffect(() => {
    if (status === "unauthenticated") {
      // Clear all caches when user logs out
      classParticipationCache.current.clear();
      quizCompletionCache.current.clear();
      scoreAnalyticsCache.current.clear();
      
      // Clear any in-progress fetches
      if (fetchingClassParticipation.current.controller) {
        fetchingClassParticipation.current.controller.abort();
        fetchingClassParticipation.current = {isLoading: false};
      }
      
      if (fetchingScoreAnalytics.current.controller) {
        fetchingScoreAnalytics.current.controller.abort();
        fetchingScoreAnalytics.current = {isLoading: false};
      }
      
      if (fetchingQuizCompletion.current.controller) {
        fetchingQuizCompletion.current.controller.abort();
        fetchingQuizCompletion.current = {isLoading: false};
      }
      
      // Reset states
      setClassParticipationData(null);
      setScoreAnalyticsData(null);
      setQuizCompletionData(null);
    }
  }, [status]);
  
  // Check if cache is valid
  const isCacheValid = <T,>(cache: CachedData<T> | null, expirationMinutes: number): boolean => {
    if (!cache) return false;
    
    const now = Date.now();
    const expirationMs = expirationMinutes * 60 * 1000;
    return (now - cache.timestamp) < expirationMs;
  };

  // Memory management - clear old cached items
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes max cache age
    
    // Helper to clean a specific cache
    const cleanSingleCache = <T,>(cache: Map<TimeFrame, CachedData<T>>) => {
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > MAX_CACHE_AGE_MS) {
          cache.delete(key);
        }
      }
    };
    
    // Clean all caches
    cleanSingleCache(classParticipationCache.current);
    cleanSingleCache(quizCompletionCache.current);
    cleanSingleCache(scoreAnalyticsCache.current);
  }, []);
  
  // Periodically clean cache to prevent memory leaks
  useEffect(() => {
    const intervalId = setInterval(cleanupCache, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(intervalId);
  }, [cleanupCache]);

  // Configuration for cache expiration times (in minutes)
  const CACHE_EXPIRATION = {
    classParticipation: 15, // 15 minutes
    scoreAnalytics: 15,     // 15 minutes
    quizCompletion: 15,     // 15 minutes
  };
  
  // Check if current user has permission to access analytics
  const canAccessAnalytics = useCallback(() => {
    // Only allow authenticated users
    if (!isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.info("Analytics access denied: User not authenticated");
      }
      return { allowed: false, reason: "authentication" };
    }
    
    // Make sure user has a role
    if (!userRole) {
      if (process.env.NODE_ENV === 'development') {
        console.info("Analytics access denied: User has no role assigned");
      }
      return { allowed: false, reason: "role" };
    }

    // All authenticated users with roles can access their own analytics
    return { allowed: true, reason: null };
  }, [isAuthenticated, userRole]);

  // Check if user has student access for student-specific analytics
  const hasStudentAccess = useCallback(() => {
    return isAuthenticated && userRole === Role.STUDENT;
  }, [isAuthenticated, userRole]);

  // Generic fetch function to reduce code duplication
  const fetchWithAuth = useCallback(async <T,>(
    url: string,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
    setData: (data: T | null) => void,
    fetchRef: React.MutableRefObject<{isLoading: boolean, controller?: AbortController}>,
    cacheMap: Map<TimeFrame, CachedData<T>>,
    cacheExpiration: number,
    errorTitle: string,
    provideFallback: boolean = false,
    fallbackData: T | null = null,
    additionalParams: Record<string, string> = {}
  ): Promise<T | null> => {
    // Check permissions before fetching
    const accessCheck = canAccessAnalytics();
    if (!accessCheck.allowed) {
      if (process.env.NODE_ENV === 'development') {
        console.info(`Analytics access denied for ${url}: ${accessCheck.reason}`);
      }
      return null;
    }

    // Check if already fetching
    if (fetchRef.current.isLoading) {
      // Cancel previous fetch if it's still in progress
      if (fetchRef.current.controller) {
        fetchRef.current.controller.abort();
      }
    }

    // Check if we have valid cached data for this timeFrame
    const cachedData = cacheMap.get(timeFrame);
    if (cachedData && isCacheValid(cachedData, cacheExpiration)) {
      setData(cachedData.data);
      return cachedData.data;
    }

    // Create new abort controller
    const controller = new AbortController();
    fetchRef.current = { isLoading: true, controller };

    setLoading(true);
    setError(null);

    try {
      // Build URL with timeFrame and additional parameters
      const params = new URLSearchParams({
        timeFrame,
        ...additionalParams
      });
      const fullUrl = `${url}?${params.toString()}`;

      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching analytics data from: ${fullUrl}`);
      }

      const response = await fetch(fullUrl, {
        signal: controller.signal,
        // Add cache control headers
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        let errorMessage: string;
        try {
        const errorData = await response.json();
          errorMessage = errorData.error || `Error: ${response.status}`;
        } catch (e) {
          errorMessage = `Error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || `Failed to load data from ${url}`);
      }
      
      const data = result.data;
      
      // Update cache with fresh data
      cacheMap.set(timeFrame, {
        data,
        timestamp: Date.now(),
        timeFrame
      });
      
      setData(data);
      return data;
    } catch (err) {
      // Only handle errors if the fetch wasn't aborted
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error fetching ${url}:`, err);
        }
        
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        
        // Show toast for unexpected errors
      toast({
        variant: "destructive",
          title: errorTitle,
          description: "Please try again later or contact support if the problem persists.",
        });
        
        // Use fallback data if requested
        if (provideFallback && fallbackData !== null) {
          setData(fallbackData);
          return fallbackData;
        } else {
          setData(null);
          return null;
        }
      }
      return null;
    } finally {
      if (fetchRef.current.controller === controller) {
        // Only reset if this is the current controller
        fetchRef.current = { isLoading: false };
        setLoading(false);
      }
    }
  }, [timeFrame, toast, canAccessAnalytics]);
  
  // Fetch Class Participation data with enhanced error handling and caching
  const fetchClassParticipation = useCallback(async (): Promise<ClassParticipationData | null> => {
    // Skip API call if user is not a student
    if (!hasStudentAccess()) {
      console.info("Class participation analytics skipped: User is not a student");
      return generateEmptyClassParticipationData();
    }

    return fetchWithAuth<ClassParticipationData>(
      '/api/users/me/class-participation-analytics',
      setIsLoadingClassParticipation,
      setClassParticipationError,
      setClassParticipationData,
      fetchingClassParticipation,
      classParticipationCache.current,
      CACHE_EXPIRATION.classParticipation,
      "Unable to load class analytics",
      true, // Provide fallback
      generateEmptyClassParticipationData(),
      { includePublicQuizzes: 'true' } // Include public quizzes in analytics
    );
  }, [fetchWithAuth, hasStudentAccess]);
  
  // Fetch score analytics data with enhanced error handling and caching
  const fetchScoreAnalytics = useCallback(async (): Promise<ScoreAnalyticsData | null> => {
    // Skip API call if user is not a student
    if (!hasStudentAccess()) {
      console.info("Score analytics skipped: User is not a student. Setting to empty data.");
      const emptyData = generateEmptyScoreAnalyticsData();
      setScoreAnalyticsData(emptyData);
      setIsLoadingScoreAnalytics(false); // Ensure loading state is also reset
      setScoreAnalyticsError(null);      // Clear any previous errors
      return emptyData;
    }

    return fetchWithAuth<ScoreAnalyticsData>(
      '/api/users/me/score-analytics',
      setIsLoadingScoreAnalytics,
      setScoreAnalyticsError,
      setScoreAnalyticsData,
      fetchingScoreAnalytics,
      scoreAnalyticsCache.current,
      CACHE_EXPIRATION.scoreAnalytics,
      "Unable to load score analytics",
      true, // Provide fallback
      generateEmptyScoreAnalyticsData(),
      { includePublicQuizzes: 'true' } // Include public quizzes in analytics
    );
  }, [fetchWithAuth, hasStudentAccess]);

  // Fetch Quiz Completion Analytics data with enhanced error handling and caching
  const fetchQuizCompletion = useCallback(async (): Promise<QuizCompletionAnalyticsData | null> => {
    // Skip API call if user is not a student
    if (!hasStudentAccess()) {
      console.info("Quiz completion analytics skipped: User is not a student");
      return generateEmptyQuizCompletionAnalyticsData();
    }
    
    // Set loading state
    setIsLoadingQuizCompletion(true);
    setQuizCompletionError(null);
    
    try {
      console.log("Fetching quiz completion data with timeFrame:", timeFrame); // Debug log
      
      // Check cache first if enabled
      if (shouldEnableAnalytics) {
        const cachedData = quizCompletionCache.current.get(timeFrame);
        if (cachedData && isCacheValid(cachedData, CACHE_EXPIRATION.quizCompletion)) {
          console.log("Using cached quiz completion data"); // Debug log
          setQuizCompletionData(cachedData.data);
          setIsLoadingQuizCompletion(false);
          return cachedData.data;
        }
      }
      
      // Build URL with timeFrame
      const url = `/api/users/me/quiz-completion-analytics?timeFrame=${timeFrame}`;
      console.log("Fetching from URL:", url); // Debug log
      
      const response = await fetch(url);
      
      // Log response status for debugging
      console.log("Quiz completion API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Quiz completion API response:", result); // Debug log
      
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch quiz completion analytics");
      }
      
      // Update state with fetched data
      setQuizCompletionData(transformQuizCompletionAPIData(result.data));
      
      // Cache the data if caching is enabled
      if (shouldEnableAnalytics) {
        quizCompletionCache.current.set(timeFrame, {
          data: transformQuizCompletionAPIData(result.data),
          timestamp: Date.now(),
          timeFrame,
        });
      }
      
      return transformQuizCompletionAPIData(result.data);
    } catch (error) {
      console.error("Error fetching quiz completion analytics:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setQuizCompletionError(errorMessage);
      return null;
    } finally {
      setIsLoadingQuizCompletion(false);
    }
  }, [timeFrame, shouldEnableAnalytics, hasStudentAccess]);

  // Track if initial fetches have been done
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  
  // Pre-fetch data when the user first loads a page with the provider
  useEffect(() => {
    if (isInitialMount.current && shouldEnableAnalytics && !hasInitialFetch) {
      isInitialMount.current = false;
      
      // Delay fetch slightly to prioritize UI rendering
      const timerId = setTimeout(() => {
        // Check access again since status could have changed
        const accessCheck = canAccessAnalytics();
        if (accessCheck.allowed) {
          // Use low priority fetch to get initial data
          Promise.allSettled([
            fetchClassParticipation(),
            fetchScoreAnalytics(),
            fetchQuizCompletion()
          ]).finally(() => {
            setHasInitialFetch(true);
          });
        } else {
          // Still mark as fetched to avoid unnecessary attempts
          setHasInitialFetch(true);
        }
      }, 100); // Small delay to let UI render first
      
      return () => clearTimeout(timerId);
    }
  }, [shouldEnableAnalytics, hasInitialFetch, fetchClassParticipation, fetchScoreAnalytics, fetchQuizCompletion, canAccessAnalytics]);

  // Handle time frame changes
  useEffect(() => {
    // Skip the initial render effect
    if (!hasInitialFetch) {
      return;
    }
    
    // Only fetch if analytics are enabled and user has permission
    if (!shouldEnableAnalytics) {
      return;
    }
    
    // Only fetch if user has permission
    const accessCheck = canAccessAnalytics();
    if (timeFrame && accessCheck.allowed) {
      // Use Promise.all to fetch data in parallel but manage errors separately
      Promise.allSettled([
        fetchClassParticipation(),
        fetchScoreAnalytics(),
        fetchQuizCompletion()
      ]).catch(error => {
        // This catch will only trigger for errors in the Promise.allSettled itself
        // Individual promise rejections are handled by the fetchWithAuth function
        if (process.env.NODE_ENV === 'development') {
          console.error("Error during parallel analytics data fetch:", error);
        }
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.info(`Skip data fetching: ${accessCheck.reason || 'unknown reason'}`);
    }
  }, [timeFrame, hasInitialFetch, fetchClassParticipation, fetchQuizCompletion, fetchScoreAnalytics, canAccessAnalytics, shouldEnableAnalytics]);
  
  // Value for the context provider
  const value = {
    classParticipationData,
    classParticipationError,
    isLoadingClassParticipation,
    timeFrame,
    setTimeFrame,
    fetchClassParticipation,
    
    scoreAnalyticsData,
    scoreAnalyticsError,
    isLoadingScoreAnalytics,
    fetchScoreAnalytics,

    quizCompletionData,
    quizCompletionError,
    isLoadingQuizCompletion,
    fetchQuizCompletion,
  };
  
  // Skip provider rendering if analytics are definitely disabled (user logged out)
  // This prevents unnecessary rendering and initialization when not needed
  if (status === "unauthenticated") {
    return <>{children}</>;
  }
  
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to use the analytics context
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  const { data: session, status } = useSession();
  
  // If we're using this hook outside of the provider
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  
  // Return a safe fallback state if user is definitely unauthenticated
  // This prevents unhandled errors in components that expect the context
  if (status === "unauthenticated") {
    return {
      classParticipationData: null,
      classParticipationError: "Authentication required",
      isLoadingClassParticipation: false,
      timeFrame: "last30days",
      setTimeFrame: (_: TimeFrame) => {},
      fetchClassParticipation: async () => null,
      
      scoreAnalyticsData: null,
      scoreAnalyticsError: "Authentication required",
      isLoadingScoreAnalytics: false,
      fetchScoreAnalytics: async () => null,

      quizCompletionData: null,
      quizCompletionError: "Authentication required",
      isLoadingQuizCompletion: false,
      fetchQuizCompletion: async () => null,
    };
  }
  
  return context;
} 