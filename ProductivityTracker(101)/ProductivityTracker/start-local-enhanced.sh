#!/bin/bash

# Enhanced Local Startup Script with Error Handling
# This ensures PostgreSQL is ready before starting the application

echo "🚀 Starting Consulting Engineers Management System (Enhanced Local)"
echo "================================================================="

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | xargs)
    echo "✅ Environment loaded from .env.local"
else
    echo "⚠️  Creating .env.local..."
    cat > .env.local << EOF
NODE_ENV=development
LOCAL_DEVELOPMENT=true
DATABASE_URL=postgresql://postgres:password@localhost:5432/consulting_engineers
PORT=5000
SESSION_SECRET=consulting-engineers-local-secret-key-2025
EOF
    export $(cat .env.local | xargs)
fi

echo "Environment: LOCAL_DEVELOPMENT=$LOCAL_DEVELOPMENT"
echo "Database: $DATABASE_URL"
echo "Port: $PORT"
echo ""

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "📋 PostgreSQL not running. Starting..."
    sudo systemctl start postgresql
    sleep 3
fi

# Test database connection
echo "📋 Testing database connection..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT 'Connection OK' as status;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed!"
    echo ""
    echo "🔧 Try running the fix script first:"
    echo "   chmod +x fix-local-setup.sh && ./fix-local-setup.sh"
    echo ""
    exit 1
fi

echo "✅ Database connection successful"

# Check if users table exists
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Database schema missing!"
    echo "🔧 Running schema creation..."
    ./fix-local-setup.sh
fi

# Check for common database issues and fix if needed
echo "🔧 Checking database integrity..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'notes';" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Database integrity issues detected. Running full repair..."
    ./fix-local-database.sh
    return 0
fi

# Check for other missing columns
MISSING_COLUMNS=0
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'title';" > /dev/null 2>&1 || MISSING_COLUMNS=1
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'is_late';" > /dev/null 2>&1 || MISSING_COLUMNS=1
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at';" > /dev/null 2>&1 || MISSING_COLUMNS=1

if [ $MISSING_COLUMNS -eq 1 ]; then
    echo "❌ Missing database columns detected. Running full repair..."
    ./fix-local-database.sh
    return 0
fi

echo "✅ Database schema verified"
echo ""

# Start the application
echo "📋 Starting application..."
echo "🌐 Application will be available at: http://localhost:5000"
echo "👤 Login: admin / admin123"
echo ""

npm run dev