#!/bin/bash
# Daily automated backup script for PostgreSQL database
# ProductivityTracker - Innovators Consulting Engineers

# Configuration
BACKUP_DIR="/var/backups/productivity_tracker"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${PGDATABASE:-productivity_tracker}"
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-postgres}"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a "$LOG_FILE"
}

# Function to log colored output
log_colored() {
    color=$1
    message=$2
    echo -e "${color}$(date '+%Y-%m-%d %H:%M:%S'): $message${NC}" | tee -a "$LOG_FILE"
}

log_colored "$YELLOW" "Starting daily backup process..."

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    log_colored "$GREEN" "Created backup directory: $BACKUP_DIR"
fi

# Check if PostgreSQL is accessible
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    log_colored "$RED" "ERROR: PostgreSQL is not accessible"
    exit 1
fi

# Check disk space (require at least 1GB free)
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # 1GB in KB
    log_colored "$RED" "ERROR: Insufficient disk space for backup"
    exit 1
fi

log_colored "$YELLOW" "Creating backup of database: $DB_NAME"

# Create backup
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    log_colored "$GREEN" "Database backup created successfully"
    
    # Get file size before compression
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup file size: $BACKUP_SIZE"
    
    # Compress the backup
    if gzip "$BACKUP_FILE"; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
        log_colored "$GREEN" "Backup compressed successfully (${COMPRESSED_SIZE})"
        
        # Verify compressed backup integrity
        if zcat "$BACKUP_FILE.gz" | head -10 > /dev/null 2>&1; then
            log_colored "$GREEN" "Backup verification passed"
        else
            log_colored "$RED" "WARNING: Backup verification failed"
        fi
        
        # Clean up old backups (keep last 30 days)
        log_colored "$YELLOW" "Cleaning up old backups..."
        OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +30)
        if [ -n "$OLD_BACKUPS" ]; then
            echo "$OLD_BACKUPS" | xargs rm -f
            OLD_COUNT=$(echo "$OLD_BACKUPS" | wc -l)
            log_colored "$GREEN" "Removed $OLD_COUNT old backup(s)"
        else
            log "No old backups to remove"
        fi
        
        # Log current backup count
        BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
        log "Total backups retained: $BACKUP_COUNT"
        
        log_colored "$GREEN" "Daily backup completed successfully: $BACKUP_FILE.gz"
        
    else
        log_colored "$RED" "ERROR: Backup compression failed"
        # Remove uncompressed file if compression failed
        [ -f "$BACKUP_FILE" ] && rm -f "$BACKUP_FILE"
        exit 1
    fi
    
else
    log_colored "$RED" "ERROR: Database backup failed"
    exit 1
fi

# Check if this is the first run (for cron setup reminder)
if [ ! -f "$BACKUP_DIR/.cron_setup" ]; then
    log_colored "$YELLOW" "First run detected. To enable automatic daily backups, add this to crontab:"
    log "0 2 * * * $(realpath "$0")"
    log "Run: sudo crontab -e"
    touch "$BACKUP_DIR/.cron_setup"
fi

log_colored "$GREEN" "Backup process completed successfully"
exit 0