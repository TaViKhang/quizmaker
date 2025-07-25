import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { QuestionType } from "@prisma/client";
import { normalizeMetadata } from "@/lib/question-utils";

// Define schema for answer submission
const AnswerSubmissionSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  selectedOptions: z.array(z.string()).optional(),
  textAnswer: z.string().nullable().optional(),
  jsonData: z.union([
    z.record(z.unknown()),
    z.string()
  ]).nullable().optional() // Allow object, string, null, or undefined
});

type AnswerSubmission = z.infer<typeof AnswerSubmissionSchema>;

/**
 * GET /api/attempts/[id]/answers
 * Get all answers for an attempt
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

    // Get attempt with answers
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
      },
      include: {
        answers: {
          include: {
            question: {
              select: {
                type: true,
              }
            }
          }
        },
      },
    });
    
    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Attempt not found" },
        { status: 404 }
      );
    }

    // Check if the user is authorized to view this attempt
    const isOwner = attempt.userId === userId;
    const isTeacher = (session.user as any).role === "TEACHER";
    
    if (!isOwner && !isTeacher) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to view this attempt's answers" },
        { status: 403 }
      );
    }

    // Format the answers based on their question types
    const formattedAnswers = attempt.answers.map(answer => {
      const questionType = answer.question?.type;
      const baseAnswer = {
        id: answer.id,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        textAnswer: answer.textAnswer,
        isCorrect: answer.isCorrect,
        score: answer.score,
        feedback: answer.feedback,
      };

      // For complex question types that might store json as a string
      if (answer.textAnswer && ['MATCHING', 'FILL_BLANK', 'CODE'].includes(questionType as string)) {
        try {
          const jsonData = JSON.parse(answer.textAnswer);
          return {
            ...baseAnswer,
            jsonData,
          };
        } catch (e) {
          console.error(`Error parsing JSON for ${questionType} answer:`, e);
        }
      }

      return baseAnswer;
    });

    return NextResponse.json({
      success: true,
      data: formattedAnswers,
    });
  } catch (error) {
    console.error("[API] Error fetching answers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch answers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attempts/[id]/answers
 * Submit an answer for a quiz attempt
 */
export async function POST(
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

    // Get attempt to check ownership
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: userId,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            showResults: true,
          }
        }
      }
    });
    
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = AnswerSubmissionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid answer submission",
          errors: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const answerData = validationResult.data;

    // Get the question to determine appropriate handling
    const question = await prisma.question.findFirst({
      where: {
        id: answerData.questionId,
        quiz: {
          attempts: {
            some: {
              id: attemptId,
            },
          },
        },
      },
      include: {
        options: true,
      }
    });

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found or does not belong to this quiz" },
        { status: 404 }
      );
    }

    // Process the answer data based on question type
    // For DB storage, we need to format the data according to the schema
    const questionMetadata = normalizeMetadata(question.metadata);
    let dbAnswerData: any = { selectedOption: null, textAnswer: null };
    
    try {
      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
        case QuestionType.TRUE_FALSE:
          // For multiple choice questions, handle both single and multiple selection
          if (answerData.selectedOptions && answerData.selectedOptions.length > 0) {
            // Store first option in selectedOption field for backward compatibility
            dbAnswerData.selectedOption = answerData.selectedOptions[0];
            
            // Store all selected options in the new selectedOptionIds field
            dbAnswerData.selectedOptionIds = answerData.selectedOptions;
            
            // For backward compatibility, still store multiple options as JSON in textAnswer
            if (answerData.selectedOptions.length > 1) {
              dbAnswerData.textAnswer = JSON.stringify(answerData.selectedOptions);
            }
          }
          break;

        case QuestionType.SHORT_ANSWER:
        case QuestionType.ESSAY:
          // For text-based answers
          dbAnswerData.textAnswer = answerData.textAnswer || null;
          break;

        case QuestionType.MATCHING:
        case QuestionType.FILL_BLANK:
        case QuestionType.CODE:
          // For complex data types, ensure the data is properly serialized
          if (answerData.jsonData !== null && typeof answerData.jsonData !== 'undefined') {
            let finalJsonDataAsObject: Record<string, unknown>;

            if (typeof answerData.jsonData === 'string') {
              try {
                finalJsonDataAsObject = JSON.parse(answerData.jsonData);
                // Ensure the parsed result is actually an object and not a primitive (e.g. a string like ""test"" or a number)
                if (typeof finalJsonDataAsObject !== 'object' || finalJsonDataAsObject === null) {
                  throw new Error("Parsed jsonData is not a valid object.");
                }
              } catch (e) {
                console.error("jsonData was a string but not valid JSON or not an object after parsing:", e);
                return NextResponse.json(
                  { success: false, message: "Invalid jsonData format: Expected a parsable JSON object string." },
                  { status: 400 }
                );
              }
            } else if (typeof answerData.jsonData === 'object') {
              // It's already an object (and not null, as checked by the outer if)
              finalJsonDataAsObject = answerData.jsonData;
            } else {
              // This case should not be reached if Zod validation with union is correct
              return NextResponse.json(
                { success: false, message: "Unexpected type for jsonData after validation." },
                { status: 400 }
              );
            }

            // Now, finalJsonDataAsObject is guaranteed to be an object. Stringify it for storage.
            try {
              dbAnswerData.textAnswer = JSON.stringify(finalJsonDataAsObject);
            } catch (e) {
                console.error("Error stringifying finalJsonDataAsObject:", e);
                return NextResponse.json(
                    { success: false, message: "Failed to serialize jsonData for storage." },
                    { status: 500 } // Internal server error
                );
            }
          } else if (question.type === QuestionType.CODE && answerData.textAnswer) {
            // Fallback for CODE questions that might send direct text if jsonData is not provided
            dbAnswerData.textAnswer = answerData.textAnswer;
          }
          break;

        default:
          dbAnswerData.textAnswer = answerData.textAnswer || null;
      }
    } catch (error) {
      console.error("Error processing answer data:", error);
      return NextResponse.json(
        { success: false, message: "Failed to process answer data" },
        { status: 500 }
      );
    }

    // Check if an answer already exists for this question in this attempt
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        attemptId,
        questionId: answerData.questionId,
      },
    });

    // Update or create the answer
    let answer;
    
    try {
      if (existingAnswer) {
        // Update existing answer
        answer = await prisma.answer.update({
          where: {
            id: existingAnswer.id,
          },
          data: dbAnswerData,
        });
      } else {
        // Create new answer
        answer = await prisma.answer.create({
          data: {
            attemptId,
            questionId: answerData.questionId,
            ...dbAnswerData,
          },
        });
      }
    } catch (error) {
      console.error("Database error saving answer:", error);
      return NextResponse.json(
        { success: false, message: "Failed to save answer to database" },
        { status: 500 }
      );
    }

    // Format the response based on question type
    let responseData: any = {
      id: answer.id,
      questionId: answer.questionId,
      saved: true,
    };

    // Add additional detail
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        responseData.selectedOptions = answerData.selectedOptions || [];
        break;
        
      case QuestionType.SHORT_ANSWER:
      case QuestionType.ESSAY:
      case QuestionType.CODE:
        responseData.textAnswer = answerData.textAnswer || '';
        break;
        
      case QuestionType.MATCHING:
      case QuestionType.FILL_BLANK:
        responseData.jsonData = answerData.jsonData || {};
        break;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("[API] Error submitting answer:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit answer" },
      { status: 500 }
    );
  }
}