import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attempts/[id]/questions
 * Get a specific question from a quiz attempt by its order number
 * Enhanced to better support different question types
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const attemptId = params.id;
    
    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: "Attempt ID is required" },
        { status: 400 }
      );
    }

    // Get the question number from the query parameter
    const questionNumber = parseInt(req.nextUrl.searchParams.get("number") || "1");
    
    // Validate question number
    if (isNaN(questionNumber) || questionNumber < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid question number" },
        { status: 400 }
      );
    }

    // Find the quiz attempt and verify ownership
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: userId, // Ensure the user owns this attempt
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: {
                order: 'asc',
              },
              include: {
                options: {
                  select: {
                    id: true,
                    content: true,
                    order: true,
                    group: true,     // For MATCHING questions
                    matchId: true,   // For MATCHING questions
                    position: true,  // For FILL_BLANK questions
                    // Don't include isCorrect to prevent cheating
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    // If attempt not found or doesn't belong to the user
    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Attempt not found or you don't have access" },
        { status: 404 }
      );
    }

    // Check if the attempt is already completed
    if (attempt.completedAt) {
      return NextResponse.json(
        { success: false, message: "This attempt is already completed" },
        { status: 400 }
      );
    }

    // Get the questions sorted by order
    const questions = attempt.quiz.questions;

    // Check if the question number is valid
    if (questionNumber > questions.length) {
      return NextResponse.json(
        { success: false, message: "Question number exceeds total questions" },
        { status: 400 }
      );
    }

    // Get the specific question (JavaScript arrays are 0-indexed)
    const question = questions[questionNumber - 1];
    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    // Find the user's answer to this question if it exists
    const answer = attempt.answers.find(a => a.questionId === question.id);

    // Process metadata based on question type
    let questionMetadata = {};
    if (question.metadata) {
      try {
        const fullMetadata = question.metadata as any;
        
        // Include type-specific metadata but exclude any sensitive data
        // (like correct answers) that shouldn't be sent to the client
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
            questionMetadata = {
              allowMultiple: fullMetadata.allowMultiple || false,
              shuffleOptions: fullMetadata.shuffleOptions || false,
            };
            break;
          case 'ESSAY':
            questionMetadata = {
              minWords: fullMetadata.minWords,
              maxWords: fullMetadata.maxWords,
              placeholder: fullMetadata.placeholder,
              richText: fullMetadata.richText || false,
            };
            break;
          case 'SHORT_ANSWER':
            questionMetadata = {
              caseSensitive: fullMetadata.caseSensitive || false,
              placeholder: fullMetadata.placeholder,
            };
            break;
          case 'FILL_BLANK':
            questionMetadata = {
              text: fullMetadata.text, // Text with blank placeholders
              caseSensitive: fullMetadata.caseSensitive || false,
            };
            break;
          case 'CODE':
            questionMetadata = {
              language: fullMetadata.language || 'javascript',
              initialCode: fullMetadata.initialCode || '',
              placeholder: fullMetadata.placeholder || '// Write your code here...',
              // Don't include test cases that could reveal the solution
            };
            break;
          // Add other question types as needed
          default:
            break;
        }
      } catch (e) {
        console.error("Error parsing question metadata:", e);
        // Continue without metadata if there's a parsing error
      }
    }

    // Format options based on question type
    const formattedOptions = question.options.map(option => {
      const baseOption = {
        id: option.id,
        content: option.content,
        order: option.order,
      };

      // Add type-specific option properties
      switch (question.type) {
        case 'MATCHING':
          return {
            ...baseOption,
            group: option.group,
            // Do not include matchId to prevent cheating
          };
        case 'FILL_BLANK':
          return {
            ...baseOption,
            position: option.position,
          };
        default:
          return baseOption;
      }
    });

    // Format the answer based on question type
    let formattedAnswer = null;
    if (answer) {
      formattedAnswer = {
        id: answer.id,
        selectedOption: answer.selectedOption,
        textAnswer: answer.textAnswer,
        jsonData: null as any, // Add jsonData with proper type
      };

      // Parse JSON answers for complex question types
      if (answer.textAnswer && ['MATCHING', 'FILL_BLANK'].includes(question.type)) {
        try {
          const jsonAnswer = JSON.parse(answer.textAnswer);
          formattedAnswer.jsonData = jsonAnswer;
        } catch (e) {
          console.error("Error parsing answer JSON:", e);
        }
      }
    }

    // Format the response with enhanced data
    const responseData = {
      question: {
        id: question.id,
        content: question.content,
        type: question.type,
        options: formattedOptions,
        metadata: questionMetadata,
        explanation: null, // Don't show explanation during the quiz
        mediaType: question.mediaType,
        mediaUrl: question.mediaUrl,
      },
      answer: formattedAnswer,
      currentQuestion: questionNumber,
      totalQuestions: questions.length,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("[API] Error fetching question:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch question" },
      { status: 500 }
    );
  }
} 