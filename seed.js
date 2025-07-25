// seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { faker } = require('@faker-js/faker');

// Fixed IDs provided
const TEACHER_ID = '111375115959239164122';
const STUDENT_IDS = [
  '103795511244209074116',
  '113112028063421487861',
  '115985101282199226346',
  '116227947239293209163',
  '117869870355829009921',
  '118029370123124780867',
];
const SPECIAL_ACCOUNT_ID = '114853829202097822211';

// Question types
const QUESTION_TYPES = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching'];

// Subject areas with relevant topics
const SUBJECTS = {
  'Mathematics': ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Trigonometry', 'Linear Algebra', 'Number Theory'],
  'Science': ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science', 'Environmental Science'],
  'Computer Science': ['Programming', 'Data Structures', 'Algorithms', 'Web Development', 'Database Systems', 'Networking'],
  'Language Arts': ['Grammar', 'Literature', 'Writing', 'Poetry', 'Shakespeare', 'Creative Writing'],
  'Social Studies': ['History', 'Geography', 'Economics', 'Political Science', 'Sociology', 'Psychology'],
  'Foreign Language': ['Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Latin'],
};

// Get random items from an array
const getRandomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate a date within the past 6 months
const getRandomRecentDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
  return faker.date.between({ from: sixMonthsAgo, to: new Date() });
};

// Create multiple-choice options
const createOptions = (correctIndex) => {
  return Array(4).fill().map((_, index) => ({
    text: faker.lorem.sentence(),
    isCorrect: index === correctIndex
  }));
};

// Generate random score based on difficulty
const generateScore = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return faker.number.int({ min: 70, max: 100 });
    case 'medium':
      return faker.number.int({ min: 60, max: 90 });
    case 'hard':
      return faker.number.int({ min: 50, max: 85 });
    default:
      return faker.number.int({ min: 60, max: 100 });
  }
};

// Main seed function
async function main() {
  console.log('Starting database seed...');

  try {
    // Ensure we have users in the database (assuming they exist already)
    const teacherExists = await prisma.user.findUnique({ where: { id: TEACHER_ID } });
    if (!teacherExists) {
      await prisma.user.create({
        data: {
          id: TEACHER_ID,
          name: 'Professor ' + faker.person.lastName(),
          email: faker.internet.email(),
          role: 'TEACHER',
        }
      });
    }

    for (const studentId of STUDENT_IDS) {
      const studentExists = await prisma.user.findUnique({ where: { id: studentId } });
      if (!studentExists) {
        await prisma.user.create({
          data: {
            id: studentId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            role: 'STUDENT',
          }
        });
      }
    }

    // Check if special account exists and create if not
    const specialAccountExists = await prisma.user.findUnique({ where: { id: SPECIAL_ACCOUNT_ID } });
    if (!specialAccountExists) {
      await prisma.user.create({
        data: {
          id: SPECIAL_ACCOUNT_ID,
          name: 'Dr. ' + faker.person.lastName(),
          email: faker.internet.email(),
          role: 'TEACHER', // Assuming this is a teacher account with lots of data
        }
      });
    }

    // Create classes for the main teacher
    console.log('Creating classes for main teacher...');
    const teacherClassCount = 5;
    const teacherClasses = [];
    
    for (let i = 0; i < teacherClassCount; i++) {
      const subject = Object.keys(SUBJECTS)[i % Object.keys(SUBJECTS).length];
      const teacherClass = await prisma.class.create({
        data: {
          name: `${subject} ${faker.number.int({ min: 101, max: 499 })}`,
          description: faker.lorem.paragraph(),
          subject: subject,
          isPublic: true,
          isActive: true,
          createdAt: getRandomRecentDate(),
          ownerId: TEACHER_ID,
        }
      });
      teacherClasses.push(teacherClass);
      
      // Add students to class
      for (const studentId of STUDENT_IDS) {
        await prisma.classEnrollment.create({
          data: {
            classId: teacherClass.id,
            userId: studentId,
            role: 'STUDENT',
            enrolledAt: getRandomRecentDate(),
          }
        });
      }
    }

    // Create classes for the special account (many more)
    console.log('Creating classes for special account...');
    const specialClassCount = 12;
    const specialClasses = [];
    
    for (let i = 0; i < specialClassCount; i++) {
      const subject = Object.keys(SUBJECTS)[i % Object.keys(SUBJECTS).length];
      const specialClass = await prisma.class.create({
        data: {
          name: `${subject} ${faker.number.int({ min: 101, max: 499 })}`,
          description: faker.lorem.paragraph(),
          subject: subject,
          isPublic: true,
          isActive: true,
          createdAt: getRandomRecentDate(),
          ownerId: SPECIAL_ACCOUNT_ID,
        }
      });
      specialClasses.push(specialClass);
      
      // Add students to class (randomize which students join)
      const studentsForClass = getRandomItems(STUDENT_IDS, faker.number.int({ min: 3, max: 6 }));
      for (const studentId of studentsForClass) {
        await prisma.classEnrollment.create({
          data: {
            classId: specialClass.id,
            userId: studentId,
            role: 'STUDENT',
            enrolledAt: getRandomRecentDate(),
          }
        });
      }
    }

    // Create quizzes for main teacher classes
    console.log('Creating quizzes for main teacher classes...');
    for (const classObj of teacherClasses) {
      const quizCount = faker.number.int({ min: 2, max: 4 });
      
      for (let i = 0; i < quizCount; i++) {
        const topic = getRandomItems(SUBJECTS[classObj.subject], 1)[0];
        const difficulty = ['easy', 'medium', 'hard'][faker.number.int({ min: 0, max: 2 })];
        const timeLimit = [10, 15, 20, 30, 45, 60][faker.number.int({ min: 0, max: 5 })];
        
        const quiz = await prisma.quiz.create({
          data: {
            title: `${topic} ${i + 1} - ${difficulty.toUpperCase()}`,
            description: faker.lorem.paragraph(),
            instructions: faker.lorem.paragraphs(2),
            subject: classObj.subject,
            topic: topic,
            timeLimit: timeLimit,
            passingScore: faker.number.int({ min: 60, max: 80 }),
            difficulty: difficulty,
            isPublic: true,
            isActive: true,
            createdAt: getRandomRecentDate(),
            classId: classObj.id,
            ownerId: TEACHER_ID,
          }
        });
        
        // Create questions for this quiz
        const questionCount = faker.number.int({ min: 5, max: 10 });
        for (let j = 0; j < questionCount; j++) {
          const questionType = QUESTION_TYPES[faker.number.int({ min: 0, max: QUESTION_TYPES.length - 1 })];
          const points = [1, 2, 5, 10][faker.number.int({ min: 0, max: 3 })];
          
          // Create the question
          const question = await prisma.question.create({
            data: {
              text: faker.lorem.paragraph(),
              type: questionType,
              points: points,
              quizId: quiz.id,
              explanation: faker.lorem.paragraph(),
            }
          });
          
          // Create options for multiple-choice and true-false questions
          if (questionType === 'multiple-choice') {
            const correctOptionIndex = faker.number.int({ min: 0, max: 3 });
            const options = createOptions(correctOptionIndex);
            
            for (let k = 0; k < options.length; k++) {
              await prisma.option.create({
                data: {
                  text: options[k].text,
                  isCorrect: options[k].isCorrect,
                  questionId: question.id,
                }
              });
            }
          } else if (questionType === 'true-false') {
            const isTrue = faker.datatype.boolean();
            await prisma.option.create({
              data: {
                text: "True",
                isCorrect: isTrue,
                questionId: question.id,
              }
            });
            await prisma.option.create({
              data: {
                text: "False",
                isCorrect: !isTrue,
                questionId: question.id,
              }
            });
          }
        }
        
        // Create student attempts for this quiz
        for (const studentId of STUDENT_IDS) {
          // 70% chance of attempting each quiz
          if (faker.number.int({ min: 1, max: 10 }) <= 7) {
            const score = generateScore(difficulty);
            const startTime = getRandomRecentDate();
            const endTime = new Date(startTime.getTime() + timeLimit * 60000 * 0.8); // 80% of time limit used
            
            const attempt = await prisma.quizAttempt.create({
              data: {
                quizId: quiz.id,
                userId: studentId,
                score: score,
                startedAt: startTime,
                completedAt: endTime,
                status: 'COMPLETED',
              }
            });
            
            // Get questions for this quiz
            const questions = await prisma.question.findMany({
              where: { quizId: quiz.id },
              include: { options: true }
            });
            
            // Create answers for each question
            for (const question of questions) {
              if (question.type === 'multiple-choice' || question.type === 'true-false') {
                // For MC and T/F, select an option (sometimes wrong to make scores realistic)
                const correctOption = question.options.find(o => o.isCorrect);
                const selectedOption = score > 80 
                  ? (faker.number.int({ min: 1, max: 10 }) <= 8 ? correctOption : question.options[faker.number.int({ min: 0, max: question.options.length - 1 })])
                  : (faker.number.int({ min: 1, max: 10 }) <= 6 ? correctOption : question.options[faker.number.int({ min: 0, max: question.options.length - 1 })]);
                
                await prisma.answer.create({
                  data: {
                    questionId: question.id,
                    attemptId: attempt.id,
                    selectedOptionId: selectedOption.id,
                    isCorrect: selectedOption.isCorrect,
                    pointsAwarded: selectedOption.isCorrect ? question.points : 0,
                  }
                });
              } else {
                // For text-based answers
                await prisma.answer.create({
                  data: {
                    questionId: question.id,
                    attemptId: attempt.id,
                    textResponse: faker.lorem.paragraph(),
                    isCorrect: faker.datatype.boolean(),
                    pointsAwarded: faker.number.int({ min: 0, max: question.points }),
                    feedback: faker.lorem.sentence(),
                  }
                });
              }
            }
          }
        }
      }
    }

    // Create many more quizzes for special account classes
    console.log('Creating quizzes for special account classes...');
    for (const classObj of specialClasses) {
      const quizCount = faker.number.int({ min: 4, max: 8 });
      
      for (let i = 0; i < quizCount; i++) {
        const topic = getRandomItems(SUBJECTS[classObj.subject], 1)[0];
        const difficulty = ['easy', 'medium', 'hard'][faker.number.int({ min: 0, max: 2 })];
        const timeLimit = [10, 15, 20, 30, 45, 60][faker.number.int({ min: 0, max: 5 })];
        
        const quiz = await prisma.quiz.create({
          data: {
            title: `${topic} ${i + 1} - ${difficulty.toUpperCase()}`,
            description: faker.lorem.paragraph(),
            instructions: faker.lorem.paragraphs(2),
            subject: classObj.subject,
            topic: topic,
            timeLimit: timeLimit,
            passingScore: faker.number.int({ min: 60, max: 80 }),
            difficulty: difficulty,
            isPublic: true,
            isActive: true,
            createdAt: getRandomRecentDate(),
            classId: classObj.id,
            ownerId: SPECIAL_ACCOUNT_ID,
          }
        });
        
        // Create questions for this quiz (more questions for special account quizzes)
        const questionCount = faker.number.int({ min: 8, max: 15 });
        for (let j = 0; j < questionCount; j++) {
          const questionType = QUESTION_TYPES[faker.number.int({ min: 0, max: QUESTION_TYPES.length - 1 })];
          const points = [1, 2, 5, 10][faker.number.int({ min: 0, max: 3 })];
          
          // Create the question
          const question = await prisma.question.create({
            data: {
              text: faker.lorem.paragraph(),
              type: questionType,
              points: points,
              quizId: quiz.id,
              explanation: faker.lorem.paragraph(),
            }
          });
          
          // Create options for multiple-choice and true-false questions
          if (questionType === 'multiple-choice') {
            const correctOptionIndex = faker.number.int({ min: 0, max: 3 });
            const options = createOptions(correctOptionIndex);
            
            for (let k = 0; k < options.length; k++) {
              await prisma.option.create({
                data: {
                  text: options[k].text,
                  isCorrect: options[k].isCorrect,
                  questionId: question.id,
                }
              });
            }
          } else if (questionType === 'true-false') {
            const isTrue = faker.datatype.boolean();
            await prisma.option.create({
              data: {
                text: "True",
                isCorrect: isTrue,
                questionId: question.id,
              }
            });
            await prisma.option.create({
              data: {
                text: "False",
                isCorrect: !isTrue,
                questionId: question.id,
              }
            });
          }
        }
        
        // Get enrolled students for this class
        const enrollments = await prisma.classEnrollment.findMany({
          where: { classId: classObj.id }
        });
        
        const enrolledStudentIds = enrollments.map(e => e.userId);
        
        // Create student attempts for this quiz (more attempts for special account quizzes)
        for (const studentId of enrolledStudentIds) {
          // Create 1-3 attempts per student for variety
          const attemptCount = faker.number.int({ min: 1, max: 3 });
          
          for (let a = 0; a < attemptCount; a++) {
            // First attempts might be incomplete
            const isComplete = a === 0 ? faker.datatype.boolean() : true;
            const score = isComplete ? generateScore(difficulty) : faker.number.int({ min: 0, max: 40 });
            const startTime = getRandomRecentDate();
            
            // For completed quizzes, set end time; for incomplete, leave null
            let endTime = null;
            if (isComplete) {
              endTime = new Date(startTime.getTime() + timeLimit * 60000 * 0.8); // 80% of time limit used
            }
            
            const attempt = await prisma.quizAttempt.create({
              data: {
                quizId: quiz.id,
                userId: studentId,
                score: score,
                startedAt: startTime,
                completedAt: endTime,
                status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
              }
            });
            
            // Get questions for this quiz
            const questions = await prisma.question.findMany({
              where: { quizId: quiz.id },
              include: { options: true }
            });
            
            // For incomplete attempts, only answer some questions
            const questionsToAnswer = isComplete ? questions : questions.slice(0, faker.number.int({ min: 1, max: Math.floor(questions.length * 0.7) }));
            
            // Create answers for each question
            for (const question of questionsToAnswer) {
              if (question.type === 'multiple-choice' || question.type === 'true-false') {
                // For MC and T/F, select an option (sometimes wrong to make scores realistic)
                const correctOption = question.options.find(o => o.isCorrect);
                const selectedOption = score > 80 
                  ? (faker.number.int({ min: 1, max: 10 }) <= 8 ? correctOption : question.options[faker.number.int({ min: 0, max: question.options.length - 1 })])
                  : (faker.number.int({ min: 1, max: 10 }) <= 6 ? correctOption : question.options[faker.number.int({ min: 0, max: question.options.length - 1 })]);
                
                await prisma.answer.create({
                  data: {
                    questionId: question.id,
                    attemptId: attempt.id,
                    selectedOptionId: selectedOption.id,
                    isCorrect: selectedOption.isCorrect,
                    pointsAwarded: selectedOption.isCorrect ? question.points : 0,
                  }
                });
              } else {
                // For text-based answers
                await prisma.answer.create({
                  data: {
                    questionId: question.id,
                    attemptId: attempt.id,
                    textResponse: faker.lorem.paragraph(),
                    isCorrect: faker.datatype.boolean(),
                    pointsAwarded: faker.number.int({ min: 0, max: question.points }),
                    feedback: faker.lorem.sentence(),
                  }
                });
              }
            }
          }
        }
      }
    }
    
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 