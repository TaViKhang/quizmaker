import { Metadata } from "next";
import { ClassAnnouncements } from "@/components/dashboard/student/class-announcements";

export const metadata: Metadata = {
  title: "Class Announcements | OnTest",
  description: "View announcements and notifications from your teacher",
};

export default function ClassAnnouncementsPage({ params }: { params: { classId: string } }) {
  const classId = params.classId;
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Class Announcements</h1>
        <p className="text-muted-foreground">View important announcements and updates from your teacher.</p>
      </div>
      
      <ClassAnnouncements />
    </div>
  );
} 