'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, FileCode, ArrowRightLeft, List, AlignJustify } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Define types
interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
  group?: string;
  position?: number;
  order: number;
  matchId?: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  explanation: string | null;
  options: QuestionOption[];
  metadata?: any;
}

interface Answer {
  id: string;
  questionId: string;
  selectedOption: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  score: number | null;
  feedback: string | null;
  jsonData?: any;
}

interface QuizResultAnswerDetailProps {
  question: Question;
  answer: Answer | null;
  questionNumber: number;
}

export function QuizResultAnswerDetail({ question, answer, questionNumber }: QuizResultAnswerDetailProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Determine if the answer is correct
  const isCorrect = answer?.isCorrect === true;
  const isPending = answer?.isCorrect === null;
  
  // Get the type-specific icon
  const getQuestionTypeIcon = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return <List className="h-4 w-4" />;
      case 'TRUE_FALSE':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'MATCHING':
        return <ArrowRightLeft className="h-4 w-4" />;
      case 'FILL_BLANK':
        return <AlignJustify className="h-4 w-4" />;
      case 'CODE':
        return <FileCode className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };
  
  // Get the type-specific badge
  const getQuestionTypeBadge = () => {
    let label = '';
    let variant: 'default' | 'secondary' | 'outline' = 'outline';
    
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        label = 'Multiple Choice';
        break;
      case 'TRUE_FALSE':
        label = 'True/False';
        break;
      case 'SHORT_ANSWER':
        label = 'Short Answer';
        break;
      case 'ESSAY':
        label = 'Essay';
        break;
      case 'MATCHING':
        label = 'Matching';
        break;
      case 'FILL_BLANK':
        label = 'Fill in the Blanks';
        break;
      case 'CODE':
        label = 'Coding';
        variant = 'secondary';
        break;
      default:
        label = question.type;
    }
    
    return (
      <Badge variant={variant} className="ml-2">
        {getQuestionTypeIcon()}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };
  
  // Render the user's answer based on question type
  const renderUserAnswer = () => {
    if (!answer) {
      return <p className="text-sm text-muted-foreground">No answer provided</p>;
    }
    
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE':
        // For single selection
        if (answer.selectedOption) {
          // Check if it's a multiple answer (JSON string)
          try {
            const selectedOptions = JSON.parse(answer.selectedOption);
            if (Array.isArray(selectedOptions)) {
              // Multiple selection
              return (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {selectedOptions.map(optionId => {
                    const option = question.options.find(o => o.id === optionId);
                    return option ? (
                      <li key={optionId} dangerouslySetInnerHTML={{ __html: option.content }} />
                    ) : null;
                  })}
                </ul>
              );
            }
          } catch (e) {
            // Not JSON, single selection
            const selectedOption = question.options.find(o => o.id === answer.selectedOption);
            return selectedOption ? (
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: selectedOption.content }} />
            ) : (
              <p className="text-sm text-muted-foreground">Unknown option</p>
            );
          }
        }
        return <p className="text-sm text-muted-foreground">No option selected</p>;
        
      case 'SHORT_ANSWER':
      case 'ESSAY':
        return answer.textAnswer ? (
          <p className="text-sm whitespace-pre-wrap">{answer.textAnswer}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No text provided</p>
        );
        
      case 'MATCHING':
        // For matching questions, we need to display the matches
        if (answer.jsonData || (answer.textAnswer && typeof answer.textAnswer === 'string')) {
          const matchData = answer.jsonData || JSON.parse(answer.textAnswer || '{}');
          
          // Group options
          const leftOptions = question.options
            .filter(opt => opt.group === 'left')
            .sort((a, b) => a.order - b.order);
            
          const rightOptions = question.options
            .filter(opt => opt.group === 'right')
            .sort((a, b) => a.order - b.order);
          
          return (
            <div className="space-y-2">
              {leftOptions.map(leftOption => {
                const matchedId = matchData[leftOption.id];
                const rightOption = rightOptions.find(opt => opt.id === matchedId);
                
                return (
                  <div key={leftOption.id} className="flex flex-col sm:flex-row text-sm">
                    <div 
                      className="font-medium sm:w-1/2 p-2 bg-muted rounded-md mb-1 sm:mb-0 sm:mr-2" 
                      dangerouslySetInnerHTML={{ __html: leftOption.content }} 
                    />
                    <div className="flex items-center sm:w-1/2">
                      <span className="mx-2">→</span>
                      {rightOption ? (
                        <div className="p-2 border rounded-md flex-1" dangerouslySetInnerHTML={{ __html: rightOption.content }} />
                      ) : (
                        <div className="p-2 border rounded-md flex-1 text-muted-foreground">No match selected</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return <p className="text-sm text-muted-foreground">No matches provided</p>;
        
      case 'FILL_BLANK':
        // For fill-in-the-blank questions
        if (answer.jsonData || (answer.textAnswer && typeof answer.textAnswer === 'string')) {
          const blankData = answer.jsonData || JSON.parse(answer.textAnswer || '{}');
          const text = question.metadata?.text || '';
          
          // Using regex to find and replace blanks with user answers
          let formattedText = text;
          const blankRegex = /\[blank_(\d+)\]/g;
          
          formattedText = formattedText.replace(blankRegex, (_match: string, position: string) => {
            const userAnswer = blankData[position];
            return userAnswer 
              ? `<span class="px-2 py-0.5 bg-muted rounded">${userAnswer}</span>` 
              : '<span class="px-2 py-0.5 bg-muted rounded text-muted-foreground">[empty]</span>';
          });
          
          return (
            <div 
              className="text-sm whitespace-pre-wrap p-4 bg-muted/30 rounded-md"
              dangerouslySetInnerHTML={{ __html: formattedText }} 
            />
          );
        }
        return <p className="text-sm text-muted-foreground">No answers provided for the blanks</p>;
        
      case 'CODE':
        // For code questions
        return answer.textAnswer ? (
          <pre className="text-sm bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
            <code>{answer.textAnswer}</code>
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">No code provided</p>
        );
        
      default:
        return <p className="text-sm text-muted-foreground">Answer format not supported</p>;
    }
  };
  
  // Render the correct answer based on question type
  const renderCorrectAnswer = () => {
    // Only render correct answer if the answer is incorrect and not pending
    if (isCorrect || isPending) return null;
    
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE':
        const correctOptions = question.options.filter(o => o.isCorrect);
        return correctOptions.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-green-600">Correct answer:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {correctOptions.map(option => (
                <li key={option.id} dangerouslySetInnerHTML={{ __html: option.content }} />
              ))}
            </ul>
          </div>
        ) : null;
        
      case 'SHORT_ANSWER':
        const correctAnswers = question.options.filter(o => o.isCorrect);
        return correctAnswers.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-green-600">Correct answer:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {correctAnswers.map(option => (
                <li key={option.id}>{option.content}</li>
              ))}
            </ul>
          </div>
        ) : null;
        
      case 'MATCHING':
        return (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="correct-answer">
              <AccordionTrigger className="text-sm font-medium text-green-600">
                View correct matches
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {question.options
                    .filter(opt => opt.group === 'left')
                    .sort((a, b) => a.order - b.order)
                    .map(leftOption => {
                      // Find the correct match for this left option
                      const correctMatchId = question.options
                        .find(opt => opt.id === leftOption.id)?.matchId;
                        
                      const rightOption = question.options
                        .find(opt => opt.id === correctMatchId);
                      
                      return (
                        <div key={leftOption.id} className="flex flex-col sm:flex-row text-sm">
                          <div 
                            className="font-medium sm:w-1/2 p-2 bg-muted rounded-md mb-1 sm:mb-0 sm:mr-2" 
                            dangerouslySetInnerHTML={{ __html: leftOption.content }} 
                          />
                          <div className="flex items-center sm:w-1/2">
                            <span className="mx-2">→</span>
                            {rightOption ? (
                              <div 
                                className="p-2 border border-green-500 bg-green-50 dark:bg-green-950 rounded-md flex-1" 
                                dangerouslySetInnerHTML={{ __html: rightOption.content }} 
                              />
                            ) : (
                              <div className="p-2 border rounded-md flex-1 text-muted-foreground">No correct match found</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
        
      case 'FILL_BLANK':
        return (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="correct-answer">
              <AccordionTrigger className="text-sm font-medium text-green-600">
                View correct answers
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <div className="text-sm space-y-2">
                    {question.options
                      .filter(opt => opt.position !== undefined)
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map(option => (
                        <div key={option.id} className="flex items-center">
                          <span className="font-medium mr-2">Blank {option.position}:</span>
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                            {option.content}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
        
      case 'CODE':
        // Show suggested solution if available
        if (question.options.length > 0 && question.options.some(o => o.isCorrect)) {
          const solutionOption = question.options.find(o => o.isCorrect);
          
          return solutionOption ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="correct-answer">
                <AccordionTrigger className="text-sm font-medium text-green-600">
                  View example solution
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="text-sm bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto mt-2">
                    <code>{solutionOption.content}</code>
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null;
        }
        return null;
        
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-3 border-b pb-6 last:border-b-0 last:pb-0">
      <div className="flex items-start">
        <div className="bg-muted w-6 h-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0 mt-0.5">
          {questionNumber}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium" dangerouslySetInnerHTML={{ __html: question.content }} />
            {getQuestionTypeBadge()}
          </div>
          
          {/* Status indicator */}
          <div className="mt-3 flex items-start">
            <div className="flex-shrink-0 mt-0.5 mr-2">
              {isPending ? (
                <Badge variant="outline" className="text-amber-500 bg-amber-50 dark:bg-amber-950">Pending</Badge>
              ) : isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Your answer:</p>
              {renderUserAnswer()}
            </div>
          </div>
          
          {/* Correct answer (if user answered incorrectly) */}
          <div className="mt-3 ml-7 pl-0.5">
            {renderCorrectAnswer()}
          </div>
          
          {/* Score */}
          {answer && answer.score !== null && (
            <div className="mt-3 ml-7 pl-0.5">
              <p className="text-sm font-medium">
                Score: <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {answer.score} point{answer.score !== 1 ? 's' : ''}
                </span>
              </p>
            </div>
          )}
          
          {/* Explanation */}
          {question.explanation && (
            <div className="mt-3 ml-7 pl-0.5 flex items-start">
              <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: question.explanation }} />
            </div>
          )}
          
          {/* Feedback */}
          {answer?.feedback && (
            <div className="mt-3 ml-7 pl-0.5 p-2 border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Teacher feedback:</p>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: answer.feedback }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 