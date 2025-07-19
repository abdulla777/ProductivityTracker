-- Fix nullable fields to prevent empty string errors
-- Run this to allow null values in optional fields

-- Users table - make employment_date nullable
ALTER TABLE users ALTER COLUMN hire_date DROP NOT NULL;

-- Projects table - make date fields nullable initially
ALTER TABLE projects ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN target_end_date DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN actual_end_date DROP NOT NULL;

-- Clients table - make optional fields nullable
ALTER TABLE clients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN city DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN notes DROP NOT NULL;

-- Leave requests table - make optional fields nullable
ALTER TABLE leave_requests ALTER COLUMN reason DROP NOT NULL;
ALTER TABLE leave_requests ALTER COLUMN days_count DROP NOT NULL;

-- Attendance table - make optional fields nullable
ALTER TABLE attendance ALTER COLUMN notes DROP NOT NULL;

-- Notifications table - make optional fields nullable
ALTER TABLE notifications ALTER COLUMN reference_id DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN reference_type DROP NOT NULL;

-- Users table - make residence fields nullable
ALTER TABLE users ALTER COLUMN residence_number DROP NOT NULL;
ALTER TABLE users ALTER COLUMN residence_expiry_date DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN department DROP NOT NULL;
ALTER TABLE users ALTER COLUMN position DROP NOT NULL;
ALTER TABLE users ALTER COLUMN salary DROP NOT NULL;

-- Success message
SELECT '✅ Database schema updated - null values now allowed for optional fields' as status;