#!/bin/bash

# Quick fix for local login issue
# Updates admin password to work with current authentication system

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Fixing admin login for local development...${NC}"

# Source .env file to get database credentials
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Update admin password to plain text for local development
PGPASSWORD=$PGPASSWORD psql -h localhost -U $PGUSER -d $PGDATABASE << 'EOF'
UPDATE users 
SET password = 'admin123' 
WHERE username = 'admin';

SELECT 
    username, 
    CASE 
        WHEN password = 'admin123' THEN 'Plain text (OK for local dev)'
        ELSE 'Hashed (may cause issues)'
    END as password_status,
    full_name, 
    role, 
    is_active 
FROM users 
WHERE username = 'admin';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Admin password updated successfully${NC}"
    echo -e "${GREEN}✓ You can now login with: admin / admin123${NC}"
    echo -e "${BLUE}Note: This uses plain text passwords for local development only${NC}"
else
    echo "Error: Failed to update admin password"
    exit 1
fi