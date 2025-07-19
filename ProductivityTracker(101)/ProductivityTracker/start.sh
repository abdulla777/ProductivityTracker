#!/bin/bash

# نظام إدارة المشاريع الهندسية - أمر التشغيل المحلي
# Consulting Engineers Management System - Local Startup Script

echo "🚀 بدء تشغيل نظام إدارة المشاريع الهندسية..."
echo "Starting Consulting Engineers Management System..."

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js أولاً"
    echo "❌ Node.js not installed. Please install Node.js first"
    exit 1
fi

# التحقق من وجود npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير متوفر. يرجى تثبيت npm أولاً"
    echo "❌ npm not available. Please install npm first"
    exit 1
fi

# التحقق من وجود قاعدة البيانات المحلية
if [ ! -f "local_productivity_tracker.db" ]; then
    echo "⚠️  قاعدة البيانات المحلية غير موجودة، سيتم إنشاؤها تلقائياً..."
    echo "⚠️  Local database not found, will be created automatically..."
    
    if [ -f "create-complete-local-db.js" ]; then
        echo "📊 إنشاء قاعدة البيانات المحلية..."
        node create-complete-local-db.js
    else
        echo "❌ ملف إنشاء قاعدة البيانات غير موجود"
        echo "❌ Database creation script not found"
        exit 1
    fi
fi

# تشغيل التطبيق
echo "🌐 تشغيل الخادم المحلي..."
echo "🌐 Starting local server..."
echo ""
echo "✅ يمكنك الوصول للتطبيق على: http://localhost:5000"
echo "✅ Access the application at: http://localhost:5000"
echo ""
echo "👤 بيانات الدخول الافتراضية:"
echo "👤 Default login credentials:"
echo "   المدير / Admin: admin / admin123"
echo "   مدير الموارد البشرية / HR Manager: hr_manager / hr123"
echo "   المهندس / Engineer: eng1 / eng123"
echo ""
echo "⏹️  لإيقاف التطبيق اضغط Ctrl+C"
echo "⏹️  To stop the application press Ctrl+C"
echo ""

# تشغيل npm run dev
npm run dev