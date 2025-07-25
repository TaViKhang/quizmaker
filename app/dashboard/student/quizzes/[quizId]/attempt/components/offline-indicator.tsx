'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  lastSavedTimestamp: Date | null;
}

export default function OfflineIndicator({ lastSavedTimestamp }: OfflineIndicatorProps) {
  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Alert className="border-yellow-500 bg-yellow-50">
      <WifiOff className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Mất kết nối internet</AlertTitle>
      <AlertDescription className="text-yellow-700">
        Bạn đang ở chế độ ngoại tuyến. Câu trả lời của bạn đang được lưu trên thiết bị này và sẽ được
        đồng bộ khi bạn kết nối lại.
        {lastSavedTimestamp && (
          <div className="mt-1 text-sm">
            Lần lưu gần nhất: {formatTime(lastSavedTimestamp)}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
} 