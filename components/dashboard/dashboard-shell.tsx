interface DashboardShellProps {
  /**
   * Nội dung chính của trang
   */
  children?: React.ReactNode;
}

/**
 * Component bao bọc nội dung chính của dashboard
 * Đã đơn giản hóa để tránh chồng lấp với layout
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="grid gap-6 md:gap-10">
      {children}
    </div>
  );
} 