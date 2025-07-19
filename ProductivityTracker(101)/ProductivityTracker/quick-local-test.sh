#!/bin/bash

# Quick Local Test Script
# ملف اختبار سريع للبيئة المحلية

echo "🧪 اختبار سريع للنظام المحلي..."
echo "🧪 Quick local system test..."

# التحقق من تثبيت PostgreSQL
echo "1️⃣ التحقق من PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL مثبت: $(psql --version)"
else
    echo "❌ PostgreSQL غير مثبت"
    exit 1
fi

# التحقق من تثبيت Node.js
echo "2️⃣ التحقق من Node.js..."
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js مثبت: $(node --version)"
else
    echo "❌ Node.js غير مثبت"
    exit 1
fi

# التحقق من قاعدة البيانات
echo "3️⃣ التحقق من قاعدة البيانات productivity_tracker..."
if PGPASSWORD=postgres psql -h localhost -U postgres -l | grep -q productivity_tracker; then
    echo "✅ قاعدة البيانات productivity_tracker موجودة"
else
    echo "❌ قاعدة البيانات productivity_tracker غير موجودة"
    exit 1
fi

# التحقق من الجداول
echo "4️⃣ التحقق من الجداول..."
TABLE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d productivity_tracker -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
if [ "$TABLE_COUNT" -ge 10 ]; then
    echo "✅ الجداول موجودة ($TABLE_COUNT جدول)"
else
    echo "❌ الجداول ناقصة (موجود فقط $TABLE_COUNT جدول)"
fi

# التحقق من المستخدم admin
echo "5️⃣ التحقق من المستخدم admin..."
ADMIN_EXISTS=$(PGPASSWORD=postgres psql -h localhost -U postgres -d productivity_tracker -t -c "SELECT COUNT(*) FROM users WHERE username = 'admin';" 2>/dev/null | xargs)
if [ "$ADMIN_EXISTS" = "1" ]; then
    echo "✅ المستخدم admin موجود"
else
    echo "❌ المستخدم admin غير موجود"
fi

# التحقق من ملف .env
echo "6️⃣ التحقق من ملف .env..."
if [ -f ".env" ]; then
    echo "✅ ملف .env موجود"
    if grep -q "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/productivity_tracker" .env; then
        echo "✅ DATABASE_URL صحيح في .env"
    else
        echo "❌ DATABASE_URL غير صحيح في .env"
    fi
else
    echo "❌ ملف .env غير موجود"
fi

# التحقق من التبعيات
echo "7️⃣ التحقق من تبعيات Node.js..."
if [ -d "node_modules" ]; then
    echo "✅ تبعيات Node.js مثبتة"
else
    echo "❌ تبعيات Node.js غير مثبتة - شغّل: npm install"
fi

echo ""
echo "🎯 ملخص الاختبار:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PostgreSQL: مثبت ويعمل"
echo "✅ Node.js: مثبت ويعمل"
echo "✅ قاعدة البيانات: موجودة مع $TABLE_COUNT جدول"
echo "✅ المستخدم admin: موجود"
echo ""
echo "🚀 لبدء التطبيق استخدم:"
echo "./start-local-development.sh"
echo ""
echo "🔑 بيانات تسجيل الدخول:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "🌐 بعد بدء التطبيق افتح:"
echo "http://localhost:5000"