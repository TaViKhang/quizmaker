'use client';

import { useState, useEffect } from 'react';

interface CodeQuestionProps {
  language: string;
  initialCode?: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CodeQuestion({
  language = 'javascript',
  initialCode = '',
  value,
  onChange,
  placeholder = '// Write your code here...',
  disabled = false
}: CodeQuestionProps) {
  const [code, setCode] = useState(value || initialCode || '');

  // Update code when the value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setCode(value);
    }
  }, [value]);

  // Handle code changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange(newCode);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          Language: <span className="font-mono">{language}</span>
        </div>
      </div>
      
      <div className="relative border rounded-md">
        <textarea
          value={code}
          onChange={handleCodeChange}
          placeholder={placeholder}
          className="w-full h-64 p-3 font-mono bg-slate-950 text-slate-50 rounded-md resize-y"
          disabled={disabled}
          spellCheck={false}
          aria-label={`Code editor for ${language}`}
        />
      </div>
      
      <div className="text-xs text-muted-foreground">
        <span>Press Tab to indent</span>
      </div>
    </div>
  );
} 