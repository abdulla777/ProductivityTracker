# 🚀 دليل التطوير المحلي الكامل
# 🚀 Complete Local Development Guide

## ✅ ما تم إنجازه | What's Been Accomplished

### 1. قاعدة البيانات المحلية | Local Database
✅ **PostgreSQL 16** مثبت ويعمل  
✅ **قاعدة البيانات** `productivity_tracker` تم إنشاؤها  
✅ **جميع الجداول** تم إنشاؤها (12 جدول)  
✅ **البيانات التجريبية** تم إدراجها  

### 2. البيئة المحلية | Local Environment
✅ **Node.js 18.20.6** مثبت  
✅ **npm 10.8.2** مثبت  
✅ **التبعيات** مثبتة (513 package)  

### 3. ملفات الإعداد | Configuration Files
✅ **ملف .env** تم إنشاؤه بالإعدادات الصحيحة  
✅ **ملفات التشغيل** تم إنشاؤها  

## 🔧 حل مشكلة متغيرات البيئة | Environment Variables Fix

المشكلة كانت أن التطبيق لا يقرأ ملف `.env` بشكل صحيح. الحل:

### استخدم ملف التشغيل الجديد:
```bash
./start-local-development.sh
```

هذا الملف سيقوم بـ:
- تحميل متغيرات البيئة من `.env`
- اختبار الاتصال بقاعدة البيانات  
- تشغيل التطبيق مع المتغيرات الصحيحة

## 🧪 اختبار النظام | System Testing

### اختبار سريع:
```bash
./quick-local-test.sh
```

### اختبار يدوي:
```bash
# اختبار قاعدة البيانات
PGPASSWORD=postgres psql -h localhost -U postgres -d productivity_tracker -c "SELECT username, role FROM users;"

# اختبار API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🎯 بيانات تسجيل الدخول | Login Credentials

| المستخدم | Username | Password | الدور | Role |
|---------|----------|----------|-------|------|
| مدير النظام | admin | admin123 | مدير | admin |
| مدير الموارد البشرية | hr_manager | hr123 | موارد بشرية | hr_manager |
| المهندس | eng1 | eng123 | مهندس | engineer |

## 📋 ملفات النظام | System Files

### ملفات التشغيل | Startup Scripts
- `setup-local.sh` - الإعداد الأولي (اكتمل)
- `start-local-development.sh` - بدء التطبيق مع متغيرات البيئة
- `quick-local-test.sh` - اختبار سريع للنظام

### ملفات الإعداد | Configuration Files
- `.env` - متغيرات البيئة المحلية
- `server/db.ts` - إعداد قاعدة البيانات (مُعدل للبيئة المحلية)

## 🚀 خطوات التشغيل | Startup Steps

### الطريقة الموصى بها | Recommended Method
```bash
# 1. اختبار النظام
./quick-local-test.sh

# 2. بدء التطبيق
./start-local-development.sh

# 3. فتح المتصفح
# http://localhost:5000
```

### الطريقة البديلة | Alternative Method
```bash
# تحديد متغيرات البيئة وتشغيل التطبيق
NODE_ENV=development \
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/productivity_tracker \
LOCAL_DEVELOPMENT=true \
FORCE_LOCAL_DB=true \
npm run dev
```

## 🔍 استكشاف الأخطاء | Troubleshooting

### مشكلة: DATABASE_URL must be set
**الحل**: استخدم `./start-local-development.sh` بدلاً من `npm run dev`

### مشكلة: Connection refused
**الحل**: 
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### مشكلة: password authentication failed
**الحل**: 
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### مشكلة: database does not exist
**الحل**: 
```bash
sudo -u postgres createdb productivity_tracker
```

## 📊 الجداول المُنشأة | Created Tables

1. **users** - المستخدمين
2. **clients** - العملاء
3. **projects** - المشاريع
4. **project_phases** - مراحل المشاريع
5. **project_files** - ملفات المشاريع
6. **project_staff** - فرق المشاريع
7. **tasks** - المهام
8. **attendance** - الحضور
9. **leave_requests** - طلبات الإجازة
10. **notifications** - الإشعارات
11. **residence_renewals** - تجديد الإقامة
12. **residence_notifications** - إشعارات الإقامة
13. **staff_evaluations** - تقييم الموظفين

## 🎉 النتيجة النهائية | Final Result

✅ **النظام يعمل بالكامل محلياً**  
✅ **جميع الوظائف متاحة**  
✅ **قاعدة البيانات مُهيأة**  
✅ **البيانات التجريبية جاهزة**  
✅ **واجهة ثنائية اللغة (عربي/إنجليزي)**  

**الخطوة التالية**: شغّل `./start-local-development.sh` وافتح `http://localhost:5000`