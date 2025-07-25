import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createServerError 
} from "@/lib/api-response";
import { QuestionType } from "@prisma/client";

interface Option {
  id: string;
  content: string;
  order: number;
  matchId: string | null;
  group: string | null;
  position: number | null;
}

interface Question {
  id: string;
  content: string;
  type: QuestionType;
  points: number;
  order: number;
  mediaUrl: string | null;
  mediaType: string | null;
  options: Option[];
}

interface GroupedOptions {
  [key: string]: Option[];
}

/**
 * GET handler for fetching questions of a public quiz
 * This endpoint requires authentication
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const accessCode = params.code;
    
    if (!accessCode) {
      return createErrorResponse("VALIDATION_ERROR", "Quiz access code is required");
    }
    
    // Find the quiz by access code
    const quiz = await db.quiz.findFirst({
      where: {
        publicAccessCode: accessCode,
        isPublic: true,
        isActive: true,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        timeLimit: true,
        shuffleQuestions: true,
        maxAttempts: true
      }
    });
    
    if (!quiz) {
      return createErrorResponse("NOT_FOUND", "Quiz not found or access code is invalid");
    }
    
    // Check if the quiz is within the available date range
    const now = new Date();
    const quizWithDates = await db.quiz.findUnique({
      where: { id: quiz.id },
      select: { startDate: true, endDate: true }
    });
    
    if (quizWithDates?.startDate && new Date(quizWithDates.startDate) > now) {
      return createErrorResponse("FORBIDDEN", "This quiz is not yet available");
    }
    
    if (quizWithDates?.endDate && new Date(quizWithDates.endDate) < now) {
      return createErrorResponse("FORBIDDEN", "This quiz is no longer available");
    }
    
    // Check if user has reached the maximum attempts
    if (quiz.maxAttempts) {
      const attemptCount = await db.quizAttempt.count({
        where: {
          quizId: quiz.id,
          userId: session.user.id
        }
      });
      
      if (attemptCount >= quiz.maxAttempts) {
        return createErrorResponse("FORBIDDEN", "You have reached the maximum number of attempts for this quiz");
      }
    }
    
    // Get the questions
    let questions = await db.question.findMany({
      where: { quizId: quiz.id },
      select: {
        id: true,
        content: true,
        type: true,
        points: true,
        order: true,
        mediaUrl: true,
        mediaType: true,
        options: {
          select: {
            id: true,
            content: true,
            order: true,
            matchId: true,
            group: true,
            position: true,
          },
          orderBy: {
            order: "asc"
          }
        }
      },
      orderBy: {
        order: "asc"
      }
    }) as Question[];
    
    // Process the questions
    if (quiz.shuffleQuestions) {
      // Shuffle the questions (Fisher-Yates algorithm)
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }
    
    // Return the quiz questions without the correct answers
    const processedQuestions = questions.map(question => {
      const { options, ...questionData } = question;
      
      // For each question type, handle options appropriately
      let processedOptions = options;
      
      // For matching questions, ensure we include all match options
      if (question.type === QuestionType.MATCHING) {
        // Shuffle match options if needed
        if (quiz.shuffleQuestions) {
          processedOptions = [...options];
          // Shuffle options with the same group
          const groups: GroupedOptions = {};
          processedOptions.forEach(opt => {
            if (!opt.group) return;
            if (!groups[opt.group]) groups[opt.group] = [];
            groups[opt.group].push(opt);
          });
          
          Object.keys(groups).forEach(group => {
            const groupOptions = groups[group];
            for (let i = groupOptions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [groupOptions[i], groupOptions[j]] = [groupOptions[j], groupOptions[i]];
            }
          });
          
          processedOptions = Object.values(groups).flat();
        }
      } 
      // For multiple choice, shuffle options
      else if ((question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) && quiz.shuffleQuestions) {
        processedOptions = [...options];
        for (let i = processedOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [processedOptions[i], processedOptions[j]] = [processedOptions[j], processedOptions[i]];
        }
      }
      
      return {
        ...questionData,
        options: processedOptions
      };
    });
    
    return createSuccessResponse({
      quizId: quiz.id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questions: processedQuestions
    });
  } catch (error) {
    console.error("Error fetching public quiz questions:", error);
    return createServerError(error instanceof Error ? error : new Error("Failed to fetch quiz questions"));
  }
} 