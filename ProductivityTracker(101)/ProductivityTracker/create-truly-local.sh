#!/bin/bash

# Create Truly Local Environment (No Internet Required)
# إنشاء بيئة محلية كاملة (بدون إنترنت)

echo "🔧 إنشاء بيئة محلية كاملة..."
echo "🔧 Creating truly local environment..."

# تثبيت PostgreSQL إذا لم يكن مثبت
if ! command -v psql >/dev/null 2>&1; then
    echo "📦 تثبيت PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# إعداد مستخدم PostgreSQL
echo "👤 إعداد مستخدم PostgreSQL..."
sudo -u postgres psql << EOF
-- إنشاء مستخدم جديد
DROP USER IF EXISTS localuser;
CREATE USER localuser WITH PASSWORD 'localpass';

-- إنشاء قاعدة البيانات
DROP DATABASE IF EXISTS productivity_tracker_local;
CREATE DATABASE productivity_tracker_local OWNER localuser;

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE productivity_tracker_local TO localuser;
EOF

# إنشاء الجداول والبيانات
echo "📊 إنشاء الجداول..."
PGPASSWORD=localpass psql -h localhost -U localuser -d productivity_tracker_local << 'EOF'

-- إنشاء أنواع البيانات
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
CREATE TABLE users (
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
CREATE TABLE clients (
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
CREATE TABLE projects (
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
CREATE TABLE project_phases (
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
CREATE TABLE project_files (
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

-- باقي الجداول...
CREATE TABLE project_staff (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
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

CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  clock_in_time TEXT,
  clock_out_time TEXT,
  notes TEXT DEFAULT '',
  is_late BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
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

CREATE TABLE notifications (
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

CREATE TABLE residence_renewals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  old_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  renewal_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  processed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE residence_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notification_type VARCHAR(20) NOT NULL,
  sent_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  days_until_expiry INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_evaluations (
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

-- إدراج البيانات الأساسية
INSERT INTO users (username, password, full_name, email, role, nationality, residence_expiry_date) VALUES
('admin', 'admin123', 'مدير النظام المحلي', 'admin@local.com', 'admin', 'saudi', '2025-12-31'),
('hr_manager', 'hr123', 'مدير الموارد البشرية المحلي', 'hr@local.com', 'hr_manager', 'saudi', '2025-12-31'),
('engineer', 'eng123', 'المهندس المحلي', 'engineer@local.com', 'engineer', 'resident', '2025-12-31');

INSERT INTO clients (name, contact_person, email, phone, city) VALUES
('شركة التطوير المحلي', 'أحمد محمد', 'ahmed@local-dev.com', '+966501111111', 'الرياض'),
('مؤسسة البناء المحلي', 'فاطمة أحمد', 'fatima@local-build.com', '+966502222222', 'جدة'),
('مكتب الهندسة المحلي', 'محمد علي', 'mohammed@local-eng.com', '+966503333333', 'الدمام');

INSERT INTO projects (title, description, client_id, location, status, priority, start_date, target_end_date, completion_percentage, budget, created_by) VALUES
('مشروع محلي تجريبي 1', 'أول مشروع في البيئة المحلية', 1, 'الرياض', 'new', 'high', '2025-01-01', '2025-12-31', 0, 500000.00, 1),
('مشروع محلي تجريبي 2', 'ثاني مشروع في البيئة المحلية', 2, 'جدة', 'in_progress', 'medium', '2025-02-01', '2025-11-30', 25, 750000.00, 1),
('مشروع محلي تجريبي 3', 'ثالث مشروع في البيئة المحلية', 3, 'الدمام', 'new', 'low', '2025-03-01', '2025-10-31', 0, 300000.00, 1);

SELECT 'البيانات المحلية تم إنشاؤها بنجاح!' as status;
EOF

# إنشاء ملف .env محلي
echo "📝 إنشاء ملف .env محلي..."
cat > .env.local << 'EOF'
# Local Database Configuration (Completely Local)
DATABASE_URL=postgresql://localuser:localpass@localhost:5432/productivity_tracker_local
PGHOST=localhost
PGPORT=5432
PGDATABASE=productivity_tracker_local
PGUSER=localuser
PGPASSWORD=localpass

# Application Configuration
NODE_ENV=development
PORT=5001
SESSION_SECRET=my-super-secret-local-session-key

# Local Development Settings
LOCAL_DEVELOPMENT=true
FORCE_LOCAL_DB=true
DISABLE_WEBSOCKETS=true

# Optional: Development debugging
DEBUG=false
EOF

# إنشاء ملف التشغيل المحلي
echo "🚀 إنشاء ملف التشغيل المحلي..."
cat > start-truly-local.sh << 'EOF'
#!/bin/bash

echo "🏠 بدء البيئة المحلية الكاملة..."
echo "🏠 Starting truly local environment..."

# تحميل المتغيرات المحلية
export $(grep -v '^#' .env.local | grep -v '^$' | xargs)

echo "📊 قاعدة البيانات المحلية: $DATABASE_URL"
echo "🌐 المنفذ المحلي: $PORT"

# اختبار الاتصال
if PGPASSWORD=localpass psql -h localhost -U localuser -d productivity_tracker_local -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ قاعدة البيانات المحلية متصلة"
else
    echo "❌ فشل الاتصال بقاعدة البيانات المحلية"
    exit 1
fi

# بدء التطبيق
NODE_ENV=development \
DATABASE_URL="postgresql://localuser:localpass@localhost:5432/productivity_tracker_local" \
FORCE_LOCAL_DB=true \
PORT=5001 \
SESSION_SECRET=my-super-secret-local-session-key \
npm run dev
EOF

chmod +x start-truly-local.sh

echo "✅ تم إنشاء البيئة المحلية الكاملة!"
echo "✅ Truly local environment created!"
echo ""
echo "🎯 بيانات تسجيل الدخول المحلية:"
echo "🎯 Local login credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "🚀 لتشغيل البيئة المحلية الكاملة:"
echo "🚀 To start truly local environment:"
echo "./start-truly-local.sh"
echo ""
echo "🌐 التطبيق سيعمل على:"
echo "🌐 Application will run on:"
echo "http://localhost:5001"