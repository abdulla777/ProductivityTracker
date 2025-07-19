-- Quick SQL Fix for Local Database
-- Run this directly in PostgreSQL to fix the missing columns

-- Connect to your database first:
-- psql -U postgres -d productivity_tracker

-- Add missing columns to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS clock_in_time TEXT,
ADD COLUMN IF NOT EXISTS clock_out_time TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
AND column_name IN ('clock_in_time', 'clock_out_time');

-- Test inserting an attendance record
INSERT INTO attendance (user_id, date, clock_in_time, clock_out_time, is_present, notes, recorded_by) 
VALUES (1, CURRENT_DATE, '09:00:00', '17:00:00', true, 'Quick fix test', 1)
RETURNING id, user_id, date, clock_in_time, clock_out_time, notes;

-- Show success message
SELECT 'SUCCESS: Attendance table fixed! You can now use manual attendance registration.' as result;