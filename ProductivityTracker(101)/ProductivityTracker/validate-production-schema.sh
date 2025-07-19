#!/bin/bash

# Production Database Schema Validation

print_status() {
    echo -e "\033[0;32m[$(date '+%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

print_error() {
    echo -e "\033[0;31m[$(date '+%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

print_status "Validating production database schema..."

# Check critical tables exist
TABLES=("users" "clients" "projects" "leave_requests" "attendance" "notifications")

for table in "${TABLES[@]}"; do
    if psql $DATABASE_URL -c "SELECT 1 FROM $table LIMIT 1;" &>/dev/null; then
        print_status "✅ Table '$table' exists and accessible"
    else
        print_error "❌ Table '$table' missing or inaccessible"
    fi
done

# Check critical columns
print_status "Checking critical nullable columns..."
psql $DATABASE_URL -c "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('start_date', 'target_end_date');"
psql $DATABASE_URL -c "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name IN ('type', 'start_date', 'end_date');"

print_status "Schema validation completed"
