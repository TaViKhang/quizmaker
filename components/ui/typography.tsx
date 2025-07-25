import React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

type VariantType = 
  | "h1" 
  | "h2" 
  | "h3" 
  | "h4" 
  | "h5" 
  | "h6" 
  | "p" 
  | "blockquote" 
  | "large" 
  | "small" 
  | "muted";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: VariantType;
  as?: React.ElementType;
  asChild?: boolean;
}

const variantClassMap: Record<VariantType, string> = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight lg:text-3xl",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight lg:text-2xl",
  h5: "scroll-m-20 text-lg font-semibold tracking-tight lg:text-xl",
  h6: "scroll-m-20 text-base font-semibold tracking-tight lg:text-lg",
  p: "leading-7 [&:not(:first-child)]:mt-6",
  blockquote: "mt-6 border-l-2 pl-6 italic",
  large: "text-lg font-semibold md:text-xl",
  small: "text-sm font-medium leading-none",
  muted: "text-sm text-muted-foreground",
};

const defaultElementMap: Record<VariantType, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  p: "p",
  blockquote: "blockquote",
  large: "p",
  small: "small",
  muted: "p",
};

/**
 * Typography component for consistent text styling
 * based on the OnTest Design System
 * 
 * @example
 * ```tsx
 * <Typography variant="h1">Page Title</Typography>
 * <Typography variant="lead">Introduction paragraph with larger text</Typography>
 * <Typography variant="body">Main content text</Typography>
 * <Typography variant="small">Small text for metadata</Typography>
 * ```
 */
export function Typography({
  variant = "p",
  as,
  asChild,
  className,
  children,
  ...props
}: TypographyProps) {
  const Component = asChild
    ? Slot
    : as || defaultElementMap[variant] || "p";

  return (
    <Component
      className={cn(variantClassMap[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
} 