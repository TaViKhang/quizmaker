import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuestionService } from "../../services/question-service";
import { 
  errorResponse, 
  handleZodError, 
  notFoundResponse,
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "../../utils/api-response";
import { z } from "zod";

const questionService = new QuestionService();

/**
 * GET /api/questions/[id]
 * Get a question by ID
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

    // Get question
    const question = await questionService.getQuestionById(params.id);
    
    if (!question) {
      return notFoundResponse("Question not found");
    }
    
    return successResponse(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    return serverErrorResponse("Failed to fetch question");
  }
}

/**
 * PUT /api/questions/[id]
 * Update a question
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

    // Check if question exists
    const question = await questionService.getQuestionById(params.id);
    
    if (!question) {
      return notFoundResponse("Question not found");
    }

    // Parse request body
    const body = await req.json();
    
    // Update question
    const updatedQuestion = await questionService.updateQuestion(params.id, body);
    
    return successResponse(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    
    return serverErrorResponse("Failed to update question");
  }
}

/**
 * DELETE /api/questions/[id]
 * Delete a question
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

    // Check if question exists
    const question = await questionService.getQuestionById(params.id);
    
    if (!question) {
      return notFoundResponse("Question not found");
    }

    // Delete question
    await questionService.deleteQuestion(params.id);
    
    return successResponse({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return serverErrorResponse("Failed to delete question");
  }
} 