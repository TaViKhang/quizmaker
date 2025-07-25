import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuestionService } from "../services/question-service";
import { 
  errorResponse, 
  handleZodError, 
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "../utils/api-response";
import { z } from "zod";
import { QuestionTypeEnum, QuestionQuerySchema } from "../schemas/question-schemas";

const questionService = new QuestionService();

/**
 * GET /api/questions
 * Get questions with pagination and filtering
 */
export async function GET(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Get query params
    const url = new URL(req.url);
    const typeParam = url.searchParams.get('type');
    
    // Parse and validate query parameters
    const queryParams = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 10,
      search: url.searchParams.get('search') || undefined,
      type: typeParam ? (QuestionTypeEnum.safeParse(typeParam).success 
        ? typeParam as typeof QuestionTypeEnum._type 
        : undefined) : undefined,
      sortBy: url.searchParams.get('sortBy') || undefined,
      sortOrder: url.searchParams.get('sortOrder') || undefined,
      questionBankId: url.searchParams.get('questionBankId') || undefined,
    };
    
    // Get questions
    const { items, total } = await questionService.getQuestions(queryParams);
    
    return successResponse(items, {
      pagination: {
        total,
        page: Number(queryParams.page) || 1,
        limit: Number(queryParams.limit) || 10,
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return serverErrorResponse("Failed to fetch questions");
  }
}

/**
 * POST /api/questions
 * Create a new question
 */
export async function POST(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Parse request body
    const body = await req.json();
    
    // Create question
    const question = await questionService.createQuestion(body);
    
    return successResponse(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    
    return serverErrorResponse("Failed to create question");
  }
} 