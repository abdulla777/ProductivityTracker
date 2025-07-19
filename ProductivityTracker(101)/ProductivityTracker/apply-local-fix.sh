#!/bin/bash

# Apply Local Database Fix for User's PostgreSQL
# This script fixes the missing columns in the user's local database

echo "🔧 Applying local database schema fix..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Apply the schema fix
echo "📋 Adding missing columns to attendance table..."
psql -U postgres -d productivity_tracker -f fix-user-local-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema fix applied successfully!"
    echo "📊 Verifying attendance table structure..."
    
    # Test the fix by inserting a sample record
    echo "🧪 Testing attendance record creation..."
    psql -U postgres -d productivity_tracker -c "
    INSERT INTO attendance (user_id, date, clock_in_time, clock_out_time, is_present, notes, recorded_by) 
    VALUES (1, CURRENT_DATE, '09:00:00', '17:00:00', true, 'Local database fix test', 1)
    RETURNING id, user_id, date, clock_in_time, clock_out_time, notes;
    "
    
    if [ $? -eq 0 ]; then
        echo "🎉 SUCCESS: Attendance system is now working!"
        echo "🚀 You can now use the manual attendance registration without errors."
    else
        echo "❌ Test failed. Please check the database configuration."
    fi
else
    echo "❌ Failed to apply database fix. Please check the error messages above."
    exit 1
fi

echo "📋 Database fix complete. Restarting the application..."