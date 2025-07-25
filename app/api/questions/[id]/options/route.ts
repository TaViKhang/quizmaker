import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuestionService } from "../../../services/question-service";
import { 
  errorResponse, 
  handleZodError, 
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse
} from "../../../utils/api-response";
import { OptionSchema } from "../../../schemas/question-schemas";
import { API_MESSAGES } from "../../../utils/api-types";
import { z } from "zod";

const questionService = new QuestionService();

/**
 * GET /api/questions/[id]/options
 * Get all options for a question
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Get question with options
    const question = await questionService.getQuestionById(params.id);
    if (!question) {
      return notFoundResponse(API_MESSAGES.NOT_FOUND.QUESTION);
    }

    return successResponse(question.options || []);
  } catch (error) {
    console.error("Error fetching question options:", error);
    return serverErrorResponse("Failed to fetch question options");
  }
}

/**
 * POST /api/questions/[id]/options
 * Add new options to a question
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Parse and validate request body
    const body = await req.json();
    const optionsSchema = z.array(OptionSchema);
    const validationResult = optionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Get existing question
    const question = await questionService.getQuestionById(params.id);
    if (!question) {
      return notFoundResponse(API_MESSAGES.NOT_FOUND.QUESTION);
    }

    // Update question with new options
    const updatedQuestion = await questionService.updateQuestion(params.id, {
      options: [...(question.options || []), ...validationResult.data],
    });

    return successResponse(updatedQuestion.options);
  } catch (error) {
    console.error("Error adding question options:", error);
    return serverErrorResponse("Failed to add question options");
  }
}

/**
 * PUT /api/questions/[id]/options
 * Update all options for a question
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Parse and validate request body
    const body = await req.json();
    const optionsSchema = z.array(OptionSchema);
    const validationResult = optionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Get existing question
    const question = await questionService.getQuestionById(params.id);
    if (!question) {
      return notFoundResponse(API_MESSAGES.NOT_FOUND.QUESTION);
    }

    // Update question with new options
    const updatedQuestion = await questionService.updateQuestion(params.id, {
      options: validationResult.data,
    });

    return successResponse(updatedQuestion.options);
  } catch (error) {
    console.error("Error updating question options:", error);
    return serverErrorResponse("Failed to update question options");
  }
}

/**
 * DELETE /api/questions/[id]/options
 * Delete all options for a question
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Get existing question
    const question = await questionService.getQuestionById(params.id);
    if (!question) {
      return notFoundResponse(API_MESSAGES.NOT_FOUND.QUESTION);
    }

    // Update question with empty options array
    const updatedQuestion = await questionService.updateQuestion(params.id, {
      options: [],
    });

    return successResponse(updatedQuestion.options);
  } catch (error) {
    console.error("Error deleting question options:", error);
    return serverErrorResponse("Failed to delete question options");
  }
} 