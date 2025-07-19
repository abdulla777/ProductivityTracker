#!/bin/bash

# Test login functionality after database fixes

echo "🧪 Testing Login Functionality"
echo "=============================="

# Test database connection
echo "📋 Testing database connection..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT username, role FROM users LIMIT 3;"

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Start the app in background
echo "📋 Starting application in background..."
LOCAL_DEVELOPMENT=true NODE_ENV=development npm run dev > /dev/null 2>&1 &
APP_PID=$!

# Wait for app to start
sleep 5

# Test login
echo "📋 Testing admin login..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -c test_cookies.txt

echo ""
echo "📋 Testing API endpoints..."

# Test users API
echo "Users API:"
curl -s http://localhost:5000/api/users -b test_cookies.txt | head -c 200

echo ""
echo "📋 Stopping test application..."
kill $APP_PID 2>/dev/null

echo "✅ Login test completed"