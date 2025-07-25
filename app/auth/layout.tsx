import { Metadata } from "next";
import { AuthLayout } from "@/components/layouts/auth-layout";

export const metadata: Metadata = {
  title: "Authentication | OnTest",
  description: "Sign in or sign up to OnTest, the online assessment platform",
};

interface AuthRootLayoutProps {
  children: React.ReactNode;
}

export default function AuthRootLayout({ children }: AuthRootLayoutProps) {
  return (
    <AuthLayout>{children}</AuthLayout>
  );
} 