import { z } from "zod";

/**
 * Base schema for creating an attempt
 */
export const CreateAttemptSchema = z.object({
  quizId: z.string().cuid(),
  userId: z.string(), // Accept any string format, not just cuid
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * Schema for updating an attempt
 */
export const UpdateAttemptSchema = z.object({
  completedAt: z.date().optional(),
  score: z.number().min(0).optional(),
  timeSpent: z.number().min(0).optional(), // Time spent in seconds
});

/**
 * Schema for getting attempts with pagination
 */
export const AttemptQuerySchema = z.object({
  quizId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sortBy: z.enum(["startedAt", "completedAt", "score"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  status: z.enum(["completed", "in_progress", "all"]).optional(),
  fromDate: z.string().optional(), // ISO date string
  toDate: z.string().optional(), // ISO date string
});

/**
 * Schema for submitting an answer
 */
export const SubmitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  selectedOption: z.string().optional(),
  textAnswer: z.string().optional(),
});

/**
 * Schema for bulk submitting answers
 */
export const BulkSubmitAnswersSchema = z.object({
  answers: z.array(SubmitAnswerSchema),
});

/**
 * Alternative schema for submitting answers directly as an array
 */
export const BulkAnswersArraySchema = z.array(SubmitAnswerSchema);

/**
 * Schema for completing an attempt
 */
export const CompleteAttemptSchema = z.object({
  timeSpent: z.number().min(0).optional(),
});

/**
 * Types derived from schemas
 */
export type CreateAttemptInput = z.infer<typeof CreateAttemptSchema>;
export type UpdateAttemptInput = z.infer<typeof UpdateAttemptSchema>;
export type AttemptQueryParams = z.infer<typeof AttemptQuerySchema>;
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
export type BulkSubmitAnswersInput = z.infer<typeof BulkSubmitAnswersSchema>;
export type CompleteAttemptInput = z.infer<typeof CompleteAttemptSchema>; 