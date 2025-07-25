"use client";

import QuizTake from './quiz-take';
import { useSearchParams } from 'next/navigation';

interface QuizAttemptPageProps {
  params: {
    quizId: string;
  };
}

export default function QuizAttemptPage({ params }: QuizAttemptPageProps) {
  const { quizId } = params;
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  
  return <QuizTake quizId={quizId} attemptId={attemptId} />;
} 