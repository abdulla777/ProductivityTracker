#!/bin/bash

# Quick Setup Checker for Local Development
# Verifies all requirements are met before running the application

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

echo -e "${BLUE}🔍 Checking Local Development Environment${NC}"
echo -e "${BLUE}========================================${NC}"

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_status "Node.js $(node --version) is installed"
    else
        print_warning "Node.js version is $NODE_VERSION, recommended version is 18+"
    fi
else
    print_error "Node.js is not installed"
    echo "Install with: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    print_status "npm $(npm --version) is available"
else
    print_error "npm is not available"
    exit 1
fi

# Check PostgreSQL
if command -v psql >/dev/null 2>&1; then
    print_status "PostgreSQL is installed"
    
    # Check if PostgreSQL service is running
    if sudo systemctl is-active --quiet postgresql 2>/dev/null; then
        print_status "PostgreSQL service is running"
    else
        print_warning "PostgreSQL service is not running"
        echo "Start with: sudo systemctl start postgresql"
    fi
else
    print_error "PostgreSQL is not installed"
    echo "Install with: sudo apt-get install -y postgresql postgresql-contrib"
    exit 1
fi

# Check .env file
if [ -f ".env" ]; then
    print_status ".env file exists"
    
    # Check DATABASE_URL
    if grep -q "^DATABASE_URL=" .env; then
        DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2-)
        if [[ $DATABASE_URL == postgresql://* ]]; then
            print_status "DATABASE_URL is properly formatted"
        else
            print_warning "DATABASE_URL format may be incorrect"
        fi
    else
        print_error "DATABASE_URL not found in .env file"
    fi
    
    # Check other required variables
    for var in "NODE_ENV" "SESSION_SECRET"; do
        if grep -q "^${var}=" .env; then
            print_status "$var is set"
        else
            print_warning "$var is not set in .env file"
        fi
    done
else
    print_error ".env file not found"
    echo "Run setup-local.sh to create it"
    exit 1
fi

# Check package.json and node_modules
if [ -f "package.json" ]; then
    print_status "package.json exists"
    
    if [ -d "node_modules" ]; then
        print_status "node_modules directory exists"
    else
        print_warning "node_modules not found"
        echo "Run: npm install"
    fi
else
    print_error "package.json not found"
    echo "Make sure you're in the correct project directory"
    exit 1
fi

# Test database connection
print_info "Testing database connection..."
if [ -f ".env" ]; then
    # Source .env file
    export $(grep -v '^#' .env | xargs)
    
    if [ -n "$PGPASSWORD" ] && [ -n "$PGUSER" ] && [ -n "$PGDATABASE" ]; then
        if PGPASSWORD=$PGPASSWORD psql -h localhost -U $PGUSER -d $PGDATABASE -c "SELECT 1;" >/dev/null 2>&1; then
            print_status "Database connection successful"
            
            # Check if admin user exists
            if PGPASSWORD=$PGPASSWORD psql -h localhost -U $PGUSER -d $PGDATABASE -c "SELECT username FROM users WHERE username = 'admin';" -t 2>/dev/null | grep -q admin; then
                print_status "Admin user exists in database"
            else
                print_warning "Admin user not found in database"
                echo "You may need to run the database seeding script"
            fi
        else
            print_error "Database connection failed"
            echo "Check PostgreSQL service and credentials"
        fi
    else
        print_error "Database environment variables not properly set"
    fi
fi

echo ""
echo -e "${BLUE}📋 Summary:${NC}"

# Count issues
ERRORS=$(print_error "dummy" 2>&1 | wc -l)

if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓ Environment is ready for development!${NC}"
    echo ""
    echo -e "${YELLOW}🚀 To start the application:${NC}"
    echo -e "   ${BLUE}node start-local.js${NC}   (recommended)"
    echo -e "   ${BLUE}npm run dev${NC}         (standard)"
    echo ""
    echo -e "${YELLOW}🔑 Login credentials:${NC}"
    echo -e "   Username: ${GREEN}admin${NC}"
    echo -e "   Password: ${GREEN}admin123${NC}"
else
    echo -e "${YELLOW}⚠ Some issues found. Please fix them before starting the application.${NC}"
    echo ""
    echo -e "${YELLOW}Need help? Check:${NC}"
    echo -e "   - ${BLUE}دليل_التثبيت_المحلي.md${NC} (Arabic guide)"
    echo -e "   - ${BLUE}LOCAL_DEVELOPMENT_GUIDE.md${NC} (English guide)"
    echo -e "   - Run ${BLUE}./setup-local.sh${NC} for automated setup"
fi