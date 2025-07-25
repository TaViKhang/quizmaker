"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface DialogProps extends DialogPrimitive.DialogProps {
  /**
   * If true, interaction with outside elements will be disabled and
   * only dialog content will be accessible via keyboard navigation.
   * @default true
   */
  modal?: boolean;
}

const Dialog = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  DialogProps
>(({ modal = true, ...props }, ref) => (
  <DialogPrimitive.Root modal={modal} {...props} />
))
Dialog.displayName = DialogPrimitive.Root.displayName

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "default" | "sm" | "lg" | "xl" | "full";
    hideClose?: boolean;
    closeLabel?: string;
  }
>(({ className, children, size = "default", hideClose = false, closeLabel = "Close", ...props }, ref) => {
  // Ref cho nút close để focus vào đó khi dialog mở
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Xử lý focus khi mở dialog
  const handleOpenAutoFocus = React.useCallback((event: Event) => {
    // Ngăn chặn hành vi focus mặc định
    event.preventDefault();
    
    // Focus vào nút đóng dialog (hoặc có thể là phần tử khác trong dialog)
    if (!hideClose && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
    }
  }, [hideClose]);

  // Xử lý focus khi đóng dialog
  const handleCloseAutoFocus = React.useCallback((event: Event) => {
    // Ngăn chặn hành vi focus trả về mặc định
    event.preventDefault();
  }, []);

  return (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-5 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        size === "sm" && "max-w-sm rounded-lg",
        size === "default" && "max-w-md rounded-lg", 
        size === "lg" && "max-w-xl rounded-lg",
        size === "xl" && "max-w-3xl rounded-lg",
        size === "full" && "max-w-[calc(100%-2rem)] h-[calc(100%-2rem)] rounded-lg",
        className
      )}
      onOpenAutoFocus={handleOpenAutoFocus}
      onCloseAutoFocus={handleCloseAutoFocus}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          ref={closeButtonRef}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          aria-label={closeLabel}
        >
        <X className="h-4 w-4" />
          <span className="sr-only">{closeLabel}</span>
      </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
