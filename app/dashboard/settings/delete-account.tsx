"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";

export function DeleteAccount() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  
  const isConfirmValid = confirmText === "DELETE";
  
  const handleDeleteAccount = async () => {
    if (!isConfirmValid) {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await fetch("/api/users/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmText
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }
      
      toast.success("Account deleted successfully");
      
      // Sign out user before redirecting
      await signOut({ redirect: false });
      
      // Wait a bit for session to be cleared
      setTimeout(() => {
        // Redirect to home page
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };
  
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Icons.deleteAccount className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700 mb-4">
          Once you delete your account, there is no going back. This action <strong>cannot</strong> be undone.
          Please be certain before proceeding.
        </p>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="confirm" className="text-red-700">
              Type DELETE to confirm
            </Label>
            <Input
              id="confirm"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="border-red-200 bg-white focus-visible:ring-red-500"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              disabled={!isConfirmValid || isDeleting}
              onClick={() => isConfirmValid && setShowDialog(true)}
            >
              {isDeleting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account 
                and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteAccount();
                }}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
} 