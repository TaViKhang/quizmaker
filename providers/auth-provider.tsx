"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";

// User activity tracking component
function ActivityTracker() {
  const { data: session } = useSession();
  
  useEffect(() => {
    if (!session) return;
    
    // Function to update the user's last activity time
    const updateActivity = () => {
      document.cookie = `last-activity=${Math.floor(Date.now() / 1000)}; path=/; max-age=${60 * 60}; SameSite=Lax`;
    };
    
    // Update activity on initial load
    updateActivity();
    
    // Add event listeners for user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Throttle function to limit updates (once every 5 minutes)
    let lastUpdate = Date.now();
    const THROTTLE_TIME = 5 * 60 * 1000; // 5 minutes
    
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > THROTTLE_TIME) {
        updateActivity();
        lastUpdate = now;
      }
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Clean up event listeners
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session]);
  
  return null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <ActivityTracker />
      {children}
    </SessionProvider>
  );
} 