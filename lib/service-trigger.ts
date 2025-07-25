import { db } from "@/lib/db";
import { createNotification, createNotificationsForClass, NotificationCategory } from "@/lib/notification-service";

/**
 * Service triggers for handling notifications across the application
 * This file contains functions that can be called after certain events
 * to trigger notifications and other side effects
 */

/**
 * Creates notifications for all students in a class when a new announcement is created
 */
export async function triggerClassAnnouncementNotification({
  classId,
  announcementId,
  title,
  content,
  teacherId,
}: {
  classId: string;
  announcementId: string;
  title: string;
  content: string;
  teacherId: string;
}) {
  try {
    // Get class details for the notification message
    const classDetails = await db.class.findUnique({
      where: { id: classId },
      select: { name: true }
    });

    if (!classDetails) {
      console.error(`Could not find class with ID ${classId} for announcement notification`);
      return 0;
    }

    // Create notifications for all students in the class
    const notifiedCount = await createNotificationsForClass({
      classId,
      title: "New Class Announcement",
      message: `New announcement in "${classDetails.name}": ${title}`,
      category: 'CLASS_UPDATED', // Ensure this matches a valid NotificationType in Prisma schema
      resourceId: classId, // Use classId as resourceId for proper navigation
      resourceType: "class", // Use class as the resource type for consistent navigation
      // Exclude the teacher who created the announcement
      excludeUserIds: [teacherId],
    });

    return notifiedCount;
  } catch (error) {
    console.error("Error creating class announcement notifications:", error);
    return 0;
  }
}

/**
 * Creates notifications when a class is updated (details changed)
 */
export async function triggerClassUpdatedNotification({
  classId,
  className,
  teacherId,
  updatedFields = []
}: {
  classId: string;
  className: string;
  teacherId: string;
  updatedFields?: string[];
}) {
  try {
    let message = `The class "${className}" has been updated`;
    
    // Add specific details about what was updated if available
    if (updatedFields.length > 0) {
      message += `: ${updatedFields.join(", ")}`;
    }

    // Create notifications for all students in the class
    const notifiedCount = await createNotificationsForClass({
      classId,
      title: "Class Updated",
      message,
      category: 'CLASS_UPDATED',
      resourceId: classId,
      resourceType: "class",
      // Exclude the teacher who made the update
      excludeUserIds: [teacherId]
    });

    return notifiedCount;
  } catch (error) {
    console.error("Error creating class updated notifications:", error);
    return 0;
  }
}

/**
 * Creates notifications when a quiz is graded
 */
export async function triggerQuizGradedNotification({
  quizId,
  quizTitle,
  studentId,
  score,
  totalScore,
  classId,
  className,
}: {
  quizId: string;
  quizTitle: string;
  studentId: string;
  score: number;
  totalScore: number;
  classId?: string;
  className?: string;
}) {
  try {
    let message = `Your quiz "${quizTitle}" has been graded. Score: ${score}/${totalScore}`;
    
    // Add class info if available
    if (className) {
      message += ` in class "${className}"`;
    }

    // Create notification for the student
    await createNotification({
      userId: studentId,
      title: "Quiz Graded",
      message,
      category: 'QUIZ_GRADED',
      resourceId: quizId,
      resourceType: "quiz"
    });

    return 1;
  } catch (error) {
    console.error("Error creating quiz graded notification:", error);
    return 0;
  }
}

/**
 * Run scheduled tasks like sending reminders, etc.
 * This can be called from a cron job or similar
 */
export async function runScheduledNotificationTasks() {
  try {
    // Import the function here to avoid circular dependencies
    const { createQuizReminders, deleteExpiredNotifications } = require("./notification-service");
    
    // Run scheduled tasks
    const reminderCount = await createQuizReminders();
    const deletedCount = await deleteExpiredNotifications();
    
    return {
      remindersSent: reminderCount,
      notificationsDeleted: deletedCount
    };
  } catch (error) {
    console.error("Error running scheduled notification tasks:", error);
    return {
      remindersSent: 0,
      notificationsDeleted: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 