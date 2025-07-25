"use client";

import { useEffect, useState } from "react";
import { QuestionType } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { normalizeMetadata, prepareMetadataForDB } from "@/lib/utils";

// Import all question editors
import { MultipleChoiceEditor } from "./MultipleChoiceEditor";
import { EssayQuestionEditor } from "./EssayQuestionEditor";
import { TrueFalseEditor } from "./TrueFalseEditor";
import { ShortAnswerEditor } from "./ShortAnswerEditor";
import { MatchingEditor } from "./MatchingEditor";
import { FillBlankEditor } from "./FillBlankEditor";
import { CodeEditor } from "./CodeEditor";

interface DynamicQuestionEditorProps {
  questionType: QuestionType;
  questionId?: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function DynamicQuestionEditor({
  questionType,
  questionId,
  initialData,
  onSave,
  onCancel,
}: DynamicQuestionEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Process metadata if exists in initialData
  useEffect(() => {
    if (initialData?.metadata) {
      try {
        // Chuẩn hóa metadata
        const normalizedMetadata = normalizeMetadata(initialData.metadata);
        if (normalizedMetadata) {
          initialData.metadata = normalizedMetadata;
        }
      } catch (error) {
        console.error("Failed to parse metadata JSON:", error);
        // Giữ metadata ban đầu nếu parsing thất bại
      }
    }
  }, [initialData]);

  // Handle save with common saving logic
  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      // Combine data with question type and id
      const questionData = {
        ...data,
        type: questionType,
        id: questionId,
      };
      
      // Ensure metadata is properly formatted
      // For backward compatibility, check if separate metadata properties need to be merged
      if (questionType === QuestionType.MULTIPLE_CHOICE && !questionData.metadata) {
        // If MultipleChoiceEditor sent allowMultipleAnswers/shuffleOptions directly instead of in metadata
        if ('allowMultipleAnswers' in questionData || 'shuffleOptions' in questionData) {
          questionData.metadata = {
            allowMultiple: questionData.allowMultipleAnswers || false,
            shuffleOptions: questionData.shuffleOptions || false,
          };
          // Remove redundant properties
          delete questionData.allowMultipleAnswers;
          delete questionData.shuffleOptions;
        }
      }
      
      // Process metadata to ensure it's properly formatted for database
      if (questionData.metadata) {
        questionData.metadata = normalizeMetadata(questionData.metadata);
      }
      
      await onSave(questionData);
    } catch (error) {
      console.error("Error in DynamicQuestionEditor handleSave:", error);
      alert(`Failed to save question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Get editor title based on question type
  const getEditorTitle = () => {
    const isEditing = !!questionId;
    const action = isEditing ? "Edit" : "Add";
    
    switch (questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return `${action} Multiple Choice Question`;
      case QuestionType.ESSAY:
        return `${action} Essay Question`;
      case QuestionType.TRUE_FALSE:
        return `${action} True/False Question`;
      case QuestionType.SHORT_ANSWER:
        return `${action} Short Answer Question`;
      case QuestionType.MATCHING:
        return `${action} Matching Question`;
      case QuestionType.FILL_BLANK:
        return `${action} Fill in the Blank Question`;
      case QuestionType.CODE:
        return `${action} Code Question`;
      default:
        return `${action} Question`;
    }
  };

  // Render the appropriate editor based on question type
  const renderQuestionEditor = () => {
    switch (questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        );
      case QuestionType.ESSAY:
        return (
          <EssayQuestionEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        );
      case QuestionType.TRUE_FALSE:
        return (
          <TrueFalseEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        );
      case QuestionType.SHORT_ANSWER:
        return (
          <ShortAnswerEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        );
      case QuestionType.MATCHING:
        return (
          <MatchingEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        );
      case QuestionType.FILL_BLANK:
        return (
          <FillBlankEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        );
      case QuestionType.CODE:
        return (
          <CodeEditor
            initialData={initialData}
            onSave={handleSave}
            onCancel={onCancel}
          />
        );
      default:
        return (
          <div className="p-4 text-center">
            <p>Unsupported question type</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getEditorTitle()}</CardTitle>
        <CardDescription>
          Configure all options for this question.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {renderQuestionEditor()}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <div className="flex gap-2">
          {isSaving && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 