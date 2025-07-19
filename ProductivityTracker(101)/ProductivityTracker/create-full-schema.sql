-- Complete Schema for Consulting Engineers Management System
-- This creates all tables and data needed for the application

-- Create enum types
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('admin', 'project_manager', 'engineer', 'admin_staff', 'hr_manager', 'general_manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('new', 'in_progress', 'delayed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_phase AS ENUM ('architectural_design', 'structural_design', 'mep_design', 'official_approval', 'execution_supervision');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'delayed', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_type AS ENUM ('new_project', 'partnership', 'vendor_registration', 'ongoing_project', 'project_expansion');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_strength AS ENUM ('strong', 'medium', 'weak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('draft', 'submitted', 'under_review', 'negotiation', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE residence_status AS ENUM ('active', 'expired', 'expiring_soon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table (core table)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role role NOT NULL DEFAULT 'admin_staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  -- Residence fields
  nationality VARCHAR(20) DEFAULT 'saudi',
  residence_number VARCHAR(50),
  residence_expiry_date DATE,
  residence_status residence_status DEFAULT 'active'
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  client_id INTEGER REFERENCES clients(id),
  location TEXT,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  budget DECIMAL(15,2),
  status project_status DEFAULT 'new',
  current_phase project_phase,
  progress INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create project_staff table
CREATE TABLE IF NOT EXISTS project_staff (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  user_id INTEGER REFERENCES users(id),
  role TEXT,
  assigned_at TIMESTAMP DEFAULT now(),
  assigned_date DATE DEFAULT CURRENT_DATE
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'not_started',
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  reference_id INTEGER,
  reference_type TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'present',
  is_present BOOLEAN DEFAULT true,
  is_late BOOLEAN DEFAULT false,
  notes TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create residence renewals table
CREATE TABLE IF NOT EXISTS residence_renewals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  old_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  renewal_period_months INTEGER NOT NULL,
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Create residence notifications table  
CREATE TABLE IF NOT EXISTS residence_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  notification_type VARCHAR(20) NOT NULL,
  expiry_date DATE NOT NULL,
  sent_to VARCHAR(100),
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type opportunity_type NOT NULL,
  status opportunity_status DEFAULT 'lead',
  strength opportunity_strength DEFAULT 'medium',
  estimated_value DECIMAL(15,2),
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER REFERENCES opportunities(id),
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15,2),
  status proposal_status DEFAULT 'draft',
  submitted_date DATE,
  valid_until DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Create opportunity_files table
CREATE TABLE IF NOT EXISTS opportunity_files (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER REFERENCES opportunities(id),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Create opportunity_notes table
CREATE TABLE IF NOT EXISTS opportunity_notes (
  id SERIAL PRIMARY KEY,
  opportunity_id INTEGER REFERENCES opportunities(id),
  content TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create client_notes table
CREATE TABLE IF NOT EXISTS client_notes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  content TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create staff_evaluations table
CREATE TABLE IF NOT EXISTS staff_evaluations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  project_id INTEGER,
  evaluation_period TEXT,
  performance_score INTEGER,
  technical_skills_score INTEGER,
  communication_score INTEGER,
  teamwork_score INTEGER,
  comments TEXT,
  evaluated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  location TEXT,
  type TEXT DEFAULT 'meeting',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Insert default users
INSERT INTO users (username, password, full_name, email, role, nationality, residence_status) 
VALUES 
  ('admin', 'admin123', 'مدير النظام', 'admin@innovators.com', 'admin', 'saudi', 'active'),
  ('hr_manager', 'hr123', 'مدير الموارد البشرية', 'hr@innovators.com', 'hr_manager', 'saudi', 'active'),
  ('general_manager', 'gm123', 'المدير العام', 'gm@innovators.com', 'general_manager', 'saudi', 'active')
ON CONFLICT (username) DO UPDATE SET
  nationality = EXCLUDED.nationality,
  residence_status = EXCLUDED.residence_status;

-- Insert test resident users
INSERT INTO users (username, password, full_name, email, role, nationality, residence_number, residence_expiry_date, residence_status) 
VALUES 
  ('resident1', 'password123', 'أحمد محمد علي', 'ahmed@test.com', 'engineer', 'resident', '2123456789', '2025-09-15', 'active'),
  ('resident2', 'password123', 'فاطمة أحمد سالم', 'fatima@test.com', 'engineer', 'resident', '2123456790', '2025-08-10', 'active'),
  ('resident3', 'password123', 'محمد أحمد البلوشي', 'mohamed@test.com', 'engineer', 'resident', '2123456791', '2025-08-15', 'active')
ON CONFLICT (username) DO UPDATE SET
  nationality = EXCLUDED.nationality,
  residence_number = EXCLUDED.residence_number,
  residence_expiry_date = EXCLUDED.residence_expiry_date,
  residence_status = EXCLUDED.residence_status;

-- Insert sample client
INSERT INTO clients (name, contact_person, email, phone, address, city) 
VALUES ('شركة الرياض للتطوير', 'أحمد محمد السالم', 'contact@riyadhdev.com', '+966501234567', 'حي الملك فهد', 'الرياض')
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Setup verification:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

SELECT 'Users created:' as info;
SELECT username, full_name, role, nationality FROM users;

SELECT 'Residence users:' as info;
SELECT full_name, nationality, residence_number, residence_expiry_date 
FROM users 
WHERE nationality = 'resident';