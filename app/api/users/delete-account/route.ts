import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

// Schema validation for the request
const deleteAccountSchema = z.object({
  password: z.string().optional(),
  confirmText: z.string().refine(val => val === 'DELETE', {
    message: "Please type DELETE to confirm account deletion"
  })
});

export async function DELETE(req: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to delete your account" }, 
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = deleteAccountSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.flatten() }, 
        { status: 400 }
      );
    }

    const { password, confirmText } = validationResult.data;

    // Get the user from database
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // If user has password (local authentication), verify it
    if (user.password) {
      // If password is required but not provided
      if (!password) {
        return NextResponse.json(
          { error: "Password is required to delete your account" }, 
          { status: 400 }
        );
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Incorrect password" }, 
          { status: 401 }
        );
      }
    }

    // Start deleting data in order to avoid foreign key constraint violations
    
    // Save session information for deletion
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("next-auth.session-token")?.value;
    
    await db.$transaction(async (tx) => {
      // Get list of quizzes created by user
      const userQuizzes = await tx.quiz.findMany({
        where: {
          authorId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      const quizIds = userQuizzes.map(quiz => quiz.id);

      // Get list of attempts and questions for these quizzes
      const attempts = await tx.quizAttempt.findMany({
        where: {
          quizId: {
            in: quizIds,
          },
        },
        select: {
          id: true,
        },
      });

      const questions = await tx.question.findMany({
        where: {
          quizId: {
            in: quizIds,
          },
        },
        select: {
          id: true,
        },
      });

      const attemptIds = attempts.map(attempt => attempt.id);
      const questionIds = questions.map(question => question.id);

      // 1. Delete all answers from attempts and questions
      await tx.answer.deleteMany({
        where: {
          OR: [
            {
              attemptId: {
                in: attemptIds,
              }
            },
            {
              questionId: {
                in: questionIds,
              }
            }
          ]
        }
      });

      // Delete all answers from user's attempts
      await tx.answer.deleteMany({
        where: {
          attempt: {
            userId: session.user.id,
          }
        }
      });

      // 2. Delete all options for user's questions
      await tx.option.deleteMany({
        where: {
          questionId: {
            in: questionIds,
          }
        }
      });

      // 3. Delete all questions from user's quizzes
      await tx.question.deleteMany({
        where: {
          quizId: {
            in: quizIds,
          }
        }
      });

      // 4. Delete all attempts from user's quizzes
      await tx.quizAttempt.deleteMany({
        where: {
          quizId: {
            in: quizIds,
          }
        }
      });

      // 5. Delete all attempts by the user
      await tx.quizAttempt.deleteMany({
        where: {
          userId: session.user.id,
        }
      });

      // 6. Delete all quizzes by the user
      await tx.quiz.deleteMany({
        where: {
          authorId: session.user.id,
        }
      });

      // NEW STEP: Delete classes where the user is the teacher
      await tx.class.deleteMany({
        where: {
          teacherId: session.user.id,
        },
      });

      // 7. Delete OAuth accounts
      await tx.account.deleteMany({
        where: {
          userId: session.user.id,
        }
      });

      // 8. Delete sessions
      await tx.session.deleteMany({
        where: {
          userId: session.user.id,
        }
      });

      // 9. Finally delete the user
      await tx.user.delete({
        where: {
          id: session.user.id,
        }
      });
    });

    // Delete session cookies to log out user
    await cookieStore.delete("next-auth.session-token");
    await cookieStore.delete("next-auth.callback-url");
    await cookieStore.delete("next-auth.csrf-token");

    return NextResponse.json({
      message: "Account deleted successfully",
      logout: true
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting your account" }, 
      { status: 500 }
    );
  }
} 