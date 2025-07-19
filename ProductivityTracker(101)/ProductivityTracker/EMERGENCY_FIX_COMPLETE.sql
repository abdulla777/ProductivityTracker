-- EMERGENCY FIX: All Missing Database Columns
-- Run this to fix ALL critical column issues immediately

-- Fix 1: Add missing columns to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Fix 2: Add missing columns to projects table  
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_percentage REAL DEFAULT 0.0;

-- Fix 3: Add missing columns to users table (critical for login)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Fix 4: Create residence_status enum and add to users
DO $$ BEGIN
    CREATE TYPE residence_status AS ENUM ('active', 'expired', 'expiring_soon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(20) DEFAULT 'saudi';
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_expiry_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_status residence_status DEFAULT 'active';

-- Fix 5: Add missing columns to other tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'present';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days_count INTEGER;

-- Fix 6: Update existing data to prevent null issues
UPDATE users SET is_active = true WHERE is_active IS NULL;
UPDATE users SET residence_status = 'active' WHERE residence_status IS NULL;
UPDATE users SET nationality = 'saudi' WHERE nationality IS NULL;
UPDATE projects SET completion_percentage = 0.0 WHERE completion_percentage IS NULL;

-- Fix 7: Verify all critical columns exist
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') 
         THEN '✅ users.is_active exists' 
         ELSE '❌ users.is_active MISSING' END as is_active_check,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'residence_status') 
         THEN '✅ users.residence_status exists' 
         ELSE '❌ users.residence_status MISSING' END as residence_status_check,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'reference_id') 
         THEN '✅ notifications.reference_id exists' 
         ELSE '❌ notifications.reference_id MISSING' END as reference_id_check,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'completion_percentage') 
         THEN '✅ projects.completion_percentage exists' 
         ELSE '❌ projects.completion_percentage MISSING' END as completion_percentage_check;

-- Success message
SELECT '🎉 EMERGENCY FIX COMPLETE - All critical columns should now exist!' as status;