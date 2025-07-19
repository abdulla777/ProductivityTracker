#!/bin/bash

# Start Application with Local SQLite Database Only
# Completely local - no external dependencies

echo "🏠 Starting application with LOCAL SQLite database..."
echo "🏠 بدء التطبيق مع قاعدة بيانات SQLite المحلية..."

# Check if SQLite database exists
if [ -f "./local_productivity_tracker.db" ]; then
    echo "✅ Local SQLite database found"
    echo "✅ قاعدة بيانات SQLite المحلية موجودة"
else
    echo "📊 SQLite database will be created on first run"
    echo "📊 سيتم إنشاء قاعدة بيانات SQLite عند أول تشغيل"
fi

echo "📊 Using local database: ./local_productivity_tracker.db"
echo "📊 استخدام قاعدة البيانات المحلية: ./local_productivity_tracker.db"

# Start application with local database settings
echo "🚀 Starting application..."
echo "🚀 بدء التطبيق..."

NODE_ENV=development \
DATABASE_URL="file:./local_productivity_tracker.db" \
LOCAL_DEVELOPMENT=true \
FORCE_LOCAL_DB=true \
USE_SQLITE=true \
PORT=5000 \
SESSION_SECRET=local-development-secret \
npm run dev