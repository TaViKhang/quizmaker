'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeDisplayProps {
  remainingTime: number | null;
  isSubmitting: boolean;
}

export default function TimeDisplay({ 
  remainingTime,
  isSubmitting
}: TimeDisplayProps) {
  // Format time as HH:MM:SS
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get appropriate styling for time display
  const getTimeStyle = (): string => {
    if (remainingTime === null) return 'text-slate-500';
    if (isSubmitting) return 'text-slate-500';
    
    // Red when less than 5 minutes
    if (remainingTime < 300) return 'text-red-500';
    
    // Orange when less than 10 minutes
    if (remainingTime < 600) return 'text-orange-500';
    
    return 'text-slate-700';
  };
  
  // Render clock icon with appropriate color
  const renderClockIcon = () => {
    if (remainingTime === null) return <Clock className="h-5 w-5 text-slate-500" />;
    if (isSubmitting) return <Clock className="h-5 w-5 text-slate-500" />;
    
    if (remainingTime < 300) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    
    if (remainingTime < 600) {
      return <Clock className="h-5 w-5 text-orange-500" />;
    }
    
    return <Clock className="h-5 w-5 text-slate-700" />;
  };
  
  return (
    <Card className="flex items-center gap-2 px-3 py-2 bg-slate-50 border">
      {renderClockIcon()}
      <span className={`font-mono font-medium ${getTimeStyle()}`}>
        {formatTime(remainingTime)}
      </span>
    </Card>
  );
} 