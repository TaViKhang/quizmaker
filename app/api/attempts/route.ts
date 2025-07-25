import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AttemptService } from "../services/attempt-service";
import { 
  errorResponse, 
  handleZodError, 
  notFoundResponse,
  serverErrorResponse, 
  successResponse, 
  unauthorizedResponse 
} from "../utils/api-response";
import { 
  AttemptQuerySchema, 
  CreateAttemptSchema 
} from "../schemas/attempt-schemas";
import { API_MESSAGES, HTTP_STATUS } from "../utils/api-types";

const attemptService = new AttemptService();

/**
 * GET /api/attempts
 * Get attempts with pagination and filtering
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
    const queryParams = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 10,
      quizId: url.searchParams.get('quizId') || undefined,
      userId: url.searchParams.get('userId') || undefined,
      sortBy: url.searchParams.get('sortBy') || undefined,
      sortOrder: url.searchParams.get('sortOrder') || undefined,
      status: url.searchParams.get('status') || undefined,
      fromDate: url.searchParams.get('fromDate') || undefined,
      toDate: url.searchParams.get('toDate') || undefined,
    };

    // Validate query params
    const validatedQuery = AttemptQuerySchema.parse(queryParams);
    
    // Get attempts
    const { attempts, total } = await attemptService.getAttempts(validatedQuery);
    
    return successResponse(attempts, {
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching attempts:", error);
    
    if (error.name === "ZodError") {
      return handleZodError(error);
    }
    
    return serverErrorResponse("Failed to fetch attempts");
  }
}

/**
 * POST /api/attempts
 * Create a new attempt
 */
export async function POST(req: Request) {
  try {
    // Get auth session
    const session = await getServerSession(authOptions);
    
    // Debug log
    console.log('Session in POST /attempts:', JSON.stringify({
      sessionExists: !!session,
      userExists: !!session?.user,
      userId: session?.user?.id,
      userIdType: session?.user?.id ? typeof session.user.id : null
    }));
    
    // User must be authenticated to create an attempt
    if (!session?.user) {
      return unauthorizedResponse();
    }
    
    // Ensure user has an ID
    if (!session.user.id) {
      console.error("Session user has no ID:", session.user);
      return errorResponse("User ID missing from session. Please log out and sign in again.", {
        status: 400,
        code: "INVALID_SESSION"
      });
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return errorResponse("Invalid JSON in request body", {
        status: 400,
        code: "INVALID_REQUEST"
      });
    }
    
    // Output for debugging
    console.log('Creating attempt with data:', {
      quizId: body.quizId,
      userId: session.user.id
    });
    
    // Create complete data payload
    const attemptData = {
      quizId: body.quizId,
      userId: session.user.id,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    };
    
    // Skip validation for now to debug the actual data being passed
    try {
      // Create attempt directly
      const attempt = await attemptService.createAttempt(attemptData);
      return successResponse(attempt, { status: HTTP_STATUS.CREATED });
    } catch (error: any) {
      console.error("Error creating attempt (bypassing validation):", error);
      return serverErrorResponse(`Failed to create attempt directly: ${error.message}`);
    }
  } catch (error: any) {
    console.error("Error creating attempt:", error);
    
    if (error.name === "ZodError") {
      return handleZodError(error);
    }
    
    return serverErrorResponse("Failed to create attempt: " + error.message);
  }
} 