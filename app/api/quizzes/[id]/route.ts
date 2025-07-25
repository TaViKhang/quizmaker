import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";
import { Role, QuestionType, NotificationType } from "@prisma/client";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createAuthenticationError,
  createPermissionError,
  createNotFoundError,
  createServerError,
  formatZodError
} from "@/lib/api-response";
import { createNotificationsForClass } from "@/lib/notification-service";

// Schema validation for updating a quiz
const updateQuizSchema = z.object({
  title: z.string().min(1, "Quiz title is required").max(200, "Quiz title too long").optional(),
  description: z.string().max(2000, "Description too long").optional().nullable(),
  timeLimit: z.number().int().min(1, "Time limit must be at least 1 minute").optional(),
  maxAttempts: z.number().int().positive().optional().nullable(),
  passingScore: z.number().min(0).max(100, "Passing score must be between 0-100").optional().nullable(),
  shuffleQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  accessCode: z.string().max(20, "Access code too long").optional().nullable(),
  category: z.string().max(50, "Category too long").optional().nullable(),
  tags: z.array(z.string()).optional(),
});

// GET handler for retrieving a specific quiz by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    const quizId = params.id;
    const isTeacher = session.user.role === Role.TEACHER;
    
    // Find quiz with different data based on user role
    if (isTeacher) {
      // Teacher view - include all information including questions and answers
      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
              teacherId: true,
              teacher: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          },
          questions: {
            orderBy: { order: 'asc' },
            include: {
              options: {
                orderBy: { order: 'asc' },
              },
            }
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            }
          }
        }
      });
      
      if (!quiz) {
        return createNotFoundError("Quiz not found");
      }
      
      // Check if the teacher has permission to view this quiz
      const isAuthor = quiz.authorId === session.user.id;
      const isClassTeacher = quiz.class?.teacherId === session.user.id;
      
      if (!isAuthor && !isClassTeacher) {
        return createPermissionError("You don't have permission to view this quiz");
      }
      
      return createSuccessResponse(quiz);
    } else {
      // Student view - don't include correct answers if student hasn't completed the quiz
      // First check if the quiz is available to the student
      const quizBasicInfo = await db.quiz.findUnique({
        where: { 
          id: quizId,
          isPublished: true,
          isActive: true,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              type: true,
              students: {
                where: {
                  studentId: session.user.id
                },
                select: {
                  id: true
                }
              }
            }
          }
        }
      });
      
      if (!quizBasicInfo) {
        return createNotFoundError("Quiz not found or not available");
      }
      
      // Check if student is enrolled in the class (if quiz is attached to a class)
      if (quizBasicInfo.classId) {
        const isEnrolled = quizBasicInfo.class?.students && quizBasicInfo.class.students.length > 0;
        const isPublicClass = quizBasicInfo.class?.type === "PUBLIC";
        
        if (!isEnrolled && !isPublicClass) {
          return createPermissionError("You don't have access to this quiz");
        }
      }
      
      // Check if quiz is within the available time frame
      const now = new Date();
      if (
        (quizBasicInfo.startDate && new Date(quizBasicInfo.startDate) > now) ||
        (quizBasicInfo.endDate && new Date(quizBasicInfo.endDate) < now)
      ) {
        return createErrorResponse(
          "QUIZ_NOT_AVAILABLE",
          "This quiz is not available at this time"
        );
      }
      
      // Check if student has remaining attempts
      if (quizBasicInfo.maxAttempts) {
        const attemptCount = await db.quizAttempt.count({
          where: {
            quizId,
            userId: session.user.id
          }
        });
        
        if (attemptCount >= quizBasicInfo.maxAttempts) {
          return createErrorResponse(
            "MAX_ATTEMPTS_REACHED",
            "You have reached the maximum number of attempts for this quiz"
          );
        }
      }
      
      // Fetch quiz details for student (excluding correct answers)
      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          class: {
            select: {
              id: true,
              name: true,
            }
          },
          questions: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              content: true,
              type: true,
              points: true,
              order: true,
              mediaUrl: true,
              mediaType: true,
              metadata: true,
              category: true,
              options: quizBasicInfo.shuffleQuestions 
                ? undefined 
                : {
                    select: {
                      id: true,
                      content: true,
                      order: true,
                      matchId: true,
                      group: true,
                      position: true,
                      // Don't include isCorrect
                    },
                    orderBy: { order: 'asc' },
                  }
            }
          },
          _count: {
            select: {
              questions: true,
            }
          },
          attempts: {
            where: {
              userId: session.user.id
            },
            orderBy: {
              startedAt: 'desc'
            },
            select: {
              id: true,
              startedAt: true,
              completedAt: true,
              score: true,
              timeSpent: true,
            },
            take: 5 // Only return the most recent 5 attempts
          }
        }
      });
      
      if (!quiz) {
        return createNotFoundError("Quiz not found");
      }
      
      // Chuẩn bị kết quả cuối cùng để trả về
      let finalResult = { ...quiz };
      
      // If quiz specifies to shuffle questions, randomize the order for the student
      if (quizBasicInfo.shuffleQuestions && quiz.questions) {
        // Make a deep copy to avoid mutation issues
        const shuffledQuestions = [...quiz.questions].sort(() => Math.random() - 0.5);
        
        // For each question, fetch and shuffle options separately
        const questionsWithOptions = await Promise.all(
          shuffledQuestions.map(async (question) => {
            const questionId = question.id;
            
            const options = await db.option.findMany({
              where: { questionId },
              select: {
                id: true,
                content: true,
                order: true,
                matchId: true,
                group: true,
                position: true,
                // Don't include isCorrect
              }
            });
            
            // Shuffle options (except for certain question types where order matters)
            if (
              question.type !== QuestionType.FILL_BLANK && 
              question.type !== QuestionType.MATCHING
            ) {
              return { ...question, options: [...options].sort(() => Math.random() - 0.5) };
            } else {
              return { ...question, options };
            }
          })
        );
        
        // Create a new object with shuffled questions instead of modifying finalResult
        finalResult = {
          ...finalResult,
          questions: questionsWithOptions as any // Type assertion needed due to options field structure differences
        };
      }
      
      // Add attempt information
      const attemptCount = await db.quizAttempt.count({
        where: {
          quizId,
          userId: session.user.id
        }
      });
      
      // Add additional properties to our response
      const enrichedQuizData = {
        ...finalResult,
        userAttemptCount: attemptCount,
        attemptsRemaining: finalResult.maxAttempts 
          ? Math.max(0, finalResult.maxAttempts - attemptCount)
          : null
      };
      
      return createSuccessResponse(enrichedQuizData);
    }
    
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

// PUT handler for updating a quiz
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createAuthenticationError();
    }
    
    // Only teachers can update quizzes
    if (session.user.role !== Role.TEACHER) {
      return createPermissionError("Only teachers can update quizzes");
    }
    
    const quizId = params.id;
    
    // Check if quiz exists and teacher has permission to update it
    const existingQuiz = await db.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        attempts: {
          select: {
            id: true,
          },
          take: 1, // We only need to check if there are any attempts
        },
      }
    });
    
    if (!existingQuiz) {
      return createNotFoundError("Quiz not found");
    }
    
    // Only the author can update the quiz
    if (existingQuiz.authorId !== session.user.id) {
      return createPermissionError("You don't have permission to update this quiz");
    }
    
    const body = await request.json();
    
    const validationResult = updateQuizSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid quiz data",
        formatZodError(validationResult.error)
      );
    }
    
    const data = validationResult.data;
    
    // Validate dates if provided
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (startDate > endDate) {
        return createErrorResponse(
          "VALIDATION_ERROR",
          "Start date must be before end date",
          { startDate: "Start date must be before end date" }
        );
      }
    }
    
    // Check if quiz has attempts - restrict changes if it does
    const hasAttempts = existingQuiz.attempts.length > 0;
    
    if (hasAttempts) {
      // Only restrict certain fields, but allow updating time-related fields
      const restrictedFields = ['shuffleQuestions'];
      
      for (const field of restrictedFields) {
        // Safe type checking using type assertion and explicit checks
        const fieldName = field as keyof typeof data;
        if (fieldName in data && data[fieldName] !== undefined) {
          const quizField = field as keyof typeof existingQuiz;
          if (data[fieldName] !== existingQuiz[quizField]) {
            return createErrorResponse(
              "CANNOT_MODIFY",
              `Cannot modify ${field} for quizzes that have been attempted`,
              { [field]: `Cannot modify ${field} for quizzes that have been attempted` }
            );
          }
        }
      }
    }
    
    // Parse dates for database
    const parsedData = {
      ...data,
      startDate: data.startDate !== undefined 
        ? (data.startDate === null ? null : new Date(data.startDate)) 
        : undefined,
      endDate: data.endDate !== undefined 
        ? (data.endDate === null ? null : new Date(data.endDate)) 
        : undefined,
    };
    
    // Update quiz
    const updatedQuiz = await db.quiz.update({
      where: {
        id: quizId,
      },
      data: parsedData,
      select: {
        id: true,
        title: true,
        description: true,
        classId: true,
        timeLimit: true,
        maxAttempts: true,
        passingScore: true,
        shuffleQuestions: true,
        showResults: true,
        startDate: true,
        endDate: true,
        isActive: true,
        isPublished: true,
        accessCode: true,
        category: true,
        tags: true,
        updatedAt: true,
      }
    });
    
    // Create notifications if the quiz is published or its publish state changed
    if (data.isPublished === true && !existingQuiz.isPublished && existingQuiz.classId) {
      const classDetails = await db.class.findUnique({
        where: { id: existingQuiz.classId },
        select: { name: true }
      });
      
      if (classDetails) {
        await createNotificationsForClass({
          classId: existingQuiz.classId,
          title: "New Quiz Available",
          message: `A new quiz "${updatedQuiz.title}" is available in class "${classDetails.name}"`,
          category: 'NEW_QUIZ',
          resourceId: updatedQuiz.id,
          resourceType: "quiz",
          expiredAt: updatedQuiz.endDate ? new Date(updatedQuiz.endDate) : undefined
        });
      }
    }
    
    // If significant details changed, notify students
    if (
      existingQuiz.isPublished && 
      data.isPublished !== false && 
      existingQuiz.classId &&
      (data.title || data.startDate || data.endDate || data.timeLimit)
    ) {
      const classDetails = await db.class.findUnique({
        where: { id: existingQuiz.classId },
        select: { name: true }
      });
      
      if (classDetails) {
        let changeMessage = "The following details have been updated: ";
        const changes = [];
        
        if (data.title && data.title !== existingQuiz.title) changes.push("title");
        if (data.startDate && existingQuiz.startDate?.toISOString() !== new Date(data.startDate).toISOString()) changes.push("start date");
        if (data.endDate && existingQuiz.endDate?.toISOString() !== new Date(data.endDate).toISOString()) changes.push("end date");
        if (data.timeLimit && data.timeLimit !== existingQuiz.timeLimit) changes.push("time limit");
        
        changeMessage += changes.join(", ");
        
        // Create notification with properly typed dates
        await createNotificationsForClass({
          classId: existingQuiz.classId,
          title: "Quiz Updated",
          message: `Quiz "${updatedQuiz.title}" in class "${classDetails.name}" has been updated. ${changeMessage}`,
          category: 'NEW_QUIZ',
          resourceId: updatedQuiz.id,
          resourceType: "quiz",
          expiredAt: data.endDate ? new Date(data.endDate) : undefined
        });
        
        // If the quiz was updated to have a start date in the future, set a reminder
        if (data.startDate && new Date(data.startDate) > new Date()) {
          const reminderTime = new Date(data.startDate);
          reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before
          
          if (reminderTime > new Date()) {
            // Schedule a reminder notification - but API doesn't support scheduled notifications so just create a reminder notification
            await db.notification.create({
              data: {
                userId: existingQuiz.authorId,
                category: NotificationType.QUIZ_REMINDER,
                title: 'Quiz Reminder',
                message: `Don't forget to check your quiz "${updatedQuiz.title}"`,
                resourceId: updatedQuiz.id,
                resourceType: "quiz"
              }
            });
          }
        }
      }
    }
    
    return createSuccessResponse(updatedQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return createServerError(error instanceof Error ? error : new Error("Unknown error"));
  }
}
