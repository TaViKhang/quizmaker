import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role, ClassType, Prisma } from "@prisma/client";
import { generateRandomCode } from "@/lib/utils";
import { z } from "zod";

/**
 * GET handler for retrieving all classes for a teacher
 */
export async function GET(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json(
        { error: "Access denied: Teacher role required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const rawParams = {
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || "10",
      search: url.searchParams.get("search") || "",
      status: url.searchParams.get("status") || "all",
      sortBy: url.searchParams.get("sortBy") || "updatedAt",
      sortOrder: url.searchParams.get("sortOrder") || "desc",
    };

    // Validate query parameters
    const parsedParams = querySchema.parse(rawParams);

    // Calculate pagination
    const skip = (parsedParams.page - 1) * parsedParams.limit;

    // Build filter conditions
    let where: Prisma.ClassWhereInput = {
      teacherId: session.user.id,
    };

    // Add search filter if provided
    if (parsedParams.search) {
      where.OR = [
        { name: { contains: parsedParams.search, mode: "insensitive" } },
        { description: { contains: parsedParams.search, mode: "insensitive" } },
        { subject: { contains: parsedParams.search, mode: "insensitive" } },
      ];
    }

    // Add status filter if provided
    if (parsedParams.status === "active") {
      where.isActive = true;
    } else if (parsedParams.status === "inactive") {
      where.isActive = false;
    }

    // Count total classes matching filter
    const totalClasses = await prisma.class.count({ where });

    // Setup order by
    let orderBy: any = {};
    if (parsedParams.sortBy === "studentCount") {
      // Special case for studentCount
      orderBy = { students: { _count: parsedParams.sortOrder } };
    } else {
      orderBy = { [parsedParams.sortBy || "updatedAt"]: parsedParams.sortOrder || "desc" };
    }

    // Get classes with pagination, filtering, and sorting
    const classes = await prisma.class.findMany({
      where,
      orderBy,
      skip,
      take: parsedParams.limit,
      include: {
        _count: {
          select: {
            students: true,
            quizzes: true,
          },
        },
      },
    });

    // Get additional statistics
    const formattedClasses = await Promise.all(
      classes.map(async (classItem) => {
        // Get the number of active quizzes
        const activeQuizCount = await prisma.quiz.count({
          where: {
            classId: classItem.id,
            isActive: true,
            isPublished: true,
          },
        });

        // Get average quiz score for this class
        const quizAttempts = await prisma.quizAttempt.findMany({
          where: {
            quiz: {
              classId: classItem.id,
            },
            completedAt: {
              not: null,
            },
          },
          select: {
            score: true,
          },
        });

        const scores = quizAttempts
          .map((attempt) => attempt.score)
          .filter((score): score is number => score !== null);

        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : null;

        // Calculate recent activity using separate queries instead of nested selects
        const classInfo = await prisma.class.findUnique({
          where: {
            id: classItem.id,
          },
          select: {
            updatedAt: true,
          }
        });

        // Get most recent quiz update
        const recentQuiz = await prisma.quiz.findFirst({
          where: {
            classId: classItem.id,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          select: {
            updatedAt: true,
          },
        });

        // Get most recent student enrollment
        const recentEnrollment = await prisma.classEnrollment.findFirst({
          where: {
            classId: classItem.id,
          },
          orderBy: {
            joinedAt: 'desc',
          },
          select: {
            joinedAt: true,
          },
        });
        
        // Collect dates for finding most recent activity
        const dates = [
          classInfo?.updatedAt,
          recentQuiz?.updatedAt,
          recentEnrollment?.joinedAt
        ].filter(Boolean) as Date[];
        
        const lastActiveDate = dates.length 
          ? new Date(Math.max(...dates.map(date => date.getTime())))
          : classItem.createdAt;

        return {
          id: classItem.id,
          name: classItem.name,
          description: classItem.description,
          subject: classItem.subject,
          type: classItem.type || "Regular",
          isActive: classItem.isActive,
          // Use code field for inviteCode
          inviteCode: classItem.code,
          createdAt: classItem.createdAt.toISOString(),
          updatedAt: classItem.updatedAt.toISOString(),
          studentCount: classItem._count.students,
          quizCount: classItem._count.quizzes,
          activeQuizCount,
          averageScore,
          lastActiveDate: lastActiveDate.toISOString(),
        };
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(totalClasses / parsedParams.limit);

    return NextResponse.json({
      classes: formattedClasses,
      pagination: {
        page: parsedParams.page,
        limit: parsedParams.limit,
        total: totalClasses,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new class
 */
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    if (session.user.role !== Role.TEACHER) {
      return NextResponse.json(
        { error: "Access denied: Teacher role required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate request body with type casting for ClassType
    const classSchema = z.object({
      name: z.string().min(1, "Class name is required"),
      description: z.string().optional().nullable(),
      subject: z.string().optional().nullable(),
      type: z.nativeEnum(ClassType).optional(),
      isActive: z.boolean().optional().default(true),
    });

    const validatedData = classSchema.parse(body);

    try {
      // Generate a unique invite code
      const code = generateInviteCode();
      
      console.log("Creating class with data:", {
        ...validatedData,
        teacherId: session.user.id,
        code
      });

      // Create a new class
      const newClass = await prisma.class.create({
        data: {
          ...validatedData,
          teacherId: session.user.id,
          code, // Use code field instead of inviteCode
        },
      });

      return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
      console.error("Database error creating class:", error);
      return NextResponse.json(
        { error: "Failed to create class", message: (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating class:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}

// Helper function to generate a random invite code
function generateInviteCode(length = 6): string {
  try {
    return generateRandomCode(length);
  } catch (error) {
    console.error("Error generating invite code:", error);
    // Fallback to manual implementation if the util function fails
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

// Schema for query validation
const querySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "all", ""]).optional().default("all"),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "studentCount", ""]).optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc", ""]).optional().default("desc"),
}); 