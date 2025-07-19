#!/bin/bash

# Complete Local Setup for Consulting Engineers Management System
# Handles PostgreSQL installation, database creation, and schema setup

echo "🚀 Complete Local Setup for Consulting Engineers Management System"
echo "================================================================="

# Function to print colored output
print_status() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

print_info() {
    echo -e "\033[1;34mℹ $1\033[0m"
}

print_warning() {
    echo -e "\033[1;33m⚠ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m✗ $1\033[0m"
}

# Check if script is run with sudo for PostgreSQL installation
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root/sudo. It will ask for sudo when needed."
    exit 1
fi

# Update system packages
print_info "Updating system packages..."
sudo apt update

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    print_info "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    print_status "PostgreSQL installed"
else
    print_status "PostgreSQL already installed"
fi

# Start PostgreSQL service
print_info "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_status "PostgreSQL service started"

# Setup database and user
print_info "Setting up database and user..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS consulting_engineers;"
sudo -u postgres psql -c "CREATE DATABASE consulting_engineers;"
sudo -u postgres psql -c "DROP USER IF EXISTS postgres;"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'password';"
sudo -u postgres psql -c "ALTER USER postgres CREATEDB;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE consulting_engineers TO postgres;"
print_status "Database and user created"

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed"
else
    print_status "Node.js already installed ($(node --version))"
fi

# Install project dependencies
print_info "Installing project dependencies..."
npm install
print_status "Dependencies installed"

# Add pg dependency for local PostgreSQL
print_info "Adding PostgreSQL driver..."
npm install pg @types/pg
print_status "PostgreSQL driver added"

# Create environment file for local development
print_info "Creating local environment file..."
cat > .env.local << EOF
NODE_ENV=development
LOCAL_DEVELOPMENT=true
DATABASE_URL=postgresql://postgres:password@localhost:5432/consulting_engineers
PORT=5000
SESSION_SECRET=consulting-engineers-local-secret-key-2025
EOF
print_status "Environment file created (.env.local)"

# Initialize database schema
print_info "Initializing database schema..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -f create-full-schema.sql
if [ $? -eq 0 ]; then
    print_status "Database schema initialized"
else
    print_error "Failed to initialize database schema"
    exit 1
fi

# Create local startup script
print_info "Creating local startup script..."
cat > start-local.sh << 'EOF'
#!/bin/bash

# Load local environment
export $(cat .env.local | xargs)

echo "🚀 Starting Consulting Engineers Management System (Local)"
echo "========================================================"
echo "Environment: LOCAL_DEVELOPMENT=true"
echo "Database: $DATABASE_URL"
echo "Port: $PORT"
echo ""

# Check PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "📋 Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Test database connection
echo "📋 Testing database connection..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT 'Database connection successful!' as status;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Start the application
echo "📋 Starting application..."
npm run dev
EOF

chmod +x start-local.sh
print_status "Local startup script created (start-local.sh)"

# Test database connection
print_info "Testing database connection..."
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT 'Connection successful!' as status;"
if [ $? -eq 0 ]; then
    print_status "Database connection test successful"
else
    print_error "Database connection test failed"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
print_status "PostgreSQL installed and configured"
print_status "Database 'consulting_engineers' created"
print_status "Schema initialized with residence management"
print_status "Admin user: admin / admin123"
print_status "HR Manager: hr_manager / hr123"
print_status "Test residents created"
echo ""
echo "🚀 To start the application:"
echo "   ./start-local.sh"
echo ""
echo "🌐 Application will be available at:"
echo "   http://localhost:5000"
echo ""
print_info "All residence management features are ready:"
print_info "- Staff creation with nationality selection"
print_info "- Residence permit tracking"
print_info "- Automated expiry notifications"
print_info "- HR renewal workflow"