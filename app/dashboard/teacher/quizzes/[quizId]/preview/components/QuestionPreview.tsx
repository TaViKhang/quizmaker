"use client";

import { useMemo } from "react";
import { Question, QuestionType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, CheckCircle } from "lucide-react";

interface QuestionPreviewProps {
  question: Question & {
    options: {
      id: string;
      content: string;
      isCorrect: boolean;
      order: number;
      group?: string | null;
      matchId?: string | null;
    }[];
  };
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
  // Parse metadata based on question type
  const metadata = useMemo(() => {
    try {
      return question.metadata ? JSON.parse(JSON.stringify(question.metadata)) : {};
    } catch (e) {
      console.error("Error parsing question metadata", e);
      return {};
    }
  }, [question.metadata]);

  // Render question content with HTML
  const renderContent = () => {
    return (
      <div 
        className="mb-6 text-lg"
        dangerouslySetInnerHTML={{ __html: question.content }}
      />
    );
  };

  // Multiple Choice Question
  const renderMultipleChoice = () => {
    // Check if this is a multi-select or single-select question
    const isMultiSelect = question.options.filter(o => o.isCorrect).length > 1;
    
    return (
      <div className="space-y-4">
        {renderContent()}
        
        {isMultiSelect ? (
          <div className="space-y-3">
            {question.options
              .sort((a, b) => a.order - b.order)
              .map((option) => (
                <div key={option.id} className="flex items-start space-x-3 p-3 rounded-md border">
                  <Checkbox id={option.id} disabled />
                  <Label 
                    htmlFor={option.id} 
                    className="text-base cursor-pointer"
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                </div>
              ))}
          </div>
        ) : (
          <RadioGroup className="space-y-3">
            {question.options
              .sort((a, b) => a.order - b.order)
              .map((option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 rounded-md border">
                  <RadioGroupItem value={option.id} id={option.id} disabled />
                  <Label 
                    htmlFor={option.id} 
                    className="text-base cursor-pointer"
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                </div>
              ))}
          </RadioGroup>
        )}
      </div>
    );
  };

  // True/False Question
  const renderTrueFalse = () => {
    return (
      <div className="space-y-4">
        {renderContent()}
        
        <RadioGroup className="space-y-3">
          <div className="flex items-center space-x-3 p-3 rounded-md border">
            <RadioGroupItem value="true" id="true" disabled />
            <Label htmlFor="true" className="text-base cursor-pointer">True</Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md border">
            <RadioGroupItem value="false" id="false" disabled />
            <Label htmlFor="false" className="text-base cursor-pointer">False</Label>
          </div>
        </RadioGroup>
      </div>
    );
  };

  // Short Answer Question
  const renderShortAnswer = () => {
    return (
      <div className="space-y-4">
        {renderContent()}
        
        <div className="space-y-2">
          <Input 
            placeholder={metadata.placeholder || "Enter your answer"} 
            disabled 
          />
          <p className="text-xs text-muted-foreground">
            Type a short answer (case {metadata.caseSensitive ? "sensitive" : "insensitive"})
          </p>
        </div>
      </div>
    );
  };

  // Essay Question
  const renderEssay = () => {
    return (
      <div className="space-y-4">
        {renderContent()}
        
        <div className="space-y-2">
          <Textarea 
            placeholder={metadata.placeholder || "Enter your answer..."} 
            className="min-h-[150px]" 
            disabled 
          />
          {(metadata.minWords > 0 || metadata.maxWords > 0) && (
            <p className="text-xs text-muted-foreground">
              {metadata.minWords > 0 && `Minimum ${metadata.minWords} words`}
              {metadata.minWords > 0 && metadata.maxWords > 0 && " | "}
              {metadata.maxWords > 0 && `Maximum ${metadata.maxWords} words`}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Matching Question
  const renderMatching = () => {
    // Organize options into groups (premises and responses)
    const premises = question.options
      .filter(o => o.group === "premise")
      .sort((a, b) => a.order - b.order);
      
    const responses = question.options
      .filter(o => o.group === "response")
      .sort((a, b) => a.order - b.order);
    
    return (
      <div className="space-y-4">
        {renderContent()}
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Items</h3>
            <div className="space-y-2">
              {premises.map((premise, index) => (
                <div key={premise.id} className="flex items-center p-3 rounded-md border">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-medium mr-3">
                    {index + 1}
                  </div>
                  <span dangerouslySetInnerHTML={{ __html: premise.content }} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Matches</h3>
            <div className="space-y-2">
              {responses.map((response, index) => (
                <div key={response.id} className="flex items-center p-3 rounded-md border">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-700 font-medium mr-3">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span dangerouslySetInnerHTML={{ __html: response.content }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fill in the Blank Question
  const renderFillInBlank = () => {
    // Get template and blanks from metadata
    const template = metadata.template || "";
    const blanks = metadata.blanks || [];
    
    // Replace blank markers with input fields
    const parts = template.split(/(\[blank_[a-z0-9]+\])/g);
    
    return (
      <div className="space-y-4">
        {renderContent()}
        
        <div className="p-4 border rounded-md">
          {parts.map((part: string, index: number) => {
            const blankMatch = part.match(/\[(blank_[a-z0-9]+)\]/);
            
            if (blankMatch) {
              const blankId = blankMatch[1];
              return (
                <Input
                  key={index}
                  className="inline-block w-32 mx-1"
                  placeholder="..."
                  disabled
                />
              );
            }
            
            return <span key={index}>{part}</span>;
          })}
        </div>
      </div>
    );
  };

  // Code Question
  const renderCode = () => {
    return (
      <div className="space-y-4">
        {renderContent()}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              <span>Language: <strong>{metadata.language || "JavaScript"}</strong></span>
            </div>
            
            <span className="text-sm text-muted-foreground">
              {metadata.testCases?.length || 0} test case(s)
            </span>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px]">
                <pre className="p-4 text-sm font-mono overflow-x-auto">
                  {metadata.starterCode || "// Write your code here"}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render proper component based on question type
  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
      return renderMultipleChoice();
    case QuestionType.TRUE_FALSE:
      return renderTrueFalse();
    case QuestionType.SHORT_ANSWER:
      return renderShortAnswer();
    case QuestionType.ESSAY:
      return renderEssay();
    case QuestionType.MATCHING:
      return renderMatching();
    case QuestionType.FILL_BLANK:
      return renderFillInBlank();
    case QuestionType.CODE:
      return renderCode();
    default:
      return (
        <div className="p-6 text-center border rounded-md">
          <p>Unsupported question type: {question.type}</p>
        </div>
      );
  }
} 