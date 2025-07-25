import { z } from "zod";

/**
 * Enum types for question types - matches QuestionType in schema.prisma
 */
export const QuestionTypeEnum = z.enum([
  "MULTIPLE_CHOICE", // Multiple choice questions
  "ESSAY",           // Essay questions
  "TRUE_FALSE",      // True/False questions
  "SHORT_ANSWER",    // Short answer questions
  "MATCHING",        // Matching questions
  "FILL_BLANK",      // Fill in the blank
  "CODE",            // Code questions
  "FILE_UPLOAD",     // File upload questions
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;

/**
 * Schema for question options - matches Option model in schema.prisma
 */
export const OptionSchema = z.object({
  id: z.string().optional(), // Optional when creating new
  content: z.string().min(1, "Option content cannot be empty"),
  isCorrect: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
  group: z.string().optional(),
  matchId: z.string().optional(),
  position: z.number().int().optional(),
});

export type Option = z.infer<typeof OptionSchema>;

// Base schema for all question types
const BaseQuestionSchema = z.object({
  content: z.string().min(1, "Question content cannot be empty"),
  points: z.number().int().positive().default(1),
  order: z.number().int().nonnegative().default(0),
  category: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).default(3).optional(),
  explanation: z.string().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]).optional(),
  mediaUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  questionBankId: z.string().optional(),
  quizId: z.string().optional(),
});

// Schema for multiple choice questions
const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  options: z.array(OptionSchema)
    .min(2, "Must have at least 2 options")
    .refine(
      (options) => options.some(option => option.isCorrect === true),
      {
        message: "Must have at least one correct option",
      }
    ),
});

// Schema for true/false questions
const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("TRUE_FALSE"),
  options: z.array(OptionSchema)
    .length(2, "Must have exactly 2 options (True/False)")
    .refine(
      (options) => options.some(option => option.isCorrect === true),
      {
        message: "Must have one correct option",
      }
    ),
});

// Schema for essay questions
const EssayQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("ESSAY"),
  options: z.array(OptionSchema).optional(),
});

// Schema for short answer questions
const ShortAnswerQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("SHORT_ANSWER"),
  options: z.array(OptionSchema).optional(),
});

// Schema for matching questions
const MatchingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("MATCHING"),
  options: z.array(OptionSchema).optional(),
});

// Schema for fill in the blank questions
const FillBlankQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("FILL_BLANK"),
  options: z.array(OptionSchema).optional(),
});

// Schema for code questions
const CodeQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("CODE"),
  options: z.array(OptionSchema).optional(),
});

// Schema for file upload questions
const FileUploadQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal("FILE_UPLOAD"),
  options: z.array(OptionSchema).optional(),
});

// Combined schema using discriminated union
export const CreateQuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  EssayQuestionSchema,
  ShortAnswerQuestionSchema,
  MatchingQuestionSchema,
  FillBlankQuestionSchema,
  CodeQuestionSchema,
  FileUploadQuestionSchema
]);

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

// Update schemas for each question type - all partial
const UpdateBaseQuestionSchema = BaseQuestionSchema.partial();

const UpdateMultipleChoiceQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  options: z.array(OptionSchema).optional()
});

const UpdateTrueFalseQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("TRUE_FALSE"),
  options: z.array(OptionSchema).optional()
});

const UpdateEssayQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("ESSAY"),
  options: z.array(OptionSchema).optional()
});

const UpdateShortAnswerQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("SHORT_ANSWER"),
  options: z.array(OptionSchema).optional()
});

const UpdateMatchingQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("MATCHING"),
  options: z.array(OptionSchema).optional()
});

const UpdateFillBlankQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("FILL_BLANK"),
  options: z.array(OptionSchema).optional()
});

const UpdateCodeQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("CODE"),
  options: z.array(OptionSchema).optional()
});

const UpdateFileUploadQuestionSchema = UpdateBaseQuestionSchema.extend({
  type: z.literal("FILE_UPLOAD"),
  options: z.array(OptionSchema).optional()
});

// Combined update schema using discriminated union
export const UpdateQuestionSchema = z.discriminatedUnion("type", [
  UpdateMultipleChoiceQuestionSchema,
  UpdateTrueFalseQuestionSchema,
  UpdateEssayQuestionSchema,
  UpdateShortAnswerQuestionSchema,
  UpdateMatchingQuestionSchema,
  UpdateFillBlankQuestionSchema,
  UpdateCodeQuestionSchema,
  UpdateFileUploadQuestionSchema
]);

export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;

/**
 * Schema for question query parameters
 */
export const QuestionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  type: QuestionTypeEnum.optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // "tag1,tag2,tag3"
  quizId: z.string().optional(),
  questionBankId: z.string().optional(),
});

export type QuestionQuery = z.infer<typeof QuestionQuerySchema>; 