-- Fix User's Local Database Schema
-- This script adds all missing columns to the user's local PostgreSQL database

-- Add missing columns to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS clock_in_time TEXT,
ADD COLUMN IF NOT EXISTS clock_out_time TEXT;

-- Create staff_evaluations table if missing
CREATE TABLE IF NOT EXISTS staff_evaluations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    evaluated_by INTEGER NOT NULL REFERENCES users(id),
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing assigned_at column to project_staff
ALTER TABLE project_staff 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to other tables if needed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS residence_status TEXT DEFAULT 'active';

-- Create notifications table if missing
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    priority TEXT DEFAULT 'low',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_id INTEGER,
    reference_type TEXT
);

-- Create residence_renewals table if missing
CREATE TABLE IF NOT EXISTS residence_renewals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    old_expiry_date DATE NOT NULL,
    new_expiry_date DATE NOT NULL,
    processed_by INTEGER NOT NULL REFERENCES users(id),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create residence_notifications table if missing
CREATE TABLE IF NOT EXISTS residence_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE NOT NULL,
    days_until_expiry INTEGER NOT NULL
);

-- Verify the attendance table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;