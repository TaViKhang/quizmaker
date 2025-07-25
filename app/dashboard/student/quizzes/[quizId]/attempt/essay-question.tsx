'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface EssayQuestionProps {
  value: string;
  onChange: (text: string) => void;
  minWords?: number;
  maxWords?: number;
  placeholder?: string;
  richText?: boolean;
  disabled?: boolean;
}

export function EssayQuestion({
  value,
  onChange,
  minWords,
  maxWords,
  placeholder = 'Enter your answer here...',
  richText = false,
  disabled = false
}: EssayQuestionProps) {
  const [wordCount, setWordCount] = useState(0);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Count words when text changes
  useEffect(() => {
    if (!value) {
      setWordCount(0);
      return;
    }
    
    // Split by whitespace to count words
    const words = value.trim().split(/\s+/);
    const count = value.trim() ? words.length : 0;
    setWordCount(count);
    
    // Check word limits
    if (maxWords && count > maxWords) {
      setIsError(true);
      setErrorMessage(`Your answer exceeds the maximum ${maxWords} words limit.`);
    } else if (minWords && count < minWords) {
      setIsError(true);
      setErrorMessage(`Your answer must contain at least ${minWords} words.`);
    } else {
      setIsError(false);
      setErrorMessage('');
    }
  }, [value, minWords, maxWords]);

  return (
    <div className="space-y-2">
      {richText ? (
        // Rich text input could be implemented with a rich text editor component
        <div className="border rounded-md">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary rounded-md resize-y"
            disabled={disabled}
          />
        </div>
      ) : (
        // Simple textarea for plain text
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 min-h-[150px] border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          disabled={disabled}
        />
      )}
      
      <div className="flex justify-between text-sm">
        <div className="flex items-center">
          {isError && (
            <div className="flex items-center text-red-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
        
        <div className={`${isError ? 'text-red-500' : 'text-muted-foreground'}`}>
          {wordCount} word{wordCount !== 1 ? 's' : ''} 
          {maxWords && ` / ${maxWords} max`}
        </div>
      </div>
    </div>
  );
} 