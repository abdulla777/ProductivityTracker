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
