"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics, TimeFrame } from "@/components/providers/analytics-provider";
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

/**
 * MockTestButton Component
 * 
 * This component provides buttons for testing various API endpoints during development.
 * It allows developers to quickly test API responses without needing to set up test data.
 */
export default function MockTestButton() {
  const { toast } = useToast();
  const { fetchClassParticipation, setTimeFrame, timeFrame } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);
  
  const testClassParticipationAPI = async () => {
    setIsLoading(true);
    
    try {
      await fetchClassParticipation();
      toast({
        title: "API Test Successful",
        description: `Class participation data fetched successfully with timeFrame: ${timeFrame}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "API Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value as TimeFrame);
  };

  // Function to test class participation analytics API
  const testClassParticipationAnalytics = async (timeFrame: string = 'last30days') => {
    try {
      const response = await fetch(`/api/users/me/class-participation-analytics?timeFrame=${timeFrame}`);
      const data = await response.json();
      
      console.log(`Class Participation Analytics (${timeFrame}):`, data);
      
      toast({
        title: `Class Participation Test (${timeFrame})`,
        description: response.ok 
          ? 'Successfully fetched data. Check console for details.' 
          : `Error: ${data.error || 'Unknown error'}`,
        variant: response.ok ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error testing class participation analytics:', error);
      toast({
        title: 'Test Failed',
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // Function to test quiz completion analytics API
  const testQuizCompletionAnalytics = async (timeFrame: string = 'last30days') => {
    try {
      const response = await fetch(`/api/users/me/quiz-completion-analytics?timeFrame=${timeFrame}`);
      const data = await response.json();
      
      console.log(`Quiz Completion Analytics (${timeFrame}):`, data);
      
      toast({
        title: `Quiz Completion Test (${timeFrame})`,
        description: response.ok 
          ? 'Successfully fetched data. Check console for details.' 
          : `Error: ${data.error || 'Unknown error'}`,
        variant: response.ok ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error testing quiz completion analytics:', error);
      toast({
        title: 'Test Failed',
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {/* Class Participation Analytics Test */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            Test Class Participation
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => testClassParticipationAnalytics('last7days')}>
            Last 7 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testClassParticipationAnalytics('last30days')}>
            Last 30 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testClassParticipationAnalytics('last90days')}>
            Last 90 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testClassParticipationAnalytics('allTime')}>
            All Time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quiz Completion Analytics Test */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            Test Quiz Completion
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => testQuizCompletionAnalytics('last7days')}>
            Last 7 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testQuizCompletionAnalytics('last30days')}>
            Last 30 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testQuizCompletionAnalytics('last90days')}>
            Last 90 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testQuizCompletionAnalytics('allTime')}>
            All Time
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 