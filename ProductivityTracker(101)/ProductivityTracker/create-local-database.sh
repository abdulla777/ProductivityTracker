#!/bin/bash

# إنشاء قاعدة البيانات المحلية مع جميع الجداول والبيانات
# Create local database with all tables and data

echo "🚀 بدء إنشاء قاعدة البيانات المحلية..."
echo "🚀 Starting local database creation..."

# إنشاء قاعدة البيانات
echo "📊 إنشاء قاعدة البيانات productivity_tracker..."
sudo -u postgres createdb productivity_tracker

# تطبيق الجداول والبيانات
echo "🔧 إنشاء الجداول والبيانات..."
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

-- جدول فريق المشاريع
CREATE TABLE project_staff (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المهام
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

-- جدول الحضور
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

-- جدول طلبات الإجازة
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

-- جدول الإشعارات
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

-- جدول تجديد الإقامة
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

-- جدول إشعارات الإقامة
CREATE TABLE residence_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notification_type VARCHAR(20) NOT NULL,
  sent_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  days_until_expiry INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول تقييم الموظفين
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

-- إنشاء الفهارس
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_phase_id ON project_files(phase_id);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX idx_project_staff_project_id ON project_staff(project_id);
CREATE INDEX idx_project_staff_user_id ON project_staff(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- إدراج البيانات الأساسية
INSERT INTO users (username, password, full_name, email, role, nationality, residence_expiry_date) VALUES
('admin', 'admin123', 'مدير النظام', 'admin@innovators.com', 'admin', 'saudi', '2025-08-20'),
('hr_manager', 'hr123', 'مدير الموارد البشرية', 'hr@innovators.com', 'hr_manager', 'saudi', '2025-09-15'),
('eng1', 'eng123', 'المهندس أحمد', 'ahmad@innovators.com', 'engineer', 'resident', '2025-12-30');

INSERT INTO clients (name, contact_person, email, phone, city) VALUES
('شركة الخليج للمقاولات', 'أحمد المطيري', 'contact@gulf-contracting.com', '+966501234567', 'الرياض'),
('شركة البناء الحديث', 'فاطمة العتيبي', 'info@modern-construction.com', '+966507654321', 'جدة'),
('مؤسسة النهضة العقارية', 'محمد الأحمد', 'projects@nahda-real-estate.com', '+966551234567', 'الدمام');

INSERT INTO projects (title, description, client_id, location, status, start_date, target_end_date, budget, created_by) VALUES
('برج الريادة السكني', 'مشروع سكني يتكون من 20 طابق في وسط الرياض', 1, 'الرياض - حي الملك فهد', 'in_progress', '2025-01-15', '2025-12-31', 5000000.00, 1),
('مجمع مكاتب الأعمال', 'مجمع تجاري للمكاتب والشركات', 2, 'جدة - حي الزهراء', 'new', '2025-02-01', '2025-11-30', 3500000.00, 1),
('مشروع الفلل الذكية', 'مجموعة من الفلل الذكية بتقنيات حديثة', 3, 'الدمام - حي الشاطئ', 'new', '2025-03-01', '2026-02-28', 8000000.00, 1);

-- إدراج مراحل المشاريع
INSERT INTO project_phases (project_id, phase, description, status) VALUES
(1, 'architectural_design', 'تصميم معماري للبرج السكني', 'completed'),
(1, 'structural_design', 'التصميم الإنشائي والهيكلي', 'in_progress'),
(1, 'mep_design', 'تصميم الأنظمة الكهروميكانيكية', 'not_started'),
(2, 'architectural_design', 'التصميم المعماري للمجمع التجاري', 'in_progress'),
(3, 'architectural_design', 'تصميم الفلل الذكية', 'not_started');

-- إدراج فريق المشاريع
INSERT INTO project_staff (project_id, user_id) VALUES
(1, 2), (1, 3),
(2, 2), (2, 3),
(3, 3);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

SELECT 'Database created successfully!' as status;
EOF

echo "✅ تم إنشاء قاعدة البيانات بنجاح!"
echo "✅ Database created successfully!"
echo ""
echo "📋 البيانات المُدرجة:"
echo "- 3 مستخدمين (admin, hr_manager, eng1)"
echo "- 3 عملاء"
echo "- 3 مشاريع"
echo "- 5 مراحل مشاريع"
echo ""
echo "🔑 بيانات تسجيل الدخول:"
echo "المدير: admin / admin123"
echo "مدير الموارد البشرية: hr_manager / hr123"
echo "المهندس: eng1 / eng123"
echo ""
echo "🚀 يمكنك الآن تشغيل التطبيق بـ: npm run dev"