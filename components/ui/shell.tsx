import * as React from "react";
import { cn } from "@/lib/utils";

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Shell({
  children,
  className,
  ...props
}: ShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 