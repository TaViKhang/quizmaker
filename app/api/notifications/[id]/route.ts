import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { 
  createSuccessResponse, 
  createAuthenticationError, 
  createPermissionError,
  createNotFoundError,
  createServerError 
} from "@/lib/api-response";

/**
 * DELETE /api/notifications/[id]
 * Delete a notification by ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const notificationId = params.id;
    
    // Verify the notification belongs to the current user
    const notification = await db.notification.findUnique({
      where: {
        id: notificationId,
      },
      select: {
        id: true,
        userId: true,
      }
    });
    
    if (!notification) {
      return createNotFoundError("Notification not found");
    }
    
    // Check if the notification belongs to the current user
    if (notification.userId !== session.user.id) {
      return createPermissionError("You can only delete your own notifications");
    }
    
    // Delete the notification
    await db.notification.delete({
      where: {
        id: notificationId,
      }
    });
    
    return createSuccessResponse({ 
      message: "Notification deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting notification:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 