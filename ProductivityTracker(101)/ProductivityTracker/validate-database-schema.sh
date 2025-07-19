#!/bin/bash

# Database Schema Validation Script
# This script checks for all required columns and creates them if missing

echo "🔍 Validating Database Schema..."
echo "================================="

DB_NAME="consulting_engineers"
DB_USER="postgres"
DB_PASSWORD="password"

# Function to check and add column
check_and_add_column() {
    local table_name=$1
    local column_name=$2
    local column_definition=$3
    
    PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql -d $DB_NAME -c "
    DO \$\$ BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = '$table_name' AND column_name = '$column_name'
        ) THEN
            ALTER TABLE $table_name ADD COLUMN $column_name $column_definition;
            RAISE NOTICE 'Added missing $column_name column to $table_name table';
        ELSE
            RAISE NOTICE '$column_name column already exists in $table_name';
        END IF;
    END \$\$;
    "
}

echo "📋 Creating critical enum types..."

# Create residence_status enum if it doesn't exist
PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql -d $DB_NAME -c "
DO \$\$ BEGIN
    CREATE TYPE residence_status AS ENUM ('active', 'expired', 'expiring_soon');
EXCEPTION
    WHEN duplicate_object THEN null;
END \$\$;
"

echo "📋 Checking critical columns..."

# Check users table critical columns
check_and_add_column "users" "is_active" "BOOLEAN DEFAULT true"
check_and_add_column "users" "department" "TEXT"
check_and_add_column "users" "position" "TEXT"
check_and_add_column "users" "hire_date" "DATE"
check_and_add_column "users" "salary" "DECIMAL(10,2)"
check_and_add_column "users" "updated_at" "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
check_and_add_column "users" "residence_status" "residence_status DEFAULT 'active'"

# Check notifications table CRITICAL columns
check_and_add_column "notifications" "reference_id" "INTEGER"
check_and_add_column "notifications" "reference_type" "TEXT"
check_and_add_column "notifications" "priority" "TEXT DEFAULT 'medium'"

# Check projects table
check_and_add_column "projects" "completion_percentage" "REAL DEFAULT 0.0"

# Check clients table
check_and_add_column "clients" "city" "TEXT"

# Check attendance table
check_and_add_column "attendance" "status" "TEXT DEFAULT 'present'"

# Check leave_requests table
check_and_add_column "leave_requests" "days_count" "INTEGER"

echo "✅ Database schema validation completed!"
echo "🚀 All required columns are now present."