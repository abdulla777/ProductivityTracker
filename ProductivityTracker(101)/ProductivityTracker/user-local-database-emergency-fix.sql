-- إصلاح طارئ لقاعدة البيانات المحلية
-- Emergency fix for local database

-- حذف وإعادة إنشاء جدول project_files
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
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إضافة الفهارس
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_phase_id ON project_files(phase_id);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);

-- إضافة عمود description لجدول project_phases
ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS description TEXT;

-- التحقق من النتائج
SELECT 'Fixed project_files table' as status;
SELECT column_name FROM information_schema.columns WHERE table_name = 'project_files' ORDER BY ordinal_position;

SELECT 'Fixed project_phases table' as status;
SELECT column_name FROM information_schema.columns WHERE table_name = 'project_phases' ORDER BY ordinal_position;