-- Fix residence columns for local PostgreSQL database
-- This script ensures all residence-related columns exist

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

-- Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('nationality', 'residence_number', 'residence_expiry_date', 'residence_status');