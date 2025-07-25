module.exports = {

"[project]/lib/notification-service.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "createNotification": (()=>createNotification),
    "createNotificationsForClass": (()=>createNotificationsForClass),
    "createQuizReminders": (()=>createQuizReminders),
    "deleteExpiredNotifications": (()=>deleteExpiredNotifications),
    "markNotificationsAsRead": (()=>markNotificationsAsRead)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
;
async function createNotification({ userId, title, message, category, resourceId, resourceType, expiredAt }) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].notification.create({
        data: {
            userId,
            title,
            message,
            category: category,
            resourceId,
            resourceType,
            expiredAt
        }
    });
}
async function createNotificationsForClass({ classId, title, message, category, resourceId, resourceType, expiredAt, excludeUserIds = [] }) {
    // Get all students in the class
    const enrollments = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].classEnrollment.findMany({
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
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].notification.createMany({
            data: enrollments.map((enrollment)=>({
                    userId: enrollment.studentId,
                    title,
                    message,
                    category: category,
                    resourceId,
                    resourceType,
                    expiredAt
                }))
        });
    }
    return enrollments.length;
}
async function markNotificationsAsRead(userId, notificationIds) {
    if (notificationIds && notificationIds.length > 0) {
        // Mark specific notifications as read
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].notification.updateMany({
            where: {
                id: {
                    in: notificationIds
                },
                userId
            },
            data: {
                isRead: true
            }
        });
    } else {
        // Mark all notifications as read
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].notification.updateMany({
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
async function deleteExpiredNotifications() {
    const now = new Date();
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].notification.deleteMany({
        where: {
            expiredAt: {
                lt: now
            }
        }
    });
}
async function createQuizReminders() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Find quizzes ending within the next 24 hours
    const upcomingQuizzes = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].quiz.findMany({
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
    for (const quiz of upcomingQuizzes){
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
}}),
"[project]/lib/service-trigger.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "runScheduledNotificationTasks": (()=>runScheduledNotificationTasks),
    "triggerClassAnnouncementNotification": (()=>triggerClassAnnouncementNotification),
    "triggerClassUpdatedNotification": (()=>triggerClassUpdatedNotification),
    "triggerQuizGradedNotification": (()=>triggerQuizGradedNotification)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/notification-service.ts [app-route] (ecmascript)");
;
;
async function triggerClassAnnouncementNotification({ classId, announcementId, title, content, teacherId }) {
    try {
        // Get class details for the notification message
        const classDetails = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].class.findUnique({
            where: {
                id: classId
            },
            select: {
                name: true
            }
        });
        if (!classDetails) {
            console.error(`Could not find class with ID ${classId} for announcement notification`);
            return 0;
        }
        // Create notifications for all students in the class
        const notifiedCount = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNotificationsForClass"])({
            classId,
            title: "New Class Announcement",
            message: `New announcement in "${classDetails.name}": ${title}`,
            category: 'CLASS_UPDATED',
            resourceId: classId,
            resourceType: "class",
            // Exclude the teacher who created the announcement
            excludeUserIds: [
                teacherId
            ]
        });
        return notifiedCount;
    } catch (error) {
        console.error("Error creating class announcement notifications:", error);
        return 0;
    }
}
async function triggerClassUpdatedNotification({ classId, className, teacherId, updatedFields = [] }) {
    try {
        let message = `The class "${className}" has been updated`;
        // Add specific details about what was updated if available
        if (updatedFields.length > 0) {
            message += `: ${updatedFields.join(", ")}`;
        }
        // Create notifications for all students in the class
        const notifiedCount = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNotificationsForClass"])({
            classId,
            title: "Class Updated",
            message,
            category: 'CLASS_UPDATED',
            resourceId: classId,
            resourceType: "class",
            // Exclude the teacher who made the update
            excludeUserIds: [
                teacherId
            ]
        });
        return notifiedCount;
    } catch (error) {
        console.error("Error creating class updated notifications:", error);
        return 0;
    }
}
async function triggerQuizGradedNotification({ quizId, quizTitle, studentId, score, totalScore, classId, className }) {
    try {
        let message = `Your quiz "${quizTitle}" has been graded. Score: ${score}/${totalScore}`;
        // Add class info if available
        if (className) {
            message += ` in class "${className}"`;
        }
        // Create notification for the student
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNotification"])({
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
async function runScheduledNotificationTasks() {
    try {
        // Import the function here to avoid circular dependencies
        const { createQuizReminders, deleteExpiredNotifications } = __turbopack_context__.r("[project]/lib/notification-service.ts [app-route] (ecmascript)");
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
}}),

};

//# sourceMappingURL=lib_7712e74e._.js.map