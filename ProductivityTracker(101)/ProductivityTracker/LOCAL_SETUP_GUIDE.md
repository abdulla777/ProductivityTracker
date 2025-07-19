# دليل الإعداد المحلي - نظام إدارة المهندسين الاستشاريين

## المشكلة الحالية
يبدو أن جدول `users` غير موجود في قاعدة البيانات المحلية.

## الحل السريع

### الخطوة 1: تشغيل سكريبت الإصلاح
```bash
chmod +x fix-local-setup.sh
./fix-local-setup.sh
```

### الخطوة 2: تشغيل النظام
```bash
chmod +x start-local-enhanced.sh
./start-local-enhanced.sh
```

## ما يفعله سكريبت الإصلاح:

1. ✅ **فحص PostgreSQL**: يتأكد من تشغيل PostgreSQL
2. ✅ **إنشاء قاعدة البيانات**: ينشئ `consulting_engineers` إذا لم تكن موجودة
3. ✅ **إنشاء المستخدم**: ينشئ مستخدم `postgres` بكلمة مرور `password`
4. ✅ **إنشاء المخطط الكامل**: ينشئ جميع الجداول المطلوبة
5. ✅ **إدراج البيانات**: يضيف المستخدمين والبيانات الأساسية

## المستخدمين الجاهزين:

| اسم المستخدم | كلمة المرور | الدور | الجنسية |
|-------------|------------|-------|---------|
| admin | admin123 | مدير عام | سعودي |
| hr_manager | hr123 | مدير موارد بشرية | سعودي |
| resident1 | password123 | مهندس | مقيم |
| resident2 | password123 | مهندس | مقيم |

## الجداول المُنشأة:

- ✅ `users` - المستخدمين مع حقول الإقامة
- ✅ `clients` - العملاء
- ✅ `projects` - المشاريع
- ✅ `tasks` - المهام
- ✅ `notifications` - الإشعارات
- ✅ `attendance` - الحضور
- ✅ `leave_requests` - طلبات الإجازة
- ✅ `residence_renewals` - تجديدات الإقامة
- ✅ `residence_notifications` - إشعارات الإقامة
- ✅ وجداول أخرى...

## نظام إدارة الإقامات:

- ✅ **تتبع الجنسية**: سعودي/مقيم
- ✅ **أرقام الإقامة**: للمقيمين فقط
- ✅ **تواريخ الانتهاء**: مع تحذيرات تلقائية
- ✅ **إشعارات مُبرمجة**: 3 أشهر، شهر، أسبوع، يومي قبل الانتهاء
- ✅ **تجديد الإقامات**: واجهة مديري الموارد البشرية
- ✅ **تتبع التجديدات**: حفظ تاريخ جميع التجديدات

## استكشاف الأخطاء:

### إذا فشل الاتصال:
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### إذا لم يوجد المستخدم:
```bash
sudo -u postgres createuser -s postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
```

### للتحقق من الجداول:
```bash
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "\dt"
```

### لعرض المستخدمين:
```bash
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT username, role FROM users;"
```

## بعد الإعداد:

1. 🌐 **الوصول**: http://localhost:5000
2. 👤 **تسجيل الدخول**: admin / admin123
3. 🏠 **إدارة الإقامات**: متوفرة في القائمة الجانبية
4. 👥 **إضافة موظفين**: مع اختيار الجنسية وحقول الإقامة
5. 📅 **تتبع التواريخ**: إشعارات تلقائية للإقامات منتهية الصلاحية

## الملفات المهمة:

- `create-full-schema.sql` - مخطط قاعدة البيانات الكامل
- `fix-local-setup.sh` - سكريبت الإصلاح السريع
- `start-local-enhanced.sh` - سكريبت التشغيل المحسن
- `.env.local` - متغيرات البيئة المحلية