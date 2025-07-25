'use client';

import React, { useState, useEffect } from 'react';
import { Option } from '@/lib/question-utils';

export interface FillBlankQuestionProps {
  text: string;
  options: Option[];
  caseSensitive?: boolean;
  existingAnswer?: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
  disabled?: boolean;
  showAnswers?: boolean;
}

export function FillBlankQuestion({
  text,
  options,
  caseSensitive = false,
  existingAnswer,
  onChange,
  disabled = false,
  showAnswers = false,
}: FillBlankQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(existingAnswer || {});
  
  useEffect(() => {
    if (existingAnswer) {
      setAnswers(existingAnswer);
    } else {
      // Initialize with empty strings for each blank
      const initialAnswers: Record<string, string> = {};
      options.forEach(option => {
        if (option.position !== undefined && option.position !== null) {
          initialAnswers[option.position.toString()] = '';
        }
      });
      setAnswers(initialAnswers);
    }
  }, [existingAnswer, options]);
  
  const handleInputChange = (position: string, value: string) => {
    const newAnswers = { ...answers, [position]: value };
    setAnswers(newAnswers);
    onChange(newAnswers);
  };
  
  // Function to check if the answer for a blank is correct
  const isCorrectAnswer = (position: string, userAnswer: string) => {
    const option = options.find(opt => 
      opt.position !== undefined && opt.position.toString() === position
    );
    
    if (!option) return false;
    
    if (caseSensitive) {
      return option.content.trim() === userAnswer.trim();
    } else {
      return option.content.trim().toLowerCase() === userAnswer.trim().toLowerCase();
    }
  };
  
  const getCorrectAnswer = (position: string) => {
    const option = options.find(opt => 
      opt.position !== undefined && opt.position.toString() === position
    );
    return option?.content || '';
  };
  
  const renderTextWithBlanks = () => {
    let result = [];
    let currentText = text;
    let match;
    const blankRegex = /\[blank_(\d+)\]/g;
    let lastIndex = 0;
    
    while ((match = blankRegex.exec(currentText)) !== null) {
      // Add text before the blank
      result.push(currentText.substring(lastIndex, match.index));
      
      // Get the blank position
      const position = match[1];
      const userAnswer = answers[position] || '';
      const isCorrect = isCorrectAnswer(position, userAnswer);
      const correctAnswer = getCorrectAnswer(position);
      
      // Add the input field for the blank
      result.push(
        <span key={`blank-${position}`} className="inline-block">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => handleInputChange(position, e.target.value)}
            className={`border px-2 py-1 rounded w-32 text-center inline-block 
              ${disabled ? 'bg-muted' : ''} 
              ${showAnswers && userAnswer 
                ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') 
                : 'border-input'
              }`}
            placeholder={`Blank ${position}`}
            disabled={disabled}
          />
          {showAnswers && userAnswer && !isCorrect && (
            <div className="text-xs mt-1 text-red-600">
              Correct: {correctAnswer}
            </div>
          )}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < currentText.length) {
      result.push(currentText.substring(lastIndex));
    }
    
    return result;
  };
  
  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap">
        {renderTextWithBlanks()}
      </div>
      {caseSensitive && (
        <div className="text-xs italic text-muted-foreground mt-1">
          Note: This question is case-sensitive.
        </div>
      )}
    </div>
  );
} 