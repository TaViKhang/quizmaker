import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { 
  createSuccessResponse, 
  createAuthenticationError, 
  createErrorResponse,
  createServerError 
} from "@/lib/api-response";
import { markNotificationsAsRead } from "@/lib/notification-service";
import { z } from "zod";

/**
 * GET /api/notifications
 * Fetch user notifications with optional filtering
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "30");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const where = {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {})
    };
    
    // Get total count for pagination
    const total = await db.notification.count({ where });
    
    // Get notifications with pagination
    const notifications = await db.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip: offset,
      take: Math.min(limit, 50) // Cap at 50 to prevent abuse
    });
    
    // Count unread notifications
    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });
    
    return createSuccessResponse({
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// Schema for validating PATCH request
const updateNotificationSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAllRead: z.boolean().optional()
});

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const body = await request.json();
    const validationResult = updateNotificationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid request data",
        validationResult.error.flatten()
      );
    }
    
    const { notificationIds, markAllRead } = validationResult.data;
    
    // Update notifications
    await markNotificationsAsRead(
      session.user.id, 
      markAllRead ? undefined : notificationIds
    );
    
    // Get new unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });
    
    return createSuccessResponse({ 
      message: "Notifications updated",
      unreadCount
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// Schema for validating POST request to create notifications
const createNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  category: z.enum([
    "NEW_QUIZ", 
    "QUIZ_REMINDER", 
    "QUIZ_GRADED", 
    "CLASS_JOINED", 
    "CLASS_UPDATED", 
    "SYSTEM"
  ]),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
});

/**
 * POST /api/notifications
 * Create a new notification for a user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers and admins can create notifications
    const isTeacher = session.user.role === "TEACHER";
    if (!isTeacher) {
      return createErrorResponse(
        "PERMISSION_DENIED",
        "Only teachers can create notifications",
        { details: "Insufficient permissions" }
      );
    }
    
    const body = await request.json();
    const validationResult = createNotificationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid notification data",
        validationResult.error.flatten()
      );
    }
    
    const { 
      userId, 
      title, 
      message, 
      category, 
      resourceId, 
      resourceType 
    } = validationResult.data;
    
    // Create the notification
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        category,
        resourceId,
        resourceType,
        isRead: false,
        expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      },
    });
    
    return createSuccessResponse({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 