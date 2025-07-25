import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";
import StudentDetailsClient from "@/components/dashboard/teacher/student-details-client";

interface PageProps {
  params: {
    studentId: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const student = await prisma.user.findUnique({
      where: {
        id: params.studentId,
        role: Role.STUDENT,
      },
      select: {
        name: true,
      },
    });

    return {
      title: `${student?.name || 'Student'} Details - OnTest`,
      description: `View detailed performance for ${student?.name || 'student'}`,
    };
  } catch (error) {
    return {
      title: "Student Details - OnTest",
      description: "View detailed student performance",
    };
  }
}

export default async function StudentDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login?callbackUrl=/dashboard/teacher");
  }
  
  if (session.user.role !== Role.TEACHER) {
    redirect("/dashboard");
  }
  
  try {
    // Get student data
    const student = await prisma.user.findUnique({
      where: {
        id: params.studentId,
        role: Role.STUDENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    
    if (!student) {
      throw new Error("Student not found");
    }
    
    // Get classes where the student is enrolled and the teacher is the current user
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: params.studentId,
        class: {
          teacherId: session.user.id,
        },
      },
      select: {
        id: true,
        joinedAt: true,
        lastActive: true,
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            type: true,
            isActive: true,
          },
        },
      },
    });
    
    // Return if student is not enrolled in any of the teacher's classes
    if (enrollments.length === 0) {
      throw new Error("Student not enrolled in any of your classes");
    }
    
    // Get quiz attempts for this student in the teacher's classes
    const classIds = enrollments.map(e => e.class.id);
    
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: params.studentId,
        quiz: {
          classId: {
            in: classIds,
          },
        },
      },
      select: {
        id: true,
        score: true,
        startedAt: true,
        completedAt: true,
        quiz: {
          select: {
            id: true,
            title: true,
            classId: true,
            passingScore: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
    
    // Calculate statistics for each class
    const classStats = enrollments.map(enrollment => {
      const classAttempts = quizAttempts.filter(
        attempt => attempt.quiz.classId === enrollment.class.id
      );
      
      const completedAttempts = classAttempts.filter(
        attempt => attempt.completedAt !== null
      );
      
      const scores = completedAttempts
        .map(attempt => attempt.score)
        .filter((score): score is number => score !== null);
      
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : null;
      
      // Calculate pass rate
      const passedAttempts = completedAttempts.filter(attempt => {
        const passingScore = attempt.quiz.passingScore || 60;
        return (attempt.score || 0) >= passingScore;
      });
      
      const passRate = completedAttempts.length > 0
        ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
        : null;
      
      return {
        classId: enrollment.class.id,
        className: enrollment.class.name,
        subject: enrollment.class.subject,
        type: enrollment.class.type,
        isActive: enrollment.class.isActive,
        enrollmentId: enrollment.id,
        joinedAt: enrollment.joinedAt.toISOString(),
        lastActive: enrollment.lastActive?.toISOString() || null,
        attemptCount: classAttempts.length,
        completedCount: completedAttempts.length,
        averageScore,
        passRate,
      };
    });
    
    // Format student data for client
    const formattedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      createdAt: student.createdAt.toISOString(),
      classes: classStats,
      quizAttempts: quizAttempts.map(attempt => ({
        id: attempt.id,
        quizId: attempt.quiz.id,
        quizTitle: attempt.quiz.title,
        classId: attempt.quiz.classId,
        className: enrollments.find(e => e.class.id === attempt.quiz.classId)?.class.name || '',
        score: attempt.score,
        startedAt: attempt.startedAt.toISOString(),
        completedAt: attempt.completedAt?.toISOString() || null,
        passed: attempt.score !== null && attempt.quiz.passingScore !== null 
          ? attempt.score >= attempt.quiz.passingScore 
          : null,
      })),
    };
    
    // Calculate overall statistics
    const completedAttempts = quizAttempts.filter(
      attempt => attempt.completedAt !== null
    );
    
    const scores = completedAttempts
      .map(attempt => attempt.score)
      .filter((score): score is number => score !== null);
    
    const overallStats = {
      totalAttempts: quizAttempts.length,
      completedAttempts: completedAttempts.length,
      averageScore: scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : null,
      classesEnrolled: enrollments.length,
      lastActive: enrollments.length > 0
        ? new Date(Math.max(...enrollments
            .filter(e => e.lastActive)
            .map(e => e.lastActive ? e.lastActive.getTime() : 0)))
            .toISOString()
        : null,
    };
    
    return (
      <DashboardShell>
        <DashboardHeader
          heading={`Student: ${student.name}`}
          text={`Detailed performance and enrollment information`}
        />
        <StudentDetailsClient 
          student={formattedStudent}
          stats={overallStats}
        />
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error loading student details:", error);
    
    // Return with fallback data
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Student Details"
          text="View detailed student performance"
        />
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground">
            There was an error loading the student data. This student may not be enrolled in any of your classes.
          </p>
          <a 
            href="/dashboard/teacher/students"
            className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            Back to Students
          </a>
        </div>
      </DashboardShell>
    );
  }
} 