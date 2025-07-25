"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    
    if (errorParam) {
      switch (errorParam) {
        case "Signin":
          setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
          break;
        case "OAuthSignin":
          setError("Đã xảy ra lỗi khi đăng nhập với tài khoản xã hội. Vui lòng thử lại.");
          break;
        case "OAuthCallback":
          setError("Đã xảy ra lỗi khi xác thực với tài khoản xã hội. Vui lòng thử lại.");
          break;
        case "OAuthCreateAccount":
          setError("Không thể tạo tài khoản với tài khoản xã hội này. Có thể email đã được sử dụng.");
          break;
        case "EmailCreateAccount":
          setError("Không thể tạo tài khoản với email này. Có thể email đã được sử dụng.");
          break;
        case "Callback":
          setError("Đã xảy ra lỗi khi xác thực. Vui lòng thử lại.");
          break;
        case "CredentialsSignin":
          setError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
          break;
        default:
          setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
          break;
      }
    } else {
      setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Lỗi xác thực</CardTitle>
          <CardDescription>
            Đã xảy ra lỗi khi xác thực người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              Quay lại trang đăng nhập
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Về trang chủ
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 