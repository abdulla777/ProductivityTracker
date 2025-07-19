#!/bin/bash

# Start Application with Local PostgreSQL Only
# No external databases - completely local setup

echo "🏠 Starting application with LOCAL PostgreSQL only..."
echo "🏠 بدء التطبيق مع PostgreSQL المحلي فقط..."

# Check if PostgreSQL is running
if ! pg_ctl status -D /tmp/postgres_data >/dev/null 2>&1; then
    echo "🔄 Starting local PostgreSQL server..."
    echo "🔄 بدء خادم PostgreSQL المحلي..."
    
    # Start PostgreSQL if not running
    pg_ctl -D /tmp/postgres_data -l /tmp/postgres.log start -w >/dev/null 2>&1
    sleep 2
fi

# Test database connection
echo "🔗 Testing local database connection..."
echo "🔗 اختبار الاتصال بقاعدة البيانات المحلية..."

if psql -h /tmp/postgres_socket -p 5433 -d productivity_tracker -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Local PostgreSQL connection successful"
    echo "✅ الاتصال بـ PostgreSQL المحلي ناجح"
else
    echo "❌ Local PostgreSQL connection failed"
    echo "❌ فشل الاتصال بـ PostgreSQL المحلي"
    exit 1
fi

echo "📊 Using local database: /tmp/postgres_socket:5433/productivity_tracker"
echo "📊 استخدام قاعدة البيانات المحلية: /tmp/postgres_socket:5433/productivity_tracker"

# Start application with local database settings
echo "🚀 Starting application..."
echo "🚀 بدء التطبيق..."

NODE_ENV=development \
DATABASE_URL="postgresql://runner@/tmp/postgres_socket:5433/productivity_tracker" \
LOCAL_DEVELOPMENT=true \
FORCE_LOCAL_DB=true \
PORT=5000 \
SESSION_SECRET=local-development-secret \
npm run dev