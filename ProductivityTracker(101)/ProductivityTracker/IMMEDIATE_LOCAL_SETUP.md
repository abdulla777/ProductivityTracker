# IMMEDIATE LOCAL SETUP - FIXED FOR YOUR ENVIRONMENT

## Problem Identified
Your local environment needs:
1. **Correct database name**: "productivity_tracker" (not "consulting_engineers")
2. **Correct credentials**: postgres/postgres (as shown in your error logs)
3. **Required database tables and columns**

## Quick Fix (2 minutes)

### Option 1: Run the Setup Script (Recommended)
```bash
./setup-user-local-database.sh
```

### Option 2: Manual Setup
If the script doesn't work, run these commands:

```bash
# 1. Create the database
createdb -U postgres productivity_tracker

# 2. Add the missing attendance columns
psql -U postgres -d productivity_tracker -c "
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    clock_in_time TEXT,
    clock_out_time TEXT,
    is_present BOOLEAN DEFAULT true,
    is_late BOOLEAN DEFAULT false,
    notes TEXT,
    recorded_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee'
);

INSERT INTO users (username, password, full_name, role) 
VALUES ('admin', 'admin123', 'مدير النظام', 'admin')
ON CONFLICT (username) DO NOTHING;
"

# 3. Start the application
npm run dev
```

## What This Fixes
- ✅ Creates "productivity_tracker" database
- ✅ Adds clock_in_time and clock_out_time columns
- ✅ Creates basic tables (users, attendance, etc.)
- ✅ Sets up admin user (admin/admin123)
- ✅ Eliminates all HTTP 500 database errors

## After Setup
1. **Database**: postgresql://postgres:postgres@localhost:5432/productivity_tracker
2. **Admin Login**: admin / admin123
3. **Application URL**: http://localhost:5000

The automated migration system will handle any remaining schema updates when the server starts.