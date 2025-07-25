import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { Role, ClassType } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError
} from "@/lib/api-response";

// GET handler for class dashboard summary
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const awaitedParams = await params; // Await params
    const classId = awaitedParams.id;
    
    // Get basic class information
    const classItem = await db.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        description: true,
        subject: true,
        type: true,
        coverImage: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        students: {
          select: {
            studentId: true,
          }
        }
      }
    });
    
    if (!classItem) {
      return createNotFoundError("Class not found");
    }
    
    // Different data for students vs teachers
    if (session.user.role === Role.TEACHER) {
      // Ensure the teacher is the owner of the class
      if (classItem.teacherId !== session.user.id) {
        return createPermissionError("You don't have access to this class dashboard");
      }
      
      // Get teacher-specific dashboard data
      const [studentCount, quizCount, materialCount, announcementCount, recentEnrollments] = await Promise.all([
        // Student count
        db.classEnrollment.count({
          where: { classId }
        }),
        
        // Quiz count
        db.quiz.count({
          where: { classId }
        }),
        
        // Material count
        db.material.count({
          where: { classId }
        }),
        
        // Announcement count
        db.classAnnouncement.count({
          where: { classId }
        }),
        
        // Recent enrollments
        db.classEnrollment.findMany({
          where: { classId },
          orderBy: { joinedAt: 'desc' },
          take: 5,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        })
      ]);
      
      // Get recent quizzes
      const recentQuizzes = await db.quiz.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          isPublished: true,
          _count: {
            select: {
              attempts: true
            }
          }
        }
      });
      
      return createSuccessResponse({
        class: {
          id: classItem.id,
          name: classItem.name,
          description: classItem.description,
          subject: classItem.subject,
          coverImage: classItem.coverImage
        },
        teacher: classItem.teacher,
        stats: {
          studentCount,
          quizCount,
          materialCount,
          announcementCount
        },
        recentActivity: {
          enrollments: recentEnrollments.map(enrollment => ({
            id: enrollment.id,
            student: enrollment.student,
            joinedAt: enrollment.joinedAt
          })),
          quizzes: recentQuizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            startDate: quiz.startDate,
            endDate: quiz.endDate,
            isPublished: quiz.isPublished,
            attemptCount: quiz._count.attempts
          }))
        }
      });
      
    } else if (session.user.role === Role.STUDENT) {
      // Check if student is enrolled in this class
      const enrollment = await db.classEnrollment.findFirst({
        where: {
          classId,
          studentId: session.user.id
        }
      });
      
      const isPublic = classItem.type === ClassType.PUBLIC;
      
      // Students can only access classes they're enrolled in or public classes
      if (!enrollment && !isPublic) {
        return createPermissionError("You don't have access to this class dashboard");
      }
      
      // Get student-specific dashboard data
      const [upcomingQuizzes, recentAnnouncements, materials, classmates] = await Promise.all([
        // Upcoming quizzes
        db.quiz.findMany({
          where: {
            classId,
            isPublished: true,
            isActive: true,
            OR: [
              // Upcoming quizzes (start date in the future)
              {
                startDate: {
                  gt: new Date()
                }
              },
              // Ongoing quizzes (started but not ended)
              {
                startDate: {
                  lte: new Date()
                },
                endDate: {
                  gte: new Date()
                }
              }
            ]
          },
          orderBy: {
            startDate: 'asc'
          },
          take: 5,
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            timeLimit: true,
            // Check if student has attempted this quiz
            attempts: {
              where: {
                userId: session.user.id
              },
              select: {
                id: true,
                startedAt: true,
                completedAt: true,
                score: true
              }
            }
          }
        }),
        
        // Recent announcements
        db.classAnnouncement.findMany({
          where: { classId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true
          }
        }),
        
        // Recent materials
        db.material.findMany({
          where: { classId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            type: true,
            createdAt: true
          }
        }),
        
        // Classmates (if enrolled)
        enrollment ? db.classEnrollment.findMany({
          where: {
            classId,
            studentId: { not: session.user.id } // Exclude current student
          },
          take: 10,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }) : Promise.resolve([])
      ]);
      
      // Format the quizzes to include hasAttempted flag
      const formattedQuizzes = upcomingQuizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        startDate: quiz.startDate,
        endDate: quiz.endDate,
        timeLimit: quiz.timeLimit,
        status: getQuizStatus(quiz.startDate, quiz.endDate),
        hasAttempted: quiz.attempts.length > 0,
        attemptId: quiz.attempts[0]?.id || null,
        attemptScore: quiz.attempts[0]?.score || null
      }));
      
      return createSuccessResponse({
        class: {
          id: classItem.id,
          name: classItem.name,
          description: classItem.description,
          subject: classItem.subject,
          coverImage: classItem.coverImage
        },
        teacher: classItem.teacher,
        enrollment: enrollment ? {
          id: enrollment.id,
          joinedAt: enrollment.joinedAt
        } : null,
        dashboard: {
          upcomingQuizCount: formattedQuizzes.length,
          recentAnnouncementCount: recentAnnouncements.length,
          materialsCount: materials.length,
          classmateCount: classmates.length
        },
        content: {
          upcomingQuizzes: formattedQuizzes,
          recentAnnouncements,
          materials,
          classmates: classmates.map(enrollment => ({
            id: enrollment.student.id,
            name: enrollment.student.name,
            image: enrollment.student.image
          }))
        }
      });
    }
    
    // Should never get here due to Role enum
    return createPermissionError("Invalid user role");
    
  } catch (error) {
    console.error("Error generating class dashboard:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// Helper to determine quiz status
function getQuizStatus(startDate: Date | null, endDate: Date | null): 'upcoming' | 'ongoing' | 'ended' {
  const now = new Date();
  
  if (startDate && startDate > now) {
    return 'upcoming';
  }
  
  if (endDate && endDate < now) {
    return 'ended';
  }
  
  return 'ongoing';
} 