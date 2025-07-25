import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  createQuizReminders, 
  deleteExpiredNotifications 
} from "@/lib/notification-service";
import { 
  createSuccessResponse, 
  createAuthenticationError,
  createErrorResponse,
  createServerError 
} from "@/lib/api-response";

const API_SECRET = process.env.CRON_API_SECRET;

/**
 * POST /api/notifications/jobs
 * Endpoint for running scheduled notification jobs
 * Can be triggered by a cron job service (e.g., Vercel Cron)
 */
export async function POST(request: Request) {
  try {
    // Validate either:
    // 1. The request has a valid API secret (for cron jobs)
    // 2. The request is from an authenticated admin user
    
    const body = await request.json();
    const { secret, job } = body;
    
    // Check if request has valid API secret
    const hasValidSecret = secret && secret === API_SECRET;
    
    // If no valid secret, check if user is authenticated
    if (!hasValidSecret) {
      const session = await getServerSession(authOptions);
      
      // Only authenticated users with admin privileges can run jobs manually
      if (!session?.user || session.user.role !== 'TEACHER') {
        return createAuthenticationError();
      }
    }
    
    // Validate job type
    if (!job || !['quiz-reminders', 'delete-expired'].includes(job)) {
      return createErrorResponse(
        "INVALID_JOB",
        "Invalid job type specified",
        { validJobs: ['quiz-reminders', 'delete-expired'] }
      );
    }
    
    // Run the specified job
    let result: any;
    
    switch (job) {
      case 'quiz-reminders':
        result = await createQuizReminders();
        return createSuccessResponse({
          message: "Quiz reminder notifications created",
          count: result
        });
        
      case 'delete-expired':
        result = await deleteExpiredNotifications();
        return createSuccessResponse({
          message: "Expired notifications deleted",
          count: result.count
        });
        
      default:
        return createErrorResponse(
          "INVALID_JOB",
          "Invalid job type specified"
        );
    }
  } catch (error) {
    console.error("Error running notification job:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 