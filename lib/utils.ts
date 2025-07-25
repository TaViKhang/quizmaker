import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely access theme state to avoid hydration errors
 * This is useful for conditionally rendering theme-dependent UI
 * 
 * @param theme Current theme from useTheme hook
 * @param mounted Boolean indicating if component is mounted
 * @returns Safe theme value or null if not mounted
 */
export function getSafeTheme(
  theme: string | undefined, 
  mounted: boolean
): "light" | "dark" | "system" | null {
  if (!mounted) return null
  return (theme as "light" | "dark" | "system") || null
}

/**
 * Generate a random alphanumeric code of specified length
 * @param length Length of the code to generate
 * @returns Random alphanumeric string
 */
export function generateRandomCode(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
}

/**
 * Format duration in milliseconds to a human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted duration string (e.g., "1h 30m" or "45m")
 */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0 minutes";
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  
  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }
  
  return parts.join(' ');
}

/**
 * Normalize metadata to ensure correct format
 * @param metadata Metadata object or string to normalize
 * @returns Normalized object or null if invalid
 */
export function normalizeMetadata<T extends Record<string, any> = Record<string, any>>(metadata: unknown): T | null {
  // Return null for falsy values (undefined, null, empty string, etc.)
  if (!metadata) return null;
  
  try {
    // If metadata is already an object, return it directly with type assertion
    if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
      // Remove null/undefined values for consistency
      const cleanedMetadata = Object.fromEntries(
        Object.entries(metadata as Record<string, any>).filter(([_, v]) => v !== null && v !== undefined)
      );
      
      return cleanedMetadata as T;
    }
    
    // If metadata is a string, try to parse it as JSON
    if (typeof metadata === 'string') {
      try {
        const parsed = JSON.parse(metadata);
        
        // Ensure the parsed result is actually an object
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          // Clean up null/undefined values
          const cleanedMetadata = Object.fromEntries(
            Object.entries(parsed).filter(([_, v]) => v !== null && v !== undefined)
          );
          
          return cleanedMetadata as T;
        }
        
        // If parsed but not an object, return null
        return null;
      } catch (parseError) {
        console.warn("Failed to parse metadata string:", parseError);
        return null;
    }
    }
    
    // For all other types (number, boolean, etc.), return null
    return null;
  } catch (error) {
    console.error("Failed to normalize metadata:", error);
    return null;
  }
}

/**
 * Prepare metadata for database storage
 * @param metadata Metadata object to prepare
 * @returns Stringified metadata or null
 */
export function prepareMetadataForDB(metadata: Record<string, any> | null): string | null {
  if (!metadata) return null;
  
  try {
    // Remove null/undefined properties
    const cleanMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([_, v]) => v !== null && v !== undefined)
    );
    
    // Check if any properties remain
    if (Object.keys(cleanMetadata).length === 0) {
      return null;
    }
    
    return JSON.stringify(cleanMetadata);
  } catch (error) {
    console.error("Failed to prepare metadata for DB:", error);
    return null;
  }
}
