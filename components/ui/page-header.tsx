import React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  text?: string;
  backButtonHref?: string;
  backButtonLabel?: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  separator?: boolean;
}

/**
 * A responsive page header component with title, description, and actions
 */
export function PageHeader({
  heading,
  text,
  backButtonHref,
  backButtonLabel = "Back",
  actions,
  tabs,
  separator = false,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 space-y-4", className)} {...props}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {backButtonHref && (
            <div className="mb-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="-ml-2 h-8 text-muted-foreground"
              >
                <Link href={backButtonHref}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {backButtonLabel}
                </Link>
              </Button>
            </div>
          )}
          <Typography variant="h2" className="line-clamp-1">
            {heading}
          </Typography>
          {text && (
            <Typography variant="muted" className="max-w-[750px]">
              {text}
            </Typography>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {actions}
          </div>
        )}
      </div>
      {tabs && <div className="overflow-auto">{tabs}</div>}
      {separator && <Separator className="mt-6" />}
    </div>
  );
} 