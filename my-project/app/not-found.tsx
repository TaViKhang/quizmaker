import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900 dark:text-gray-100">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-700 dark:text-gray-300">
          Trang không tồn tại
        </h2>
        <p className="mt-6 text-base text-gray-500 dark:text-gray-400">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">
              Quay về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 