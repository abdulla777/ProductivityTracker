#!/bin/bash

# Start Application with Neon Database
# تشغيل التطبيق مع قاعدة بيانات Neon

echo "🚀 بدء التطبيق مع قاعدة بيانات Neon..."
echo "🚀 Starting application with Neon database..."

# التحقق من DATABASE_URL البيئي
REAL_DATABASE_URL=$(printenv DATABASE_URL)

if [ -z "$REAL_DATABASE_URL" ]; then
    echo "❌ متغير DATABASE_URL غير موجود في البيئة"
    echo "❌ DATABASE_URL environment variable not found"
    exit 1
fi

echo "📊 استخدام قاعدة البيانات: $REAL_DATABASE_URL"
echo "📊 Using database: $REAL_DATABASE_URL"

# اختبار الاتصال
echo "🔗 اختبار الاتصال بقاعدة البيانات..."
echo "🔗 Testing database connection..."

if psql "$REAL_DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ الاتصال بقاعدة البيانات ناجح"
    echo "✅ Database connection successful"
else
    echo "❌ فشل في الاتصال بقاعدة البيانات"
    echo "❌ Database connection failed"
    exit 1
fi

# بدء التطبيق مع قاعدة بيانات Neon
echo "🚀 بدء التطبيق..."
echo "🚀 Starting application..."

NODE_ENV=development \
DATABASE_URL="$REAL_DATABASE_URL" \
PORT=5000 \
SESSION_SECRET=my-session-secret-for-development \
npm run dev