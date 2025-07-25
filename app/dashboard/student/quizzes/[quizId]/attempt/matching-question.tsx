'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Option } from '@/lib/question-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import { shuffleArray } from '@/lib/question-utils';

export interface MatchingQuestionProps {
  options: Option[];
  existingAnswer?: Record<string, string>;
  onChange: (matches: Record<string, string>) => void;
  disabled?: boolean;
  showCorrect?: boolean;
  metadata?: {
    shuffleOptions?: boolean;
  };
}

export function MatchingQuestion({
  options,
  existingAnswer,
  onChange,
  disabled = false,
  showCorrect = false,
  metadata
}: MatchingQuestionProps) {
  const [matches, setMatches] = useState<Record<string, string>>(existingAnswer || {});
  
  const leftOptions = useMemo(() => options
    .filter(opt => opt.group === 'premise')
    .sort((a, b) => a.order - b.order), [options]);
  
  const rightOptions = useMemo(() => {
    let filteredRight = options
      .filter(opt => opt.group === 'response')
      .sort((a, b) => a.order - b.order);
    
    if (metadata?.shuffleOptions && !disabled && !showCorrect) {
      return shuffleArray(filteredRight);
    }
    return filteredRight;
  }, [options, metadata?.shuffleOptions, disabled, showCorrect]);
  
  useEffect(() => {
    if (existingAnswer) {
      setMatches(existingAnswer);
    } else {
      const initialMatches: Record<string, string> = {};
      leftOptions.forEach(opt => {
        initialMatches[opt.id] = '';
      });
      setMatches(initialMatches);
    }
  }, [existingAnswer, leftOptions]);
  
  const handleMatchChange = (leftId: string, rightId: string) => {
    const newMatches = { ...matches, [leftId]: rightId };
    setMatches(newMatches);
    onChange(newMatches);
  };
  
  // Function to check if a match is correct
  const isCorrectMatch = (leftOption: Option) => {
    const selectedRightId = matches[leftOption.id];
    return leftOption.matchId === selectedRightId;
  };
  
  // Get the correct right option for a left option
  const getCorrectRightOption = (leftOption: Option) => {
    const originalRightOptions = options
      .filter(opt => opt.group === 'response')
      .sort((a, b) => a.order - b.order);
    return originalRightOptions.find(opt => opt.id === leftOption.matchId);
  };
  
  return (
    <div className="space-y-4">
      {leftOptions.map((leftOption) => {
        const userSelectedRight = rightOptions.find(opt => opt.id === matches[leftOption.id]);
        const isCorrectCurrentMatch = isCorrectMatch(leftOption);
        const correctRightForDisplay = getCorrectRightOption(leftOption);
        
        return (
          <div
            key={leftOption.id}
            className={`flex items-center gap-2 p-2 rounded-md ${
              showCorrect && matches[leftOption.id]
                ? (isCorrectCurrentMatch ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10')
                : ''
            }`}
          >
            <div className="font-medium min-w-40" dangerouslySetInnerHTML={{ __html: leftOption.content }} />
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Select
                value={matches[leftOption.id] || ''}
                onValueChange={(value) => handleMatchChange(leftOption.id, value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a match..." />
                </SelectTrigger>
                <SelectContent>
                  {rightOptions.map((rightOption) => (
                    <SelectItem key={rightOption.id} value={rightOption.id}>
                      <span dangerouslySetInnerHTML={{ __html: rightOption.content }} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {showCorrect && matches[leftOption.id] && !isCorrectCurrentMatch && correctRightForDisplay && (
              <div className="text-xs text-red-600">
                Correct: <span dangerouslySetInnerHTML={{ __html: correctRightForDisplay.content }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 