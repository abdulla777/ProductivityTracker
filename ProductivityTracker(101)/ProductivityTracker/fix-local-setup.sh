#!/bin/bash

# Quick Fix for Local PostgreSQL Setup
# This script ensures PostgreSQL is running and creates the complete schema

echo "🔧 Quick Fix for Local PostgreSQL Setup"
echo "======================================"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not installed. Please install it first:"
    echo "   sudo apt update && sudo apt install postgresql postgresql-contrib"
    exit 1
fi

# Start PostgreSQL if not running
if ! systemctl is-active --quiet postgresql; then
    echo "📋 Starting PostgreSQL service..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    echo "✅ PostgreSQL started"
else
    echo "✅ PostgreSQL is already running"
fi

# Check if database exists, create if not
echo "📋 Setting up database..."
sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw consulting_engineers
if [ $? -ne 0 ]; then
    echo "📋 Creating database..."
    sudo -u postgres createdb consulting_engineers
fi

# Create/update user
sudo -u postgres psql -c "
DO \$\$ BEGIN
    CREATE USER postgres WITH PASSWORD 'password';
EXCEPTION
    WHEN duplicate_object THEN
    ALTER USER postgres WITH PASSWORD 'password';
END \$\$;
" 2>/dev/null

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE consulting_engineers TO postgres;" 2>/dev/null

# Create the complete schema
echo "📋 Creating complete schema..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -f create-full-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema created successfully"
else
    echo "❌ Schema creation failed"
    exit 1
fi

# Test connection and show results
echo "📋 Testing setup..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "
SELECT 'Test users created:' as info;
SELECT username, role, nationality FROM users LIMIT 5;
"

echo ""
echo "🎉 Local PostgreSQL setup complete!"
echo "=================================="
echo "✅ Database: consulting_engineers"
echo "✅ Admin user: admin / admin123"
echo "✅ HR Manager: hr_manager / hr123"
echo "✅ Residence management enabled"
echo ""
echo "🚀 Now run: ./start-local.sh"