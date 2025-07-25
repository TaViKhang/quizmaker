'use client';

import { useEffect, useState } from 'react';
import { 
  normalizeQuestion, 
  getMultipleChoiceMetadata,
  getEssayMetadata,
  getShortAnswerMetadata,
  getFillBlankMetadata,
  getCodeMetadata,
  getMatchingMetadata,
  Question as ImportedQuestion,
  Option as OptionType,
  Answer as AnswerType
} from '@/lib/question-utils';
import { MultipleChoiceQuestion } from '../multiple-choice-question';
import { EssayQuestion } from '../essay-question';
import { FillBlankQuestion } from '../fill-blank-question';
import { MatchingQuestion } from '../matching-question';
import { CodeQuestion } from '../code-question';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { normalizeMetadata } from '@/lib/utils';

// Định nghĩa kiểu câu hỏi từ schema
export type QuestionType = 
  | 'MULTIPLE_CHOICE' 
  | 'ESSAY' 
  | 'TRUE_FALSE' 
  | 'SHORT_ANSWER' 
  | 'MATCHING' 
  | 'FILL_BLANK' 
  | 'CODE' 
  | 'FILE_UPLOAD';

// Định nghĩa interface cho câu hỏi
export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  options?: Option[];
  metadata?: Record<string, any> | null | string; // Có thể là string hoặc object
  mediaType?: string;
  mediaUrl?: string;
  explanation?: string;
}

// Interface cho lựa chọn trong câu hỏi
export interface Option {
  id: string;
  content: string;
  order: number;
  isCorrect?: boolean;  // Chỉ hiện ở phía giáo viên
  group?: string;       // For MATCHING questions
  position?: number;    // For FILL_BLANK questions
}

// Metadata cho các loại câu hỏi khác nhau
export interface QuestionMetadata {
  // Multiple choice
  allowMultiple?: boolean;
  shuffleOptions?: boolean;
  
  // Essay
  minWords?: number;
  maxWords?: number;
  placeholder?: string;
  richText?: boolean;
  
  // Short answer
  caseSensitive?: boolean;
  
  // Fill-in-the-blank
  text?: string;
  blankPositions?: Array<{ id: string, position: number }>;
  
  // Matching
  leftGroup?: Option[];
  rightGroup?: Option[];
  
  // Code
  language?: string;
  initialCode?: string;
  testCases?: string[];
}

// Interface cho câu trả lời
export interface Answer {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
  jsonData?: Record<string, any> | null;
}

interface QuestionRendererProps {
  question: ImportedQuestion;
  answer?: AnswerType | null;
  onAnswerChange: (answer: AnswerType) => void;
  isReview?: boolean;
}

/**
 * Main component to render a question based on its type
 */
export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  isReview = false
}: QuestionRendererProps) {
  const [normalizedQuestion, setNormalizedQuestion] = useState<ImportedQuestion>({...question});
  const [error, setError] = useState<string | null>(null);

  // State for the current answer, adhering to AnswerType (jsonData as string | null)
  const [currentAnswerForPropagation, setCurrentAnswerForPropagation] = useState<AnswerType>(() => {
    // Initialize with prop answer or default structure
    return answer || {
      questionId: question.id,
      selectedOptions: [],
      textAnswer: '',
      jsonData: null,
    };
  });

  // State for parsed jsonData (object form) for internal use by child components
  const [parsedJsonData, setParsedJsonData] = useState<Record<string, any> | null>(() => {
    if (answer?.jsonData && typeof answer.jsonData === 'string') {
      try {
        return JSON.parse(answer.jsonData);
      } catch (e) {
        console.error("Error parsing jsonData from props on init:", e);
        return null;
      }
    }
    return null; // Nếu answer.jsonData không phải string hoặc không tồn tại
  });

  useEffect(() => {
    // Normalize question metadata (giữ nguyên logic này)
    try {
      let questionToNormalize = { ...question };
      if (questionToNormalize.metadata && typeof questionToNormalize.metadata === 'string') {
        try {
          questionToNormalize.metadata = JSON.parse(questionToNormalize.metadata);
        } catch (parseError) {
          console.error("Error parsing question metadata:", parseError);
          questionToNormalize.metadata = {}; 
        }
      }
      setNormalizedQuestion(normalizeQuestion(questionToNormalize));
      setError(null);
    } catch (err) {
      console.error("Error normalizing question:", err);
      setError("Error processing question data. Please contact your teacher.");
    }
  }, [question]);

  // Effect to update internal states when 'answer' prop changes
  useEffect(() => {
    if (answer) {
      setCurrentAnswerForPropagation(answer); // Cập nhật state dùng để truyền ra ngoài
      if (answer.jsonData && typeof answer.jsonData === 'string') {
        try {
          setParsedJsonData(JSON.parse(answer.jsonData));
        } catch (e) {
          console.error("Error parsing jsonData from updated props:", e);
          setParsedJsonData(null);
        }
      } else {
        // Nếu jsonData không phải string (có thể là null hoặc đã là object do lỗi nào đó)
        // hoặc không có jsonData, reset parsedJsonData
        setParsedJsonData(null); 
      }
    } else {
      // Reset if prop.answer is removed
      const defaultAnswer = {
        questionId: question.id,
        selectedOptions: [],
        textAnswer: '',
        jsonData: null,
      };
      setCurrentAnswerForPropagation(defaultAnswer);
      setParsedJsonData(null);
    }
  }, [answer, question.id]);

  const handleAnswerChange = (updatedAnswerPartial: Partial<Omit<AnswerType, 'jsonData'> & { jsonData?: Record<string, any> | null }>) => {
    // updatedAnswerPartial.jsonData ở đây là object từ FillBlankQuestion hoặc MatchingQuestion
    
    let newJsonDataForPropagation: string | null = currentAnswerForPropagation.jsonData;

    if (updatedAnswerPartial.hasOwnProperty('jsonData')) {
        // Nếu jsonData được cung cấp (kể cả là null), cập nhật parsedJsonData
        setParsedJsonData(updatedAnswerPartial.jsonData || null);
        // Và stringify nó để truyền ra ngoài
        newJsonDataForPropagation = updatedAnswerPartial.jsonData ? JSON.stringify(updatedAnswerPartial.jsonData) : null;
    }
    
    const newAnswerForPropagation: AnswerType = {
      questionId: currentAnswerForPropagation.questionId, // không thay đổi questionId ở đây
      selectedOptions: updatedAnswerPartial.selectedOptions !== undefined ? updatedAnswerPartial.selectedOptions : currentAnswerForPropagation.selectedOptions,
      textAnswer: updatedAnswerPartial.textAnswer !== undefined ? updatedAnswerPartial.textAnswer : currentAnswerForPropagation.textAnswer,
      jsonData: newJsonDataForPropagation,
    };

    setCurrentAnswerForPropagation(newAnswerForPropagation);
    onAnswerChange(newAnswerForPropagation);
  };

  // Display error if we couldn't process the question
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Render the appropriate question component based on question type
  const renderQuestionByType = () => {
    if (!normalizedQuestion) return null;
    
    try {
      switch (normalizedQuestion.type) {
        case 'MULTIPLE_CHOICE':
          const mcMetadata = getMultipleChoiceMetadata(normalizedQuestion);
          return (
            <MultipleChoiceQuestion
              question={normalizedQuestion}
              selectedOptions={currentAnswerForPropagation.selectedOptions}
              onChange={(selection) => handleAnswerChange({ selectedOptions: selection })}
              allowMultiple={mcMetadata.allowMultiple}
              shuffleOptionsEnabled={mcMetadata.shuffleOptions}
              disabled={isReview}
            />
          );

        case 'TRUE_FALSE':
          // True/False is essentially a multiple choice with 2 options
          return (
            <MultipleChoiceQuestion
              question={normalizedQuestion}
              selectedOptions={currentAnswerForPropagation.selectedOptions}
              onChange={(selection) => handleAnswerChange({ selectedOptions: selection })}
              allowMultiple={false}
              shuffleOptionsEnabled={false}
              disabled={isReview}
            />
          );

        case 'ESSAY':
          const essayMetadata = getEssayMetadata(normalizedQuestion);
          return (
            <EssayQuestion
              value={currentAnswerForPropagation.textAnswer || ''}
              onChange={(text) => handleAnswerChange({ textAnswer: text })}
              minWords={essayMetadata.minWords}
              maxWords={essayMetadata.maxWords}
              placeholder={essayMetadata.placeholder}
              richText={essayMetadata.richText}
              disabled={isReview}
            />
          );

        case 'SHORT_ANSWER':
          const saMetadata = getShortAnswerMetadata(normalizedQuestion);
          return (
            <input
              type="text"
              value={currentAnswerForPropagation.textAnswer || ''}
              onChange={(e) => handleAnswerChange({ textAnswer: e.target.value })}
              placeholder={saMetadata.placeholder || 'Enter your answer here...'}
              className="w-full p-2 border rounded-md"
              disabled={isReview}
            />
          );

        case 'FILL_BLANK':
          const fbMetadata = getFillBlankMetadata(normalizedQuestion);
          return (
            <FillBlankQuestion
              text={normalizedQuestion.content} 
              options={normalizedQuestion.options || []} 
              caseSensitive={fbMetadata.caseSensitive}
              existingAnswer={parsedJsonData ? parsedJsonData as Record<string, string> : undefined}
              onChange={(data) => handleAnswerChange({ jsonData: data })}
              disabled={isReview}
            />
          );

        case 'CODE':
          const codeMetadata = getCodeMetadata(normalizedQuestion);
          return (
            <CodeQuestion
              language={codeMetadata.language}
              initialCode={codeMetadata.initialCode || ''}
              value={currentAnswerForPropagation.textAnswer || ''}
              onChange={(code) => handleAnswerChange({ textAnswer: code })}
              disabled={isReview}
            />
          );

        case 'MATCHING':
          const matchingMetadata = getMatchingMetadata(normalizedQuestion);
          return (
            <MatchingQuestion
              options={normalizedQuestion.options || []}
              existingAnswer={parsedJsonData ? parsedJsonData as Record<string, string> : undefined}
              onChange={(data) => handleAnswerChange({ jsonData: data })}
              disabled={isReview}
              showCorrect={isReview}
              metadata={{ shuffleOptions: matchingMetadata.shuffleOptions }}
            />
          );

        default:
          return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-600">
                This question type ({normalizedQuestion.type}) is not supported yet.
              </p>
            </div>
          );
      }
    } catch (err) {
      console.error("Error rendering question:", err);
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">
            Error rendering question. Please contact your teacher.
          </p>
        </div>
      );
    }
  };

  // Render question media (if available)
  const renderQuestionMedia = () => {
    if (!normalizedQuestion.mediaUrl) return null;
    
    return (
      <div className="mb-4">
        {normalizedQuestion.mediaType === 'IMAGE' && (
          <img 
            src={normalizedQuestion.mediaUrl} 
            alt="Question media" 
            className="max-w-full rounded-md"
          />
        )}
        {normalizedQuestion.mediaType === 'VIDEO' && (
          <video 
            src={normalizedQuestion.mediaUrl} 
            controls 
            className="max-w-full rounded-md"
          />
        )}
        {normalizedQuestion.mediaType === 'AUDIO' && (
          <audio 
            src={normalizedQuestion.mediaUrl} 
            controls 
            className="w-full"
          />
        )}
      </div>
    );
  };

  // Media rendering for questions with attached media
  const renderMedia = () => {
    if (!normalizedQuestion.mediaUrl) return null;
    
    switch (normalizedQuestion.mediaType) {
      case 'IMAGE':
        return (
          <div className="my-4">
            <img
              src={normalizedQuestion.mediaUrl}
              alt="Question illustration"
              className="max-w-full rounded-md"
            />
          </div>
        );
      case 'VIDEO':
        return (
          <div className="my-4">
            <video
              src={normalizedQuestion.mediaUrl}
              controls
              className="max-w-full rounded-md"
            />
          </div>
        );
      case 'AUDIO':
        return (
          <div className="my-4">
            <audio
              src={normalizedQuestion.mediaUrl}
              controls
              className="w-full"
            />
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="my-4">
            <a
              href={normalizedQuestion.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Xem tài liệu đính kèm
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question media */}
      {renderQuestionMedia()}
      
      {/* Question content */}
      <div className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: normalizedQuestion.content }} />
      </div>
      
      {/* Question input based on type */}
      <div className="mt-4">
        {renderQuestionByType()}
      </div>
    </div>
  );
} 