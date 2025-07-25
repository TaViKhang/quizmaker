"use client";

import { useEffect, useState } from "react";
import { Check, Dot, ExternalLink, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NotificationType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

// Type definition for notification data
interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  category: NotificationType;
  resourceId?: string;
  resourceType?: string;
  createdAt: Date;
  expiredAt?: Date;
}

// Props for the NotificationList component
interface NotificationListProps {
  onNotificationsRead?: () => void;
}

/**
 * NotificationList component
 * Displays a list of user notifications with actions to mark as read
 */
export function NotificationList({ onNotificationsRead }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  async function fetchNotifications() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/notifications?limit=15");
      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }
      
      const data = await res.json();
      setNotifications(data.data.notifications.map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
        expiredAt: notification.expiredAt ? new Date(notification.expiredAt) : undefined
      })));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }
  
  async function markAsRead(notificationId?: string) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          notificationId 
            ? { notificationIds: [notificationId] } 
            : { markAllRead: true }
        )
      });
      
      if (!res.ok) {
        throw new Error("Failed to update notifications");
      }
      
      if (notificationId) {
        // Update local state for single notification
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
      } else {
        // Mark all as read in local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
      
      // Callback to parent
      if (onNotificationsRead) {
        onNotificationsRead();
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  }
  
  async function deleteNotification(notificationId: string, e: React.MouseEvent) {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan tỏa đến thông báo
    e.preventDefault();
    
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete notification");
      }
      
      // Cập nhật state để loại bỏ thông báo đã xóa
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      // Thông báo thành công
      toast({
        title: "Notification deleted",
        description: "The notification has been removed",
        variant: "default",
      });
      
      // Cập nhật lại UI
      router.refresh();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  }
  
  function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to resource if available
    if (notification.resourceId && notification.resourceType) {
      let path = "";
      
      switch (notification.resourceType) {
        case "quiz":
          path = `/dashboard/student/quizzes/${notification.resourceId}`;
          break;
        case "class":
          // Nếu là thông báo liên quan đến lớp học, kiểm tra nội dung
          if (notification.category === "CLASS_UPDATED" && 
              notification.message && 
              notification.message.toLowerCase().includes("announcement")) {
            // Đây là thông báo về announcement mới, nên điều hướng đến trang announcements
            path = `/dashboard/student/classes/${notification.resourceId}/announcements`;
          } else {
            // Mặc định là trang chi tiết lớp học
            path = `/dashboard/student/classes/${notification.resourceId}`;
          }
          break;
        case "quiz_attempt":
          path = `/dashboard/student/quizzes/results/${notification.resourceId}`;
          break;
        case "announcement":
          // Lấy classId từ message hoặc từ bối cảnh, trong trường hợp này giả định rằng
          // classId có thể được trích xuất từ URL hiện tại hoặc từ state
          const classId = getCurrentClassId();
          if (classId) {
            path = `/dashboard/student/classes/${classId}/announcements`;
          } else {
            // Nếu không có classId, chuyển hướng đến danh sách lớp học
            path = `/dashboard/student/classes`;
          }
          break;
        default:
          // If resourceType is unknown, try to determine from category
          switch (notification.category) {
            case "QUIZ_GRADED":
              path = `/dashboard/student/quizzes/results/${notification.resourceId}`;
              break;
            case "CLASS_JOINED":
              path = `/dashboard/student/classes/${notification.resourceId}`;
              break;
            case "NEW_QUIZ":
              path = `/dashboard/student/quizzes/${notification.resourceId}`;
              break;
            case "CLASS_UPDATED":
              // Đối với CLASS_UPDATED, kiểm tra nếu trong nội dung thông báo có chứa "announcement"
              if (notification.message && notification.message.toLowerCase().includes("announcement")) {
                // Đây là thông báo về announcement mới, nên điều hướng đến trang announcements
                path = `/dashboard/student/classes/${notification.resourceId}/announcements`;
              } else {
                // Các cập nhật lớp khác
                path = `/dashboard/student/classes/${notification.resourceId}`;
              }
              break;
            default:
              // No specific path, just direct to dashboard
              path = "/dashboard/student";
              break;
          }
          break;
      }
      
      if (path) {
        router.push(path);
      }
    }
  }
  
  // Helper function to get current class ID from URL
  function getCurrentClassId(): string | null {
    if (typeof window !== 'undefined') {
      const matches = window.location.pathname.match(/\/classes\/([^\/]+)/);
      return matches ? matches[1] : null;
    }
    return null;
  }
  
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>Stay updated on your classes and quizzes</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => markAsRead()} 
          disabled={loading || notifications.every(n => n.isRead)}
        >
          <Check className="h-4 w-4 mr-1" /> Mark all read
        </Button>
      </CardHeader>
      
      <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
        {loading ? (
          // Loading state
          <div className="space-y-2 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start space-x-4 py-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="p-4 text-center text-muted-foreground">
            {error}
            <Button 
              variant="link" 
              size="sm" 
              className="ml-2"
              onClick={fetchNotifications}
            >
              Retry
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          // Empty state
          <div className="p-8 text-center text-muted-foreground">
            No notifications to display
          </div>
        ) : (
          // List of notifications
          <div>
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className={cn(
                  "flex items-start px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-accent/50 transition-colors relative",
                  !notification.isRead && "bg-accent/30"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <Dot className="h-10 w-10 text-primary -ml-2" />
                )}
                
                <div className="flex-1 ml-1">
                  <div className="flex items-start justify-between">
                    <h4 className={cn(
                      "text-sm font-medium",
                      !notification.isRead && "font-semibold"
                    )}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    {notification.resourceId && (
                      <div className="flex items-center text-xs text-primary">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View details
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-destructive"
                      onClick={(e) => deleteNotification(notification.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t">
        <Button variant="outline" size="sm" className="w-full" onClick={fetchNotifications}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
} 