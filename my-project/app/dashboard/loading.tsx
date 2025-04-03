import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Loading data..." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[180px] rounded-md" />
        <Skeleton className="h-[180px] rounded-md" />
        <Skeleton className="h-[180px] rounded-md" />
      </div>
    </DashboardShell>
  );
} 