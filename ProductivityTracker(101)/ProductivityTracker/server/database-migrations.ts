/**
 * Automated Database Migrations
 * Ensures all required tables and columns exist on application startup
 * This runs automatically every time the server starts
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

interface Migration {
  id: string;
  description: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    id: 'add_attendance_time_columns',
    description: 'Add clock_in_time and clock_out_time columns to attendance table',
    sql: `
      ALTER TABLE attendance 
      ADD COLUMN IF NOT EXISTS clock_in_time TEXT,
      ADD COLUMN IF NOT EXISTS clock_out_time TEXT;
    `
  },
  {
    id: 'create_staff_evaluations_table',
    description: 'Create staff_evaluations table if missing',
    sql: `
      CREATE TABLE IF NOT EXISTS staff_evaluations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comments TEXT,
        evaluated_by INTEGER NOT NULL REFERENCES users(id),
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    id: 'add_project_staff_assigned_at',
    description: 'Add assigned_at column to project_staff table',
    sql: `
      ALTER TABLE project_staff 
      ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `
  },
  {
    id: 'create_notifications_table',
    description: 'Create notifications table if missing',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        priority TEXT DEFAULT 'low',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reference_id INTEGER,
        reference_type TEXT
      );
    `
  },
  {
    id: 'add_leave_request_audit_fields',
    description: 'Add admin notes and audit fields to leave requests',
    sql: `
      ALTER TABLE leave_requests 
      ADD COLUMN IF NOT EXISTS admin_notes TEXT,
      ADD COLUMN IF NOT EXISTS last_modified_by INTEGER REFERENCES users(id);
    `
  },
  {
    id: 'create_residence_tables',
    description: 'Create residence tracking tables',
    sql: `
      CREATE TABLE IF NOT EXISTS residence_renewals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        old_expiry_date DATE NOT NULL,
        new_expiry_date DATE NOT NULL,
        processed_by INTEGER NOT NULL REFERENCES users(id),
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
      
      CREATE TABLE IF NOT EXISTS residence_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        notification_type TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATE NOT NULL,
        days_until_expiry INTEGER NOT NULL
      );
    `
  }
];

async function createMigrationsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS database_migrations (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Failed to create migrations table:', error);
    throw error;
  }
}

async function getMigrationsApplied(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT id FROM database_migrations ORDER BY applied_at;
    `);
    return result.rows.map((row: any) => row.id);
  } catch (error) {
    // If migrations table doesn't exist, return empty array
    return [];
  }
}

async function applyMigration(migration: Migration): Promise<void> {
  try {
    console.log(`Applying migration: ${migration.description}`);
    
    // Execute the migration SQL
    await db.execute(sql.raw(migration.sql));
    
    // Record that this migration was applied
    await db.execute(sql`
      INSERT INTO database_migrations (id, description) 
      VALUES (${migration.id}, ${migration.description})
      ON CONFLICT (id) DO NOTHING;
    `);
    
    console.log(`✅ Migration completed: ${migration.id}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migration.id}`, error);
    throw error;
  }
}

export async function runDatabaseMigrations(): Promise<void> {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Get list of applied migrations
    const appliedMigrations = await getMigrationsApplied();
    
    // Apply pending migrations
    let migrationsApplied = 0;
    for (const migration of migrations) {
      if (!appliedMigrations.includes(migration.id)) {
        await applyMigration(migration);
        migrationsApplied++;
      }
    }
    
    if (migrationsApplied > 0) {
      console.log(`✅ Applied ${migrationsApplied} database migrations successfully`);
    } else {
      console.log('✅ Database schema is up to date');
    }
    
    // Verify critical attendance columns exist
    await verifyAttendanceTable();
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
}

async function verifyAttendanceTable(): Promise<void> {
  try {
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attendance' 
      AND column_name IN ('clock_in_time', 'clock_out_time')
      ORDER BY column_name;
    `);
    
    const columns = result.rows.map((row: any) => row.column_name);
    const hasClockInTime = columns.includes('clock_in_time');
    const hasClockOutTime = columns.includes('clock_out_time');
    
    if (hasClockInTime && hasClockOutTime) {
      console.log('✅ Attendance table verification passed - all required columns present');
    } else {
      console.error('❌ Attendance table verification failed - missing columns:', {
        clock_in_time: hasClockInTime,
        clock_out_time: hasClockOutTime
      });
      throw new Error('Critical attendance table columns are missing');
    }
  } catch (error) {
    console.error('❌ Failed to verify attendance table:', error);
    throw error;
  }
}