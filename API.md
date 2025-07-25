# 🔌 API Documentation - OnTest

This document provides comprehensive information about the OnTest REST API endpoints based on the actual implementation.

## 📋 Table of Contents

- [Authentication](#-authentication)
- [Base URL & Headers](#-base-url--headers)
- [Response Format](#-response-format)
- [Error Handling](#-error-handling)
- [API Endpoints](#-api-endpoints)
- [Examples](#-examples)

## 🔐 Authentication

OnTest uses NextAuth.js with Google OAuth for authentication. All API requests require a valid session.

### Authentication Methods

1. **Google OAuth Session** (Primary)
   - Automatic session management via cookies
   - No additional headers required
   - Users must sign in with Google

### Getting Session Information

```http
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "TEACHER",
    "image": "https://lh3.googleusercontent.com/..."
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

### Role Selection (First-time Users)

```http
POST /api/auth/select-role
```

**Request Body:**
```json
{
  "role": "TEACHER"
}
```

## 🌐 Base URL & Headers

### Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

### Required Headers
```http
Content-Type: application/json
Accept: application/json
```

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

## 🛠️ API Endpoints

### Authentication

#### Get Current User
```http
GET /api/users/me
```

#### Update User Role
```http
POST /api/users/change-role
```

**Request Body:**
```json
{
  "userId": "user_id",
  "newRole": "STUDENT"
}
```

#### Delete Account
```http
DELETE /api/users/delete-account
```

### Classes

#### Get All Classes
```http
GET /api/classes
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

#### Create Class
```http
POST /api/classes
```

**Request Body:**
```json
{
  "name": "Mathematics Grade 10",
  "description": "Advanced mathematics course",
  "subject": "Mathematics",
  "type": "PRIVATE",
  "maxStudents": 30
}
```

#### Get Class Details
```http
GET /api/classes/{id}
```

#### Update Class
```http
PUT /api/classes/{id}
```

#### Join Class
```http
POST /api/classes/{id}/join
```

**Request Body:**
```json
{
  "code": "ABC123"
}
```

#### Get Class Students
```http
GET /api/classes/{id}/students
```

#### Add Students to Class
```http
POST /api/classes/{id}/students
```

**Request Body:**
```json
{
  "studentIds": ["student_id_1", "student_id_2"]
}
```

#### Get Class Dashboard
```http
GET /api/classes/{id}/dashboard
```

#### Create Class Announcement
```http
POST /api/classes/{id}/announcements
```

**Request Body:**
```json
{
  "title": "Important Update",
  "content": "Please review the new assignment guidelines."
}
```

#### Get Class Materials
```http
GET /api/classes/{id}/materials
```

#### Create Class Quiz
```http
POST /api/classes/{id}/quizzes
```

### Quizzes

#### Get All Quizzes
```http
GET /api/quizzes
```

#### Create Quiz
```http
POST /api/quizzes
```

**Request Body:**
```json
{
  "title": "Mathematics Quiz 1",
  "description": "Basic algebra concepts",
  "timeLimit": 60,
  "classId": "class_id",
  "category": "Mathematics",
  "maxAttempts": 3,
  "passingScore": 70,
  "showResults": true,
  "shuffleQuestions": false,
  "startDate": "2024-01-15T09:00:00Z",
  "endDate": "2024-01-20T23:59:59Z"
}
```

#### Get Quiz Details
```http
GET /api/quizzes/{id}
```

#### Update Quiz
```http
PUT /api/quizzes/{id}
```

#### Submit Quiz
```http
POST /api/quizzes/{id}/submit
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "question_id",
      "selectedOptions": ["option_id"],
      "textAnswer": "Optional text answer"
    }
  ]
}
```

### Questions

#### Create Question
```http
POST /api/questions
```

**Request Body:**
```json
{
  "quizId": "quiz_id",
  "content": "What is 2 + 2?",
  "type": "MULTIPLE_CHOICE",
  "points": 1,
  "order": 1,
  "options": [
    {
      "content": "3",
      "isCorrect": false,
      "order": 1
    },
    {
      "content": "4",
      "isCorrect": true,
      "order": 2
    }
  ]
}
```

#### Update Question
```http
PUT /api/questions/{id}
```

#### Delete Question
```http
DELETE /api/questions/{id}
```

#### Update Question Options
```http
PUT /api/questions/{id}/options
```

### Quiz Attempts

#### Start Quiz Attempt
```http
POST /api/attempts/start
```

**Request Body:**
```json
{
  "quizId": "quiz_id"
}
```

#### Submit Answer
```http
POST /api/attempts/{id}/answers
```

**Request Body:**
```json
{
  "questionId": "question_id",
  "selectedOptions": ["option_id_1"],
  "textAnswer": "Optional text answer",
  "jsonData": {}
}
```

#### Get Attempt Results
```http
GET /api/attempts/{id}/results
```

### Teacher Endpoints

#### Get Teacher Classes
```http
GET /api/teacher/classes
```

#### Create Teacher Quiz
```http
POST /api/teacher/quizzes
```

#### Get Teacher Dashboard
```http
GET /api/teacher/dashboard
```

#### Get Students for Grading
```http
GET /api/teacher/students
```

### Analytics

#### Get User Learning Progress
```http
GET /api/users/me/learning-progress
```

**Query Parameters:**
- `timeFrame`: "last7days", "last30days", "last90days", etc.
- `subject`: Filter by specific subject

#### Get Quiz Results
```http
GET /api/users/me/quiz-results/{id}
```

### Notifications

#### Get User Notifications
```http
GET /api/notifications
```

#### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
```

#### Delete Notification
```http
DELETE /api/notifications/{id}
```

## 📝 Examples

### Complete Quiz Flow

1. **Get Available Quizzes**
```javascript
const response = await fetch('/api/quizzes?classId=class_123');
const quizzes = await response.json();
```

2. **Start Quiz Attempt**
```javascript
const attempt = await fetch('/api/attempts/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quizId: 'quiz_123' })
});
```

3. **Submit Answers**
```javascript
await fetch('/api/attempts/attempt_123/answers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionId: 'question_123',
    selectedOptions: ['option_456']
  })
});
```

4. **Submit Quiz**
```javascript
const results = await fetch('/api/quizzes/quiz_123/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: [
      {
        questionId: 'question_123',
        selectedOptions: ['option_456']
      }
    ]
  })
});
```

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/quizzes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
} catch (error) {
  console.error('API Error:', error.message);
  throw error;
}
```

---

**Need help?** Check our [User Guide](./USER_GUIDE.md) or [Installation Guide](./INSTALLATION.md).
