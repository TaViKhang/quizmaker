import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { 
  BookOpen, 
  ClipboardCheck, 
  BarChart, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Dashboard" 
        text={`Chào mừng ${user.name || 'bạn'} đến với hệ thống quản lý bài kiểm tra trực tuyến.`}
      />
      
      {user.role === Role.STUDENT && (
        <StudentDashboard user={user} />
      )}

      {user.role === Role.TEACHER && (
        <TeacherDashboard user={user} />
      )}

      {user.role !== Role.STUDENT && user.role !== Role.TEACHER && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Thông tin tài khoản
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.name}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {user.email}
              </p>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Vai trò: {user.role}
              </p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bài kiểm tra
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bài kiểm tra hoạt động
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Xem tất cả</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kết quả
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bài kiểm tra đã làm
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Xem kết quả</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

function StudentDashboard({ user }: { user: any }) {
  // Dữ liệu demo cho học sinh
  const upcomingExams = [
    { id: 1, title: "Kiểm tra Toán học cơ bản", date: "10/04/2023", time: "08:30 - 09:30", subject: "Toán" },
    { id: 2, title: "Kiểm tra Ngữ văn học kỳ", date: "12/04/2023", time: "10:00 - 11:30", subject: "Văn" },
    { id: 3, title: "Quiz Tiếng Anh", date: "15/04/2023", time: "14:00 - 14:45", subject: "Anh" },
  ];
  
  const recentResults = [
    { id: 1, title: "Kiểm tra Vật lý", date: "01/04/2023", score: 85, maxScore: 100, subject: "Vật lý" },
    { id: 2, title: "Bài tập Hóa học", date: "28/03/2023", score: 73, maxScore: 100, subject: "Hóa học" },
    { id: 3, title: "Quiz Sinh học", date: "25/03/2023", score: 95, maxScore: 100, subject: "Sinh học" },
  ];
  
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài kiểm tra đã làm</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">
              +4 so với tháng trước
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
            <BarChart className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              +3.2% so với kỳ trước
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bài kiểm tra sắp tới</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bài kiểm tra tiếp theo trong 2 ngày
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian học tập</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Trong tháng này
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Bài kiểm tra sắp tới</TabsTrigger>
          <TabsTrigger value="results">Kết quả gần đây</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="border rounded-md mt-2">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Bài kiểm tra sắp tới</h3>
            {upcomingExams.length > 0 ? (
              <div className="divide-y">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" /> {exam.date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" /> {exam.time}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          {exam.subject}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Xem chi tiết
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium">Không có bài kiểm tra nào!</h3>
                <p className="text-muted-foreground mt-1">
                  Bạn không có bài kiểm tra nào trong thời gian tới.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="border rounded-md mt-2">
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Kết quả gần đây</h3>
            {recentResults.length > 0 ? (
              <div className="divide-y">
                {recentResults.map((result) => (
                  <div key={result.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{result.title}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" /> {result.date}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          {result.subject}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {result.score}/{result.maxScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((result.score / result.maxScore) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium">Chưa có kết quả nào!</h3>
                <p className="text-muted-foreground mt-1">
                  Bạn chưa hoàn thành bài kiểm tra nào gần đây.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeacherDashboard({ user }: { user: any }) {
  // Placeholder cho dashboard của giáo viên
  // Sẽ phát triển sau
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Thông tin tài khoản
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{user.name}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {user.email}
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Vai trò: {user.role}
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Bài kiểm tra
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground mt-1">
            Bài kiểm tra đã tạo
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Xem tất cả</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Học sinh
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">142</div>
          <p className="text-xs text-muted-foreground mt-1">
            Đang hoạt động
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Xem danh sách</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 