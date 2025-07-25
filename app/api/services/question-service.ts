import { db } from "@/lib/db";
import { CreateQuestionInput, QuestionQuery, UpdateQuestionInput } from "../schemas/question-schemas";
import { Question } from "../models/question";
import { Prisma } from "@prisma/client";

/**
 * Service for question operations
 */
export class QuestionService {
  /**
   * Get list of questions with filter and pagination
   */
  async getQuestions(query: QuestionQuery): Promise<{
    items: Question[];
    total: number;
  }> {
    const { page, limit, type, difficulty, search, tags, category, quizId, questionBankId } = query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where: Prisma.QuestionWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (category) {
      where.category = category;
    }

    if (quizId) {
      where.quizId = quizId;
    }

    if (questionBankId) {
      where.questionBankId = questionBankId;
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tags) {
      const tagList = tags.split(",").map(tag => tag.trim());
      where.tags = {
        hasSome: tagList,
      };
    }

    // Get questions with count
    const [items, total] = await Promise.all([
      db.question.findMany({
        where,
        include: {
          options: true,
        },
        orderBy: [
          { order: "asc" },
          { id: "desc" }
        ],
        skip,
        take: limit,
      }),
      db.question.count({ where }),
    ]);

    return {
      items: items as unknown as Question[],
      total,
    };
  }

  /**
   * Get question details
   */
  async getQuestionById(id: string): Promise<Question | null> {
    const question = await db.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: "asc" }
        },
      },
    });

    return question as unknown as Question | null;
  }

  /**
   * Create a new question
   */
  async createQuestion(data: CreateQuestionInput): Promise<Question> {
    const { options, ...questionData } = data;

    // Create question and options in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create question first
      const question = await tx.question.create({
        data: questionData,
      });

      // If there are options, create them
      if (options && options.length > 0) {
        await tx.option.createMany({
          data: options.map((option, index) => ({
            content: option.content,
            isCorrect: option.isCorrect,
            order: option.order || index,
            group: option.group,
            matchId: option.matchId,
            position: option.position,
            questionId: question.id,
          })),
        });
      }

      // Get created question with options
      return await tx.question.findUnique({
        where: { id: question.id },
        include: {
          options: {
            orderBy: { order: "asc" }
          },
        },
      });
    });

    return result as unknown as Question;
  }

  /**
   * Update question
   */
  async updateQuestion(id: string, data: UpdateQuestionInput): Promise<Question> {
    const { options, ...questionData } = data;

    // Cập nhật question và options trong transaction
    const result = await db.$transaction(async (tx) => {
      // Cập nhật question
      const question = await tx.question.update({
        where: { id },
        data: questionData,
      });

      // Nếu có update options
      if (options) {
        // Xóa options cũ
        await tx.option.deleteMany({
          where: { questionId: id },
        });

        // Tạo options mới
        if (options.length > 0) {
          await tx.option.createMany({
            data: options.map((option, index) => ({
              content: option.content,
              isCorrect: option.isCorrect,
              order: option.order || index,
              group: option.group,
              matchId: option.matchId,
              position: option.position,
              questionId: id,
            })),
          });
        }
      }

      // Lấy question đã cập nhật với options
      return await tx.question.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: { order: "asc" }
          },
        },
      });
    });

    return result as unknown as Question;
  }

  /**
   * Delete question
   */
  async deleteQuestion(id: string): Promise<boolean> {
    try {
      await db.$transaction(async (tx) => {
        // Xóa các answers liên quan trước
        await tx.answer.deleteMany({
          where: { questionId: id },
        });
        
        // Xóa các options
        await tx.option.deleteMany({
          where: { questionId: id },
        });

        // Xóa question
        await tx.question.delete({
          where: { id },
        });
      });

      return true;
    } catch (error) {
      console.error("Error deleting question:", error);
      return false;
    }
  }
} 