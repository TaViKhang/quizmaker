import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { QuestionType, Role } from '@prisma/client';
import { normalizeMetadata } from '@/lib/utils';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// Schema for validation
const AnswerSubmissionSchema = z.object({
  questionId: z.string(),
  answer: z.object({
    selectedOptions: z.array(z.string()).optional(),
    textAnswer: z.string().optional(),
    jsonData: z.string().optional(),
  }),
});

/**
 * POST /api/attempts/[id]/validate-answer
 * Validate and save an answer for a quiz attempt
 * Required authentication: Yes - User must be logged in
 * Permission: User must own the attempt
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const attemptId = params.id;

    // Validate submission data
    const body = await req.json();
    const validationResult = AnswerSubmissionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid submission data", 
          errors: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { questionId, answer } = validationResult.data;

    // Find the attempt and verify it belongs to the current user
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        completedAt: null // Must be incomplete
      },
      include: {
        quiz: true
      }
    });
    
    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Attempt not found or already completed" },
        { status: 404 }
      );
    }

    // Find the question
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        quizId: attempt.quizId
      },
      include: {
        options: true
      }
    });
    
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    // Extract selected options from the answer
    const selectedOptions = answer.selectedOptions || [];
    const textAnswer = answer.textAnswer || null;
    const jsonData = answer.jsonData || null;
    
    // Calculate max score
    const maxScore = question.points || 0;
    let isCorrect: boolean | null = null;
    let score: number | null = null;
    
    // Prepare answer data
    const answerData = {
      attemptId,
      questionId,
      selectedOption: selectedOptions.length > 0 ? selectedOptions[0] : null, // For backward compatibility
      selectedOptionIds: selectedOptions,
      textAnswer,
    };
    
    // Auto-grade questions where possible
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        if (selectedOptions.length > 0) {
          // Get metadata to check if multiple selection is allowed
          const metadata = normalizeMetadata(question.metadata) || {};
          
          // Kiểm tra allowMultiple từ cả hai tên trường cho backward compatibility
          let allowMultiple = false;
          if (metadata) {
            // Ưu tiên tên trường mới trước
            allowMultiple = typeof metadata.allowMultiple !== 'undefined'
              ? Boolean(metadata.allowMultiple)
              : Boolean(metadata.allowMultipleAnswers);
          }
          
          // Get correct options
          const correctOptions = question.options.filter(o => o.isCorrect);
          const correctOptionIds = correctOptions.map(o => o.id);
          
          if (allowMultiple) {
            // For multiple-choice: all correct options must be selected and no incorrect options
            const selectedCorrectCount = selectedOptions.filter(id => 
              correctOptionIds.includes(id)
            ).length;
            
            const selectedIncorrectCount = selectedOptions.filter(id => 
              !correctOptionIds.includes(id)
            ).length;
            
            // Full points if all correct options selected and no incorrect ones
            if (selectedCorrectCount === correctOptionIds.length && selectedIncorrectCount === 0) {
              isCorrect = true;
              score = question.points;
            } 
            // Partial points if some correct options selected and no incorrect ones
            else if (selectedCorrectCount > 0 && selectedIncorrectCount === 0) {
              isCorrect = false; // Technically not 100% correct
              
              // Allow partial credit if enabled in metadata (default true)
              const allowPartialCredit = metadata?.allowPartialCredit !== false;
              
              if (allowPartialCredit) {
                // Calculate partial score based on proportion of correct answers selected
                score = Math.round((selectedCorrectCount / correctOptionIds.length) * question.points);
              } else {
                score = 0; // No partial credit
              }
            } 
            // No points if any incorrect option is selected
            else {
              isCorrect = false;
              score = 0;
            }
          } else {
            // For single choice: the one selected option must be correct
            isCorrect = correctOptionIds.includes(selectedOptions[0]);
            score = isCorrect ? question.points : 0;
          }
        } else {
          // No option selected
          isCorrect = false;
          score = 0;
        }
        break;
        
      // Handle other question types here
      case QuestionType.SHORT_ANSWER:
        // Short answer questions require exact match
        if (textAnswer && question.options.length > 0) {
          const metadata = normalizeMetadata(question.metadata) || {};
          const caseSensitive = metadata.caseSensitive || false;
          
          // Get all correct answers from options
          const correctAnswers = question.options
            .filter(o => o.isCorrect)
            .map(o => o.content);
          
          // Check if the answer matches any correct answer
          if (caseSensitive) {
            isCorrect = correctAnswers.includes(textAnswer);
          } else {
            isCorrect = correctAnswers.some(
              a => a.toLowerCase() === textAnswer.toLowerCase()
            );
          }
          
          score = isCorrect ? maxScore : 0;
        } else {
          isCorrect = false;
          score = 0;
        }
        break;
        
      // For question types that require manual grading, save the answer without grading
      case QuestionType.ESSAY:
      case QuestionType.MATCHING:
      case QuestionType.FILL_BLANK:
      case QuestionType.CODE:
        // These question types will be graded later (manually or by additional processing)
        isCorrect = null;
        score = null;
        break;
        
      default:
        isCorrect = null;
        score = null;
    }
    
    // Save the answer with the calculated score
    // First check if answer already exists
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        attemptId,
        questionId
      }
    });
    
    let savedAnswer;
    if (existingAnswer) {
      // Update existing answer
      savedAnswer = await prisma.answer.update({
        where: {
          id: existingAnswer.id
        },
        data: {
          ...answerData,
          isCorrect,
          score
        }
      });
    } else {
      // Create new answer
      savedAnswer = await prisma.answer.create({
        data: {
          ...answerData,
          isCorrect,
          score
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        answerId: savedAnswer.id,
        isCorrect,
        score,
        feedback: null
      }
    });
  } catch (error) {
    console.error("Error validating answer:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 