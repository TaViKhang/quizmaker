import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const requestedStatus = searchParams.get("status");  // ✅ TÊN MỚI ĐỂ TRÁNH XUNG ĐỘT
    const classId = searchParams.get("classId");
    const subject = searchParams.get("subject");
    const startDateFrom = searchParams.get("startDateFrom");
    const endDateTo = searchParams.get("endDateTo");
    const sortBy = searchParams.get("sortBy") || "startDate";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9");
    const skip = (page - 1) * limit;
    
    // Build filters object for Prisma query
    const filters: any = {
      // Only show published quizzes
      isPublished: true,
      
      OR: [
        // 1. Quiz từ các lớp học sinh viên đã tham gia (đã enrolled)
        {
          class: {
            students: {
              some: {
                studentId: userId
              }
            }
          }
        },
        // 2. Quiz công khai (isPublic = true)
        { isPublic: true }
      ]
    };
    
    // Thêm log để kiểm tra
    console.log(`\n🔍 [API] Fetching quizzes for student: ${userId}`);
    console.log(`📋 [API] Filters:`, JSON.stringify(filters, null, 2));
    console.log(`🎯 [API] Requested status filter: ${requestedStatus}`);
    console.log(`📄 [API] Pagination: page ${page}, limit ${limit}, skip ${skip}`);
    
    // ❌ BỎ LOGIC FILTER SAI NÀY - NÓ LOẠI BỎ TẤT CẢ QUIZ UPCOMING VÀ AVAILABLE
    // Quiz status sẽ được tính toán và filter sau trong processing logic
    // Không nên filter isPublished và isActive ở đây vì nó sẽ loại bỏ quiz cần thiết
    
    // Search filter - index-based search optimization
    if (search) {
      filters.OR = [
        ...filters.OR, // Giữ lại các điều kiện OR hiện có
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    
    // Class filter
    if (classId && classId !== "all") {
      filters.classId = classId;
    }
    
    // Subject filter - more direct filtering
    if (subject && subject !== "all") {
      // Need to adjust the OR clause to ensure class subject is considered
      filters.class = {
        subject,
      };
    }
    
    // Date filters
    if (startDateFrom) {
      filters.startDate = {
        ...filters.startDate,
        gte: new Date(startDateFrom)
      };
    }
    
    if (endDateTo) {
      filters.endDate = {
        ...filters.endDate,
        lte: new Date(endDateTo)
      };
    }
    
    // Get current date
    const now = new Date();
    
    // Determine sort direction
    const direction = sortOrder === "desc" ? "desc" : "asc";
    
    // Determine sort field
    let orderBy: any = [];
    switch (sortBy) {
      case "title":
        orderBy.push({ title: direction });
        break;
      case "endDate":
        orderBy.push({ endDate: direction });
        break;
      case "startDate":
      default:
        orderBy.push({ startDate: direction });
    }
    // Always add id as secondary sort for consistency
    orderBy.push({ id: "asc" });
    
    // Status filter optimization - apply if needed
    let statusFilter = requestedStatus && requestedStatus !== "all" ? requestedStatus : null;
    
    // ⚠️ IMPORTANT: Don't pre-filter at database level for status
    // The status calculation is complex and depends on user attempts
    // We need to fetch all quizzes and then filter by status in JavaScript
    // Only apply basic database filters that are clearly safe
    
    if (statusFilter) {
      // Only apply very basic database filters that won't interfere with status calculation
      switch (statusFilter) {
        case "expired":
          // Only filter for definitely expired quizzes (endDate in past)
          // But don't filter out others since a quiz might be "completed" vs "expired"
          // depending on user attempts
          // We'll handle this in the JavaScript processing instead
          break;
        case "upcoming":
        case "ongoing": 
        case "completed":
        default:
          // Don't apply database-level filtering for these statuses
          // They require complex logic based on user attempts
          break;
      }
    }
    
    // Fetch ALL quizzes first (without pagination) to properly calculate status
    // We need to do this because status filtering happens in JavaScript, not in database
    const allQuizzes = await prisma.quiz.findMany({
      where: filters,
      include: {
        class: {
          select: {
            name: true,
            subject: true
          }
        },
        attempts: {
          where: {
            userId
          },
          select: {
            id: true,
            score: true,
            completedAt: true
          }
        },
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy
    });
    
    console.log(`\n📊 [API] Database query results:`);
    console.log(`📈 [API] Total quizzes found: ${allQuizzes.length}`);
    
    // Process quizzes to determine status and transform data
    const processedQuizzes = allQuizzes.map((quiz) => {
      // Calculate quiz status based on dates and attempts
      let status: "upcoming" | "ongoing" | "completed" | "expired" = "ongoing";
      const startDate = quiz.startDate;
      const endDate = quiz.endDate;
      const hasAttempts = quiz.attempts.length > 0;
      const hasCompletedAttempt = quiz.attempts.some((a) => a.completedAt !== null);
      
      // Debug logging for status calculation
      console.log(`Quiz ${quiz.id} - ${quiz.title}:`, {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        now: now.toISOString(),
        hasAttempts,
        hasCompletedAttempt,
        maxAttempts: quiz.maxAttempts
      });
      
      // More precise status logic
      const hasStarted = !startDate || startDate <= now;
      const hasExpired = endDate && endDate < now;
      
      if (!hasStarted) {
        // Quiz has not started yet (startDate exists and is in future)
        status = "upcoming";
        console.log(`Quiz ${quiz.id} status: upcoming (not started)`);
      } else if (hasExpired) {
        // Quiz has ended - distinguish between completed and expired
        if (hasCompletedAttempt) {
          status = "completed";
          console.log(`Quiz ${quiz.id} status: completed (ended with completed attempt)`);
        } else {
          status = "expired";
          console.log(`Quiz ${quiz.id} status: expired (ended without completion)`);
        }
      } else if (hasCompletedAttempt && quiz.maxAttempts && quiz.attempts.length >= quiz.maxAttempts) {
        // Quiz is still open but user has completed all allowed attempts
        status = "completed";
        console.log(`Quiz ${quiz.id} status: completed (max attempts reached)`);
      } else {
        // Quiz is currently open and available
        status = "ongoing";
        console.log(`Quiz ${quiz.id} status: ongoing (available now)`);
      }
      
      // Calculate highest score from attempts - more efficient calculation
      let highestScore = null;
      if (hasCompletedAttempt) {
        const scores = quiz.attempts
          .filter((a) => a.completedAt !== null && a.score !== null)
          .map((a) => a.score || 0);
          
        highestScore = scores.length ? Math.max(...scores) : null;
      }
      
      // Check if quiz is locked (formal class check)
      const userWithRoles = session.user as any;
      const isFormal = quiz.tags?.includes("formal") || false;
      const isLocked = 
        (isFormal && !userWithRoles.formalStudent) ||
        (quiz.maxAttempts !== null && quiz.attempts.length >= quiz.maxAttempts && !hasCompletedAttempt);
      
      // Generate lock reason
      let lockReason = "";
      if (isLocked) {
        if (isFormal && !userWithRoles.formalStudent) {
          lockReason = "This quiz is only available to formal class students";
        } else if (quiz.maxAttempts !== null && quiz.attempts.length >= quiz.maxAttempts) {
          lockReason = "You have reached the maximum number of attempts";
        }
      }

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        classId: quiz.classId,
        className: quiz.class?.name || null,
        subject: quiz.class?.subject || null,
        startDate: quiz.startDate?.toISOString() || null,
        endDate: quiz.endDate?.toISOString() || null,
        durationMinutes: quiz.timeLimit,
        totalQuestions: quiz._count.questions,
        status,
        isLocked,
        lockReason,
        isFormal,
        attemptLimit: quiz.maxAttempts,
        currentAttempts: quiz.attempts.length,
        highestScore
      };
    }).filter((quiz): quiz is NonNullable<typeof quiz> => quiz !== null); // Remove filtered out quizzes (null values) with proper typing
    
    // Filter by status AFTER processing all quizzes
    const filteredQuizzes = requestedStatus && requestedStatus !== "all" 
      ? processedQuizzes.filter((quiz) => quiz.status === requestedStatus)
      : processedQuizzes;

    // Apply pagination AFTER filtering
    const totalItems = filteredQuizzes.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const startIndex = skip;
    const endIndex = startIndex + limit;
    const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex);
    
    // Log final results summary
    const statusSummary = processedQuizzes.reduce((acc, quiz) => {
      acc[quiz.status] = (acc[quiz.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n📋 [API] Final results summary:`);
    console.log(`🎯 [API] Status filter requested: ${requestedStatus || 'none'}`);
    console.log(`📊 [API] Status distribution:`, statusSummary);
    console.log(`📈 [API] Total items after filtering: ${totalItems}`);
    console.log(`📄 [API] Total pages: ${totalPages}`);
    console.log(`📋 [API] Items on current page: ${paginatedQuizzes.length}`);
    
    // Log upcoming and expired quizzes specifically
    const upcomingQuizzes = processedQuizzes.filter((q) => q.status === 'upcoming');
    const expiredQuizzes = processedQuizzes.filter((q) => q.status === 'expired');
    
    if (upcomingQuizzes.length > 0) {
      console.log(`\n🔮 [API] Upcoming quizzes (${upcomingQuizzes.length}):`);
      upcomingQuizzes.forEach((quiz) => {
        console.log(`  📝 ${quiz.title} - Start: ${quiz.startDate}, End: ${quiz.endDate}`);
      });
    }
    
    if (expiredQuizzes.length > 0) {
      console.log(`\n⏰ [API] Expired quizzes (${expiredQuizzes.length}):`);
      expiredQuizzes.forEach((quiz) => {
        console.log(`  📝 ${quiz.title} - Start: ${quiz.startDate}, End: ${quiz.endDate}`);
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        items: paginatedQuizzes,
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
    
  } catch (error) {
    console.error("[API] Error fetching quizzes:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
} 