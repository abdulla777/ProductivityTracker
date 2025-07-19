# Migration Guide: From Replit to Local Development

This guide will help you migrate the Consulting Engineers Management System from Replit to your local development environment.

## Prerequisites

- **Node.js 18+** and **npm 9+**
- **PostgreSQL** (local installation or cloud service)
- **Git** (optional, for version control)

## Quick Migration Steps

### 1. Download and Extract Project

```bash
# If you have the project as a ZIP file
unzip consulting-engineers-project.zip
cd consulting-engineers-project

# OR clone from repository
git clone <repository-url>
cd consulting-engineers-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb consulting_engineers

# Create user (optional)
sudo -u postgres createuser --interactive
```

#### Option B: Cloud Database (Recommended)
Use services like:
- **Neon** (https://neon.tech) - Serverless PostgreSQL
- **Supabase** (https://supabase.com) - Free tier available
- **PlanetScale** (https://planetscale.com) - MySQL alternative
- **Railway** (https://railway.app) - PostgreSQL hosting

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Update `.env` with your database URL:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/consulting_engineers
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-secure-secret-key
```

### 5. Initialize Database Schema

```bash
npm run db:push
```

### 6. Start the Application

```bash
# Single process (recommended)
npm run dev

# OR separate processes (for development)
npm run dev:both
```

## Configuration Files for Local Development

The project includes several configuration files for local development:

### Core Files
- `package.local.json` - Local package configuration with additional scripts
- `vite.config.local.ts` - Vite configuration without Replit dependencies
- `tsconfig.local.json` - TypeScript configuration for local development
- `.env.example` - Environment variables template

### Helper Scripts
- `setup-local.js` - Automated setup script
- `check-dependencies.js` - Validates project configuration
- `server/db.local.ts` - Alternative database configuration for local PostgreSQL

## Database Migration Options

### From Neon Serverless to Local PostgreSQL

1. **Export data from Neon**:
```bash
pg_dump "postgresql://username:password@ep-xxx.neon.tech/neondb" > neon_export.sql
```

2. **Import to local PostgreSQL**:
```bash
psql -d consulting_engineers -f neon_export.sql
```

3. **Update .env**:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/consulting_engineers
```

### Using Docker for Database

```bash
# Start PostgreSQL in Docker
docker run --name postgres-consulting \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=consulting_engineers \
  -p 5432:5432 \
  -d postgres:15

# Use this connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/consulting_engineers
```

## Removing Replit Dependencies

The following Replit-specific dependencies are automatically handled:

### Removed from Local Config
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-runtime-error-modal`
- Replit-specific environment variables

### Alternative Implementations
- **Database**: Use any PostgreSQL provider instead of Replit Database
- **Environment**: Use `.env` files instead of Replit Secrets
- **Hosting**: Deploy to Vercel, Netlify, or any hosting service

## Development Workflow

### Development Mode
```bash
# Start development server
npm run dev

# Application runs on:
# - http://localhost:5000 (full-stack)
# - Backend API: http://localhost:5000/api/*
# - Frontend: Served by backend at port 5000
```

### Separate Frontend/Backend (Optional)
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend  
npm run dev:frontend

# URLs:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - API: http://localhost:5000/api/*
```

### Production Build
```bash
npm run build
npm run start
```

## Import Path Verification

All import paths have been verified to work locally:

### Alias Configuration
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets/*` → `./attached_assets/*`

### Key Components Verified
- ✅ Toast system (`@/components/ui/toaster`)
- ✅ UI components (`@/components/ui/*`)
- ✅ Context providers (`@/context/*`)
- ✅ Custom hooks (`@/hooks/*`)
- ✅ Shared schemas (`@shared/schema`)

## Troubleshooting Common Issues

### Port Conflicts
```bash
# Find process using port 5000
lsof -i :5000

# Kill process if needed
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql "postgresql://username:password@localhost:5432/consulting_engineers"

# Check if database exists
psql -l | grep consulting_engineers
```

### Import Path Issues
```bash
# Verify TypeScript configuration
npx tsc --noEmit

# Check if paths resolve correctly
npm run check
```

### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check dependencies
node check-dependencies.js
```

## Performance Optimizations for Local Development

### Database Optimization
```sql
-- Add indexes for better performance (run in PostgreSQL)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
```

### Development Tools
```bash
# Install useful development tools
npm install -g nodemon
npm install -g typescript

# Use nodemon for auto-restart
nodemon --exec tsx server/index.ts
```

## Deployment Options

### Vercel (Frontend + Serverless Functions)
```bash
npm install -g vercel
vercel
```

### Railway (Full-Stack)
```bash
# Connect to Railway
npm install -g @railway/cli
railway login
railway init
railway up
```

### DigitalOcean App Platform
- Connect GitHub repository
- Set environment variables
- Deploy automatically

### Traditional VPS
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start npm --name "consulting-engineers" -- run start
```

## Security Considerations

### Environment Variables
```env
# Use strong session secret
SESSION_SECRET=your-very-secure-random-string-here

# Database credentials
DATABASE_URL=postgresql://secure_user:strong_password@host:5432/database

# Enable SSL in production
NODE_ENV=production
```

### Database Security
```sql
-- Create restricted user for application
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE consulting_engineers TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

## Testing the Migration

### Verification Checklist
- [ ] Application starts without errors
- [ ] Database connection works
- [ ] Login functionality works (admin/admin123)
- [ ] All pages load correctly
- [ ] Language switching works (Arabic/English)
- [ ] CRUD operations work (create/read/update projects, clients, staff)
- [ ] Responsive design works on mobile

### Test Commands
```bash
# Run dependency checker
node check-dependencies.js

# Test database connection
npm run db:push

# Start application
npm run dev

# Test API endpoints
curl http://localhost:5000/api/users
curl http://localhost:5000/api/projects
```

## Success! 

Your application should now be running locally at http://localhost:5000

Default login credentials:
- **Username**: admin
- **Password**: admin123

For additional help, see `README.md` or contact support.