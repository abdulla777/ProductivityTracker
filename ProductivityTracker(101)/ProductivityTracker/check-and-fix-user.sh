#!/bin/bash

# Quick script for user to run when database has issues

echo "🚀 One-Click Fix for Database Issues"
echo "==================================="

echo "📋 Step 1: Checking for critical missing columns..."

# Check if is_active column exists and add it if missing
PGUSER=postgres PGPASSWORD=password psql -d consulting_engineers -c "
DO \$\$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added missing is_active column to users table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END \$\$;
"

# Check if reference_id column exists in notifications
PGUSER=postgres PGPASSWORD=password psql -d consulting_engineers -c "
DO \$\$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'reference_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN reference_id INTEGER;
        RAISE NOTICE 'Added missing reference_id column to notifications table';
    ELSE
        RAISE NOTICE 'reference_id column already exists';
    END IF;
END \$\$;
"

echo "📋 Step 2: Running database repair..."
./debug-database.sh

echo "📋 Step 3: Starting enhanced application..."
./start-local-enhanced.sh