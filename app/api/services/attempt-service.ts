import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { 
  AttemptQueryParams,
  CreateAttemptInput,
  UpdateAttemptInput,
  SubmitAnswerInput 
} from "../schemas/attempt-schemas";

export class AttemptService {
  /**
   * Create a new quiz attempt
   */
  async createAttempt(data: CreateAttemptInput) {
    // Debug log
    console.log('AttemptService.createAttempt data:', {
      quizId: data.quizId,
      userId: data.userId,
      userIdType: typeof data.userId,
      userIdLength: data.userId ? data.userId.length : 0
    });

    // Ensure userId is defined before creating attempt
    if (!data.userId) {
      throw new Error("User ID is required to create an attempt. You must be authenticated.");
    }

    try {
      // Create the attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: data.quizId,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
        include: {
          quiz: {
            select: {
              title: true,
              timeLimit: true,
              shuffleQuestions: true,
              questions: {
                select: {
                  id: true,
                  content: true,
                  type: true,
                  points: true,
                  order: true,
                  mediaType: true,
                  mediaUrl: true,
                  options: {
                    select: {
                      id: true,
                      content: true,
                      order: true,
                      group: true,
                      matchId: true,
                      position: true,
                      // Don't expose isCorrect to prevent cheating
                    }
                  }
                },
                orderBy: {
                  order: 'asc'
                }
              }
            }
          }
        }
      });
      
      return attempt;
    } catch (error) {
      console.error('Prisma error in createAttempt:', error);
      throw error;
    }
  }

  /**
   * Get attempts with filtering and pagination
   */
  async getAttempts(params: AttemptQueryParams) {
    const { page, limit, sortBy, sortOrder, quizId, userId, status, fromDate, toDate } = params;
    
    // Build where clause
    const where: Prisma.QuizAttemptWhereInput = {};
    
    if (quizId) {
      where.quizId = quizId;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status) {
      if (status === "completed") {
        where.completedAt = { not: null };
      } else if (status === "in_progress") {
        where.completedAt = null;
      }
    }
    
    if (fromDate) {
      where.startedAt = { gte: new Date(fromDate) };
    }
    
    if (toDate) {
      if (where.startedAt && typeof where.startedAt === 'object' && 'gte' in where.startedAt) {
        (where.startedAt as any).lte = new Date(toDate);
      } else {
        where.startedAt = { lte: new Date(toDate) };
      }
    }
    
    // Count total matching attempts
    const total = await prisma.quizAttempt.count({ where });
    
    // Build order by
    const orderBy: Prisma.QuizAttemptOrderByWithRelationInput = {};
    
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.startedAt = 'desc';
    }
    
    // Get attempts with pagination
    const attempts = await prisma.quizAttempt.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
        answers: {
          select: {
            id: true,
            questionId: true,
            score: true,
            isCorrect: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return { attempts, total };
  }
  
  /**
   * Get attempt by ID
   */
  async getAttemptById(id: string, includeDetails = false) {
    return prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            title: true,
            timeLimit: true,
            showResults: true,
          },
        },
        answers: includeDetails ? {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        } : true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
  
  /**
   * Update an attempt
   */
  async updateAttempt(id: string, data: UpdateAttemptInput) {
    return prisma.quizAttempt.update({
      where: { id },
      data,
    });
  }
  
  /**
   * Submit a single answer
   */
  async submitAnswer(attemptId: string, answer: SubmitAnswerInput) {
    // Get the question to determine its type and correct answers
    const question = await prisma.question.findUnique({
      where: { id: answer.questionId },
      include: {
        options: true,
      },
    });
    
    if (!question) {
      throw new Error("Question not found");
    }
    
    let isCorrect: boolean | null = false;
    let score: number | null = 0;
    
    // Determine if the answer is correct based on question type
    switch (question.type) {
      case "MULTIPLE_CHOICE":
      case "TRUE_FALSE":
        if (answer.selectedOption) {
          const option = question.options.find(opt => opt.id === answer.selectedOption);
          isCorrect = option?.isCorrect || false;
          score = isCorrect ? question.points : 0;
        }
        break;
        
      case "ESSAY":
      case "SHORT_ANSWER":
      case "FILL_BLANK":
      case "CODE":
      case "FILE_UPLOAD":
        // These question types require manual scoring
        isCorrect = null;
        score = null;
        break;
        
      case "MATCHING":
        // For matching questions, need more complex logic
        if (answer.selectedOption) {
          try {
            // Parse the selectedOption string that should be in format "optionId:matchId"
            const [optionId, selectedMatchId] = answer.selectedOption.split(":");
            
            if (!optionId || !selectedMatchId) {
              isCorrect = false;
              score = 0;
              break;
            }
            
            // Find the option
            const option = question.options.find(opt => opt.id === optionId);
            
            if (!option) {
              isCorrect = false;
              score = 0;
              break;
            }
            
            // Check if selected matchId matches the correct matchId for this option
            isCorrect = option.matchId === selectedMatchId;
            score = isCorrect ? question.points : 0;
          } catch (error) {
            console.error("Error processing matching question:", error);
            isCorrect = false;
            score = 0;
          }
        } else {
          isCorrect = false;
          score = 0;
        }
        break;
    }
    
    // Check if answer already exists
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        attemptId,
        questionId: answer.questionId,
      },
    });
    
    if (existingAnswer) {
      // Update existing answer
      return prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOption: answer.selectedOption,
          textAnswer: answer.textAnswer,
          isCorrect,
          score,
        },
      });
    } else {
      // Create new answer
      return prisma.answer.create({
        data: {
          attemptId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          textAnswer: answer.textAnswer,
          isCorrect,
          score,
        },
      });
    }
  }
  
  /**
   * Complete an attempt and calculate final score
   */
  async completeAttempt(attemptId: string, timeSpent?: number) {
    // Get the attempt with all answers
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: {
              include: {
                options: true
              }
            },
          },
        },
      },
    });
    
    if (!attempt) {
      throw new Error("Attempt not found");
    }
    
    // Calculate score
    let totalScore = 0;
    let totalPoints = 0;
    let totalQuestionsAnswered = 0;
    let autoGradedCount = 0;
    
    // Get all questions from the quiz
    const questionMap = new Map(
      attempt.quiz.questions.map(question => [question.id, question])
    );
    
    // Process each answer
    for (const answer of attempt.answers) {
      const question = questionMap.get(answer.questionId);
      
      // Skip if question not found (shouldn't happen)
      if (!question) continue;
      
      totalQuestionsAnswered++;
      totalPoints += question.points;
      
      // Only count automatically-scored questions for automatic scoring
      if (answer.score !== null) {
        totalScore += answer.score;
        autoGradedCount++;
      }
      
      // Double-check MATCHING type answers to ensure correct scoring
      if (question.type === "MATCHING" && answer.selectedOption) {
        try {
          // Re-evaluate the matching answer
          const [optionId, selectedMatchId] = answer.selectedOption.split(":");
          
          if (optionId && selectedMatchId) {
            const option = question.options.find(opt => opt.id === optionId);
            
            if (option) {
              const isCorrect = option.matchId === selectedMatchId;
              const score = isCorrect ? question.points : 0;
              
              // Update answer if necessary
              if (answer.isCorrect !== isCorrect || answer.score !== score) {
                await prisma.answer.update({
                  where: { id: answer.id },
                  data: {
                    isCorrect: isCorrect as boolean,
                    score: score as number,
                  },
                });
                
                // Update running total
                if (answer.score !== null) {
                  // Subtract old score
                  totalScore -= answer.score;
                  // Add new score
                  totalScore += score;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error re-evaluating matching answer:", error);
        }
      }
    }
    
    // Check if all questions were answered
    const totalQuestions = attempt.quiz.questions.length;
    const questionsNotAnswered = totalQuestions - totalQuestionsAnswered;
    
    // Calculate percentage score (if there are points to be earned)
    let percentageScore = 0;
    
    if (totalPoints > 0) {
      // If there are only auto-graded questions
      if (totalQuestions === autoGradedCount) {
        percentageScore = (totalScore / totalPoints) * 100;
      } 
      // If there are manual-graded questions mixed in
      else {
        // Only calculate based on auto-graded questions
        const autoGradedPoints = attempt.answers
          .filter(a => a.score !== null)
          .reduce((sum, answer) => {
            const question = questionMap.get(answer.questionId);
            return sum + (question?.points || 0);
          }, 0);
        
        if (autoGradedPoints > 0) {
          percentageScore = (totalScore / autoGradedPoints) * 100;
        }
        
        // Mark as partial if some questions require manual grading
        if (autoGradedCount < totalQuestionsAnswered) {
          percentageScore = -percentageScore; // Negative score indicates partial grading
        }
      }
    }
    
    // Update the attempt
    return prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: new Date(),
        score: percentageScore,
        timeSpent: timeSpent || null,
      },
    });
  }
  
  /**
   * Get analytics for a quiz
   * Uses best attempt per student to avoid inflated counts from practice attempts
   */
  async getQuizAnalytics(quizId: string) {
    // Get the quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        attempts: {
          where: {
            completedAt: { not: null },
          },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Group attempts by student and get best attempt per student
    const studentBestAttempts = new Map<string, any>();

    quiz.attempts.forEach(attempt => {
      if (!attempt.userId) return; // Skip guest attempts

      const existingBest = studentBestAttempts.get(attempt.userId);
      if (!existingBest || (attempt.score || 0) > (existingBest.score || 0)) {
        studentBestAttempts.set(attempt.userId, attempt);
      }
    });

    const bestAttempts = Array.from(studentBestAttempts.values());

    // Calculate analytics using best attempts only
    const totalAttempts = quiz.attempts.length; // Keep total for practice tracking
    const uniqueStudents = studentBestAttempts.size; // Count unique students
    const completedAttempts = bestAttempts.filter(a => a.completedAt !== null).length;
    const averageScore = bestAttempts.length > 0
      ? bestAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / bestAttempts.length
      : 0;

    // Calculate question stats using best attempts only
    const questionStats = quiz.questions.map(question => {
      const answers = bestAttempts
        .flatMap(a => a.answers)
        .filter(a => a.questionId === question.id);

      const totalAnswers = answers.length;
      const correctAnswers = answers.filter(a => a.isCorrect === true).length;
      const incorrectAnswers = answers.filter(a => a.isCorrect === false).length;
      const unanswered = uniqueStudents - totalAnswers;

      return {
        questionId: question.id,
        content: question.content,
        type: question.type,
        totalAnswers,
        correctAnswers,
        incorrectAnswers,
        unanswered,
        correctPercentage: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      };
    });

    return {
      quizId,
      title: quiz.title,
      totalAttempts, // Total practice attempts
      uniqueStudents, // Unique students who attempted
      completedAttempts, // Completed attempts (best per student)
      averageScore, // Average of best scores
      questionStats,
    };
  }
} 