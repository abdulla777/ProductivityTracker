#!/bin/bash

# Consulting Engineers Management System - Complete Local Setup
# نظام إدارة مكتب الاستشارات الهندسية - الإعداد المحلي الكامل

echo "🚀 بدء الإعداد المحلي الكامل لنظام إدارة الاستشارات الهندسية..."
echo "🚀 Starting complete local setup for Consulting Engineers Management System..."

# التحقق من صلاحيات المدير
if [[ $EUID -ne 0 ]]; then
   echo "❌ يرجى تشغيل هذا الملف كمدير (sudo)"
   echo "❌ Please run this script as root (sudo)"
   exit 1
fi

# تحديث النظام
echo "📦 تحديث قوائم الحزم..."
apt update -y

# تثبيت PostgreSQL
echo "🐘 تثبيت PostgreSQL..."
apt install -y postgresql postgresql-contrib

# بدء خدمة PostgreSQL
echo "▶️ بدء خدمة PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# تثبيت Node.js و npm
echo "📦 تثبيت Node.js و npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# التحقق من الإصدارات
echo "✅ التحقق من الإصدارات المثبتة:"
node --version
npm --version
psql --version

# إنشاء قاعدة البيانات والمستخدم
echo "🔧 إعداد قاعدة البيانات..."
sudo -u postgres createdb productivity_tracker 2>/dev/null || echo "قاعدة البيانات موجودة بالفعل"

# إنشاء الجداول والبيانات
echo "📊 إنشاء الجداول والبيانات الأولية..."
sudo -u postgres psql productivity_tracker << 'EOF'

-- إنشاء أنواع البيانات المطلوبة
CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'engineer', 'admin_staff', 'general_manager', 'hr_manager');
CREATE TYPE project_status AS ENUM ('new', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE phase_type AS ENUM ('architectural_design', 'structural_design', 'mep_design', 'official_approval', 'execution_supervision');
CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'completed', 'on_hold');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'maternity', 'paternity', 'other');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE residence_status AS ENUM ('active', 'expired', 'renewed');

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'engineer',
  is_active BOOLEAN DEFAULT true,
  nationality VARCHAR(50) DEFAULT 'saudi',
  residence_number VARCHAR(50),
  residence_expiry_date DATE,
  residence_status residence_status DEFAULT 'active',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول العملاء
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  client_id INTEGER REFERENCES clients(id),
  location VARCHAR(255),
  status project_status DEFAULT 'new',
  priority project_priority DEFAULT 'medium',
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  completion_percentage REAL DEFAULT 0,
  budget DECIMAL(15,2),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول مراحل المشاريع
CREATE TABLE IF NOT EXISTS project_phases (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase phase_type NOT NULL,
  description TEXT,
  status phase_status DEFAULT 'not_started',
  start_date DATE,
  end_date DATE,
  completion_percentage REAL DEFAULT 0,
  remarks TEXT
);

-- جدول ملفات المشاريع
CREATE TABLE IF NOT EXISTS project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id INTEGER REFERENCES project_phases(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_description TEXT,
  file_type TEXT,
  file_url TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- باقي الجداول
CREATE TABLE IF NOT EXISTS project_staff (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  assigned_to INTEGER REFERENCES users(id),
  assigned_by INTEGER REFERENCES users(id),
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  clock_in_time TEXT,
  clock_out_time TEXT,
  notes TEXT DEFAULT '',
  is_late BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP WITHOUT TIME ZONE,
  employee_notes TEXT,
  admin_notes TEXT,
  last_modified_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  priority VARCHAR(20) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS residence_renewals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  old_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  renewal_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  processed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS residence_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notification_type VARCHAR(20) NOT NULL,
  sent_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  days_until_expiry INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_evaluations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  evaluator_id INTEGER NOT NULL REFERENCES users(id),
  evaluation_period VARCHAR(50),
  performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 10),
  comments TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدراج البيانات الأساسية إذا لم تكن موجودة
INSERT INTO users (username, password, full_name, email, role, nationality, residence_expiry_date) 
SELECT 'admin', 'admin123', 'مدير النظام', 'admin@innovators.com', 'admin', 'saudi', '2025-08-20'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, password, full_name, email, role, nationality, residence_expiry_date) 
SELECT 'hr_manager', 'hr123', 'مدير الموارد البشرية', 'hr@innovators.com', 'hr_manager', 'saudi', '2025-09-15'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'hr_manager');

INSERT INTO users (username, password, full_name, email, role, nationality, residence_expiry_date) 
SELECT 'eng1', 'eng123', 'المهندس أحمد', 'ahmad@innovators.com', 'engineer', 'resident', '2025-12-30'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'eng1');

INSERT INTO clients (name, contact_person, email, phone, city) 
SELECT 'شركة الخليج للمقاولات', 'أحمد المطيري', 'contact@gulf-contracting.com', '+966501234567', 'الرياض'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'شركة الخليج للمقاولات');

INSERT INTO clients (name, contact_person, email, phone, city) 
SELECT 'شركة البناء الحديث', 'فاطمة العتيبي', 'info@modern-construction.com', '+966507654321', 'جدة'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'شركة البناء الحديث');

INSERT INTO clients (name, contact_person, email, phone, city) 
SELECT 'مؤسسة النهضة العقارية', 'محمد الأحمد', 'projects@nahda-real-estate.com', '+966551234567', 'الدمام'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'مؤسسة النهضة العقارية');

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

SELECT 'Database setup completed successfully!' as status;
EOF

# إنشاء ملف .env للبيئة المحلية
echo "🔧 إنشاء ملف .env للبيئة المحلية..."
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

# تثبيت التبعيات
echo "📦 تثبيت تبعيات Node.js..."
npm install

echo "✅ تم الإعداد بنجاح!"
echo "✅ Setup completed successfully!"
echo ""
echo "🎯 بيانات تسجيل الدخول:"
echo "🎯 Login credentials:"
echo "المدير / Admin: admin / admin123"
echo "مدير الموارد البشرية / HR Manager: hr_manager / hr123"
echo "المهندس / Engineer: eng1 / eng123"
echo ""
echo "🚀 لتشغيل التطبيق:"
echo "🚀 To start the application:"
echo "npm run dev"
echo ""
echo "🌐 ثم افتح المتصفح على:"
echo "🌐 Then open browser at:"
echo "http://localhost:5000"