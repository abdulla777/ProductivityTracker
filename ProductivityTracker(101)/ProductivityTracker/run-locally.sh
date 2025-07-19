#!/bin/bash

# Script to run the application locally with correct environment
# This ensures local PostgreSQL is used instead of Replit's environment

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Application in Local Mode${NC}"
echo -e "${BLUE}=====================================${NC}"

# Force local environment variables
export NODE_ENV=development
export LOCAL_DEVELOPMENT=true
export DATABASE_URL=postgresql://postgres:password@localhost:5432/consulting_engineers
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=consulting_engineers
export PGUSER=postgres
export PGPASSWORD=password
export PORT=5000
export SESSION_SECRET=my-local-session-secret-for-development
export DISABLE_WEBSOCKETS=true

# Clear any Replit-specific environment variables
unset REPLIT_DOMAINS
unset REPLIT_DB_URL

echo -e "${YELLOW}Environment Variables Set:${NC}"
echo "NODE_ENV: $NODE_ENV"
echo "LOCAL_DEVELOPMENT: $LOCAL_DEVELOPMENT"
echo "DATABASE_URL: $DATABASE_URL"
echo "PORT: $PORT"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}Starting PostgreSQL service...${NC}"
    sudo systemctl start postgresql
fi

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
PGPASSWORD=$PGPASSWORD psql -h localhost -U $PGUSER -d $PGDATABASE -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Setting up database...${NC}"
    sudo -u postgres createdb consulting_engineers 2>/dev/null || true
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';" 2>/dev/null || true
fi

# Start the application
echo -e "${GREEN}Starting application with local environment...${NC}"
npm run dev