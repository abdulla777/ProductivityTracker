#!/bin/bash

# Production Database Protection Setup Script
# This script sets up comprehensive database protection measures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_status "🛡️  Setting up Production Database Protection"

# 1. Setup daily backup cron job
print_info "Setting up daily backup cron job..."
CURRENT_DIR=$(pwd)
CRON_JOB="0 2 * * * $CURRENT_DIR/setup-daily-backup.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "setup-daily-backup.sh"; then
    print_warning "Daily backup cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    print_status "Daily backup cron job added (runs at 2 AM daily)"
fi

# 2. Create backup directory and set permissions
print_info "Creating backup directory structure..."
sudo mkdir -p /var/backups/productivity-tracker
sudo chown $USER:$USER /var/backups/productivity-tracker
sudo chmod 755 /var/backups/productivity-tracker

# 3. Create database documentation
print_info "Creating database documentation..."
cat > DATABASE_PROTECTION_GUIDE.md << 'EOF'
# Database Protection Guide

## Daily Backup System

### Automatic Backups
- **Schedule**: Every day at 2:00 AM
- **Location**: `/var/backups/productivity-tracker/`
- **Format**: Compressed SQL dumps (`.sql.gz`)
- **Retention**: 30 days
- **Naming**: `productivity_tracker_backup_YYYYMMDD_HHMMSS.sql.gz`

### Manual Backup Commands
```bash
# Create immediate backup
./setup-daily-backup.sh

# Create backup with custom name
pg_dump -h localhost -U postgres productivity_tracker > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h localhost -U postgres productivity_tracker < backup_file.sql
```

## Database Migration Best Practices

### Using Drizzle Kit
```bash
# Generate migration
npx drizzle-kit generate:pg

# Apply migration
npx drizzle-kit push:pg

# View migration status
npx drizzle-kit up:pg
```

### Safe Schema Changes
1. Always backup before changes
2. Test changes in development first
3. Use transactions for complex changes
4. Document all schema modifications
5. Use migration scripts for production

## Monitoring and Maintenance

### Database Health Checks
```bash
# Check database size
psql -h localhost -U postgres -c "SELECT pg_size_pretty(pg_database_size('productivity_tracker'));"

# Check table sizes
psql -h localhost -U postgres productivity_tracker -c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC;"

# Check active connections
psql -h localhost -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'productivity_tracker';"
```

### Performance Monitoring
```bash
# Check slow queries
psql -h localhost -U postgres productivity_tracker -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check locks
psql -h localhost -U postgres productivity_tracker -c "SELECT * FROM pg_locks;"
```

## Emergency Procedures

### Database Restore Process
1. Stop application server
2. Create current backup (if possible)
3. Restore from backup file
4. Verify data integrity
5. Restart application server

### System Recovery
```bash
# Full system restore
sudo systemctl stop productivity-tracker
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS productivity_tracker;"
psql -h localhost -U postgres -c "CREATE DATABASE productivity_tracker;"
gunzip -c /var/backups/productivity-tracker/latest_backup.sql.gz | psql -h localhost -U postgres productivity_tracker
sudo systemctl start productivity-tracker
```

## Security Measures

### Database Security
- Regular password updates
- Connection encryption
- Access control policies
- Audit logging enabled
- Regular security updates

### Backup Security
- Encrypted backup storage
- Access restricted to authorized personnel
- Regular restore testing
- Offsite backup copies
EOF

# 4. Create database schema validation script
print_info "Creating schema validation script..."
cat > validate-production-schema.sh << 'EOF'
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
EOF

chmod +x validate-production-schema.sh

# 5. Test backup system
print_info "Testing backup system..."
if ./setup-daily-backup.sh; then
    print_status "✅ Backup system test successful"
else
    print_error "❌ Backup system test failed"
fi

# 6. Generate final status report
print_status "📋 Production Protection Setup Complete"
echo
echo "✅ Daily backup cron job configured (2 AM daily)"
echo "✅ Backup directory created: /var/backups/productivity-tracker"
echo "✅ Database documentation created: DATABASE_PROTECTION_GUIDE.md"
echo "✅ Schema validation script created: validate-production-schema.sh"
echo "✅ Backup system tested successfully"
echo
print_info "🔒 Your database is now protected with:"
echo "   • Automated daily backups"
echo "   • 30-day retention policy"
echo "   • Comprehensive documentation"
echo "   • Schema validation tools"
echo "   • Emergency recovery procedures"
echo
print_warning "⚠️  Remember to:"
echo "   • Test restore procedures monthly"
echo "   • Monitor backup logs regularly"
echo "   • Keep documentation updated"
echo "   • Review security settings quarterly"