#!/bin/bash

# Fix Local PostgreSQL Authentication Issue
# إصلاح مشكلة مصادقة PostgreSQL المحلي

echo "🔧 إصلاح مشكلة PostgreSQL المحلي..."
echo "🔧 Fixing local PostgreSQL authentication..."

# إعداد كلمة مرور postgres
echo "🔑 إعداد كلمة مرور المستخدم postgres..."
sudo -u postgres psql << 'EOF'
ALTER USER postgres PASSWORD 'postgres';
\q
EOF

# إنشاء قاعدة البيانات إذا لم تكن موجودة
echo "📊 إنشاء قاعدة البيانات..."
sudo -u postgres createdb productivity_tracker 2>/dev/null || echo "قاعدة البيانات موجودة مسبقاً"

# منح الصلاحيات
echo "🔐 منح الصلاحيات..."
sudo -u postgres psql -d productivity_tracker << 'EOF'
GRANT ALL PRIVILEGES ON DATABASE productivity_tracker TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;
\q
EOF

# اختبار الاتصال
echo "🔗 اختبار الاتصال..."
if PGPASSWORD=postgres psql -h localhost -U postgres -d productivity_tracker -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ نجح الاتصال بقاعدة البيانات"
    echo "✅ Database connection successful"
else
    echo "❌ فشل الاتصال بقاعدة البيانات"
    echo "❌ Database connection failed"
    exit 1
fi

echo "🎉 تم إصلاح PostgreSQL المحلي بنجاح!"
echo "🎉 Local PostgreSQL fixed successfully!"
echo ""
echo "📋 معلومات الاتصال:"
echo "📋 Connection details:"
echo "Host: localhost"
echo "Port: 5432"
echo "Database: productivity_tracker"
echo "Username: postgres"
echo "Password: postgres"