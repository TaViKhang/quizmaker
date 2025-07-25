import { db } from "@/lib/db";

// Define notification categories as string literals
export type NotificationCategory = 
  | 'NEW_QUIZ'
  | 'QUIZ_REMINDER'
  | 'QUIZ_GRADED'
  | 'CLASS_JOINED'
  | 'CLASS_UPDATED'
  | 'SYSTEM';

/**
 * Create a notification for a single user
 */
export async function createNotification({
  userId,
  title,
  message,
  category,
  resourceId,
  resourceType,
  expiredAt
}: {
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  resourceId?: string;
  resourceType?: string;
  expiredAt?: Date;
}) {
  return db.notification.create({
    data: {
      userId,
      title,
      message,
      category: category as any, // Type cast to handle any enum conversion issues
      resourceId,
      resourceType,
      expiredAt
    }
  });
}

/**
 * Create notifications for all students in a class
 */
export async function createNotificationsForClass({
  classId,
  title,
  message,
  category,
  resourceId,
  resourceType,
  expiredAt,
  excludeUserIds = []
}: {
  classId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  resourceId?: string;
  resourceType?: string;
  expiredAt?: Date;
  excludeUserIds?: string[];
}) {
  // Get all students in the class
  const enrollments = await db.classEnrollment.findMany({
    where: {
      classId,
      studentId: {
        notIn: excludeUserIds
      }
    },
    select: {
      studentId: true
    }
  });
  
  // Create notifications for all students
  if (enrollments.length > 0) {
    await db.notification.createMany({
      data: enrollments.map(enrollment => ({
        userId: enrollment.studentId,
        title,
        message,
        category: category as any, // Type cast to handle any enum conversion issues
        resourceId,
        resourceType,
        expiredAt
      }))
    });
  }
  
  return enrollments.length;
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(userId: string, notificationIds?: string[]) {
  if (notificationIds && notificationIds.length > 0) {
    // Mark specific notifications as read
    return db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: {
        isRead: true
      }
    });
  } else {
    // Mark all notifications as read
    return db.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }
}

/**
 * Delete expired notifications
 * (This can be run as a scheduled job)
 */
export async function deleteExpiredNotifications() {
  const now = new Date();
  
  return db.notification.deleteMany({
    where: {
      expiredAt: {
        lt: now
      }
    }
  });
}

/**
 * Create automated quiz reminders
 * (This can be run as a scheduled job)
 */
export async function createQuizReminders() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Find quizzes ending within the next 24 hours
  const upcomingQuizzes = await db.quiz.findMany({
    where: {
      endDate: {
        gte: now,
        lte: tomorrow
      },
      isActive: true,
      isPublished: true
    },
    include: {
      class: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  // Create reminder notifications
  for (const quiz of upcomingQuizzes) {
    if (quiz.classId) {
      await createNotificationsForClass({
        classId: quiz.classId,
        title: "Quiz Reminder",
        message: `The quiz "${quiz.title}" in class "${quiz.class?.name}" will end on ${quiz.endDate.toLocaleString()}`,
        category: 'QUIZ_REMINDER',
        resourceId: quiz.id,
        resourceType: "quiz",
        expiredAt: quiz.endDate
      });
    }
  }
  
  return upcomingQuizzes.length;
} 