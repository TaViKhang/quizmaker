import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { QuestionType, Role } from "@prisma/client";
import { z } from "zod";

// Common schema for question data
const questionBaseSchema = z.object({
  content: z.string().min(1).max(10000),
  explanation: z.string().optional(),
  points: z.coerce.number().int().min(1),
  type: z.nativeEnum(QuestionType),
  order: z.coerce.number().int().optional(),
});

// Type-specific schemas
const multipleChoiceSchema = questionBaseSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
  allowMultipleAnswers: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  options: z.array(
    z.object({
      content: z.string().min(1),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })
  ).min(2),
});

const essaySchema = questionBaseSchema.extend({
  type: z.literal(QuestionType.ESSAY),
  wordLimit: z.coerce.number().int().min(1).max(10000).optional(),
  placeholder: z.string().optional(),
  rubric: z.array(
    z.object({
      criteria: z.string().min(1),
      weight: z.coerce.number().min(0).max(100),
      levels: z.array(
        z.object({
          level: z.string().min(1),
          points: z.coerce.number().int().min(0),
          description: z.string().min(1),
        })
      ).min(2),
    })
  ).optional(),
});

const trueFalseSchema = questionBaseSchema.extend({
  type: z.literal(QuestionType.TRUE_FALSE),
  correctAnswer: z.boolean(),
});

const shortAnswerSchema = questionBaseSchema.extend({
  type: z.literal(QuestionType.SHORT_ANSWER),
  caseSensitive: z.boolean().default(false),
  acceptableAnswers: z.array(z.string().min(1)).min(1),
});

// Định nghĩa schema cho một option trong câu hỏi matching
const matchingOptionSchema = z.object({
  id: z.string().optional(), // id có thể được client gửi lên (cả ID tạm thời hoặc ID thật từ DB)
  content: z.string().min(1, "Option content cannot be empty"),
  group: z.enum(['premise', 'response'], {
    errorMap: () => ({ message: "Option group must be 'premise' or 'response'." })
  }),
  order: z.number().int().min(0, "Option order must be a non-negative integer."),
  matchId: z.string().optional().nullable(), // matchId có trên premise, trỏ đến id của response
});

const matchingSchema = questionBaseSchema.extend({
  type: z.literal(QuestionType.MATCHING),
  options: z.array(matchingOptionSchema)
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
    ),
  metadata: z.object({
    shuffleOptions: z.boolean().default(false)
  }).optional().nullable(),
});

const fillBlankSchema = questionBaseSchema.extend({
  type: z.literal(QuestionType.FILL_BLANK),
  text: z.string().min(1),
  blanks: z.array(
    z.object({
      id: z.string(),
      acceptableAnswers: z.array(z.string().min(1)).min(1),
      caseSensitive: z.boolean().default(false),
      points: z.coerce.number().int().min(1).optional(),
    })
  ).min(1),
});

const codeSchema = questionBaseSchema.extend({
  type: z.literal(QuestionType.CODE),
  language: z.string().min(1),
  defaultCode: z.string().optional(),
  solutionCode: z.string(),
  testCases: z.array(
    z.object({
      input: z.string().optional(),
      expectedOutput: z.string(),
      hidden: z.boolean().default(false),
      points: z.coerce.number().int().min(0).optional(),
    })
  ).optional(),
});

// Combined question schema using discriminated union
const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema,
  essaySchema,
  trueFalseSchema,
  shortAnswerSchema,
  matchingSchema,
  fillBlankSchema,
  codeSchema,
]);

/**
 * GET handler for retrieving all questions for a quiz
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: "Không được phép" }, { status: 401 });
    }

    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json({ error: "Không được phép" }, { status: 403 });
    }

    const userId = session.user.id;
    const paramsData = await params;
    const quizId = paramsData.quizId;

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

    // Fetch all questions for this quiz
    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: "asc" },
      include: {
        options: true,
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách câu hỏi" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new question
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    // Kiểm tra xác thực
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lấy dữ liệu từ request body
    const body = await req.json();
    const quizId = params.quizId;

    // Validate quizId
    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required" }, { status: 400 });
    }

    // Kiểm tra quyền truy cập
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { authorId: true }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.authorId !== session.user.id) {
      return NextResponse.json({ error: "You don't have permission to modify this quiz" }, { status: 403 });
    }

    // Lấy số lượng câu hỏi hiện tại để tính order mới
    const questionCount = await prisma.question.count({
      where: { quizId }
    });

    // Xử lý metadata cho các loại câu hỏi
    let metadata = {};
    
    // Xử lý đặc biệt cho Multiple Choice để đảm bảo trường metadata được lưu đúng
    if (body.type === "MULTIPLE_CHOICE") {
      metadata = {
        allowMultiple: body.allowMultipleAnswers || body.allowMultiple || false,
        shuffleOptions: body.shuffleOptions || false
      };
    } else if (body.metadata) {
      // Loại câu hỏi khác, giữ nguyên metadata từ client
      metadata = body.metadata;
    }

    // Tạo câu hỏi mới
    const question = await prisma.$transaction(async (tx) => {
      // 1. Tạo bản ghi Question trước (không có options)
      const newQuestion = await tx.question.create({
      data: {
      quizId,
        content: body.content,
        type: body.type,
        points: body.points || 1,
        order: body.order !== undefined ? body.order : questionCount,
        explanation: body.explanation || null,
        category: body.category || null,
        difficulty: body.difficulty || null,
        metadata: metadata, // Sử dụng metadata đã xử lý
        },
      });

      const optionsFromBody = Array.isArray(body.options) ? body.options : [];

      // 2. Xử lý options sau khi đã có newQuestion.id
      if (body.type === QuestionType.MATCHING) {
        const premiseOptionsData = optionsFromBody.filter((opt: any) => opt.group === 'premise');
        const responseOptionsData = optionsFromBody.filter((opt: any) => opt.group === 'response');
        const clientResponseIdToDbResponseId = new Map<string, string>();

        // 2a. Tạo tất cả response options và lưu map ID
        for (const responseOpt of responseOptionsData) {
          const createdResponse = await tx.option.create({
            data: {
              questionId: newQuestion.id, // Gán questionId thật
              content: responseOpt.content,
              group: responseOpt.group,
              order: responseOpt.order !== undefined ? responseOpt.order : 0,
              isCorrect: false,
            },
          });
          if (responseOpt.id) { // Nếu client có gửi ID tạm thời cho response
            clientResponseIdToDbResponseId.set(responseOpt.id, createdResponse.id);
          }
        }

        // 2b. Tạo tất cả premise options, sử dụng map ID để lấy matchId thật
        for (const premiseOpt of premiseOptionsData) {
          let finalMatchId = null;
          if (premiseOpt.matchId) {
            finalMatchId = clientResponseIdToDbResponseId.get(premiseOpt.matchId) || null;
            // Quan trọng: Nếu `premiseOpt.matchId` là một ID thật từ DB (trong trường hợp copy câu hỏi chẳng hạn)
            // và nó không có trong clientResponseIdToDbResponseId (vì response đó không phải mới),
            // thì chúng ta cần kiểm tra xem ID đó có thực sự tồn tại không.
            // Tuy nhiên, trong kịch bản TẠO MỚI, matchId luôn là ID tạm thời từ client.
            // Nếu không tìm thấy trong map, có nghĩa là client đã gửi matchId không hợp lệ.
            // Zod validation ở trên nên bắt trường hợp này.
          }
          await tx.option.create({
            data: {
              questionId: newQuestion.id, // Gán questionId thật
              content: premiseOpt.content,
              group: premiseOpt.group,
              order: premiseOpt.order !== undefined ? premiseOpt.order : 0,
              matchId: finalMatchId,
              isCorrect: false,
            },
          });
        }
      } else {
        // Xử lý options cho các loại câu hỏi khác
        if (optionsFromBody.length > 0) {
          await tx.option.createMany({
            data: optionsFromBody.map((option: any) => ({
              questionId: newQuestion.id, // Gán questionId thật
              content: option.content,
              isCorrect: option.isCorrect || false,
              order: option.order !== undefined ? option.order : 0,
              group: option.group || null,
              matchId: option.matchId || null,
              position: option.position || null,
            })),
          });
        }
      }

      // 3. Lấy lại câu hỏi đầy đủ với options
      return await tx.question.findUnique({
        where: { id: newQuestion.id },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create question" },
      { status: 500 }
    );
  }
} 