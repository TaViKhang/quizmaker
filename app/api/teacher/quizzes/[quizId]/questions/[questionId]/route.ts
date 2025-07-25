import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role, QuestionType } from "@prisma/client";
import { z } from "zod";

// Common schema for question data in PUT requests (fields are optional for partial updates)
const questionBaseUpdateSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  explanation: z.string().optional(),
  points: z.coerce.number().int().min(1).optional(),
  type: z.nativeEnum(QuestionType).optional(),
  order: z.coerce.number().int().optional(),
});

// Type-specific schemas for PUT
const multipleChoiceUpdateSchema = questionBaseUpdateSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
  metadata: z.object({
    allowMultiple: z.boolean().optional(),
    allowMultipleAnswers: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
  }).optional(),
  options: z.array(
    z.object({
      id: z.string().optional(),
      content: z.string().min(1),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
      order: z.number().int().min(0).optional(),
    })
  ).optional(),
});

// Định nghĩa schema cho một option trong câu hỏi matching
const matchingOptionUpdateSchema = z.object({
  id: z.string().optional(), // id có thể được client gửi lên (cả ID tạm thời hoặc ID thật từ DB)
  content: z.string().min(1, "Option content cannot be empty"),
  group: z.enum(['premise', 'response'], {
    errorMap: () => ({ message: "Option group must be 'premise' or 'response'." })
  }),
  order: z.number().int().min(0, "Option order must be a non-negative integer."),
  matchId: z.string().optional().nullable(), // matchId có trên premise, trỏ đến id của response
});

const matchingUpdateSchema = questionBaseUpdateSchema.extend({
  type: z.literal(QuestionType.MATCHING),
  options: z.array(matchingOptionUpdateSchema)
    .min(4, "Matching questions require at least 2 premises and 2 responses in total.")
    .refine(
      (options) => {
        const premises = options.filter(opt => opt.group === 'premise');
        const responses = options.filter(opt => opt.group === 'response');
        return premises.length >= 2 && responses.length >= 2;
      },
      { message: "Must have at least two premises and two responses." }
    )
    .refine(
      (options) => {
        // Lấy tất cả ID của response options (bao gồm cả ID tạm thời)
        const responseIds = new Set(
          options.filter(opt => opt.group === 'response').map(opt => opt.id).filter(Boolean)
        );
        
        // Với mỗi premise, kiểm tra xem matchId có tồn tại trong danh sách responseIds không
        const allPremisesWithValidMatches = options
          .filter(opt => opt.group === 'premise')
          .every(premise => {
            // Nếu premise có matchId, kiểm tra xem matchId đó có tồn tại trong responseIds không
            return premise.matchId && responseIds.has(premise.matchId);
          });
        
        return allPremisesWithValidMatches;
      },
      { message: "Each premise must be matched to a valid response option in the same question." }
    )
    .refine(
      (options) => { // Đảm bảo không có response nào được match bởi nhiều premise (nếu là one-to-one)
        const premises = options.filter(opt => opt.group === 'premise');
        const matchedResponseIds = new Set<string>();
        
        for (const premise of premises) {
          if (premise.matchId) {
            if (matchedResponseIds.has(premise.matchId)) {
              return false; // Tìm thấy một response được match nhiều lần
            }
            matchedResponseIds.add(premise.matchId);
          }
        }
        return true;
      },
      { message: "Each response can only be matched by one premise (one-to-one matching enforced)." }
    ).optional(),
  metadata: z.object({
    shuffleOptions: z.boolean().optional()
  }).optional(),
});

// Combined question update schema using discriminated union
const questionUpdateSchema = z.discriminatedUnion("type", [
  multipleChoiceUpdateSchema,
  matchingUpdateSchema,
  // Add other question type schemas as needed
]).or(questionBaseUpdateSchema); // Allow updates without specifying type

interface RouteParams {
  params: {
    quizId: string;
    questionId: string;
  };
}

/**
 * GET handler for retrieving a specific question
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const paramsData = await params;
    const { quizId, questionId } = paramsData;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Check if the quiz exists and belongs to the teacher
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        authorId: userId,
      },
    });
    
    if (!quiz) {
      return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });
    }
    
    // Find the question
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
        quizId,
      },
      include: {
        options: {
          orderBy: {
            order: "asc",
          },
        },
        // Include other related data based on question type
      },
    });
    
    if (!question) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });
    }
    
    return NextResponse.json(question);
  } catch (error) {
    console.error("Error retrieving question:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin câu hỏi" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a question
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const paramsData = await params;
    const { quizId, questionId } = paramsData;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Check if the quiz exists and belongs to the teacher
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        authorId: userId,
      },
    });
    
    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz không tồn tại hoặc bạn không có quyền chỉnh sửa" },
        { status: 404 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate request body
    const validationResult = questionUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Dữ liệu không hợp lệ", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    // Ensure the question exists
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
        quizId: quizId,
      },
      include: {
        options: true,
      },
    });
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Câu hỏi không tồn tại" },
        { status: 404 }
      );
    }
    
    // Process metadata
    let metadata = data.metadata;
    
    // For multiple choice questions, ensure metadata format is consistent
    if (existingQuestion.type === "MULTIPLE_CHOICE") {
      // Normalize metadata field names for consistency
      metadata = {
        ...(metadata || {}),
        // Convert allowMultipleAnswers to allowMultiple if exists
        ...(metadata?.allowMultipleAnswers !== undefined && {
          allowMultiple: Boolean(metadata.allowMultipleAnswers)
        }),
        // Ensure consistent metadata properties
        allowMultiple: metadata?.allowMultiple !== undefined 
          ? Boolean(metadata.allowMultiple) 
          : (metadata?.allowMultipleAnswers !== undefined 
              ? Boolean(metadata.allowMultipleAnswers) 
              : Boolean((existingQuestion.metadata as any)?.allowMultiple || false)),
        shuffleOptions: metadata?.shuffleOptions !== undefined
          ? Boolean(metadata.shuffleOptions)
          : Boolean((existingQuestion.metadata as any)?.shuffleOptions || false),
      };
      
      // Remove old naming convention if exists
      if (metadata.allowMultipleAnswers !== undefined) {
        delete metadata.allowMultipleAnswers;
      }
    }
    
    // Begin updating the question
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // Update the question itself
      const question = await tx.question.update({
        where: {
          id: questionId,
        },
        data: {
          content: data.content !== undefined ? data.content : existingQuestion.content,
          points: data.points !== undefined ? data.points : existingQuestion.points,
          order: data.order !== undefined ? data.order : existingQuestion.order,
          explanation: data.explanation !== undefined ? data.explanation : existingQuestion.explanation,
          metadata: metadata !== undefined ? metadata : existingQuestion.metadata,
        },
        include: {
          options: true,
        },
      });
      
      // Handle options update if provided
      if (data.options && Array.isArray(data.options)) {
        // Get map of existing options by ID for easy lookup
        const existingOptionsMap = new Map();
        existingQuestion.options.forEach(option => {
          existingOptionsMap.set(option.id, option);
        });
        
        // Track IDs of options to keep (not delete)
        const optionIdsToKeep = new Set<string>();
        
        // Xử lý đặc biệt cho câu hỏi MATCHING
        if (existingQuestion.type === "MATCHING") {
          const premiseOptionsFromRequest = data.options.filter((opt: any) => opt.group === 'premise');
          const responseOptionsFromRequest = data.options.filter((opt: any) => opt.group === 'response');
          const clientResponseIdToDbResponseIdMap = new Map<string, string>();

          // Process Response Options first
          for (const responseOpt of responseOptionsFromRequest) {
            if (responseOpt.id && responseOpt.id.startsWith('id_')) {
              // New response option (client-generated ID)
              const newResponse = await tx.option.create({
                data: {
                  questionId: questionId,
                  content: responseOpt.content,
                  group: 'response',
                  order: responseOpt.order ?? 0,
                  isCorrect: false,
                },
              });
              clientResponseIdToDbResponseIdMap.set(responseOpt.id, newResponse.id);
              optionIdsToKeep.add(newResponse.id);
            } else if (responseOpt.id) {
              // Existing response option (DB ID)
              const existingDbOption = existingOptionsMap.get(responseOpt.id);
              if (existingDbOption) {
                await tx.option.update({
                  where: { id: responseOpt.id },
                  data: {
                    content: responseOpt.content,
                    order: responseOpt.order,
                  },
                });
                optionIdsToKeep.add(responseOpt.id);
                clientResponseIdToDbResponseIdMap.set(responseOpt.id, responseOpt.id); // Map DB ID to itself
              } else {
                 // ID was provided, but not found in DB - treat as new if content exists
                 if (responseOpt.content) {
                    const newResponse = await tx.option.create({
                        data: {
                            questionId: questionId,
                            content: responseOpt.content,
                            group: 'response',
                            order: responseOpt.order ?? 0,
                            isCorrect: false,
                        },
                    });
                    // If original responseOpt.id was some non-client-id, we still need to map it if it was used in a matchId
                    clientResponseIdToDbResponseIdMap.set(responseOpt.id, newResponse.id); 
                    optionIdsToKeep.add(newResponse.id);
                 }
              }
            } else {
              // New response option (no ID from client)
              if (responseOpt.content) { // Only create if there is content
                const newResponse = await tx.option.create({
                    data: {
                    questionId: questionId,
                    content: responseOpt.content,
                    group: 'response',
                    order: responseOpt.order ?? 0,
                    isCorrect: false,
                    },
                });
                optionIdsToKeep.add(newResponse.id);
                // No client ID to map here
              }
            }
          }

          // Process Premise Options
          for (const premiseOpt of premiseOptionsFromRequest) {
            let finalMatchId = null;
            if (premiseOpt.matchId) {
              finalMatchId = clientResponseIdToDbResponseIdMap.get(premiseOpt.matchId) || premiseOpt.matchId;
            }

            if (premiseOpt.id && premiseOpt.id.startsWith('id_')) {
              // New premise option (client-generated ID)
              const newPremise = await tx.option.create({
                data: {
                  questionId: questionId,
                  content: premiseOpt.content,
                  group: 'premise',
                  order: premiseOpt.order ?? 0,
                  matchId: finalMatchId,
                  isCorrect: false,
                },
              });
              optionIdsToKeep.add(newPremise.id);
            } else if (premiseOpt.id) {
              // Existing premise option (DB ID)
              const existingDbOption = existingOptionsMap.get(premiseOpt.id);
              if (existingDbOption) {
                await tx.option.update({
                  where: { id: premiseOpt.id },
                  data: {
                    content: premiseOpt.content,
                    order: premiseOpt.order,
                    matchId: finalMatchId,
                  },
                });
                optionIdsToKeep.add(premiseOpt.id);
              } else {
                // ID was provided, but not found in DB - treat as new
                if (premiseOpt.content) {
                    const newPremise = await tx.option.create({
                        data: {
                            questionId: questionId,
                            content: premiseOpt.content,
                            group: 'premise',
                            order: premiseOpt.order ?? 0,
                            matchId: finalMatchId,
                            isCorrect: false,
                        },
                    });
                    optionIdsToKeep.add(newPremise.id);
                }
              }
            } else {
              // New premise option (no ID from client)
               if (premiseOpt.content) { // Only create if there is content
                    const newPremise = await tx.option.create({
                        data: {
                        questionId: questionId,
                        content: premiseOpt.content,
                        group: 'premise',
                        order: premiseOpt.order ?? 0,
                        matchId: finalMatchId,
                        isCorrect: false,
                        },
                    });
                    optionIdsToKeep.add(newPremise.id);
               }
            }
          }
        } else {
          // Handle options for other question types (non-MATCHING)
          for (const option of data.options) {
            if (option.id && existingOptionsMap.has(option.id)) {
              // Update existing option
              await tx.option.update({
                where: { id: option.id },
                data: {
                  content: option.content,
                  isCorrect: option.isCorrect,
                  order: option.order,
                  group: option.group,
                  matchId: option.matchId,
                  position: option.position,
                },
              });
              optionIdsToKeep.add(option.id);
            } else {
              // Create new option only if it has content
              if (option.content) { 
                const newOption = await tx.option.create({
                  data: {
                    questionId: questionId,
                    content: option.content,
                    isCorrect: Boolean(option.isCorrect),
                    order: option.order || 0,
                    group: option.group,
                    matchId: option.matchId,
                    position: option.position,
                  },
                });
                optionIdsToKeep.add(newOption.id);
              }
            }
          }
        }
        
        // Delete options that weren't in the update and are not in optionIdsToKeep
        const idsToDelete = existingQuestion.options
                            .map(opt => opt.id)
                            .filter(id => !optionIdsToKeep.has(id));
        
        if (idsToDelete.length > 0) {
            await tx.option.deleteMany({
                where: {
                questionId: questionId,
                id: { in: idsToDelete },
                },
            });
        }
      }
      
      // Get the updated question with new options
      return await tx.question.findUnique({
        where: {
          id: questionId,
        },
        include: {
          options: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });
    
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật câu hỏi" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a question
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const paramsData = await params;
    const { quizId, questionId } = paramsData;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }
    
    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Check if the quiz exists and belongs to the teacher
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
        authorId: userId,
      },
    });
    
    if (!quiz) {
      return NextResponse.json({ error: "Không tìm thấy quiz" }, { status: 404 });
    }
    
    // Check if the question exists and belongs to the quiz
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id: questionId,
        quizId,
      },
    });
    
    if (!existingQuestion) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });
    }
    
    // Delete the question
    await prisma.question.delete({
      where: {
        id: questionId,
      },
    });
    
    // Update order of remaining questions
    const remainingQuestions = await prisma.question.findMany({
      where: {
        quizId,
        order: {
          gt: existingQuestion.order,
        },
      },
      orderBy: {
        order: "asc",
      },
    });
    
    // Update the order of remaining questions
    await Promise.all(
      remainingQuestions.map((question) =>
        prisma.question.update({
          where: { id: question.id },
          data: { order: question.order - 1 },
        })
      )
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Lỗi khi xóa câu hỏi" },
      { status: 500 }
    );
  }
} 