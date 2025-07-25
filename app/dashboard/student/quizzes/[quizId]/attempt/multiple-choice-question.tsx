'use client';

import { Option } from '@/lib/question-utils';
import { useMemo } from 'react';
import { shuffleArray } from '@/lib/question-utils';
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, CheckSquare, Square } from "lucide-react";

interface MultipleChoiceQuestionProps {
  question: {
    id?: string;
    content?: string;
    options?: Option[];
  };
  selectedOptions: string[];
  onChange: (selection: string[]) => void;
  allowMultiple: boolean;
  shuffleOptionsEnabled: boolean;
  disabled?: boolean;
}

export function MultipleChoiceQuestion({ 
  question, 
  selectedOptions = [],
  onChange,
  allowMultiple = false,
  shuffleOptionsEnabled = false,
  disabled = false
}: MultipleChoiceQuestionProps) {
  // For single selection
  const handleRadioChange = (optionId: string) => {
    onChange([optionId]);
  };
  
  // For multiple selection
  const handleCheckboxChange = (optionId: string) => {
    if (allowMultiple) {
      const newSelection = selectedOptions.includes(optionId)
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];
        
      onChange(newSelection);
    } else {
      // Ensure single selection even with checkbox
      onChange([optionId]);
    }
  };
  
  // Process options - shuffle or sort by order
  const processedOptions = useMemo(() => {
    if (!question.options || question.options.length === 0) return [];
    
    if (shuffleOptionsEnabled) {
      // Use the shuffleArray function to randomize options
      return shuffleArray(question.options);
    } else {
      // Sort options by order as before
      return [...question.options].sort((a, b) => a.order - b.order);
    }
  }, [question.options, shuffleOptionsEnabled]);
  
  return (
    <div className="space-y-4">
      {/* Hiển thị nhãn loại câu hỏi */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={allowMultiple ? "secondary" : "outline"} className="text-xs">
          {allowMultiple ? (
            <>
              <CheckSquare className="h-3 w-3 mr-1" />
              Đa lựa chọn (Chọn một hoặc nhiều đáp án)
            </>
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Đơn lựa chọn (Chỉ chọn một đáp án)
            </>
          )}
        </Badge>
      </div>

      {allowMultiple ? (
        // Multiple selection (Checkboxes)
        <div className="space-y-3">
          {processedOptions.map(option => (
            <div key={option.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-slate-50">
              <Checkbox 
                id={option.id} 
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleCheckboxChange(option.id);
                  } else {
                    handleCheckboxChange(option.id);
                  }
                }}
                disabled={disabled}
                className="mt-1"
              />
              <Label 
                htmlFor={option.id} 
                className={`flex-1 ${disabled ? 'opacity-70' : 'cursor-pointer'}`}
                dangerouslySetInnerHTML={{ __html: option.content }}
              />
            </div>
          ))}
        </div>
      ) : (
        // Single selection (Radio buttons)
        <RadioGroup 
          value={selectedOptions.length > 0 ? selectedOptions[0] : undefined}
          onValueChange={handleRadioChange}
          disabled={disabled}
          className="space-y-3"
        >
          {processedOptions.map(option => (
            <div key={option.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-slate-50">
              <RadioGroupItem 
                id={option.id} 
                value={option.id}
                disabled={disabled}
                className="mt-1"
              />
              <Label 
                htmlFor={option.id} 
                className={`flex-1 ${disabled ? 'opacity-70' : 'cursor-pointer'}`}
                dangerouslySetInnerHTML={{ __html: option.content }}
              />
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
} 