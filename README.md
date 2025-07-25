<div align="center">

# 🎓 OnTest - Online Testing System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Google OAuth](https://img.shields.io/badge/Google-OAuth-red?style=flat-square&logo=google)](https://developers.google.com/identity)

*A modern online assessment platform with secure Google OAuth authentication*

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🎯 Features](#-features) • [🔐 Authentication](#-authentication)

</div>

---

## 📋 Table of Contents

- [🎯 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🔐 Authentication](#-authentication)
- [📖 Documentation](#-documentation)
- [🏗️ Architecture](#️-architecture)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Features

### 👨‍🏫 For Teachers
- **Quiz Management**: Create quizzes with multiple question types (Multiple Choice, True/False, Short Answer, Essay)
- **Class Management**: Organize students into classes with unique join codes
- **Real-time Analytics**: Track student performance and quiz statistics
- **Automated Grading**: Instant grading for objective questions
- **Flexible Scheduling**: Set quiz availability windows and time limits
- **Notifications**: Automatic notifications for grading quizzes

### 👨‍🎓 For Students
- **Interactive Quizzes**: Take quizzes with intuitive, responsive interface
- **Progress Tracking**: Monitor performance across subjects and time
- **Class Enrollment**: Join classes using simple join codes
- **Instant Feedback**: Get immediate results and explanations

### 🔧 System Features
- **Google OAuth Authentication**: Secure login with Google accounts
- **Role-based Access Control**: Automatic teacher/student role management
- **Real-time Notifications**: Stay updated with class activities
- **Comprehensive Analytics**: Performance insights and trends
- **Dark/Light Theme**: Customizable user interface

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **State Management**: React Server Components + Client Hooks
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Chart.js](https://www.chartjs.org/) + [Recharts](https://recharts.org/)

### Backend
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma 6.2](https://www.prisma.io/)
- **Authentication**: [NextAuth.js 4](https://next-auth.js.org/) with Google OAuth
- **API**: Next.js API Routes

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or later
- **PostgreSQL** 12.0 or later
- **Google OAuth credentials** (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TaViKhang/quizmaker.git
   cd my-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/your-database-name"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # Google OAuth (Required - Get from Google Cloud Console)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push

   # Seed the database with sample data
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

OnTest uses **Google OAuth** for secure, streamlined authentication:

### How it Works
1. **Sign in with Google** - Click "Sign in with Google" on the homepage
2. **First-time Setup** - New users select their role (Teacher or Student)
3. **Automatic Access** - Returning users go directly to their dashboard

### Benefits
- ✅ **No password management** - Use your existing Google account
- ✅ **Enhanced security** - Leverages Google's security infrastructure
- ✅ **Quick setup** - No lengthy registration forms
- ✅ **Single sign-on** - Seamless experience across devices

### Role Selection
- **Teachers**: Can create classes, quizzes, and manage students
- **Students**: Can join classes and take quizzes

## 📖 Documentation

- **[📋 Installation Guide](./INSTALLATION.md)** - Detailed setup instructions
- **[🎬 Demo Script](./DEMO_SCRIPT.md)** - Video demo guidelines

## 🏗️ Architecture

### Database Schema
```
Users (Teachers/Students)
├── Classes (Teacher-created)
│   ├── Enrollments (Student memberships)
│   ├── Quizzes (Assessments)
│   ├── Announcements (Class updates)
│   └── Materials (Resources)
├── Quiz Attempts (Student submissions)
├── Questions & Answers (Quiz content)
└── Notifications (System alerts)
```

### Key Components
- **Google OAuth Authentication**: Secure login with role selection
- **Quiz Engine**: Multiple question types with automated grading
- **Class Management**: Teacher-student organization system
- **Analytics Engine**: Real-time performance tracking
- **Notification System**: Automated alerts and reminders

### Security Features
- 🔐 **Google OAuth Integration** - Secure authentication
- 🛡️ **Role-based Access Control** (RBAC)
- 🔒 **JWT Session Management** with NextAuth.js
- 🚫 **SQL Injection Prevention** via Prisma ORM
- ⏱️ **Rate Limiting** on API endpoints

### Environment Variables
```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🤝 Contributing

We welcome contributions!

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

## 📄 License

This project is licensed under the **MIT License**.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

<div align="center">

**Made with ❤️ for Education**

[⭐ Star this repo](https://github.com/TaViKhang/quizmaker) • [🐛 Report Bug](https://github.com/your-username/eduasses/issues) • [💡 Request Feature](https://github.com/your-username/eduasses/issues)

</div>
