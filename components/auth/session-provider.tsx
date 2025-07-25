"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { useState, useEffect, type ReactNode } from "react"

export interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Đảm bảo session sẵn sàng trước khi render children
  useEffect(() => {
    // Thêm một khoảng thời gian ngắn để đảm bảo session được fetch đầy đủ
    const timer = setTimeout(() => {
      setIsSessionReady(true);
    }, 100);

    // Xử lý lỗi NextAuth fetch
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('next-auth') || 
          event.message.includes('auth/session') ||
          event.message.includes('Unexpected token')) {
        console.warn('NextAuth session fetch error detected:', event.message);
        // Vẫn render UI mặc dù có lỗi session
        setIsSessionReady(true);
        setHasError(true);
      }
    };

    // Lắng nghe lỗi
    window.addEventListener('error', handleError);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Xử lý lỗi session trong chuỗi event
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && 
          (String(event.reason).includes('next-auth') || 
          String(event.reason).includes('auth/session'))) {
        console.warn('NextAuth promise rejection:', event.reason);
        setIsSessionReady(true);
        setHasError(true);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <NextAuthSessionProvider 
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {isSessionReady ? children : null}
    </NextAuthSessionProvider>
  )
} 