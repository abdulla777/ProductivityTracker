#!/bin/bash

# Start Application with Local Database (Fixed for Replit)
# تشغيل التطبيق مع قاعدة البيانات المحلية (محدث لـ Replit)

echo "🚀 بدء التطبيق مع قاعدة البيانات المحلية..."
echo "🚀 Starting application with local database..."

# اختبار الاتصال مع المستخدم الصحيح
echo "🔗 اختبار الاتصال بقاعدة البيانات..."
if sudo -u neondb_owner psql -d productivity_tracker -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ الاتصال بقاعدة البيانات المحلية ناجح"
    echo "✅ Local database connection successful"
else
    echo "❌ فشل في الاتصال بقاعدة البيانات المحلية"
    echo "❌ Local database connection failed"
    exit 1
fi

echo "📊 استخدام قاعدة البيانات المحلية: productivity_tracker"
echo "📊 Using local database: productivity_tracker"

# بدء التطبيق مع الإعدادات المحلية
NODE_ENV=development \
DATABASE_URL="postgresql://neondb_owner@localhost:5432/productivity_tracker" \
LOCAL_DEVELOPMENT=true \
FORCE_LOCAL_DB=true \
PORT=5000 \
SESSION_SECRET=my-local-session-secret \
npm run dev