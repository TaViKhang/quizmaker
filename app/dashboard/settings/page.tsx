import { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DeleteAccount } from "./delete-account";
import { UserInfo } from "./user-info";

export const metadata: Metadata = {
  title: "Settings | OnTest",
  description: "Manage your account settings and preferences",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences."
      />
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
          <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1">Preferences</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Personal Information</h3>
              <p className="text-sm text-muted-foreground">
                Update your personal information and how we can contact you.
              </p>
            </div>
            <Separator />
            <UserInfo user={user} />
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Security</h3>
              <p className="text-sm text-muted-foreground">
                Manage your security settings and connected accounts.
              </p>
            </div>
            <Separator />
            
            <div className="grid gap-6">
              <div className="grid gap-2">
                <h4 className="font-medium">Account Security</h4>
                <p className="text-sm text-muted-foreground">
                  Your account is currently using Google for authentication.
                </p>
              </div>
              
              <div className="grid gap-4">
                <h4 className="font-medium">Connected Accounts</h4>
                <div className="bg-slate-50 rounded-md p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Google</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-xs bg-emerald-100 text-emerald-700 py-1 px-2 rounded-full">
                    Connected
                  </div>
                </div>
              </div>
              
              <DeleteAccount />
            </div>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Customize your experience with OnTest.
              </p>
            </div>
            <Separator />
            
            <div className="grid gap-6">
              <div className="px-6 py-12 text-center bg-slate-50 rounded-md">
                <h4 className="font-medium text-lg">Preferences Coming Soon</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  We're working on more customization options for your experience. 
                  Check back soon!
                </p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </DashboardShell>
  );
} 