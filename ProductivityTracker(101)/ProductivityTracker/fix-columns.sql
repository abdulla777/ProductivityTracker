-- Fix all missing columns in the database
-- This script ensures all critical columns exist

-- Add CRITICAL missing column to users table (fixes login issues)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create residence_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE residence_status AS ENUM ('active', 'expired', 'expiring_soon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add residence columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(20) DEFAULT 'saudi';
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_expiry_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_status residence_status DEFAULT 'active';

-- Add other missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to other tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'present';
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days_count INTEGER;

-- CRITICAL: Add missing columns to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_percentage REAL DEFAULT 0.0;

-- Ensure all required columns for user creation exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update all existing users to have residence_status if null
UPDATE users SET residence_status = 'active' WHERE residence_status IS NULL;
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Verify critical columns exist
SELECT 'is_active column exists' as result FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active';
SELECT 'residence_status column exists' as result FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'residence_status';