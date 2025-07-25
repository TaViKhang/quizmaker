"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ReactNode, useCallback } from "react";
import { motion } from "framer-motion";

export interface StatDetailDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;
  /**
   * Function to set dialog open state
   */
  setOpen: (open: boolean) => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Optional dialog description
   */
  description?: string;
  /**
   * Dialog content
   */
  children: ReactNode;
  /**
   * Optional max width for the dialog
   * @default "lg"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  /**
   * Controls whether the dialog should trap focus
   * @default true
   */
  trapFocus?: boolean;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl", 
  "5xl": "max-w-5xl",
  "full": "max-w-full"
};

/**
 * Dialog component for displaying detailed analytics
 */
export function StatDetailDialog({
  open,
  setOpen,
  title,
  description,
  children,
  maxWidth = "lg",
  trapFocus = true,
}: StatDetailDialogProps) {
  // Use useCallback to prevent recreation of the handler on each render
  const handleOpenChange = useCallback((open: boolean) => {
    // Use setTimeout to avoid focus management issues
    setTimeout(() => {
      setOpen(open);
    }, 0);
  }, [setOpen]);

  // Simple animation variants without AnimatePresence which can cause focus issues
  const fadeInAnimationVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange}
      modal={true} // Changed from false to true to enable overlay focus trapping
    >
      <DialogContent 
        className={`${maxWidthMap[maxWidth]} p-0 md:p-6 pt-6 gap-0 overflow-hidden`}
        onInteractOutside={(e) => {
          // Prevent closing when interacting with selects or popups
          if ((e.target as HTMLElement).closest('[role="listbox"]')) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Handle escape key more carefully to avoid focus issues
          e.preventDefault();
          handleOpenChange(false);
        }}
      >
        <DialogHeader className="px-4 md:px-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1.5">{description}</DialogDescription>
              )}
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute right-4 top-4 transition-all hover:bg-red-100 hover:text-red-600"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4 px-4 md:px-0 pb-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
} 