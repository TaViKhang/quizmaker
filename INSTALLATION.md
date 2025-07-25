# 🛠️ Installation Guide - OnTest

This guide provides detailed instructions for setting up OnTest with Google OAuth authentication.

## 📋 Table of Contents

- [System Requirements](#-system-requirements)
- [Google OAuth Setup](#-google-oauth-setup)
- [Local Development Setup](#-local-development-setup)
- [Database Configuration](#-database-configuration)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)

## 🖥️ System Requirements

### Minimum Requirements
- **Node.js**: 18.0 or later
- **npm**: 8.0 or later (or yarn 1.22+)
- **PostgreSQL**: 12.0 or later
- **Google Account**: For OAuth setup
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space

### Recommended Development Environment
- **OS**: Windows 10/11, macOS 10.15+, or Ubuntu 20.04+
- **IDE**: Visual Studio Code with TypeScript extension
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

## 🔐 Google OAuth Setup

**Important**: OnTest requires Google OAuth for authentication. You must set this up before running the application.

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Enter project name: `eduasses-auth` (or your preferred name)
   - Click "Create"

### Step 2: Enable Google+ API

1. **Navigate to APIs & Services**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Click "Create"

2. **Fill Required Information**
   ```
   App name: OnTest
   User support email: your-email@gmail.com
   Developer contact: your-email@gmail.com
   ```

3. **Add Scopes** (Optional for development)
   - Click "Add or Remove Scopes"
   - Add: `email`, `profile`, `openid`

4. **Add Test Users** (For development)
   - Add your email and any test accounts

### Step 4: Create OAuth Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Client**
   ```
   Application type: Web application
   Name: OnTest Web Client
   
   Authorized JavaScript origins:
   - http://localhost:3000 (for development)
   - https://your-domain.com (for production)
   
   Authorized redirect URIs:
   - http://localhost:3000/api/auth/callback/google (for development)
   - https://your-domain.com/api/auth/callback/google (for production)
   ```

3. **Save Credentials**
   - Copy the **Client ID** and **Client Secret**
   - You'll need these for environment variables

## 🚀 Local Development Setup

### Step 1: Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/your-username/ontest.git

# Or using SSH
git clone git@github.com:your-username/ontest.git

# Navigate to project directory
cd ontest
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Or using yarn
yarn install
```

**Note**: If you encounter permission errors on Windows, run your terminal as Administrator.

### Step 3: Verify Installation

```bash
# Check Node.js version
node --version  # Should be 18.0+

# Check npm version
npm --version   # Should be 8.0+

# Verify TypeScript installation
npx tsc --version
```

## 🗄️ Database Configuration

### Option 1: Local PostgreSQL Installation

#### Windows
1. Download PostgreSQL from [official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember your superuser password
4. Add PostgreSQL to your PATH environment variable

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database user
createuser --interactive
```

#### Ubuntu/Linux
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a database user
sudo -u postgres createuser --interactive
```

#### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (choose your own name)
CREATE DATABASE your_database_name;

# Create user (optional)
CREATE USER your_username WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;

# Exit PostgreSQL
\q
```

### Option 2: Cloud Database (Recommended)

#### Supabase (Free Tier Available)
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Copy the database URL from Settings > Database
4. Use the URL in your `.env.local` file

#### Railway
1. Go to [Railway](https://railway.app/)
2. Create a new PostgreSQL database
3. Copy the connection string
4. Use in your environment variables

## 🔧 Environment Variables

### Step 1: Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Or create manually if .env.example doesn't exist
touch .env
```

### Step 2: Configure Variables

Edit `.env` with your preferred text editor:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name?schema=public"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key"

# Google OAuth Configuration (REQUIRED)
# Get these from Google Cloud Console following the setup guide above
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-client-secret"
```

**Important Setup Steps**:
1. Replace `username:password` with your PostgreSQL credentials
2. Replace `your_database_name` with your chosen database name
3. Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
4. Get Google OAuth credentials from Google Cloud Console

### Step 3: Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET (optional)
openssl rand -hex 32
```

### Environment Variables Explanation

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://username:password@localhost:5432/database_name?schema=public` |
| `NEXTAUTH_URL` | Your application URL | ✅ | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | ✅ | `generated-with-openssl-rand-base64-32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ | `123456789-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ | `GOCSPX-your-secret-from-google-console` |

## 🏃‍♂️ Running the Application

### Step 1: Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database with sample data
npm run seed
```

### Step 2: Start Development Server

```bash
# Start the development server
npm run dev

# Or with yarn
yarn dev
```

### Step 3: Verify Installation

1. Open your browser and go to [http://localhost:3000](http://localhost:3000)
2. You should see the EduAsses homepage
3. Click "Sign in with Google" to test authentication
4. Select your role (Teacher or Student) on first login
5. Access the dashboard to confirm everything works

**Database Note**: You can choose any database name you prefer. Make sure it matches the name in your DATABASE_URL.

## 🌐 Production Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com/)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add all variables from your `.env.local`
   - Update `NEXTAUTH_URL` to your production domain
   - Update Google OAuth redirect URIs

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Your app will be available at `https://your-app.vercel.app`

### Update Google OAuth for Production

1. **Add Production URLs**
   - Go back to Google Cloud Console
   - Update OAuth client with production URLs:
     ```
     Authorized JavaScript origins:
     - https://your-domain.vercel.app
     
     Authorized redirect URIs:
     - https://your-domain.vercel.app/api/auth/callback/google
     ```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Google OAuth Error
```
Error: redirect_uri_mismatch
```

**Solutions:**
- Verify redirect URIs in Google Cloud Console match exactly
- Check that NEXTAUTH_URL matches your domain
- Ensure no trailing slashes in URLs

#### 2. Database Connection Error
```
Error: Can't reach database server at localhost:5432
```

**Solutions:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL format
- Ensure database exists and user has permissions

#### 3. NextAuth Configuration Error
```
[next-auth][error][CLIENT_FETCH_ERROR]
```

**Solutions:**
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Ensure Google OAuth credentials are correct

#### 4. Module Not Found Errors
```
Module not found: Can't resolve '@/components/...'
```

**Solutions:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check TypeScript configuration in `tsconfig.json`

#### 5. Prisma Client Errors
```
PrismaClientInitializationError: Prisma Client could not locate the Query Engine
```

**Solutions:**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database if needed
npx prisma db push --force-reset
```

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**: Look at browser console and terminal output
2. **Verify Google OAuth setup**: Most issues are related to OAuth configuration
3. **Search existing issues**: Check GitHub issues for similar problems
4. **Create an issue**: Provide detailed error messages and steps to reproduce

## ✅ Verification Checklist

After installation, verify these features work:

- [ ] Homepage loads correctly
- [ ] Google OAuth login works
- [ ] Role selection for new users
- [ ] Teacher can create a class
- [ ] Student can join a class with code
- [ ] Quiz creation and taking
- [ ] Analytics dashboard displays data
- [ ] Notifications system works

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Update database schema
npx prisma db push

# Rebuild application
npm run build
```

### Database Maintenance
```bash
# Backup database (replace with your database name)
pg_dump your_database_name > backup.sql

# Restore database
psql your_database_name < backup.sql
```

---

**Need more help?** Check our [User Guide](./USER_GUIDE.md) or [API Documentation](./API.md).
