const { PrismaClient, QuestionType, ClassType, Role, MediaType, NotificationType, MaterialType } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Teacher data - using existing teacher
  const teacherId = '111375115959239164122';
  const existingTeacher = await prisma.user.findUnique({
    where: { id: teacherId }
  });

  if (!existingTeacher) {
    console.log(`Teacher with ID ${teacherId} not found!`);
    console.log('Please make sure this user exists in the system before running seed');
    return;
  }
  console.log(`Using existing teacher: ${existingTeacher.name || teacherId}`);

  // Student IDs (existing)
  const giaNgoStudentId = '114853829202097822211';
  const studentIds = [
    giaNgoStudentId,  // Gia Ngô
    '113112028063421487861',  // Additional student 1
    '117869870355829009921'   // Additional student 2
  ];

  // Verify students exist
  for (const id of studentIds) {
    const student = await prisma.user.findUnique({ where: { id } });
    if (!student) {
      console.log(`Student with ID ${id} not found!`);
      console.log('Please make sure this user exists in the system before running seed');
      return;
    }
    console.log(`Using existing student: ${student.name || id}`);
  }

  // Create classes defined in this seed script
  const definedClassesInfo = [
    {
      name: "Lập Trình Web Nâng Cao",
      description: "Khóa học về phát triển web sử dụng React, Next.js và các công nghệ hiện đại",
      code: "WEB401",
      type: ClassType.PUBLIC,
      isActive: true,
      subject: "Web Development",
      maxStudents: 30,
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
      teacherId: teacherId
    },
    {
      name: "Cơ Sở Dữ Liệu Nâng Cao",
      description: "Học về cơ sở dữ liệu quan hệ, NoSQL và các kỹ thuật tối ưu hóa",
      code: "DB302",
      type: ClassType.PUBLIC,
      isActive: true,
      subject: "Database",
      maxStudents: 25,
      coverImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d",
      teacherId: teacherId
    },
    {
      name: "Trí Tuệ Nhân Tạo Căn Bản",
      description: "Giới thiệu về AI, machine learning và ứng dụng trong thực tế",
      code: "AI101",
      type: ClassType.PUBLIC,
      isActive: true,
      subject: "Artificial Intelligence",
      maxStudents: 40,
      coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485",
      teacherId: teacherId
    },
    {
      name: "Kiến Trúc Phần Mềm",
      description: "Học về các mẫu thiết kế, kiến trúc và phương pháp phát triển phần mềm hiện đại",
      code: "SE405",
      type: ClassType.PUBLIC,
      isActive: true,
      subject: "Software Engineering",
      maxStudents: 35,
      coverImage: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2",
      teacherId: teacherId
    }
  ];

  const processedClassesForThisSeed = [];
  for (const classData of definedClassesInfo) {
    const existingClass = await prisma.class.findFirst({
      where: {
        code: classData.code,
        teacherId: teacherId
      }
    });

    if (existingClass) {
      console.log(`Class ${classData.name} (defined in seed) already exists, updating...`);
      const updatedClass = await prisma.class.update({
        where: { id: existingClass.id },
        data: classData
      });
      processedClassesForThisSeed.push(updatedClass);
    } else {
      const newClass = await prisma.class.create({
        data: classData
      });
      console.log(`Created class (defined in seed): ${newClass.name}`);
      processedClassesForThisSeed.push(newClass);
    }
  }

  // Enroll students from studentIds into classes processed by this seed script
  console.log('\nEnrolling students into classes processed by this seed script...');
  for (const classEntry of processedClassesForThisSeed) {
    for (const currentStudentId of studentIds) {
      const existingEnrollment = await prisma.classEnrollment.findFirst({
        where: {
          classId: classEntry.id,
          studentId: currentStudentId
        }
      });

      if (!existingEnrollment) {
        await prisma.classEnrollment.create({
          data: {
            classId: classEntry.id,
            studentId: currentStudentId,
            joinedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            lastActive: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
          }
        });
        console.log(`Enrolled student ${currentStudentId} in class (from seed definition): ${classEntry.name}`);
      } else {
        console.log(`Student ${currentStudentId} already enrolled in class (from seed definition): ${classEntry.name}`);
        await prisma.classEnrollment.update({
          where: { id: existingEnrollment.id },
          data: { lastActive: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000) }
        });
      }
    }
  }

  // Ensure Gia Ngô (114853829202097822211) is in ALL classes of the specified teacher
  console.log(`\nEnsuring student ${giaNgoStudentId} (Gia Ngô) is enrolled in all classes of teacher ${teacherId}...`);
  const allClassesByThisTeacher = await prisma.class.findMany({
    where: { teacherId: teacherId }
  });

  for (const teacherClass of allClassesByThisTeacher) {
    const existingEnrollmentForGiaNgo = await prisma.classEnrollment.findFirst({
      where: {
        classId: teacherClass.id,
        studentId: giaNgoStudentId
      }
    });

    if (!existingEnrollmentForGiaNgo) {
      await prisma.classEnrollment.create({
        data: {
          classId: teacherClass.id,
          studentId: giaNgoStudentId,
          joinedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000), 
          lastActive: new Date(Date.now() - Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000) 
        }
      });
      console.log(`Enrolled student ${giaNgoStudentId} (Gia Ngô) in teacher's class: ${teacherClass.name} (ID: ${teacherClass.id})`);
    } else {
      console.log(`Student ${giaNgoStudentId} (Gia Ngô) is already enrolled in teacher's class: ${teacherClass.name} (ID: ${teacherClass.id})`);
      await prisma.classEnrollment.update({
          where: { id: existingEnrollmentForGiaNgo.id },
          data: { lastActive: new Date(Date.now() - Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000) }
      });
    }
  }

  // Create quizzes
  const now = new Date();
  const quizData = [
    // --- AVAILABLE QUIZZES (ĐANG CÓ SẴN) ---
    {
      title: "React Component Lifecycle & State",
      description: "Bài tập thực hành về vòng đời component và quản lý state trong React.",
      classId: processedClassesForThisSeed.find(c => c.code === "WEB401")?.id, 
      authorId: teacherId,
      timeLimit: 60, 
      passingScore: 70,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), 
      endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),   
      category: "ReactJS",
      isPublic: true,
      shuffleQuestions: true,
      showResults: true,
      tags: ["react", "lifecycle", "state", "frontend"]
    },
    {
      title: "SQL Advanced Queries & Optimization",
      description: "Kiểm tra kiến thức về các truy vấn SQL nâng cao và kỹ thuật tối ưu hóa.",
      classId: processedClassesForThisSeed.find(c => c.code === "DB302")?.id, 
      authorId: teacherId,
      timeLimit: 75,
      passingScore: 75,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0), 
      endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), 
      category: "SQL",
      isPublic: true,
      shuffleQuestions: false,
      showResults: true,
      tags: ["sql", "database", "optimization", "advanced"]
    },
    {
      title: "Introduction to Machine Learning Algorithms",
      description: "Bài kiểm tra tổng quan về các thuật toán Machine Learning phổ biến.",
      classId: processedClassesForThisSeed.find(c => c.code === "AI101")?.id, 
      authorId: teacherId,
      timeLimit: 90,
      passingScore: 65,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), 
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),  
      category: "Machine Learning",
      isPublic: true,
      shuffleQuestions: true,
      showResults: false, 
      tags: ["ai", "machine-learning", "algorithms"]
    },

    // --- UPCOMING QUIZZES (SẮP TỚI) ---
    {
      title: "Next.js Server Components & Data Fetching",
      description: "Đánh giá hiểu biết về Server Components và các phương pháp fetch dữ liệu trong Next.js.",
      classId: processedClassesForThisSeed.find(c => c.code === "WEB401")?.id, 
      authorId: teacherId,
      timeLimit: 50,
      passingScore: 70,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), 
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),  
      category: "Next.js",
      isPublic: true,
      shuffleQuestions: true,
      showResults: true,
      tags: ["nextjs", "server-components", "data-fetching", "frontend"]
    },
    {
      title: "Database Normalization & Indexing Strategies",
      description: "Bài kiểm tra về các dạng chuẩn hóa cơ sở dữ liệu và chiến lược đánh index hiệu quả.",
      classId: processedClassesForThisSeed.find(c => c.code === "DB302")?.id, 
      authorId: teacherId,
      timeLimit: 60,
      passingScore: 80,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), 
      endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),  
      category: "Database Design",
      isPublic: true,
      shuffleQuestions: false,
      showResults: true,
      tags: ["database", "normalization", "indexing", "sql"]
    },
    {
      title: "Deep Learning Architectures (CNN & RNN)",
      description: "Tìm hiểu về các kiến trúc Deep Learning phổ biến như CNN và RNN.",
      classId: processedClassesForThisSeed.find(c => c.code === "AI101")?.id, 
      authorId: teacherId,
      timeLimit: 80,
      passingScore: 70,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), 
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),  
      category: "Deep Learning",
      isPublic: true,
      shuffleQuestions: true,
      showResults: false,
      tags: ["ai", "deep-learning", "cnn", "rnn"]
    },
    {
      title: "Software Design Principles (SOLID)",
      description: "Kiểm tra hiểu biết về các nguyên lý thiết kế SOLID trong phát triển phần mềm.",
      classId: processedClassesForThisSeed.find(c => c.code === "SE405")?.id, 
      authorId: teacherId,
      timeLimit: 45,
      passingScore: 75,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), 
      endDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),  
      category: "Software Design",
      isPublic: true,
      shuffleQuestions: false,
      showResults: true,
      tags: ["software-engineering", "design-principles", "solid"]
    },

    // --- EXPIRED QUIZZES (ĐÃ HẾT HẠN) ---
    {
      title: "JavaScript ES6+ Features & Syntax",
      description: "Bài kiểm tra về các tính năng mới trong JavaScript ES6 và các phiên bản sau.",
      classId: processedClassesForThisSeed.find(c => c.code === "WEB401")?.id, 
      authorId: teacherId,
      timeLimit: 45,
      passingScore: 65,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
      endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),   // Ended 2 days ago
      category: "JavaScript",
      isPublic: true,
      shuffleQuestions: true,
      showResults: true,
      tags: ["javascript", "es6", "frontend", "syntax"]
    },
    {
      title: "Database Fundamentals & ER Modeling",
      description: "Kiểm tra kiến thức cơ bản về cơ sở dữ liệu và mô hình hóa thực thể-quan hệ.",
      classId: processedClassesForThisSeed.find(c => c.code === "DB302")?.id, 
      authorId: teacherId,
      timeLimit: 50,
      passingScore: 70,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // Started 20 days ago
      endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),   // Ended 5 days ago
      category: "Database",
      isPublic: true,
      shuffleQuestions: false,
      showResults: true,
      tags: ["database", "fundamentals", "er-modeling"]
    },
    {
      title: "Introduction to Python Programming",
      description: "Bài kiểm tra nhập môn về lập trình Python và cú pháp cơ bản.",
      classId: processedClassesForThisSeed.find(c => c.code === "AI101")?.id, 
      authorId: teacherId,
      timeLimit: 60,
      passingScore: 60,
      isPublished: true,
      isActive: true,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
      endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),   // Ended 1 day ago
      category: "Python",
      isPublic: true,
      shuffleQuestions: true,
      showResults: false,
      tags: ["python", "programming", "basics"]
    }
  ];

  const createdQuizzes = [];
  for (const quiz_data of quizData) {
    if (!quiz_data.classId) {
      console.error(`Error: Quiz "${quiz_data.title}" is missing a valid classId because the class code was not found. Skipping quiz.`);
      continue;
    }
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        title: quiz_data.title,
        classId: quiz_data.classId
      }
    });

    let currentQuiz;
    if (existingQuiz) {
      console.log(`Quiz "${quiz_data.title}" already exists, updating...`);
      currentQuiz = await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: quiz_data
      });
    } else {
      console.log(`Creating quiz: ${quiz_data.title}`);
      currentQuiz = await prisma.quiz.create({
        data: quiz_data
      });
    }
    createdQuizzes.push(currentQuiz);

    // Add questions to this quiz
    console.log(`Adding questions to quiz: ${currentQuiz.title}`);
    const questionsForThisQuiz = [
      {
        quizId: currentQuiz.id,
        content: `Câu hỏi trắc nghiệm 1 cho ${currentQuiz.title}?`, 
        type: QuestionType.MULTIPLE_CHOICE, order: 1, points: 10,
        options: { create: [{ content: "Lựa chọn A", isCorrect: true, order: 1 }, { content: "Lựa chọn B", isCorrect: false, order: 2 }] }
      },
      {
        quizId: currentQuiz.id,
        content: `Câu hỏi Đúng/Sai cho ${currentQuiz.title}: Phát biểu này có đúng không?`, 
        type: QuestionType.TRUE_FALSE, order: 2, points: 5,
        options: { create: [{ content: "Đúng", isCorrect: true, order: 1 }, { content: "Sai", isCorrect: false, order: 2 }] }
      },
      {
        quizId: currentQuiz.id,
        content: `Câu hỏi điền vào chỗ trống cho ${currentQuiz.title}: Từ còn thiếu là [blank].`, 
        type: QuestionType.FILL_BLANK, order: 3, points: 8,
        options: { create: [{ content: "đápán", isCorrect: true, order: 1 }] },
        metadata: { caseSensitive: false }
      },
      {
        quizId: currentQuiz.id,
        content: `Câu hỏi tự luận ngắn cho ${currentQuiz.title}: Hãy giải thích khái niệm X.`, 
        type: QuestionType.SHORT_ANSWER, order: 4, points: 12,
        metadata: { minLength: 10, maxLength: 200 }
      },
      {
        quizId: currentQuiz.id,
        content: `Câu hỏi trắc nghiệm 2 (chọn nhiều đáp án) cho ${currentQuiz.title}?`, 
        type: QuestionType.MULTIPLE_CHOICE, order: 5, points: 15,
        options: { create: [
          { content: "Đáp án đúng 1", isCorrect: true, order: 1 }, 
          { content: "Đáp án sai", isCorrect: false, order: 2 },
          { content: "Đáp án đúng 2", isCorrect: true, order: 3 }
        ] }
      }
    ];

    for (const questionData of questionsForThisQuiz) {
      const existingQuestion = await prisma.question.findFirst({
        where: {
          quizId: questionData.quizId,
          content: questionData.content
        }
      });
      if (existingQuestion) {
        // console.log(`Question "${questionData.content.substring(0,20)}..." already exists for this quiz, skipping.`);
      } else {
        await prisma.question.create({ data: questionData });
        // console.log(`Created question: "${questionData.content.substring(0,20)}..." for quiz ${currentQuiz.title}`);
      }
    }
  }
  
  console.log('\nDatabase seeding completed with quizzes, questions, upcoming/available quizzes, and Gia Ngô enrolled in all teacher classes!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
