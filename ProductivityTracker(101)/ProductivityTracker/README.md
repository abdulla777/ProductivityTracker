# نظام إدارة المشاريع الهندسية | Consulting Engineers Management System

نظام شامل لإدارة شركات الاستشارات الهندسية، يتميز بإدارة المشاريع وتتبع الموظفين ومراقبة الحضور وإدارة العملاء مع دعم كامل للغتين العربية والإنجليزية.

A comprehensive management system for consulting engineering companies, featuring project management, staff tracking, attendance monitoring, and client management with full bilingual Arabic/English support.

## 🚀 التشغيل السريع | Quick Start

### الأمر الوحيد للتشغيل | One-Command Startup
```bash
./start.sh
```

أو | Or:
```bash
chmod +x start.sh && ./start.sh
```

### الوصول للنظام | System Access
- **الرابط المحلي | Local URL**: http://localhost:5000
- **المدير | Admin**: `admin` / `admin123`
- **مدير الموارد البشرية | HR Manager**: `hr_manager` / `hr123`
- **المهندس | Engineer**: `eng1` / `eng123`

## 🛠️ الإعداد المحلي | Local Setup

النظام يعمل بالكامل محلياً باستخدام قاعدة بيانات SQLite بدون الحاجة لأي اتصالات خارجية.
The system runs completely locally using SQLite database without requiring any external connections.

### المتطلبات | Requirements
- Node.js 18+ 
- npm
- لا حاجة لقاعدة بيانات خارجية | No external database required

### التثبيت اليدوي | Manual Installation
```bash
# 1. تثبيت التبعيات | Install dependencies
npm install

# 2. إنشاء قاعدة البيانات (إذا لم تكن موجودة) | Create database if not exists
node create-complete-local-db.js

# 3. تشغيل التطبيق | Start application
npm run dev
```

## ✨ المميزات | Features

### إدارة المشاريع | Project Management
- إنشاء وتعديل المشاريع | Create and edit projects
- تتبع حالة المشروع ونسبة الإنجاز | Track project status and completion
- إدارة مراحل المشروع | Manage project phases
- تحميل وإدارة ملفات المشروع | Upload and manage project files

### إدارة الموظفين | Staff Management
- إضافة وتعديل بيانات الموظفين | Add and edit staff information
- إدارة الأدوار والصلاحيات | Role and permission management
- تتبع الأداء والتقييمات | Performance tracking and evaluations

### الحضور والغياب | Attendance Management
- تسجيل الحضور والانصراف | Clock in/out registration
- تتبع التأخير والغياب | Late arrival and absence tracking
- التسجيل اليدوي للحضور | Manual attendance registration
- تقارير الحضور المفصلة | Detailed attendance reports

### إدارة الإجازات | Leave Management
- طلب الإجازات بأنواعها المختلفة | Request different types of leave
- سير عمل الموافقة على الإجازات | Leave approval workflow
- تتبع رصيد الإجازات | Leave balance tracking

### إدارة العملاء | Client Management
- قاعدة بيانات شاملة للعملاء | Comprehensive client database
- تتبع معلومات التواصل | Contact information tracking
- ربط العملاء بالمشاريع | Link clients to projects

### التقارير والإحصائيات | Reports & Analytics
- تقارير شاملة للمشاريع | Comprehensive project reports
- إحصائيات الحضور | Attendance statistics
- تقارير الأداء | Performance reports
- تصدير البيانات | Data export capabilities

## 🏗️ البنية التقنية | Technical Architecture

### الواجهة الأمامية | Frontend
- **إطار العمل**: React 18 مع TypeScript
- **التصميم**: Tailwind CSS مع مكونات shadcn/ui
- **إدارة الحالة**: React Query للبيانات من الخادم
- **التوجيه**: Wouter للتوجيه من جانب العميل
- **النماذج**: React Hook Form مع Zod للتحقق
- **التدويل**: i18next مع دعم العربية (RTL) والإنجليزية

### الخادم الخلفي | Backend
- **بيئة التشغيل**: Node.js مع Express.js
- **اللغة**: TypeScript مع وحدات ES
- **قاعدة البيانات**: SQLite مع Drizzle ORM
- **إدارة الجلسات**: جلسات Express
- **تصميم API**: نقاط REST مع معالجة أخطاء متسقة

### قاعدة البيانات | Database
- **النوع**: SQLite (محلية 100%)
- **الحجم**: ~80KB مع البيانات التجريبية
- **الجداول**: 15+ جدول لإدارة شاملة
- **العلاقات**: مفاتيح خارجية وعلاقات كاملة

## 🔐 الأمان والصلاحيات | Security & Permissions

### الأدوار | User Roles
- **المدير**: صلاحية كاملة لجميع النظام
- **مدير المشروع**: إدارة المشاريع المحددة
- **المهندس**: الوصول للملف الشخصي والمهام المسندة
- **موظف إداري**: صلاحية أساسية محدودة

### الحماية | Security Features
- تشفير كلمات المرور | Password encryption
- جلسات آمنة | Secure sessions
- التحكم في الوصول حسب الدور | Role-based access control
- التحقق من صحة البيانات | Data validation

## 📂 هيكل المشروع | Project Structure

```
├── client/          # الواجهة الأمامية | Frontend
├── server/          # الخادم الخلفي | Backend
├── shared/          # المخططات المشتركة | Shared schemas
├── public/          # الملفات العامة | Public assets
├── start.sh         # أمر التشغيل | Startup script
└── local_productivity_tracker.db  # قاعدة البيانات | Database
```

## 🗄️ البيانات التجريبية | Sample Data

النظام يأتي مع بيانات تجريبية جاهزة:
The system comes with ready sample data:

- **4 مستخدمين** | 4 Users (admin, hr_manager, eng1, pm1)
- **3 عملاء** | 3 Clients
- **4 مشاريع** | 4 Projects  
- **3 سجلات حضور** | 3 Attendance records
- **2 طلب إجازة** | 2 Leave requests

## 🆘 الدعم والمساعدة | Support & Help

### مشاكل شائعة | Common Issues

**1. خطأ في تشغيل الخادم**
```bash
# التحقق من Node.js
node --version  # يجب أن يكون 18+

# إعادة تثبيت التبعيات
rm -rf node_modules
npm install
```

**2. قاعدة البيانات لا تعمل**
```bash
# إعادة إنشاء قاعدة البيانات
rm local_productivity_tracker.db
node create-complete-local-db.js
```

**3. مشكلة في تسجيل الدخول**
- تأكد من البيانات: `admin` / `admin123`
- امسح ملفات تعريف الارتباط في المتصفح

## 📝 الترخيص | License

هذا المشروع مُرخص تحت رخصة MIT
This project is licensed under the MIT License

## 🤝 المساهمة | Contributing

نرحب بالمساهمات! يرجى إنشاء pull request أو فتح issue للمناقشة.
Contributions are welcome! Please create a pull request or open an issue for discussion.

---

**تم التطوير بواسطة**: فريق تطوير نظام إدارة المشاريع الهندسية
**Developed by**: Consulting Engineers Management System Team

**تاريخ آخر تحديث**: 16 يوليو 2025
**Last Updated**: July 16, 2025