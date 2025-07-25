"use client";

import { QuestionType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckSquare, 
  FileText, 
  Check, 
  Edit3, 
  Shuffle, 
  AlignLeft,
  Code,
  X
} from "lucide-react";

interface QuestionTypeOption {
  type: QuestionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface QuestionTypeSelectorProps {
  onSelectType: (type: QuestionType) => void;
}

export function QuestionTypeSelector({ onSelectType }: QuestionTypeSelectorProps) {
  const questionTypes: QuestionTypeOption[] = [
    {
      type: QuestionType.MULTIPLE_CHOICE,
      label: "Multiple Choice",
      icon: <CheckSquare className="h-5 w-5" />,
      description: "Create a question with multiple answer choices. Can have one or more correct answers."
    },
    {
      type: QuestionType.TRUE_FALSE,
      label: "True/False",
      icon: <Check className="h-5 w-5" />,
      description: "Ask a question with true or false as the only possible answers."
    },
    {
      type: QuestionType.SHORT_ANSWER,
      label: "Short Answer",
      icon: <Edit3 className="h-5 w-5" />,
      description: "Ask students to provide a brief text response that can be auto-graded."
    },
    {
      type: QuestionType.ESSAY,
      label: "Essay",
      icon: <FileText className="h-5 w-5" />,
      description: "Allow students to provide a detailed response that you'll grade manually."
    },
    {
      type: QuestionType.MATCHING,
      label: "Matching",
      icon: <Shuffle className="h-5 w-5" />,
      description: "Create pairs of items that students need to match correctly."
    },
    {
      type: QuestionType.FILL_BLANK,
      label: "Fill in the Blank",
      icon: <AlignLeft className="h-5 w-5" />,
      description: "Create text with missing words that students must complete."
    },
    {
      type: QuestionType.CODE,
      label: "Code",
      icon: <Code className="h-5 w-5" />,
      description: "Ask students to write or complete code snippets."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {questionTypes.map((option) => (
        <Card
          key={option.type}
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors flex items-start gap-3"
          onClick={() => onSelectType(option.type)}
        >
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            {option.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{option.label}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {option.description}
            </p>
          </div>
        </Card>
      ))}

      <div className="md:col-span-2 flex justify-end mt-2">
        <Button variant="outline" onClick={() => onSelectType(QuestionType.MULTIPLE_CHOICE)}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
} 