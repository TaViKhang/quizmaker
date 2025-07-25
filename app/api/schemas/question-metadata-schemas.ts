import { z } from "zod";

/**
 * Metadata schema for multiple choice questions
 */
export const MultipleChoiceMetadataSchema = z.object({
  allowMultiple: z.boolean().default(false),
  // Support both property names for backward compatibility
  allowMultipleAnswers: z.boolean().optional(),
  shuffleOptions: z.boolean().default(false),
  allowPartialCredit: z.boolean().default(true)
}).strict()
.transform(data => {
  // Ensure consistent property usage
  if (data.allowMultipleAnswers !== undefined && data.allowMultiple === false) {
    data.allowMultiple = Boolean(data.allowMultipleAnswers);
  }
  return data;
});

/**
 * Metadata schema for true/false questions
 */
export const TrueFalseMetadataSchema = z.object({}).strict();

/**
 * Metadata schema for essay questions
 */
export const EssayMetadataSchema = z.object({
  minWords: z.number().int().nonnegative().optional(),
  maxWords: z.number().int().positive().optional(),
  placeholder: z.string().optional(),
  richText: z.boolean().default(false)
}).strict();

/**
 * Metadata schema for short answer questions
 */
export const ShortAnswerMetadataSchema = z.object({
  caseSensitive: z.boolean().default(false),
  placeholder: z.string().optional()
}).strict();

/**
 * Metadata schema for fill in the blank questions
 */
export const FillBlankMetadataSchema = z.object({
  text: z.string().min(1, "Text content with blanks is required"),
  caseSensitive: z.boolean().default(false)
}).strict();

/**
 * Metadata schema for code questions
 */
export const CodeMetadataSchema = z.object({
  language: z.string().default("javascript"),
  initialCode: z.string().optional(),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string()
  })).optional()
}).strict();

/**
 * Metadata schema for matching questions
 */
export const MatchingMetadataSchema = z.object({
  shuffleOptions: z.boolean().default(false)
}).strict();

/**
 * Combined metadata schema based on question type
 */
export const QuestionMetadataSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MULTIPLE_CHOICE"),
    metadata: MultipleChoiceMetadataSchema
  }),
  z.object({
    type: z.literal("TRUE_FALSE"),
    metadata: TrueFalseMetadataSchema
  }),
  z.object({
    type: z.literal("ESSAY"),
    metadata: EssayMetadataSchema
  }),
  z.object({
    type: z.literal("SHORT_ANSWER"),
    metadata: ShortAnswerMetadataSchema
  }),
  z.object({
    type: z.literal("FILL_BLANK"),
    metadata: FillBlankMetadataSchema
  }),
  z.object({
    type: z.literal("CODE"),
    metadata: CodeMetadataSchema
  }),
  z.object({
    type: z.literal("MATCHING"),
    metadata: MatchingMetadataSchema
  }),
]);

/**
 * Type definitions based on Zod schemas
 */
export type MultipleChoiceMetadata = z.infer<typeof MultipleChoiceMetadataSchema>;
export type TrueFalseMetadata = z.infer<typeof TrueFalseMetadataSchema>;
export type EssayMetadata = z.infer<typeof EssayMetadataSchema>;
export type ShortAnswerMetadata = z.infer<typeof ShortAnswerMetadataSchema>;
export type FillBlankMetadata = z.infer<typeof FillBlankMetadataSchema>;
export type CodeMetadata = z.infer<typeof CodeMetadataSchema>;
export type MatchingMetadata = z.infer<typeof MatchingMetadataSchema>;
export type QuestionMetadata = 
  | { type: "MULTIPLE_CHOICE", metadata: MultipleChoiceMetadata }
  | { type: "TRUE_FALSE", metadata: TrueFalseMetadata }
  | { type: "ESSAY", metadata: EssayMetadata }
  | { type: "SHORT_ANSWER", metadata: ShortAnswerMetadata }
  | { type: "FILL_BLANK", metadata: FillBlankMetadata }
  | { type: "CODE", metadata: CodeMetadata }
  | { type: "MATCHING", metadata: MatchingMetadata }; 