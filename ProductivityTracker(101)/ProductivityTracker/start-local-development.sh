#!/bin/bash

# Start Local Development with Environment Variables
# بدء التطوير المحلي مع متغيرات البيئة

echo "🚀 بدء التطوير المحلي للتطبيق..."
echo "🚀 Starting local development with environment variables..."

# تحديد مسار ملف .env
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ملف .env غير موجود، يتم إنشاؤه..."
    echo "❌ .env file not found, creating it..."
    
    cat > .env << 'EOF'
# Database Configuration (Local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/productivity_tracker
PGHOST=localhost
PGPORT=5432
PGDATABASE=productivity_tracker
PGUSER=postgres
PGPASSWORD=postgres

# Application Configuration
NODE_ENV=development
PORT=5000
SESSION_SECRET=my-local-session-secret-for-development

# Local Development Settings
LOCAL_DEVELOPMENT=true
FORCE_LOCAL_DB=true
DISABLE_WEBSOCKETS=true
REPLIT_DOMAINS=

# Optional: Development debugging
DEBUG=false
EOF
    echo "✅ ملف .env تم إنشاؤه"
    echo "✅ .env file created"
fi

# تحميل متغيرات البيئة من ملف .env
echo "📋 تحميل متغيرات البيئة..."
echo "📋 Loading environment variables..."

export $(grep -v '^#' .env | grep -v '^$' | xargs)

# التحقق من متغيرات البيئة المطلوبة
echo "🔍 التحقق من متغيرات البيئة:"
echo "🔍 Checking environment variables:"
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"
echo "LOCAL_DEVELOPMENT: $LOCAL_DEVELOPMENT"
echo "FORCE_LOCAL_DB: $FORCE_LOCAL_DB"

# اختبار الاتصال بقاعدة البيانات
echo "🔗 اختبار الاتصال بقاعدة البيانات..."
echo "🔗 Testing database connection..."

if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ الاتصال بقاعدة البيانات ناجح"
    echo "✅ Database connection successful"
else
    echo "❌ فشل في الاتصال بقاعدة البيانات"
    echo "❌ Database connection failed"
    echo "تحقق من DATABASE_URL: $DATABASE_URL"
    echo "Check DATABASE_URL: $DATABASE_URL"
    exit 1
fi

# بدء التطبيق مع متغيرات البيئة
echo "🚀 بدء التطبيق..."
echo "🚀 Starting application..."

# تشغيل التطبيق مع متغيرات البيئة الحالية (استخدام قاعدة البيانات الموجودة)
echo "📊 استخدام قاعدة البيانات الموجودة في: $DATABASE_URL"
echo "📊 Using existing database at: $DATABASE_URL"

# تشغيل التطبيق مع متغيرات البيئة
NODE_ENV=development \
FORCE_LOCAL_DB=false \
PORT=5000 \
SESSION_SECRET=my-local-session-secret-for-development \
npm run dev