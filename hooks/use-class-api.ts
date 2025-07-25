'use client';

import { useCallback, useState } from "react";
import { ClassListResponse, StudentClassDashboard, ClassMaterial, ClassAnnouncement } from "@/types/api-types";

// Interface for API context methods and state
interface UseClassApi {
  isLoading: boolean;
  error: string | null;
  // Classes 
  classes: ClassListResponse[];
  classDashboard: StudentClassDashboard | null;
  // Materials
  classMaterials: ClassMaterial[] | null;
  // Announcements
  classAnnouncements: ClassAnnouncement[] | null;
  // Methods
  fetchClasses: (options?: FetchClassesOptions) => Promise<ClassListResponse[]>;
  fetchClassDashboard: (classId: string) => Promise<StudentClassDashboard | null>;
  fetchClassMaterials: (classId: string, options?: FetchMaterialsOptions) => Promise<ClassMaterial[] | null>;
  fetchClassAnnouncements: (classId: string, options?: FetchAnnouncementsOptions) => Promise<ClassAnnouncement[] | null>;
  joinClass: (classCode: string) => Promise<boolean>;
}

// Option types for different API calls
interface FetchClassesOptions {
  page?: number;
  limit?: number;
  search?: string;
  onlyJoined?: boolean;
  type?: 'PUBLIC' | 'PRIVATE' | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FetchMaterialsOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

interface FetchAnnouncementsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

// Main hook implementation
export function useClassApi(): UseClassApi {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassListResponse[]>([]);
  const [classDashboard, setClassDashboard] = useState<StudentClassDashboard | null>(null);
  const [classMaterials, setClassMaterials] = useState<ClassMaterial[] | null>(null);
  const [classAnnouncements, setClassAnnouncements] = useState<ClassAnnouncement[] | null>(null);

  const handleApiError = (error: any) => {
    console.error('API error:', error);
    setError(error?.message || 'An unknown error occurred');
    return null;
  };

  // Fetch classes method
  const fetchClasses = useCallback(async (options: FetchClassesOptions = {}): Promise<ClassListResponse[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.search) queryParams.append('search', options.search);
      if (options.onlyJoined) queryParams.append('onlyJoined', 'true');
      if (options.type) queryParams.append('type', options.type);
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const response = await fetch(`/api/classes?${queryParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch classes');
      }

      setClasses(data.data || []);
      return data.data || [];
    } catch (error) {
      handleApiError(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch class dashboard method
  const fetchClassDashboard = useCallback(async (classId: string): Promise<StudentClassDashboard | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/classes/${classId}/dashboard`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch class dashboard');
      }

      setClassDashboard(data.data);
      return data.data;
    } catch (error) {
      return handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch class materials method
  const fetchClassMaterials = useCallback(async (
    classId: string,
    options: FetchMaterialsOptions = {}
  ): Promise<ClassMaterial[] | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.search) queryParams.append('search', options.search);
      if (options.type) queryParams.append('type', options.type);

      const response = await fetch(`/api/classes/${classId}/materials?${queryParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch class materials');
      }

      setClassMaterials(data.data);
      return data.data;
    } catch (error) {
      return handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch class announcements method
  const fetchClassAnnouncements = useCallback(async (
    classId: string,
    options: FetchAnnouncementsOptions = {}
  ): Promise<ClassAnnouncement[] | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.search) queryParams.append('search', options.search);

      const response = await fetch(`/api/classes/${classId}/announcements?${queryParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch class announcements');
      }

      setClassAnnouncements(data.data);
      return data.data;
    } catch (error) {
      return handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Join class method
  const joinClass = useCallback(async (classCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: classCode }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to join class');
      }

      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    classes,
    classDashboard,
    classMaterials,
    classAnnouncements,
    fetchClasses,
    fetchClassDashboard,
    fetchClassMaterials,
    fetchClassAnnouncements,
    joinClass,
  };
} 