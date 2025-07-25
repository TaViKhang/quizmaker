import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerClassAnnouncementNotification } from "@/lib/service-trigger";

// Cron job handler for creating notifications for class announcements
export const dynamic = "force-dynamic"; // Ensure this is a server route

// Add secure token verification
export async function GET(request: Request) {
  // Verify cron job token if running in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized attempt to access cron job");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Get current time minus 30 minutes (to handle any potential delays or missed announcements)
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    // Find recent announcements that haven't had notifications sent
    // We'll use a custom field or check to track which ones have been processed
    const recentAnnouncements = await db.classAnnouncement.findMany({
      where: {
        createdAt: {
          gte: thirtyMinutesAgo
        },
        // Add additional criteria if you have a field to track notification status
        // notificationSent: false
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            teacherId: true
          }
        }
      }
    });

    console.log(`Found ${recentAnnouncements.length} recent announcements to process`);

    // Process each announcement and create notifications
    const results = await Promise.all(
      recentAnnouncements.map(async (announcement) => {
        try {
          // Trigger notification for this announcement
          const notifiedCount = await triggerClassAnnouncementNotification({
            classId: announcement.classId,
            announcementId: announcement.id,
            title: announcement.title,
            content: announcement.content,
            teacherId: announcement.class.teacherId
          });

          // Update announcement to mark as processed if you have such a field
          // await db.classAnnouncement.update({
          //   where: { id: announcement.id },
          //   data: { notificationSent: true }
          // });

          return {
            announcementId: announcement.id,
            title: announcement.title,
            className: announcement.class.name,
            notifiedCount
          };
        } catch (error) {
          console.error(`Error processing announcement ${announcement.id}:`, error);
          return {
            announcementId: announcement.id,
            error: "Failed to process"
          };
        }
      })
    );

    // Return results
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });
  } catch (error) {
    console.error("Error in announcements-notifier cron job:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 