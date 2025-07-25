import { db } from "@/lib/db";
import { QuestionService } from "./question-service";
import { CreateQuestionInput, UpdateQuestionInput } from "../schemas/question-schemas";
import { Question } from "../models/question";
import { Prisma, Role } from "@prisma/client";

/**
 * Service for managing questions within quizzes
 */
export class QuizQuestionService {
  private questionService: QuestionService;

  constructor() {
    this.questionService = new QuestionService();
  }

  /**
   * Check if user has permission to modify quiz
   */
  async checkQuizPermission(quizId: string, userId: string, userRole: Role | null | undefined): Promise<{
    hasPermission: boolean;
    error?: { code: string; message: string };
    quiz?: any;
  }> {
    try {
      // Only teachers can manage quiz questions
      if (userRole !== Role.TEACHER) {
        return {
          hasPermission: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Only teachers can manage quiz questions"
          }
        };
      }

      // Check if quiz exists and belongs to teacher
      const quiz = await db.quiz.findFirst({
        where: {
          id: quizId,
          authorId: userId
        }
      });

      if (!quiz) {
        return {
          hasPermission: false,
          error: {
            code: "NOT_FOUND",
            message: "Quiz not found or you don't have permission to modify it"
          }
        };
      }

      // Kiểm tra nếu quiz đã publish và có attempts, cho phép xóa câu hỏi nhưng phải 
      // thông báo người dùng rằng điều này sẽ ảnh hưởng đến dữ liệu của học sinh
      // Không cần trả về lỗi, chỉ cảnh báo thông qua UI

      return { hasPermission: true, quiz };
    } catch (error) {
      console.error("Error checking quiz permission:", error);
      return {
        hasPermission: false,
        error: {
          code: "SERVER_ERROR",
          message: "An error occurred while checking quiz permission"
        }
      };
    }
  }

  /**
   * Get questions for a specific quiz
   */
  async getQuizQuestions(quizId: string, limit: number = 100, page: number = 1): Promise<{
    items: Question[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    // Get questions with pagination
    const [items, total] = await Promise.all([
      db.question.findMany({
        where: {
          quizId,
        },
        include: {
          options: {
            orderBy: { order: "asc" }
          },
        },
        orderBy: [
          { order: "asc" } as Prisma.QuestionOrderByWithRelationInput,
          { createdAt: "desc" } as Prisma.QuestionOrderByWithRelationInput
        ],
        skip,
        take: limit,
      }),
      db.question.count({
        where: { quizId }
      }),
    ]);

    return {
      items: items as unknown as Question[],
      total,
    };
  }

  /**
   * Add a question to a quiz
   */
  async addQuestionToQuiz(quizId: string, data: CreateQuestionInput): Promise<Question> {
    // Add quiz ID to question data
    const questionData = {
      ...data,
      quizId,
    };

    // Use question service to create question
    return await this.questionService.createQuestion(questionData);
  }

  /**
   * Update a question in a quiz
   */
  async updateQuizQuestion(
    quizId: string, 
    questionId: string, 
    data: UpdateQuestionInput
  ): Promise<Question | null> {
    // Check if question belongs to this quiz
    const question = await db.question.findFirst({
      where: {
        id: questionId,
        quizId,
      },
    });

    if (!question) {
      return null;
    }

    // Use question service to update the question
    return await this.questionService.updateQuestion(questionId, data);
  }

  /**
   * Delete a question from a quiz
   */
  async deleteQuizQuestion(quizId: string, questionId: string): Promise<boolean> {
    // Check if question belongs to this quiz
    const question = await db.question.findFirst({
      where: {
        id: questionId,
        quizId,
      },
    });

    if (!question) {
      return false;
    }

    // Use question service to delete the question
    return await this.questionService.deleteQuestion(questionId);
  }

  /**
   * Reorder questions in a quiz
   */
  async reorderQuizQuestions(quizId: string, questionIds: string[]): Promise<boolean> {
    try {
      // Verify all questions belong to this quiz
      const existingQuestions = await db.question.findMany({
        where: { quizId },
        select: { id: true },
      });

      const existingIds = new Set(existingQuestions.map(q => q.id));

      // Check if all provided question IDs exist in the quiz
      if (!questionIds.every(id => existingIds.has(id))) {
        return false;
      }

      // Check if all questions in the quiz are included in the reordering
      if (questionIds.length !== existingQuestions.length) {
        return false;
      }

      // Update the order of all questions in a transaction
      await db.$transaction(
        questionIds.map((id, index) =>
          db.question.update({
            where: { id },
            data: { order: index },
          })
        )
      );

      return true;
    } catch (error) {
      console.error("Error reordering questions:", error);
      return false;
    }
  }
} 