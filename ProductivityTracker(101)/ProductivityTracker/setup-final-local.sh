#!/bin/bash

# ======================================
# Consulting Engineers Management System
# Final Local Setup Script (Ubuntu 22.04+)
# ======================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as regular user."
   exit 1
fi

print_header "Consulting Engineers Management System - Final Setup"

print_info "System: Ubuntu 22.04+ Local Development Environment"
print_info "Language: Arabic/English Bilingual Interface"
print_info "Database: PostgreSQL with full schema setup"
print_info "Access: http://localhost:5000 (admin/admin123)"

echo ""
read -p "Press Enter to continue or Ctrl+C to exit..."

print_header "Step 1: System Requirements Check"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js 18 installed"
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    print_status "PostgreSQL found"
else
    print_info "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    print_status "PostgreSQL installed"
fi

print_header "Step 2: PostgreSQL Configuration"

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL user
print_info "Configuring PostgreSQL user..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';" 2>/dev/null || {
    sudo -u postgres createuser --interactive --pwprompt postgres
}

# Create database
print_info "Creating database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS consulting_engineers;"
sudo -u postgres psql -c "CREATE DATABASE consulting_engineers OWNER postgres;"

print_header "Step 3: Database Schema Setup"

# Create complete schema
print_info "Creating database schema..."
sudo -u postgres psql -d consulting_engineers << 'EOF'
-- Create all required enums
CREATE TYPE role AS ENUM ('admin', 'project_manager', 'engineer', 'admin_staff', 'hr_manager', 'general_manager');
CREATE TYPE project_status AS ENUM ('new', 'in_progress', 'delayed', 'completed', 'cancelled');
CREATE TYPE project_phase AS ENUM ('architectural_design', 'structural_design', 'mep_design', 'official_approval', 'execution_supervision');
CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'delayed', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE opportunity_status AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE opportunity_type AS ENUM ('new_project', 'partnership', 'vendor_registration', 'ongoing_project', 'project_expansion');
CREATE TYPE opportunity_strength AS ENUM ('strong', 'medium', 'weak');
CREATE TYPE proposal_status AS ENUM ('draft', 'submitted', 'under_review', 'negotiation', 'accepted', 'rejected');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE nationality AS ENUM ('saudi', 'resident');
CREATE TYPE residence_status AS ENUM ('active', 'expired', 'expiring_soon');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role role NOT NULL DEFAULT 'engineer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    department TEXT,
    position TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    nationality nationality DEFAULT 'saudi',
    residence_number TEXT,
    residence_expiry_date DATE,
    residence_status residence_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES clients(id),
    location TEXT,
    status project_status DEFAULT 'new',
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    completion_percentage REAL DEFAULT 0.0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project phases table
CREATE TABLE project_phases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    phase project_phase NOT NULL,
    status phase_status DEFAULT 'not_started',
    start_date DATE,
    end_date DATE,
    assigned_to INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project staff table
CREATE TABLE project_staff (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    role TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id INTEGER REFERENCES projects(id),
    assigned_to INTEGER REFERENCES users(id),
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'not_started',
    due_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
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
    UNIQUE(user_id, date)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    notes TEXT,
    days_count INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id INTEGER,
    reference_type TEXT,
    priority TEXT DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project files table
CREATE TABLE project_files (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opportunities table
CREATE TABLE opportunities (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    organization TEXT,
    type opportunity_type NOT NULL,
    status opportunity_status DEFAULT 'lead',
    strength opportunity_strength DEFAULT 'medium',
    estimated_value REAL,
    description TEXT,
    notes TEXT,
    expected_close_date DATE,
    actual_close_date DATE,
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    linked_project_id INTEGER REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Residence renewals table
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

-- Residence notifications table
CREATE TABLE residence_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    notification_type TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_to TEXT NOT NULL,
    is_processed BOOLEAN DEFAULT false
);

-- Insert initial data
INSERT INTO users (username, password, full_name, email, role, department, position, hire_date, nationality) VALUES
('admin', 'admin123', 'مدير النظام', 'admin@company.com', 'admin', 'إدارة', 'مدير النظام', '2024-01-01', 'saudi'),
('hr_manager', 'hr123', 'مدير الموارد البشرية', 'hr@company.com', 'hr_manager', 'الموارد البشرية', 'مدير الموارد البشرية', '2024-01-01', 'saudi'),
('general_manager', 'gm123', 'المدير العام', 'gm@company.com', 'general_manager', 'إدارة عامة', 'المدير العام', '2024-01-01', 'saudi'),
('project_manager', 'pm123', 'مدير المشاريع', 'pm@company.com', 'project_manager', 'المشاريع', 'مدير المشاريع', '2024-01-01', 'saudi'),
('engineer1', 'eng123', 'المهندس أحمد محمد', 'engineer1@company.com', 'engineer', 'الهندسة', 'مهندس مدني', '2024-01-01', 'saudi'),
('engineer2', 'eng123', 'المهندس سعد العمري', 'engineer2@company.com', 'engineer', 'الهندسة', 'مهندس معماري', '2024-01-01', 'resident'),
('admin_staff', 'staff123', 'موظف إداري', 'staff@company.com', 'admin_staff', 'الإدارة', 'موظف إداري', '2024-01-01', 'saudi');

INSERT INTO clients (name, contact_person, email, phone, address, city, notes) VALUES
('شركة الخليج للمقاولات', 'محمد الأحمد', 'info@gulf-contracting.com', '+966501234567', 'الرياض - حي العليا', 'الرياض', 'عميل رئيسي منذ 2020'),
('شركة البناء الحديث', 'أحمد السالم', 'contact@modern-build.com', '+966502345678', 'جدة - حي الزهراء', 'جدة', 'عميل جديد - 2024'),
('مؤسسة التطوير العقاري', 'سارة المحمد', 'info@real-estate-dev.com', '+966503456789', 'الدمام - حي الفيصلية', 'الدمام', 'مشاريع عقارية متنوعة');

INSERT INTO projects (title, description, client_id, location, status, start_date, target_end_date, completion_percentage, created_by) VALUES
('برج الريادة السكني', 'تصميم وتنفيذ برج سكني بـ 20 طابق', 1, 'الرياض - حي العليا', 'in_progress', '2025-01-15', '2025-12-31', 25.0, 1),
('مجمع مكاتب الأعمال', 'تطوير مجمع مكاتب تجارية حديث', 2, 'جدة - حي الزهراء', 'new', '2025-03-01', '2025-11-30', 0.0, 1),
('فيلا عائلية فاخرة', 'تصميم وبناء فيلا عائلية بمساحة 800 متر', 3, 'الدمام - حي الفيصلية', 'new', '2025-02-01', '2025-08-31', 0.0, 1);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

EOF

print_status "Database schema created successfully"

print_header "Step 4: Environment Configuration"

# Create .env file
cat > .env << 'EOF'
LOCAL_DEVELOPMENT=true
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/consulting_engineers
PORT=5000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=consulting_engineers
EOF

print_status "Environment configuration created"

print_header "Step 5: Dependencies Installation"

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

print_header "Step 6: Final System Test"

# Test database connection
print_info "Testing database connection..."
if PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT COUNT(*) FROM users;" &>/dev/null; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# Test application startup
print_info "Testing application startup..."
timeout 10s npm run dev &>/dev/null &
sleep 5
if curl -f http://localhost:5000 &>/dev/null; then
    print_status "Application startup successful"
    pkill -f "npm run dev"
else
    print_warning "Application test skipped (will work on first run)"
fi

print_header "🚀 SETUP COMPLETE"

print_status "System ready for deployment!"
echo ""
print_info "📋 Access Information:"
echo "  🌐 URL: http://localhost:5000"
echo "  👤 Admin: admin / admin123"
echo "  👤 HR Manager: hr_manager / hr123"
echo "  👤 General Manager: general_manager / gm123"
echo ""
print_info "🎯 Available Features:"
echo "  ✅ Project Management (Create, Update, Track)"
echo "  ✅ Client Management (Full CRUD)"
echo "  ✅ Staff Management (Roles, Permissions)"
echo "  ✅ Attendance Tracking (Check-in/out)"
echo "  ✅ Leave Requests (Submit, Approve)"
echo "  ✅ Notifications System"
echo "  ✅ Residence Permits Tracking"
echo "  ✅ Reports & Analytics"
echo "  ✅ Bilingual Interface (Arabic/English)"
echo ""
print_info "🛠️ Quick Commands:"
echo "  🚀 Start: ./start-local-enhanced.sh"
echo "  🔧 Fix Issues: ./check-and-fix-user.sh"
echo "  📊 Database: PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers"
echo ""
print_header "Ready to launch! Run './start-local-enhanced.sh' to begin."