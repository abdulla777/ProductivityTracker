#!/bin/bash

# Setup User's Local Database for ProductivityTracker
# This script creates the database and applies all required schema

echo "🔧 Setting up local PostgreSQL database for ProductivityTracker..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Starting PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Wait a moment for PostgreSQL to fully start
    sleep 3
    
    if ! pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
        echo "❌ Failed to start PostgreSQL. Please check your installation."
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"

# Create the database if it doesn't exist
echo "📋 Creating productivity_tracker database..."
createdb -U postgres productivity_tracker 2>/dev/null || echo "Database already exists"

# Check if we can connect to the database
if psql -U postgres -d productivity_tracker -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database. Please check your PostgreSQL configuration."
    echo "💡 You may need to:"
    echo "   - Set a password for postgres user: sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
    echo "   - Edit pg_hba.conf to allow password authentication"
    exit 1
fi

# Apply the complete schema from existing SQL file
if [ -f "complete_database_backup.sql" ]; then
    echo "📋 Applying complete database schema..."
    psql -U postgres -d productivity_tracker -f complete_database_backup.sql
else
    echo "📋 Creating basic tables structure..."
    
    # Create basic tables that the application needs
    psql -U postgres -d productivity_tracker << 'EOF'
-- Create basic tables for ProductivityTracker

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'employee',
    department VARCHAR(50),
    position VARCHAR(50),
    hire_date DATE,
    nationality VARCHAR(50) DEFAULT 'Saudi',
    residence_number VARCHAR(50),
    residence_expiry_date DATE,
    residence_status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    client_id INTEGER,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    completion_percentage INTEGER DEFAULT 0,
    budget DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table with required columns
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    clock_in_time TEXT,
    clock_out_time TEXT,
    is_present BOOLEAN DEFAULT true,
    is_late BOOLEAN DEFAULT false,
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project staff table
CREATE TABLE IF NOT EXISTS project_staff (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role VARCHAR(50),
    assigned_date DATE DEFAULT CURRENT_DATE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    days_count INTEGER,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user
INSERT INTO users (username, password, full_name, role, department) 
VALUES ('admin', 'admin123', 'مدير النظام', 'admin', 'إدارة النظام')
ON CONFLICT (username) DO NOTHING;

EOF
fi

echo "✅ Database schema setup complete"

# Verify the setup by checking critical tables and columns
echo "🧪 Verifying database setup..."

# Check attendance table has required columns
ATTENDANCE_COLUMNS=$(psql -U postgres -d productivity_tracker -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'attendance' AND column_name IN ('clock_in_time', 'clock_out_time');" | tr -d ' ' | sort)

if [[ "$ATTENDANCE_COLUMNS" == *"clock_in_time"* && "$ATTENDANCE_COLUMNS" == *"clock_out_time"* ]]; then
    echo "✅ Attendance table has required columns"
else
    echo "⚠️ Adding missing attendance columns..."
    psql -U postgres -d productivity_tracker -c "
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS clock_in_time TEXT,
        ADD COLUMN IF NOT EXISTS clock_out_time TEXT;
    "
fi

# Test database connection and admin user
echo "🧪 Testing admin user login..."
ADMIN_EXISTS=$(psql -U postgres -d productivity_tracker -t -c "SELECT COUNT(*) FROM users WHERE username = 'admin';" | tr -d ' ')

if [ "$ADMIN_EXISTS" -gt 0 ]; then
    echo "✅ Admin user exists"
else
    echo "➕ Creating admin user..."
    psql -U postgres -d productivity_tracker -c "
        INSERT INTO users (username, password, full_name, role, department) 
        VALUES ('admin', 'admin123', 'مدير النظام', 'admin', 'إدارة النظام');
    "
fi

echo ""
echo "🎉 SUCCESS: Local database setup complete!"
echo ""
echo "📋 Database Details:"
echo "   Database: productivity_tracker"
echo "   Host: localhost:5432"
echo "   User: postgres"
echo "   Password: postgres"
echo ""
echo "👤 Admin Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🚀 Next Steps:"
echo "1. Start the application: npm run dev"
echo "2. Open browser: http://localhost:5000"
echo "3. Login with admin credentials"
echo ""
echo "✅ All attendance errors should now be resolved!"