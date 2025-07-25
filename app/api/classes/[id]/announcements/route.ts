import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, ClassType } from "@prisma/client";
import { 
  createPaginatedResponse,
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";

// Schema validation for creating an announcement
const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
});

// GET handler for retrieving class announcements
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const classId = params.id;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    
    // Skip calculation for pagination
    const skip = (page - 1) * limit;
    
    // Check if class exists and user has access
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
          { type: ClassType.PUBLIC }
        ]
      },
      select: { 
        id: true,
        name: true,
        teacherId: true
      }
    });
    
    if (!classAccess) {
      return createPermissionError("You don't have access to this class");
    }
    
    // Build where conditions
    let where: any = { classId };
    
    // Add search condition if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Count total for pagination
    const total = await db.classAnnouncement.count({ where });
    
    // Fetch announcements with pagination
    const announcements = await db.classAnnouncement.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Return paginated response
    return createPaginatedResponse(
      announcements,
      total,
      page,
      limit,
      {
        filters: { search },
        className: classAccess.name
      }
    );
    
  } catch (error) {
    console.error("Error fetching class announcements:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// POST handler for creating a new announcement
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can create announcements
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can create announcements");
    }
    
    const classId = params.id;
    
    // Check if class exists and teacher owns it
    const classItem = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id
      }
    });
    
    if (!classItem) {
      return createNotFoundError("Class not found or you don't have permission to create announcements");
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = createAnnouncementSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid announcement data",
        validationResult.error.errors
      );
    }
    
    const { title, content } = validationResult.data;
    
    // Create new announcement
    const newAnnouncement = await db.classAnnouncement.create({
      data: {
        title,
        content,
        class: {
          connect: {
            id: classId
          }
        }
      }
    });
    
    // Trigger notifications for all students in the class
    // Import the trigger function dynamically to avoid circular dependencies
    const { triggerClassAnnouncementNotification } = await import('@/lib/service-trigger');
    
    // Trigger notification with announcement details - đảm bảo gửi ngay lập tức
    const notifiedCount = await triggerClassAnnouncementNotification({
      classId,
      announcementId: newAnnouncement.id,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      teacherId: session.user.id
    });
    
    console.log(`Sent announcement notifications to ${notifiedCount} students`);
    
    return createSuccessResponse({
      id: newAnnouncement.id,
      title: newAnnouncement.title,
      createdAt: newAnnouncement.createdAt
    });
    
  } catch (error) {
    console.error("Error creating announcement:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
} 