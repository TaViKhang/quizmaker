export interface AnswerType {
  questionId: string;
  selectedOptions: string[];
  textAnswer: string;
  jsonData: Record<string, any> | null;
} 