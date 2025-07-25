import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuestionService } from "../../../../services/question-service";
import { 
  errorResponse, 
  handleZodError, 
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "../../../../utils/api-response";
import { OptionSchema } from "../../../../schemas/question-schemas";
import { z } from "zod";

const questionService = new QuestionService();

/**
 * GET /api/questions/[id]/options/[optionId]
 * Get a specific option for a question
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string; optionId: string } }
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
      return errorResponse("Question not found", { status: 404 });
    }

    // Find the specific option
    const option = question.options?.find(opt => opt.id === params.optionId);
    if (!option) {
      return errorResponse("Option not found", { status: 404 });
    }

    return successResponse(option);
  } catch (error) {
    console.error("Error fetching question option:", error);
    return serverErrorResponse("Failed to fetch question option");
  }
}

/**
 * PUT /api/questions/[id]/options/[optionId]
 * Update a specific option for a question
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string; optionId: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = OptionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return handleZodError(validationResult.error);
    }

    // Get existing question
    const question = await questionService.getQuestionById(params.id);
    if (!question) {
      return errorResponse("Question not found", { status: 404 });
    }

    // Find and update the specific option
    const updatedOptions = question.options?.map(opt => 
      opt.id === params.optionId ? { ...opt, ...validationResult.data } : opt
    ) || [];

    // Update question with modified options
    const updatedQuestion = await questionService.updateQuestion(params.id, {
      options: updatedOptions,
    });

    // Find the updated option
    const updatedOption = updatedQuestion.options?.find(opt => opt.id === params.optionId);
    if (!updatedOption) {
      return errorResponse("Failed to update option", { status: 500 });
    }

    return successResponse(updatedOption);
  } catch (error) {
    console.error("Error updating question option:", error);
    return serverErrorResponse("Failed to update question option");
  }
}

/**
 * DELETE /api/questions/[id]/options/[optionId]
 * Delete a specific option from a question
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; optionId: string } }
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
      return errorResponse("Question not found", { status: 404 });
    }

    // Filter out the option to delete
    const updatedOptions = question.options?.filter(opt => opt.id !== params.optionId) || [];

    // Update question with modified options
    const updatedQuestion = await questionService.updateQuestion(params.id, {
      options: updatedOptions,
    });

    return successResponse({ message: "Option deleted successfully" });
  } catch (error) {
    console.error("Error deleting question option:", error);
    return serverErrorResponse("Failed to delete question option");
  }
} 