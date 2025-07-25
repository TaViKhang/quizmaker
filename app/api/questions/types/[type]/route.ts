import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QuestionService } from "../../../services/question-service";
import { 
  errorResponse, 
  handleZodError, 
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "../../../utils/api-response";
import { QuestionTypeEnum } from "../../../schemas/question-schemas";
import { z } from "zod";

const questionService = new QuestionService();

/**
 * GET /api/questions/types/[type]
 * Get questions by type with pagination and filtering
 */
export async function GET(
  req: Request,
  { params }: { params: { type: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Validate question type
    const typeValidation = QuestionTypeEnum.safeParse(params.type);
    if (!typeValidation.success) {
      return errorResponse("Invalid question type");
    }

    // Get query params
    const url = new URL(req.url);
    const queryParams = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 10,
      search: url.searchParams.get('search') || undefined,
      type: params.type as typeof QuestionTypeEnum._type,
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
    console.error("Error fetching questions by type:", error);
    return serverErrorResponse("Failed to fetch questions");
  }
}

/**
 * POST /api/questions/types/[type]
 * Create a new question of specific type
 */
export async function POST(
  req: Request,
  { params }: { params: { type: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Validate question type
    const typeValidation = QuestionTypeEnum.safeParse(params.type);
    if (!typeValidation.success) {
      return errorResponse("Invalid question type");
    }

    // Parse request body
    const body = await req.json();
    
    // Add type to body
    body.type = params.type;
    
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