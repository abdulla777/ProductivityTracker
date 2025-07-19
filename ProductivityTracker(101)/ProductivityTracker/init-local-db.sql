-- Initialize Local Database for Consulting Engineers Management System
-- Run this with: PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -f init-local-db.sql

-- Create enum types
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('admin', 'project_manager', 'engineer', 'admin_staff', 'hr_manager', 'general_manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('new', 'in_progress', 'delayed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_phase AS ENUM ('architectural_design', 'structural_design', 'mep_design', 'official_approval', 'execution_supervision');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'delayed', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_type AS ENUM ('new_project', 'partnership', 'vendor_registration', 'ongoing_project', 'project_expansion');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_strength AS ENUM ('strong', 'medium', 'weak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('draft', 'submitted', 'under_review', 'negotiation', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add CRITICAL missing column to users table (fixes login issues)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create residence_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE residence_status AS ENUM ('active', 'expired', 'expiring_soon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add residence columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(20) DEFAULT 'saudi';
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_expiry_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_status residence_status DEFAULT 'active';

-- Create residence renewals table
CREATE TABLE IF NOT EXISTS residence_renewals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  old_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  renewal_period_months INTEGER NOT NULL,
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Create residence notifications table  
CREATE TABLE IF NOT EXISTS residence_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  notification_type VARCHAR(20) NOT NULL,
  expiry_date DATE NOT NULL,
  sent_to VARCHAR(100),
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure admin user exists with residence fields
INSERT INTO users (username, password, full_name, email, role, nationality, residence_status) 
VALUES ('admin', 'admin123', 'مدير النظام', 'admin@innovators.com', 'admin', 'saudi', 'active')
ON CONFLICT (username) DO UPDATE SET
  nationality = EXCLUDED.nationality,
  residence_status = EXCLUDED.residence_status;

-- Create HR Manager for testing
INSERT INTO users (username, password, full_name, email, role, nationality, residence_status) 
VALUES ('hr_manager', 'hr123', 'مدير الموارد البشرية', 'hr@innovators.com', 'hr_manager', 'saudi', 'active')
ON CONFLICT (username) DO UPDATE SET
  nationality = EXCLUDED.nationality,
  residence_status = EXCLUDED.residence_status;

-- Create test resident users
INSERT INTO users (username, password, full_name, email, role, nationality, residence_number, residence_expiry_date, residence_status) 
VALUES 
  ('resident1', 'password123', 'أحمد محمد علي', 'ahmed@test.com', 'engineer', 'resident', '2123456789', '2025-09-15', 'active'),
  ('resident2', 'password123', 'فاطمة أحمد سالم', 'fatima@test.com', 'engineer', 'resident', '2123456790', '2025-08-10', 'active')
ON CONFLICT (username) DO UPDATE SET
  nationality = EXCLUDED.nationality,
  residence_number = EXCLUDED.residence_number,
  residence_expiry_date = EXCLUDED.residence_expiry_date,
  residence_status = EXCLUDED.residence_status;

-- Verify setup
SELECT 'Users with residence data:' as info;
SELECT username, full_name, nationality, residence_number, residence_expiry_date 
FROM users 
WHERE nationality = 'resident';

SELECT 'Database tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('residence_renewals', 'residence_notifications');