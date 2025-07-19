#!/bin/bash

# Debug and Fix All Database Issues for Local Environment

echo "🔧 Debugging and Fixing All Database Issues"
echo "==========================================="

# Check PostgreSQL status
if ! systemctl is-active --quiet postgresql; then
    echo "📋 Starting PostgreSQL..."
    sudo systemctl start postgresql
    sleep 3
fi

# Stop any running applications first
echo "📋 Stopping any running applications..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx server" 2>/dev/null || true
sleep 2

# Drop and recreate database completely
echo "📋 Recreating database from scratch..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS consulting_engineers;"
sudo -u postgres psql -c "CREATE DATABASE consulting_engineers;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE consulting_engineers TO postgres;"

# Create complete schema with all columns
echo "📋 Creating complete schema..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers << 'EOF'

-- Create enum types
CREATE TYPE role AS ENUM ('admin', 'project_manager', 'engineer', 'admin_staff', 'hr_manager', 'general_manager');
CREATE TYPE project_status AS ENUM ('new', 'in_progress', 'delayed', 'completed', 'cancelled');
CREATE TYPE project_phase AS ENUM ('architectural_design', 'structural_design', 'mep_design', 'official_approval', 'execution_supervision');
CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'delayed', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Create users table with all required columns
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role role NOT NULL DEFAULT 'admin_staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  nationality VARCHAR(20) DEFAULT 'saudi',
  residence_number VARCHAR(50),
  residence_expiry_date DATE,
  residence_status VARCHAR(20) DEFAULT 'active'
);

-- Create clients table with all columns
CREATE TABLE clients (
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

-- Create projects table with all columns
CREATE TABLE projects (
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
CREATE TABLE project_staff (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  user_id INTEGER REFERENCES users(id),
  role TEXT,
  assigned_at TIMESTAMP DEFAULT now(),
  assigned_date DATE DEFAULT CURRENT_DATE
);

-- Create tasks table with all columns
CREATE TABLE tasks (
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
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  reference_id INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- Create attendance table
CREATE TABLE attendance (
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
CREATE TABLE leave_requests (
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

-- Create residence tables
CREATE TABLE residence_renewals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  old_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  renewal_period_months INTEGER NOT NULL,
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE residence_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  notification_type VARCHAR(20) NOT NULL,
  expiry_date DATE NOT NULL,
  sent_to VARCHAR(100),
  sent_at TIMESTAMP,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_evaluations table
CREATE TABLE staff_evaluations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  project_id INTEGER,
  evaluation_period TEXT,
  performance_score INTEGER,
  technical_skills_score INTEGER,
  communication_score INTEGER,
  teamwork_score INTEGER,
  rating INTEGER,
  comments TEXT,
  evaluated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Insert test users
INSERT INTO users (username, password, full_name, email, role, nationality, residence_status) VALUES 
  ('admin', 'admin123', 'مدير النظام', 'admin@innovators.com', 'admin', 'saudi', 'active'),
  ('hr_manager', 'hr123', 'مدير الموارد البشرية', 'hr@innovators.com', 'hr_manager', 'saudi', 'active'),
  ('general_manager', 'gm123', 'المدير العام', 'gm@innovators.com', 'general_manager', 'saudi', 'active');

-- Insert test resident users
INSERT INTO users (username, password, full_name, email, role, nationality, residence_number, residence_expiry_date, residence_status) VALUES 
  ('resident1', 'password123', 'أحمد محمد علي', 'ahmed@test.com', 'engineer', 'resident', '2123456789', '2025-09-15', 'active'),
  ('resident2', 'password123', 'فاطمة أحمد سالم', 'fatima@test.com', 'engineer', 'resident', '2123456790', '2025-08-10', 'active');

-- Insert sample client
INSERT INTO clients (name, contact_person, email, phone, address, city, notes) VALUES 
  ('شركة الرياض للتطوير', 'أحمد محمد السالم', 'contact@riyadhdev.com', '+966501234567', 'حي الملك فهد', 'الرياض', 'عميل تجريبي للاختبار');

-- Update projects to have title
UPDATE projects SET title = name WHERE title IS NULL;

EOF

echo "✅ Database recreated successfully!"

# Test the database
echo "📋 Testing database..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "
SELECT 'Users:' as type, count(*) as count FROM users
UNION ALL
SELECT 'Clients:', count(*) FROM clients
UNION ALL  
SELECT 'Tables:', count(*) FROM information_schema.tables WHERE table_schema = 'public';
"

echo "✅ Database debug and fix completed!"
echo "🌐 Now restart the application with: ./start-local-enhanced.sh"