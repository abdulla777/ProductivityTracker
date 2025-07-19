-- COMPLETE DATABASE BACKUP FOR PRODUCTIVITY TRACKER
-- This file contains the complete database structure and test data
-- Run this to get a fully working system

-- Drop existing tables if they exist (careful with data loss!)
DROP TABLE IF EXISTS residence_renewals CASCADE;
DROP TABLE IF EXISTS residence_notifications CASCADE;
DROP TABLE IF EXISTS staff_evaluations CASCADE;
DROP TABLE IF EXISTS project_phases CASCADE;
DROP TABLE IF EXISTS project_staff CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enums if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS nationality CASCADE;
DROP TYPE IF EXISTS residence_status CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS project_phase_name CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS renewal_status CASCADE;

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'engineer', 'admin_staff', 'hr_manager', 'general_manager');
CREATE TYPE nationality AS ENUM ('saudi', 'resident');
CREATE TYPE residence_status AS ENUM ('active', 'expired', 'pending_renewal', 'cancelled');
CREATE TYPE project_status AS ENUM ('new', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE project_phase_name AS ENUM ('architectural_design', 'structural_design', 'mep_design', 'official_approval', 'execution_supervision');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed', 'cancelled');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'maternity', 'paternity', 'hajj', 'compassionate');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE renewal_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');

-- Create tables

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'admin_staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    nationality nationality NOT NULL DEFAULT 'saudi',
    residence_number TEXT,
    residence_expiry_date DATE,
    residence_status residence_status DEFAULT 'active',
    department TEXT,
    position TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    location TEXT,
    status project_status NOT NULL DEFAULT 'new',
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Project phases table
CREATE TABLE project_phases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    phase_name project_phase_name NOT NULL,
    status project_status NOT NULL DEFAULT 'new',
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    assigned_to INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Project staff table
CREATE TABLE project_staff (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    assigned_to INTEGER NOT NULL REFERENCES users(id),
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'not_started',
    due_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    is_present BOOLEAN NOT NULL DEFAULT true,
    is_late BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'present',
    notes TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    UNIQUE(user_id, date)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status leave_status NOT NULL DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    reference_id INTEGER,
    reference_type TEXT,
    priority TEXT DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Staff evaluations table
CREATE TABLE staff_evaluations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    rating INTEGER NOT NULL,
    comments TEXT,
    evaluated_by INTEGER NOT NULL REFERENCES users(id),
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Residence renewals table
CREATE TABLE residence_renewals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    old_expiry_date DATE NOT NULL,
    new_expiry_date DATE NOT NULL,
    new_residence_number TEXT,
    renewal_status renewal_status NOT NULL DEFAULT 'pending',
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Residence notifications table
CREATE TABLE residence_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    notification_type TEXT NOT NULL,
    days_until_expiry INTEGER NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_to INTEGER NOT NULL REFERENCES users(id)
);

-- Insert test data

-- Insert users
INSERT INTO users (username, password, full_name, email, role, department, position, hire_date, nationality, is_active) VALUES
('admin', 'admin123', 'مدير النظام', 'admin@innovators.com', 'admin', 'الإدارة', 'مدير النظام', '2024-01-01', 'saudi', true),
('hrmanager', 'password123', 'مدير الموارد البشرية', 'hr@innovators.com', 'hr_manager', 'الموارد البشرية', 'مدير الموارد البشرية', '2024-01-15', 'saudi', true),
('generalmanager', 'password123', 'المدير العام', 'gm@innovators.com', 'general_manager', 'الإدارة العليا', 'المدير العام', '2024-01-01', 'saudi', true),
('project_manager1', 'pm123', 'أحمد المدير', 'ahmed@innovators.com', 'project_manager', 'إدارة المشاريع', 'مدير مشاريع أول', '2024-02-01', 'saudi', true),
('engineer1', 'eng123', 'سارة المهندسة', 'sara@innovators.com', 'engineer', 'الهندسة المدنية', 'مهندسة مدنية', '2024-03-01', 'saudi', true),
('engineer2', 'eng123', 'محمد المهندس', 'mohamed@innovators.com', 'engineer', 'الهندسة المعمارية', 'مهندس معماري', '2024-03-15', 'saudi', true),
('resident1', 'password123', 'أحمد محمد علي', 'ahmed@test.com', 'engineer', 'الهندسة الكهربائية', 'مهندس كهربائي', '2024-04-01', 'resident', true),
('resident2', 'password123', 'فاطمة أحمد سالم', 'fatima@test.com', 'engineer', 'الهندسة الميكانيكية', 'مهندسة ميكانيكية', '2024-04-15', 'resident', true);

-- Update residence information for residents
UPDATE users SET 
    residence_number = '2123456789',
    residence_expiry_date = '2026-09-15',
    residence_status = 'active'
WHERE username = 'resident1';

UPDATE users SET 
    residence_number = '2123456790', 
    residence_expiry_date = '2026-08-10',
    residence_status = 'active'
WHERE username = 'resident2';

-- Insert clients
INSERT INTO clients (name, contact_person, email, phone, address, city) VALUES
('شركة الخليج للمقاولات', 'أحمد محمد', 'ahmed@gulf-contractors.com', '+966555123456', 'الرياض، حي العليا', 'الرياض'),
('شركة الابتكار للتطوير', 'سارة أحمد', 'sara@innovation-dev.com', '+966555234567', 'جدة، حي الروضة', 'جدة'),
('مؤسسة البناء الحديث', 'محمد علي', 'mohamed@modern-build.com', '+966555345678', 'الدمام، حي الشاطئ', 'الدمام');

-- Insert projects
INSERT INTO projects (title, description, client_id, location, status, start_date, target_end_date, completion_percentage, created_by) VALUES
('برج الريادة السكني', 'مشروع تصميم برج سكني مكون من 30 طابقاً في حي العليا', 1, 'الرياض - حي العليا', 'in_progress', '2025-01-15', '2025-12-15', 25, 1),
('مجمع مكاتب الأعمال', 'تصميم وتنفيذ مجمع مكاتب تجارية', 2, 'جدة - حي الروضة', 'planning', '2025-02-01', '2026-01-31', 10, 1),
('فيلا عائلية فاخرة', 'تصميم فيلا عائلية بمساحة 800 متر مربع', 3, 'الدمام - حي الشاطئ', 'new', '2025-03-01', '2025-09-30', 0, 1);

-- Insert project staff assignments
INSERT INTO project_staff (project_id, user_id, role) VALUES
(1, 4, 'مدير المشروع'),
(1, 5, 'مهندس مدني'),
(1, 6, 'مهندس معماري'),
(2, 4, 'مدير المشروع'),
(2, 7, 'مهندس كهربائي'),
(3, 5, 'مهندس مدني'),
(3, 8, 'مهندسة ميكانيكية');

-- Insert project phases
INSERT INTO project_phases (project_id, phase_name, status, start_date, target_end_date, completion_percentage, assigned_to) VALUES
(1, 'architectural_design', 'completed', '2025-01-15', '2025-02-15', 100, 6),
(1, 'structural_design', 'in_progress', '2025-02-01', '2025-03-15', 60, 5),
(1, 'mep_design', 'new', '2025-03-01', '2025-04-15', 0, 7),
(2, 'architectural_design', 'in_progress', '2025-02-01', '2025-03-01', 40, 6),
(3, 'architectural_design', 'new', '2025-03-01', '2025-04-01', 0, 6);

-- Insert tasks
INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, completion_percentage, created_by) VALUES
('إعداد المخططات الأولية', 'تصميم المخططات المعمارية الأولية للمشروع', 1, 6, 'high', 'completed', '2025-02-01', 100, 4),
('حساب الأحمال الإنشائية', 'حساب الأحمال والتصميم الإنشائي', 1, 5, 'high', 'in_progress', '2025-03-01', 60, 4),
('تصميم النظام الكهربائي', 'تصميم الشبكة الكهربائية للمبنى', 1, 7, 'medium', 'not_started', '2025-04-01', 0, 4),
('مراجعة التصاميم', 'مراجعة جميع التصاميم قبل التسليم', 2, 4, 'high', 'not_started', '2025-03-15', 0, 1);

-- Insert attendance records
INSERT INTO attendance (user_id, date, check_in, check_out, is_present, is_late, status, recorded_by) VALUES
(1, '2025-07-08', '08:00:00', '17:00:00', true, false, 'present', 1),
(4, '2025-07-08', '08:15:00', '17:30:00', true, true, 'present', 1),
(5, '2025-07-08', '07:45:00', '16:45:00', true, false, 'present', 1),
(6, '2025-07-08', '08:30:00', '17:00:00', true, true, 'present', 1),
(7, '2025-07-08', NULL, NULL, false, false, 'absent', 1);

-- Insert leave requests
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_count, reason, status, approved_by, approved_at) VALUES
(5, 'annual', '2025-07-15', '2025-07-19', 5, 'إجازة سنوية مع العائلة', 'approved', 2, '2025-07-08 10:00:00'),
(6, 'sick', '2025-07-10', '2025-07-11', 2, 'إجازة مرضية', 'pending', NULL, NULL),
(7, 'emergency', '2025-07-12', '2025-07-12', 1, 'ظروف طارئة عائلية', 'approved', 2, '2025-07-08 14:00:00'),
(8, 'annual', '2025-08-01', '2025-08-07', 7, 'إجازة سنوية', 'pending', NULL, NULL);

-- Insert notifications
INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, priority, is_read) VALUES
(4, 'مهمة جديدة', 'تم تعيين مهمة جديدة لك في مشروع برج الريادة', 'task_assigned', 2, 'task', 'high', false),
(5, 'تم الموافقة على الإجازة', 'تم الموافقة على طلب الإجازة السنوية', 'leave_approved', 1, 'leave_request', 'medium', false),
(6, 'مراجعة مطلوبة', 'يرجى مراجعة التصاميم المعمارية للمشروع', 'project_review', 1, 'project', 'high', false),
(1, 'تقرير يومي', 'تقرير الحضور اليومي جاهز للمراجعة', 'daily_report', NULL, NULL, 'low', true);

-- Insert staff evaluations
INSERT INTO staff_evaluations (user_id, project_id, rating, comments, evaluated_by) VALUES
(5, 1, 5, 'أداء ممتاز في التصميم الإنشائي', 4),
(6, 1, 4, 'تصاميم جيدة لكن تحتاج تحسين في المواعيد', 4),
(7, 1, 3, 'أداء متوسط، يحتاج متابعة أكثر', 4);

-- Insert residence notifications
INSERT INTO residence_notifications (user_id, notification_type, days_until_expiry, sent_to) VALUES
(7, '3_months', 90, 2),
(8, '1_month', 30, 2);

-- Insert residence renewals
INSERT INTO residence_renewals (user_id, old_expiry_date, new_expiry_date, new_residence_number, renewal_status, processed_by, processed_at, notes) VALUES
(7, '2025-09-15', '2026-09-15', '2123456789', 'completed', 2, '2025-07-08 09:00:00', 'تم التجديد بنجاح'),
(8, '2025-08-10', '2026-08-10', '2123456790', 'pending', NULL, NULL, 'في انتظار استكمال الأوراق');

COMMIT;

-- Final check queries
SELECT 'Users count:' as info, count(*) as value FROM users
UNION ALL
SELECT 'Clients count:', count(*) FROM clients  
UNION ALL
SELECT 'Projects count:', count(*) FROM projects
UNION ALL
SELECT 'Tasks count:', count(*) FROM tasks
UNION ALL
SELECT 'Leave requests count:', count(*) FROM leave_requests
UNION ALL
SELECT 'Attendance records:', count(*) FROM attendance
UNION ALL
SELECT 'Notifications count:', count(*) FROM notifications;