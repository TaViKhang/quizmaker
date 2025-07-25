interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({
  children,
  className,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col space-y-6 p-4 sm:p-6">
      <main className={`flex flex-1 flex-col gap-4 md:gap-8 ${className}`}>
        {children}
      </main>
    </div>
  )
} 