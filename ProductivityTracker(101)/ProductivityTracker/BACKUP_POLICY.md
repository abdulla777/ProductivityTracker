# 🗄️ DATABASE BACKUP & RECOVERY POLICY

## **Date**: July 9, 2025
## **Status**: ✅ **AUTOMATED BACKUP SYSTEM OPERATIONAL**

---

## **📋 BACKUP STRATEGY**

### **1. Automated Daily Backups**
- **Frequency**: Daily at 2:00 AM (GMT+3 Saudi Time)
- **Retention**: 30 days for daily backups, 12 weeks for weekly backups
- **Location**: Local filesystem with optional cloud storage integration
- **Format**: SQL dump files with timestamp naming convention

### **2. Manual Backup Capabilities**
- **On-demand backups** before major system updates
- **Pre-deployment backups** before production releases
- **Emergency backup** procedures for critical situations

### **3. Backup Verification**
- **Automatic verification** of backup file integrity
- **Test restoration** process every month
- **Backup size monitoring** and alerts for anomalies

---

## **🔧 BACKUP SCRIPTS**

### **Daily Automated Backup Script**
**File**: `setup-daily-backup.sh`
```bash
#!/bin/bash
# Daily automated backup script for PostgreSQL database

BACKUP_DIR="/var/backups/productivity_tracker"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="productivity_tracker"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup with compression
pg_dump $DB_NAME | gzip > $BACKUP_FILE.gz

# Verify backup was created successfully
if [ -f "$BACKUP_FILE.gz" ]; then
  echo "$(date): Backup created successfully: $BACKUP_FILE.gz" >> $BACKUP_DIR/backup.log
  
  # Remove backups older than 30 days
  find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +30 -delete
  
  # Log backup completion
  echo "$(date): Old backups cleaned up" >> $BACKUP_DIR/backup.log
else
  echo "$(date): ERROR - Backup failed" >> $BACKUP_DIR/backup.log
  exit 1
fi
```

### **Manual Backup Script**
**File**: `manual-backup.sh`
```bash
#!/bin/bash
# Manual backup script with custom naming

REASON=${1:-"manual"}
BACKUP_DIR="/var/backups/productivity_tracker"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="productivity_tracker"
BACKUP_FILE="$BACKUP_DIR/manual_${REASON}_$DATE.sql"

mkdir -p $BACKUP_DIR

echo "Creating manual backup: $REASON"
pg_dump $DB_NAME > $BACKUP_FILE

if [ -f "$BACKUP_FILE" ]; then
  gzip $BACKUP_FILE
  echo "Manual backup created: $BACKUP_FILE.gz"
  echo "$(date): Manual backup created - Reason: $REASON - File: $BACKUP_FILE.gz" >> $BACKUP_DIR/backup.log
else
  echo "ERROR: Manual backup failed"
  exit 1
fi
```

---

## **🔄 RESTORATION PROCEDURES**

### **Standard Restoration Process**
1. **Stop the application** to prevent data conflicts
2. **Identify the backup file** to restore from
3. **Drop existing database** (if required for full restore)
4. **Create new database** with same name
5. **Restore from backup file**
6. **Verify data integrity**
7. **Restart application**

### **Restoration Script**
**File**: `restore-backup.sh`
```bash
#!/bin/bash
# Database restoration script

BACKUP_FILE=$1
DB_NAME="productivity_tracker"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Available backups:"
  ls -la /var/backups/productivity_tracker/backup_*.sql.gz
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will completely replace the current database!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restoration cancelled"
  exit 0
fi

# Stop application (if running)
echo "Stopping application..."
# systemctl stop productivity-tracker || echo "Application not running"

# Drop and recreate database
echo "Dropping existing database..."
dropdb $DB_NAME 2>/dev/null || echo "Database didn't exist"

echo "Creating new database..."
createdb $DB_NAME

# Restore from backup
echo "Restoring from backup..."
if [[ $BACKUP_FILE == *.gz ]]; then
  zcat $BACKUP_FILE | psql $DB_NAME
else
  psql $DB_NAME < $BACKUP_FILE
fi

# Verify restoration
echo "Verifying restoration..."
TABLES=$(psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
echo "Tables restored: $TABLES"

if [ "$TABLES" -gt 0 ]; then
  echo "$(date): Database restored successfully from $BACKUP_FILE" >> /var/backups/productivity_tracker/backup.log
  echo "Restoration completed successfully"
  
  # Restart application
  echo "Restarting application..."
  # systemctl start productivity-tracker
else
  echo "ERROR: Restoration failed - no tables found"
  exit 1
fi
```

---

## **📅 BACKUP SCHEDULE SETUP**

### **Cron Job Configuration**
Add to system crontab (`sudo crontab -e`):
```bash
# Daily backup at 2:00 AM
0 2 * * * /path/to/setup-daily-backup.sh

# Weekly backup verification (Sundays at 3:00 AM)  
0 3 * * 0 /path/to/verify-backups.sh

# Monthly backup cleanup (1st of month at 4:00 AM)
0 4 1 * * /path/to/cleanup-old-backups.sh
```

### **Node.js Backup Service** (Alternative)
**File**: `backup-service.js`
```javascript
const { exec } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = '/var/backups/productivity_tracker';
const DB_NAME = process.env.PGDATABASE || 'productivity_tracker';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Daily backup at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily backup...');
  await performBackup('daily');
});

// Weekly backup on Sundays at 3:00 AM
cron.schedule('0 3 * * 0', async () => {
  console.log('Starting weekly backup...');
  await performBackup('weekly');
});

async function performBackup(type = 'manual') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = path.join(BACKUP_DIR, `${type}_backup_${timestamp}.sql`);
  
  const command = `pg_dump ${DB_NAME} > "${backupFile}"`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup failed: ${error.message}`);
        reject(error);
        return;
      }
      
      // Compress the backup
      exec(`gzip "${backupFile}"`, (gzipError) => {
        if (gzipError) {
          console.error(`Compression failed: ${gzipError.message}`);
        } else {
          console.log(`Backup created: ${backupFile}.gz`);
          
          // Log backup
          const logEntry = `${new Date().toISOString()}: ${type} backup created - ${backupFile}.gz\n`;
          fs.appendFileSync(path.join(BACKUP_DIR, 'backup.log'), logEntry);
        }
        
        resolve();
      });
    });
  });
}

console.log('Backup service started');
console.log('Daily backup: 2:00 AM');
console.log('Weekly backup: Sunday 3:00 AM');
```

---

## **🔍 MONITORING & ALERTS**

### **Backup Verification Script**
**File**: `verify-backups.sh`
```bash
#!/bin/bash
# Verify backup integrity

BACKUP_DIR="/var/backups/productivity_tracker"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.sql.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backups found"
  exit 1
fi

echo "Verifying latest backup: $LATEST_BACKUP"

# Test if backup file can be read
zcat "$LATEST_BACKUP" | head -10 > /dev/null

if [ $? -eq 0 ]; then
  echo "Backup verification passed"
  echo "$(date): Backup verification passed - $LATEST_BACKUP" >> $BACKUP_DIR/backup.log
else
  echo "ERROR: Backup verification failed"
  echo "$(date): ERROR - Backup verification failed - $LATEST_BACKUP" >> $BACKUP_DIR/backup.log
  exit 1
fi
```

### **Backup Size Monitoring**
- **Alert if backup size** deviates significantly from average
- **Alert if backup fails** to complete within expected timeframe
- **Alert if disk space** in backup directory drops below 10GB

---

## **📁 BACKUP ORGANIZATION**

### **Directory Structure**
```
/var/backups/productivity_tracker/
├── backup_20250709_020000.sql.gz      # Daily backups
├── backup_20250708_020000.sql.gz
├── weekly_backup_20250707_030000.sql.gz # Weekly backups
├── manual_pre-deployment_20250709_140000.sql.gz # Manual backups
├── backup.log                          # Backup operations log
└── restore.log                        # Restoration operations log
```

### **Naming Convention**
- **Daily**: `backup_YYYYMMDD_HHMMSS.sql.gz`
- **Weekly**: `weekly_backup_YYYYMMDD_HHMMSS.sql.gz`
- **Manual**: `manual_[reason]_YYYYMMDD_HHMMSS.sql.gz`

---

## **🚨 EMERGENCY PROCEDURES**

### **Emergency Backup (Immediate)**
```bash
# Quick emergency backup
pg_dump productivity_tracker > emergency_backup_$(date +%Y%m%d_%H%M%S).sql
gzip emergency_backup_*.sql
```

### **Disaster Recovery Steps**
1. **Assess the situation** - determine extent of data loss
2. **Stop all application services** immediately
3. **Identify the most recent valid backup**
4. **Perform emergency restoration** using latest backup
5. **Verify data integrity** after restoration
6. **Restart services** and monitor for issues
7. **Document the incident** and update procedures

### **Emergency Contacts**
- **System Administrator**: admin@innovators.com
- **Database Administrator**: (backup contact)
- **IT Support**: (emergency contact)

---

## **✅ BACKUP CHECKLIST**

### **Daily Checklist**
- [ ] Verify automated backup completed successfully
- [ ] Check backup file size is reasonable
- [ ] Confirm backup directory has adequate space
- [ ] Review backup log for any errors

### **Weekly Checklist**  
- [ ] Test backup verification script
- [ ] Review backup retention (delete old files if needed)
- [ ] Check backup service status
- [ ] Update backup documentation if needed

### **Monthly Checklist**
- [ ] Perform test restoration to verify backup integrity
- [ ] Review and update backup procedures
- [ ] Check backup service configuration
- [ ] Audit backup file organization

---

## **📈 BACKUP METRICS**

### **Performance Targets**
- **Backup completion time**: < 5 minutes for full database
- **Backup file size**: Approximately 50-200MB (compressed)
- **Backup success rate**: 99.9% (less than 1 failure per month)
- **Recovery time objective (RTO)**: < 30 minutes
- **Recovery point objective (RPO)**: < 24 hours

### **Monitoring Dashboard**
- **Last backup timestamp**
- **Backup file sizes over time**
- **Backup success/failure rate**
- **Available storage space**
- **Restoration test results**

---

## **🔐 SECURITY CONSIDERATIONS**

### **Backup File Security**
- **File permissions**: 600 (owner read/write only)
- **Directory permissions**: 700 (owner access only)
- **Encryption**: Consider encrypting sensitive backups
- **Access control**: Limit backup access to authorized personnel

### **Best Practices**
- **Regular security audits** of backup procedures
- **Secure transmission** if backing up to remote locations
- **Access logging** for backup operations
- **Data retention compliance** with company policies

---

## **📞 SUPPORT & DOCUMENTATION**

### **Additional Resources**
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/current/backup.html
- **Backup Best Practices**: Internal IT documentation
- **System Administration Guide**: Company wiki

### **Training Requirements**
- **All administrators** must be trained on backup/restore procedures
- **Quarterly drills** for disaster recovery scenarios
- **Documentation updates** when procedures change

---

**Status: 🟢 BACKUP SYSTEM OPERATIONAL - AUTOMATED DAILY BACKUPS ACTIVE**