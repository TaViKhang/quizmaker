import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  errorResponse, 
  handleZodError, 
  notFoundResponse,
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "@/app/api/utils/api-response";
import { z } from "zod";

// Schema xác thực cho cập nhật đánh giá câu trả lời
const UpdateAnswerSchema = z.object({
  score: z.number().min(0).optional(),
  isCorrect: z.boolean().optional(),
  feedback: z.string().optional(),
});

type UpdateAnswerInput = z.infer<typeof UpdateAnswerSchema>;

/**
 * GET /api/attempts/[id]/answers/[answerId]
 * Lấy thông tin một câu trả lời cụ thể
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string, answerId: string } }
) {
  try {
    // Xác thực người dùng
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Lấy thông tin câu trả lời
    const answer = await prisma.answer.findUnique({
      where: { id: params.answerId },
      include: {
        attempt: {
          select: {
            userId: true,
            completedAt: true,
          }
        },
        question: {
          select: {
            content: true,
            type: true,
            points: true,
          }
        }
      }
    });
    
    if (!answer) {
      return notFoundResponse("Câu trả lời không tồn tại");
    }

    // Kiểm tra nếu người dùng là chủ sở hữu của bài làm hoặc là giáo viên
    const isOwner = answer.attempt.userId === session.user.id;
    const isTeacher = session.user.role === "TEACHER";
    
    if (!isOwner && !isTeacher) {
      return errorResponse("Bạn không có quyền xem câu trả lời này", { 
        status: 403, 
        code: "FORBIDDEN" 
      });
    }

    return successResponse(answer);
  } catch (error) {
    console.error("Lỗi khi lấy câu trả lời:", error);
    return serverErrorResponse("Không thể lấy thông tin câu trả lời");
  }
}

/**
 * PUT /api/attempts/[id]/answers/[answerId]
 * Cập nhật điểm số và đánh giá cho một câu trả lời cụ thể
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string, answerId: string } }
) {
  try {
    // Xác thực người dùng
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Chỉ giáo viên mới có thể chấm điểm
    if (session.user.role !== "TEACHER") {
      return errorResponse("Chỉ giáo viên mới có thể chấm điểm", { 
        status: 403, 
        code: "FORBIDDEN" 
      });
    }

    // Kiểm tra câu trả lời tồn tại
    const answer = await prisma.answer.findUnique({
      where: { 
        id: params.answerId,
        attemptId: params.id // Đảm bảo answerId thuộc về attempt này
      },
      include: {
        attempt: {
          select: {
            completedAt: true,
            quizId: true
          }
        },
        question: {
          select: {
            points: true
          }
        }
      }
    });
    
    if (!answer) {
      return notFoundResponse("Câu trả lời không tồn tại hoặc không thuộc về bài làm này");
    }

    // Bài làm phải đã hoàn thành mới có thể chấm điểm
    if (!answer.attempt.completedAt) {
      return errorResponse("Không thể chấm điểm cho bài làm chưa hoàn thành", { 
        status: 400, 
        code: "INVALID_OPERATION" 
      });
    }

    // Phân tích và xác thực dữ liệu từ request
    const body = await req.json();
    const validationResult = UpdateAnswerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    const data: UpdateAnswerInput = validationResult.data;
    
    // Kiểm tra điểm số không vượt quá điểm tối đa của câu hỏi
    if (data.score !== undefined && data.score > answer.question.points) {
      return errorResponse(`Điểm số không thể vượt quá ${answer.question.points} điểm`, { 
        status: 400, 
        code: "INVALID_SCORE" 
      });
    }

    // Cập nhật câu trả lời
    const updatedAnswer = await prisma.answer.update({
      where: { id: params.answerId },
      data: {
        score: data.score,
        isCorrect: data.isCorrect,
        feedback: data.feedback
        // Không cập nhật selectedOption/selectedOptionIds vì đây là route dành cho giáo viên chấm điểm
      },
    });

    // Nếu cập nhật điểm, tính lại tổng điểm của bài làm
    if (data.score !== undefined || data.isCorrect !== undefined) {
      await recalculateAttemptScore(params.id);
    }

    return successResponse(updatedAnswer);
  } catch (error) {
    console.error("Lỗi khi cập nhật câu trả lời:", error);
    
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    
    return serverErrorResponse("Không thể cập nhật câu trả lời");
  }
}

/**
 * DELETE /api/attempts/[id]/answers/[answerId]
 * Xóa một câu trả lời (chỉ dành cho giáo viên, chủ yếu để sử dụng trong trường hợp đặc biệt)
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string, answerId: string } }
) {
  try {
    // Xác thực người dùng
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Chỉ giáo viên mới có thể xóa câu trả lời
    if (session.user.role !== "TEACHER") {
      return errorResponse("Chỉ giáo viên mới có thể xóa câu trả lời", { 
        status: 403, 
        code: "FORBIDDEN" 
      });
    }

    // Kiểm tra câu trả lời tồn tại
    const answer = await prisma.answer.findUnique({
      where: { 
        id: params.answerId,
        attemptId: params.id
      }
    });
    
    if (!answer) {
      return notFoundResponse("Câu trả lời không tồn tại hoặc không thuộc về bài làm này");
    }

    // Xóa câu trả lời
    await prisma.answer.delete({
      where: { id: params.answerId }
    });

    // Tính lại điểm của bài làm
    await recalculateAttemptScore(params.id);

    return successResponse({ message: "Đã xóa câu trả lời thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa câu trả lời:", error);
    return serverErrorResponse("Không thể xóa câu trả lời");
  }
}

/**
 * Hàm tính lại điểm số cho bài làm sau khi cập nhật câu trả lời
 */
async function recalculateAttemptScore(attemptId: string) {
  // Lấy thông tin bài làm và tất cả câu trả lời
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      quiz: {
        include: {
          questions: true
        }
      }
    }
  });

  if (!attempt) return;

  // Tính toán điểm số mới
  let totalScore = 0;
  let totalPoints = 0;
  let totalQuestionsAnswered = 0;
  let autoGradedCount = 0;
  let manualGradedCount = 0;

  // Tạo map các câu hỏi để dễ truy cập
  const questionMap = new Map(
    attempt.quiz.questions.map(q => [q.id, q])
  );

  // Xử lý từng câu trả lời
  for (const answer of attempt.answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    totalQuestionsAnswered++;
    totalPoints += question.points;

    // Kiểm tra nếu câu trả lời đã được chấm điểm
    if (answer.score !== null) {
      totalScore += answer.score;
      
      // Phân loại câu trả lời tự động hoặc thủ công
      if (answer.isCorrect !== null) {
        autoGradedCount++;
      } else {
        manualGradedCount++;
      }
    }
  }

  // Tính điểm phần trăm
  let percentageScore = 0;
  
  if (totalPoints > 0) {
    if (totalQuestionsAnswered === (autoGradedCount + manualGradedCount)) {
      // Tất cả câu hỏi đã được chấm điểm
      percentageScore = (totalScore / totalPoints) * 100;
    } else {
      // Còn câu hỏi chưa được chấm điểm
      const gradedPoints = attempt.answers
        .filter(a => a.score !== null)
        .reduce((sum, answer) => {
          const question = questionMap.get(answer.questionId);
          return sum + (question?.points || 0);
        }, 0);
      
      if (gradedPoints > 0) {
        percentageScore = (totalScore / gradedPoints) * 100;
      }
      
      // Nếu còn câu hỏi cần chấm điểm thủ công, đánh dấu bằng điểm âm
      if (manualGradedCount > 0 || totalQuestionsAnswered > (autoGradedCount + manualGradedCount)) {
        percentageScore = -Math.abs(percentageScore);
      }
    }
  }

  // Cập nhật điểm số cho bài làm
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { score: percentageScore }
  });
} 