import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role, Prisma } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StudentManagementClient } from "./StudentManagementClient";
import { prisma } from "@/lib/prisma";

// Interfaces phù hợp với component StudentManagementClient
interface ClassInfo {
  id: string;
  name: string;
  type: string;
  subject?: string;
  studentCount: number;
}

export const metadata: Metadata = {
  title: "Student Management | OnTest",
  description: "Manage and track student performance across your classes.",
};

// Định nghĩa kiểu dữ liệu cho student để truyền vào component
interface StudentClass {
  id: string;
  name: string;
  joinedAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  image: string | null;
  classes: StudentClass[];
  recentActivity: {
    quizId: string;
    quizTitle: string;
    classId: string | null;
    score: number | null;
    completedAt: string | null;
  }[];
  averageScore: number | null;
}

/**
 * Server Component for Teacher Student Management page
 * Handles authentication and fetches initial data for student management
 */
export default async function StudentManagementPage() {
  // Check user authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // If user is not a Teacher, redirect
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }

  // Get teacher's classes for filtering
  const teacherClasses = await prisma.class.findMany({
    where: {
      teacherId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      type: true,
      subject: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Transform class data
  const classes: ClassInfo[] = teacherClasses.map(cls => ({
    id: cls.id,
    name: cls.name,
    type: cls.type,
    subject: cls.subject ?? undefined,
    studentCount: cls._count.students,
  }));

  // Get a count of total students for pagination
  const totalStudents = await prisma.classEnrollment.findMany({
    where: {
      class: {
        teacherId: session.user.id,
      },
    },
    select: {
      studentId: true,
    },
  }).then(enrollments => 
    // Count unique student IDs
    new Set(enrollments.map(e => e.studentId)).size
  );

  // Lấy danh sách học sinh đã đăng ký lớp học của giáo viên này
  let initialStudents: Student[] = [];
  try {
    // Lấy danh sách học sinh từ các lớp của giáo viên
    const studentEnrollments = await prisma.classEnrollment.findMany({
      where: {
        class: {
          teacherId: session.user.id
        }
      },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        joinedAt: true
      },
      orderBy: {
        joinedAt: 'desc'
      },
      take: 10 // Limit first page
    });

    // Nhóm học sinh theo ID để tránh trùng lặp
    const studentMap = new Map<string, Student>();
    
    studentEnrollments.forEach(enrollment => {
      const studentId = enrollment.student.id;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          name: enrollment.student.name || "Unnamed Student",
          email: enrollment.student.email || "",
          image: enrollment.student.image,
          classes: [],
          recentActivity: [],
          averageScore: null
        });
      }
      
      const studentData = studentMap.get(studentId)!;
      
      // Thêm lớp học vào danh sách lớp của học sinh
      studentData.classes.push({
        id: enrollment.class.id,
        name: enrollment.class.name,
        joinedAt: enrollment.joinedAt.toISOString()
      });
    });
    
    initialStudents = Array.from(studentMap.values());
    
    // Lấy thêm thông tin về điểm TB nếu có
    const studentIds = initialStudents.map(student => student.id);
    if (studentIds.length > 0) {
      try {
        // Sử dụng findMany để lấy thông tin các lần thi của học sinh
        const attempts = await prisma.quizAttempt.findMany({
          where: {
            userId: {
              in: studentIds
            },
            completedAt: {
              not: null
            }
          },
          select: {
            userId: true,
            score: true
          }
        });

        // Tính điểm trung bình cho từng học sinh
        const avgScoreMap = new Map<string, { total: number, count: number }>();
        
        // Tính tổng điểm và số lần thi của mỗi học sinh
        attempts.forEach(attempt => {
          if (!avgScoreMap.has(attempt.userId)) {
            avgScoreMap.set(attempt.userId, { total: 0, count: 0 });
          }
          
          const data = avgScoreMap.get(attempt.userId)!;
          data.total += attempt.score || 0;
          data.count += 1;
        });
        
        // Cập nhật điểm trung bình cho học sinh
        avgScoreMap.forEach((data, studentId) => {
          const student = initialStudents.find(s => s.id === studentId);
          if (student && data.count > 0) {
            student.averageScore = Math.round(data.total / data.count);
          }
        });
      } catch (error) {
        console.error("Error calculating average scores:", error);
        // Tiếp tục mà không cập nhật điểm trung bình
      }
    }
  } catch (error) {
    console.error("Error fetching initial student data:", error);
    // Nếu gặp lỗi, initialStudents vẫn là mảng rỗng
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Student Management"
        text="Manage and track student performance across your classes."
      />
      
      <StudentManagementClient 
        totalStudents={totalStudents}
        classes={classes}
        initialStudents={initialStudents}
      />
    </DashboardShell>
  );
}