import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role, MaterialType, Prisma } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";
import { z } from "zod";

// GET handler for retrieving materials for a class
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
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const typeParam = searchParams.get("type");
    const search = searchParams.get("search") || "";
    
    // Type validation for MaterialType
    let materialType: MaterialType | undefined;
    if (typeParam && Object.values(MaterialType).includes(typeParam as MaterialType)) {
      materialType = typeParam as MaterialType;
    }
    
    // Skip calculation for pagination
    const skip = (page - 1) * limit;
    
    // Check if class exists and user has access
    // For teachers: must be the class teacher
    // For students: must be enrolled in the class or class must be public
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
      select: { 
        id: true,
        name: true
      }
    });
    
    if (!classAccess) {
      return createPermissionError("You don't have access to this class");
    }
    
    // Build where conditions
    const where: Prisma.MaterialWhereInput = {
      classId,
      ...(materialType && { type: materialType }),
    };
    
    // Add search condition if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Count total for pagination
    const total = await db.material.count({ where });
    
    // Fetch materials with pagination
    const materials = await db.material.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        url: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        updatedAt: true,
        uploader: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Format file size to human-readable format if available
    const formattedMaterials = materials.map(material => ({
      ...material,
      fileSizeFormatted: material.fileSize ? formatFileSize(material.fileSize) : null,
      // Add download URL if needed
      downloadUrl: material.fileName && !material.url ? 
        `/api/classes/${classId}/materials/${material.id}/download` : null
    }));
    
    // Return response with pagination
    return NextResponse.json({
      success: true,
      data: formattedMaterials,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        className: classAccess.name
      }
    });
    
  } catch (error) {
    console.error("Error fetching class materials:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// Schema validation for creating a material
const createMaterialSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  type: z.enum([
    MaterialType.FILE, 
    MaterialType.LINK, 
    MaterialType.VIDEO_EMBED, 
    MaterialType.DOCUMENT
  ]),
  url: z.string().url("Invalid URL").optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

// POST handler for creating a new material
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const classId = params.id;
    
    // Check if class exists and user has access
    const classCheck = await db.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        teacherId: true,
        type: true,
        students: {
          where: {
            studentId: session.user.id
          }
        }
      }
    });
    
    if (!classCheck) {
      return createNotFoundError("Class not found");
    }
    
    // Check permissions - only teachers can add materials
    const isTeacher = session.user.role === Role.TEACHER;
    
    if (!isTeacher || (isTeacher && classCheck.teacherId !== session.user.id)) {
      return createPermissionError("You don't have permission to add materials to this class");
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = createMaterialSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid material data",
        validationResult.error.errors
      );
    }
    
    const materialData = validationResult.data;
    
    // Create new material
    const newMaterial = await db.material.create({
      data: {
        title: materialData.title,
        description: materialData.description,
        type: materialData.type,
        url: materialData.url,
        fileName: materialData.fileName,
        fileSize: materialData.fileSize,
        mimeType: materialData.mimeType,
        class: {
          connect: {
            id: classId
          }
        },
        uploader: {
          connect: {
            id: session.user.id
          }
        }
      }
    });
    
    return createSuccessResponse({
      id: newMaterial.id,
      title: newMaterial.title,
      type: newMaterial.type,
      createdAt: newMaterial.createdAt
    });
    
  } catch (error) {
    console.error("Error adding material:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}