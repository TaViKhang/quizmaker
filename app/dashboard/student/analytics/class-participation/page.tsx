import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Suspense } from "react";
import { ClassParticipationAnalytics } from "@/components/dashboard/student/analytics/ClassParticipationAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { TestClassParticipationAPI } from "@/components/dashboard/student/analytics/test-api";

export default async function ClassParticipationAnalyticsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Class Participation Analytics"
        text="Analyze your participation and engagement across classes."
      />
      
      <Separator className="my-6" />
      
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Skeleton className="h-[100px]" />
              <Skeleton className="h-[100px]" />
              <Skeleton className="h-[100px]" />
              <Skeleton className="h-[100px]" />
            </div>
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[350px]" />
          </div>
        }
      >
        {user.role === "STUDENT" ? (
          <ClassParticipationAnalytics />
        ) : (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access restricted</AlertTitle>
            <AlertDescription>
              Class participation analytics are only available for student accounts.
            </AlertDescription>
          </Alert>
        )}
      </Suspense>
      
      {/* Include test component in development */}
      {process.env.NODE_ENV === "development" && <TestClassParticipationAPI />}
    </DashboardShell>
  );
} 