import { getServerSession } from "next-auth/next";
import { Role } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { 
  createSuccessResponse,
  createAuthenticationError, 
  createValidationError,
  createPermissionError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";

// Schema for announcement updates
const updateAnnouncementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters").optional(),
  content: z.string().min(5, "Content must be at least 5 characters").max(10000, "Content cannot exceed 10000 characters").optional(),
});

// GET handler for retrieving a specific announcement
export async function GET(
  request: Request,
  { params }: { params: { id: string; announcementId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const { id: classId, announcementId } = params;
    
    // Check if user has access to this class
    const classAccess = await db.class.findFirst({
      where: {
        id: classId,
        OR: [
          // Teacher access
          { teacherId: session.user.id },
          // Student access (must be enrolled)
          {
            students: {
              some: {
                studentId: session.user.id
              }
            }
          },
          // Public class
          { type: "PUBLIC" }
        ]
      },
      select: { id: true }
    });
    
    if (!classAccess) {
      return createPermissionError("You don't have access to this class");
    }
    
    // Fetch the specific announcement
    const announcement = await db.classAnnouncement.findUnique({
      where: { 
        id: announcementId,
        classId
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        class: {
          select: {
            id: true,
            name: true,
            teacher: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });
    
    if (!announcement) {
      return createNotFoundError("Announcement not found");
    }
    
    // Format the response
    const formattedAnnouncement = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      className: announcement.class.name,
      teacher: {
        id: announcement.class.teacher.id,
        name: announcement.class.teacher.name,
        image: announcement.class.teacher.image
      },
      isTeacher: session.user.id === announcement.class.teacher.id
    };
    
    // Return success response
    return createSuccessResponse(formattedAnnouncement);
    
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// PATCH handler for updating an announcement
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; announcementId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can update announcements
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can update announcements");
    }
    
    const { id: classId, announcementId } = params;
    
    // Check if class exists and user is the teacher
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      },
      select: { id: true }
    });
    
    if (!classExists) {
      return createPermissionError("You can only update announcements for your own classes");
    }
    
    // Check if the announcement exists
    const announcementExists = await db.classAnnouncement.findUnique({
      where: {
        id: announcementId,
        classId
      }
    });
    
    if (!announcementExists) {
      return createNotFoundError("Announcement not found");
    }
    
    // Parse and validate request data
    const data = await request.json();
    const validationResult = updateAnnouncementSchema.safeParse(data);
    
    if (!validationResult.success) {
      return createValidationError(validationResult.error);
    }
    
    // Update only the provided fields
    const updateData = {
      ...(validationResult.data.title && { title: validationResult.data.title }),
      ...(validationResult.data.content && { content: validationResult.data.content }),
    };
    
    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return createSuccessResponse({
        message: "No changes to update",
        announcement: announcementExists
      });
    }
    
    // Update the announcement
    const updatedAnnouncement = await db.classAnnouncement.update({
      where: {
        id: announcementId
      },
      data: updateData
    });
    
    // Return success response
    return createSuccessResponse({
      message: "Announcement updated successfully",
      announcement: updatedAnnouncement
    });
    
  } catch (error) {
    console.error("Error updating announcement:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// DELETE handler for removing an announcement
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; announcementId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can delete announcements
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can delete announcements");
    }
    
    const { id: classId, announcementId } = params;
    
    // Check if class exists and user is the teacher
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      },
      select: { id: true }
    });
    
    if (!classExists) {
      return createPermissionError("You can only delete announcements for your own classes");
    }
    
    // Check if the announcement exists
    const announcementExists = await db.classAnnouncement.findUnique({
      where: {
        id: announcementId,
        classId
      }
    });
    
    if (!announcementExists) {
      return createNotFoundError("Announcement not found");
    }
    
    // Delete the announcement
    await db.classAnnouncement.delete({
      where: {
        id: announcementId
      }
    });
    
    // Return success response
    return createSuccessResponse({
      message: "Announcement deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 