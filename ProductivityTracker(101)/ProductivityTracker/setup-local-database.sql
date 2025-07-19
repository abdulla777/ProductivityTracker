-- Complete Local Database Setup
-- Creates all tables and data needed for the application

-- Create ENUM types
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

-- Users table
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

-- Clients table
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

-- Projects table
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

-- Project phases table
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

-- Project files table
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

-- Project staff table
CREATE TABLE project_staff (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
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

-- Attendance table
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

-- Leave requests table
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

-- Notifications table
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

-- Residence renewals table
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

-- Residence notifications table
CREATE TABLE residence_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notification_type VARCHAR(20) NOT NULL,
  sent_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  days_until_expiry INTEGER NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff evaluations table
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

-- Database migrations table
CREATE TABLE database_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial users
INSERT INTO users (username, password, full_name, email, role, nationality, residence_expiry_date) VALUES
('admin', 'admin123', 'System Administrator', 'admin@company.local', 'admin', 'saudi', '2025-12-31'),
('hr_manager', 'hr123', 'HR Manager', 'hr@company.local', 'hr_manager', 'saudi', '2025-12-31'),
('engineer1', 'eng123', 'Senior Engineer', 'engineer1@company.local', 'engineer', 'resident', '2025-12-31'),
('manager1', 'mgr123', 'Project Manager', 'manager1@company.local', 'project_manager', 'saudi', '2025-12-31');

-- Insert sample clients
INSERT INTO clients (name, contact_person, email, phone, city) VALUES
('Local Construction Co.', 'Ahmed Ali', 'ahmed@localconstruction.com', '+966501234567', 'Riyadh'),
('Engineering Solutions Ltd.', 'Sarah Mohammed', 'sarah@engsolutions.com', '+966502345678', 'Jeddah'),
('Infrastructure Development Corp.', 'Omar Hassan', 'omar@infrastructure.com', '+966503456789', 'Dammam');

-- Insert sample projects
INSERT INTO projects (title, description, client_id, location, status, priority, start_date, target_end_date, completion_percentage, budget, created_by) VALUES
('Local Office Building', 'Design and supervision of 10-story office building', 1, 'Riyadh Downtown', 'in_progress', 'high', '2025-01-15', '2025-12-31', 35, 2500000.00, 1),
('Residential Complex Phase 1', 'Architectural and structural design for residential complex', 2, 'Jeddah North', 'new', 'medium', '2025-02-01', '2026-01-31', 0, 1800000.00, 1),
('Industrial Facility', 'MEP design for manufacturing facility', 3, 'Dammam Industrial City', 'in_progress', 'urgent', '2024-12-01', '2025-06-30', 60, 3200000.00, 1);

-- Insert project phases for the first project
INSERT INTO project_phases (project_id, phase, description, status, start_date, end_date, completion_percentage) VALUES
(1, 'architectural_design', 'Architectural design phase', 'completed', '2025-01-15', '2025-03-15', 100),
(1, 'structural_design', 'Structural design phase', 'in_progress', '2025-03-01', '2025-05-31', 70),
(1, 'mep_design', 'MEP design phase', 'not_started', '2025-05-01', '2025-07-31', 0);

-- Insert project staff assignments
INSERT INTO project_staff (project_id, user_id) VALUES
(1, 3), -- engineer1 assigned to project 1
(1, 4), -- manager1 assigned to project 1
(2, 3), -- engineer1 assigned to project 2
(3, 4); -- manager1 assigned to project 3

-- Insert sample tasks
INSERT INTO tasks (title, description, project_id, assigned_to, assigned_by, status, priority, due_date) VALUES
('Complete structural calculations', 'Finalize structural calculations for floors 6-10', 1, 3, 4, 'in_progress', 'high', '2025-08-15'),
('Review architectural plans', 'Review and approve final architectural plans', 2, 4, 1, 'pending', 'medium', '2025-08-30'),
('MEP coordination meeting', 'Coordinate with MEP consultants for industrial facility', 3, 3, 4, 'pending', 'urgent', '2025-08-10');

-- Insert sample attendance records
INSERT INTO attendance (user_id, date, clock_in_time, clock_out_time, notes, is_late) VALUES
(3, CURRENT_DATE - INTERVAL '1 day', '08:00:00', '17:00:00', 'Regular day', false),
(4, CURRENT_DATE - INTERVAL '1 day', '08:30:00', '17:30:00', 'Slightly late due to traffic', true),
(3, CURRENT_DATE, '08:15:00', NULL, 'Currently working', false);

-- Insert sample leave requests
INSERT INTO leave_requests (user_id, type, start_date, end_date, days_count, reason, status) VALUES
(3, 'annual', '2025-08-20', '2025-08-24', 5, 'Annual vacation', 'pending'),
(4, 'sick', '2025-07-15', '2025-07-15', 1, 'Medical appointment', 'approved');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES
(1, 'New Leave Request', 'Engineer1 has submitted a leave request for review', 'info', 'leave_request', 1),
(3, 'Task Assignment', 'You have been assigned a new high-priority task', 'warning', 'task', 1),
(4, 'Project Update', 'Project Local Office Building progress updated to 35%', 'success', 'project', 1);

SELECT 'Local PostgreSQL database setup completed successfully!' AS status;