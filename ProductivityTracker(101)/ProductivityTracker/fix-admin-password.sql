-- Fix admin password for local development
-- This updates the admin user to use plain text password for simplicity in local dev

UPDATE users 
SET password = 'admin123' 
WHERE username = 'admin';

-- Verify the update
SELECT username, password, full_name, role, is_active 
FROM users 
WHERE username = 'admin';