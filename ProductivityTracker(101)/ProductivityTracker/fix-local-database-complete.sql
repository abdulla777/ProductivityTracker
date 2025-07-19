-- إصلاح شامل لقاعدة البيانات المحلية
-- Complete fix for local database issues

-- إصلاح جدول project_phases
ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS description TEXT;

-- إصلاح جدول project_files
DROP TABLE IF EXISTS project_files CASCADE;
CREATE TABLE project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id INTEGER REFERENCES project_phases(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_description TEXT,
  file_type TEXT,
  file_url TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إضافة الفهارس
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_phase_id ON project_files(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);

-- إصلاح جدول notifications (إضافة الأعمدة المفقودة)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INTEGER;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- إصلاح جدول projects (إضافة completion_percentage)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- إصلاح جدول project_staff (إضافة assigned_at)
ALTER TABLE project_staff ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- إصلاح جدول users (إضافة is_active)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- التحقق من النتائج
SELECT 'project_phases columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_phases' ORDER BY ordinal_position;

SELECT 'project_files columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project_files' ORDER BY ordinal_position;

SELECT 'notifications columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position;

SELECT 'Fixed database schema successfully' as result;