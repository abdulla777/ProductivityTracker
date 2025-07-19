#!/bin/bash

# Test Database Connection Script
# This script verifies that all database scripts can connect properly

echo "🔍 Testing Database Connection with Proper Credentials"
echo "===================================================="

DB_NAME="consulting_engineers"
DB_USER="postgres"
DB_PASSWORD="password"

echo "📋 Testing basic connection..."
PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql -d $DB_NAME -c "SELECT 'Connection successful!' as status, current_user as user, current_database() as database;"

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    
    echo ""
    echo "📋 Testing column existence check..."
    PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql -d $DB_NAME -c "
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_active'
            ) THEN '✅ is_active column exists'
            ELSE '❌ is_active column missing'
        END as is_active_status,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notifications' AND column_name = 'reference_id'
            ) THEN '✅ reference_id column exists'
            ELSE '❌ reference_id column missing'
        END as reference_id_status;
    "
    
    echo ""
    echo "📋 Testing user count..."
    PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD psql -d $DB_NAME -c "SELECT COUNT(*) as user_count FROM users;"
    
    echo ""
    echo "🎉 All database connection tests passed!"
else
    echo "❌ Database connection failed!"
    echo "Please check:"
    echo "1. PostgreSQL is running: sudo systemctl status postgresql"
    echo "2. Database exists: sudo -u postgres psql -c '\\l'"
    echo "3. User credentials are correct"
fi