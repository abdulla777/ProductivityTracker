-- إصلاح جدول project_files للبيئة المحلية
-- Fix project_files table for local environment

-- إنشاء الجدول مع الأعمدة الصحيحة
CREATE TABLE IF NOT EXISTS project_files (
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

-- إضافة الأعمدة المفقودة إذا لم تكن موجودة
ALTER TABLE project_files ADD COLUMN IF NOT EXISTS phase_id INTEGER REFERENCES project_phases(id) ON DELETE SET NULL;
ALTER TABLE project_files ADD COLUMN IF NOT EXISTS file_description TEXT;
ALTER TABLE project_files ADD COLUMN IF NOT EXISTS file_type TEXT;

-- إضافة الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_phase_id ON project_files(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);

-- التحقق من بنية الجدول
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position;