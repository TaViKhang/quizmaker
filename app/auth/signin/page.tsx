import { Metadata } from "next"
import { SignInForm } from "@/components/auth/signin-form"

export const metadata: Metadata = {
  title: "Sign in | OnTest",
  description: "Sign in to access the online testing system"
}

export default function SignInPage() {
  return <SignInForm />
} 