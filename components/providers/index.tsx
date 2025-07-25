"use client";

import { ReactNode } from "react";
import { AnalyticsProvider } from "./analytics-provider";

interface ProvidersProps {
  children: ReactNode;
}

// Now AnalyticsProvider can be used safely because SessionProvider 
// is already in place from the RootLayout
export function Providers({ children }: ProvidersProps) {
  return (
    <AnalyticsProvider>
      {children}
    </AnalyticsProvider>
  );
} 