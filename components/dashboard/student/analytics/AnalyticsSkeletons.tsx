"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";

interface AnalyticsSkeletonProps {
  /**
   * The type of analytics skeleton to display
   */
  type: "score" | "class" | "quiz";
  /**
   * The title to display in the skeleton
   */
  title?: string;
}

/**
 * Skeleton loading component for analytics sections
 * Follows the design system for consistent loading states
 */
export function AnalyticsSkeleton({
  type = "score",
  title = "Loading Analytics..."
}: AnalyticsSkeletonProps) {
  // Renders a metrics card skeleton
  const renderMetricCardSkeleton = (count: number = 4) => {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Renders a chart skeleton
  const renderChartSkeleton = (height: string = "h-[300px]") => {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className={`${height} flex items-center justify-center`}>
            <div className="w-full h-full bg-muted/20 rounded-md flex items-center justify-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renders a tabbed interface skeleton
  const renderTabbedSkeleton = () => {
    return (
      <Tabs defaultValue="tab1" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
          <TabsTrigger value="tab1" className="cursor-wait">
            <Skeleton className="h-4 w-16" />
          </TabsTrigger>
          <TabsTrigger value="tab2" className="cursor-wait">
            <Skeleton className="h-4 w-16" />
          </TabsTrigger>
          <TabsTrigger value="tab3" className="cursor-wait">
            <Skeleton className="h-4 w-16" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tab1">
          {renderChartSkeleton()}
        </TabsContent>
      </Tabs>
    );
  };
  
  // Different skeleton types based on analytics component
  if (type === "score") {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-[160px]" />
        </div>
        
        {renderMetricCardSkeleton(4)}
        
        <div className="space-y-6">
          {renderChartSkeleton()}
          {renderChartSkeleton()}
        </div>
      </div>
    );
  }
  
  if (type === "class") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-[160px]" />
        </div>
        
        {renderMetricCardSkeleton(4)}
        {renderTabbedSkeleton()}
      </div>
    );
  }
  
  if (type === "quiz") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-[160px]" />
        </div>
        
        {renderMetricCardSkeleton(3)}
        {renderTabbedSkeleton()}
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-4">
                    <Skeleton className="h-5 w-full mb-3" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Default fallback skeleton
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-2/3" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] flex items-center justify-center">
          <div className="w-full h-full bg-muted/20 rounded-md flex items-center justify-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 