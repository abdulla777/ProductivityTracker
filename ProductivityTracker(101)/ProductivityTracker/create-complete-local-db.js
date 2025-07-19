/**
 * COMPLETE SQLite Database Creation Script
 * Creates local database with ALL required columns
 * Solves missing "check_in", "notes", and other column errors
 */

import Database from 'better-sqlite3';
import fs from 'fs';

function print(message, color = 'reset') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createCompleteDatabase() {
  try {
    // Remove old database if exists
    if (fs.existsSync('./local_productivity_tracker.db')) {
      fs.unlinkSync('./local_productivity_tracker.db');
      print('🗑️ Removed old database file', 'yellow');
    }

    // Create new SQLite database
    const db = new Database('./local_productivity_tracker.db');
    
    print('🏗️ Creating complete SQLite database with ALL required columns...', 'blue');
    
    // Enable foreign key constraints
    db.exec('PRAGMA foreign_keys = ON;');
    
    // Create complete schema with ALL required columns
    db.exec(`
      -- Users table with all required columns
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'engineer',
        is_active BOOLEAN DEFAULT 1,
        nationality TEXT DEFAULT 'saudi',
        residence_number TEXT,
        residence_expiry_date TEXT,
        residence_status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Clients table with notes column
      CREATE TABLE clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Projects table
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        client_id INTEGER,
        location TEXT,
        status TEXT DEFAULT 'new',
        priority TEXT DEFAULT 'medium',
        start_date TEXT,
        target_end_date TEXT,
        actual_end_date TEXT,
        completion_percentage REAL DEFAULT 0,
        budget REAL,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
      
      -- Attendance table with check_in column and all other required columns
      CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'present',
        check_in TEXT DEFAULT '',
        clock_in_time TEXT,
        clock_out_time TEXT,
        notes TEXT DEFAULT '',
        late BOOLEAN DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
      
      -- Leave Requests table with notes column
      CREATE TABLE leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        days_count INTEGER NOT NULL,
        leave_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT DEFAULT '',
        admin_notes TEXT DEFAULT '',
        approved_by INTEGER,
        approved_at TEXT,
        last_modified_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (last_modified_by) REFERENCES users(id)
      );
      
      -- Notifications table
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        recipient_id INTEGER NOT NULL,
        type TEXT DEFAULT 'info',
        reference_id INTEGER,
        reference_type TEXT,
        read_status BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (recipient_id) REFERENCES users(id)
      );
      
      -- Project Phases table
      CREATE TABLE project_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        phase TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'not_started',
        start_date TEXT,
        end_date TEXT,
        completion_percentage REAL DEFAULT 0,
        remarks TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
      
      -- Project Staff table
      CREATE TABLE project_staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        assigned_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Project Files table
      CREATE TABLE project_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        phase_id INTEGER,
        file_name TEXT NOT NULL,
        file_description TEXT,
        file_type TEXT,
        file_url TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        uploaded_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (phase_id) REFERENCES project_phases(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );
      
      -- Client Notes table
      CREATE TABLE client_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        note TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
      
      -- Tasks table
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        assigned_to INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        completion_percentage REAL DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
      
      -- Staff Evaluations table
      CREATE TABLE staff_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        evaluator_id INTEGER NOT NULL,
        evaluation_period TEXT NOT NULL,
        performance_score INTEGER,
        technical_skills INTEGER,
        communication INTEGER,
        teamwork INTEGER,
        comments TEXT,
        evaluated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (evaluator_id) REFERENCES users(id)
      );
      
      -- Leave Approvals table
      CREATE TABLE leave_approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leave_request_id INTEGER NOT NULL,
        approved_by INTEGER NOT NULL,
        status TEXT NOT NULL,
        comments TEXT,
        approved_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      );
      
      -- Residence Renewals table
      CREATE TABLE residence_renewals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        old_expiry_date TEXT NOT NULL,
        new_expiry_date TEXT NOT NULL,
        renewed_by INTEGER NOT NULL,
        renewal_date TEXT DEFAULT (datetime('now')),
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (renewed_by) REFERENCES users(id)
      );
      
      -- Residence Notifications table
      CREATE TABLE residence_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL,
        sent_at TEXT DEFAULT (datetime('now')),
        expiry_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    print('✅ All tables created with complete schema', 'green');
    
    // Insert sample data with all required fields
    print('📊 Inserting sample data...', 'blue');
    
    // Insert users
    db.exec(`
      INSERT INTO users (username, password, full_name, email, phone, role, is_active, created_at) VALUES
      ('admin', 'admin123', 'System Administrator', 'admin@company.local', '+966501234567', 'admin', 1, datetime('now')),
      ('hr_manager', 'hr123', 'HR Manager', 'hr@company.local', '+966501234568', 'hr_manager', 1, datetime('now')),
      ('eng1', 'eng123', 'Engineer Ahmed', 'ahmed@company.local', '+966501234569', 'engineer', 1, datetime('now')),
      ('pm1', 'pm123', 'Project Manager Sarah', 'sarah@company.local', '+966501234570', 'project_manager', 1, datetime('now'));
    `);
    
    // Insert clients with notes field
    db.exec(`
      INSERT INTO clients (name, contact_person, email, phone, address, city, notes, created_at) VALUES
      ('Local Construction Co.', 'Ali Hassan', 'ali@localconstruction.com', '+966501111111', '123 Business District', 'Riyadh', 'Major client since 2020', datetime('now')),
      ('Infrastructure Development Corp.', 'Fatima Ahmed', 'fatima@infrastructure.com', '+966502222222', '456 Industrial Area', 'Jeddah', 'Specializes in large infrastructure projects', datetime('now')),
      ('Modern Buildings Ltd.', 'Omar Salem', 'omar@modernbuildings.com', '+966503333333', '789 Downtown', 'Dammam', 'Focuses on commercial buildings', datetime('now'));
    `);
    
    // Insert projects
    db.exec(`
      INSERT INTO projects (title, description, client_id, location, status, start_date, target_end_date, completion_percentage, created_by, created_at) VALUES
      ('Local Office Building', 'Design and supervision of 10-story office building', 1, 'Riyadh Downtown', 'in_progress', '2025-01-15', '2025-12-31', 35, 1, datetime('now')),
      ('Residential Complex Phase 1', 'Architectural and structural design for residential complex', 2, 'Jeddah North', 'new', '2025-02-01', '2026-01-31', 0, 1, datetime('now')),
      ('Shopping Mall Development', 'Complete design and supervision of shopping mall', 3, 'Dammam Central', 'planning', '2025-03-01', '2026-12-31', 5, 1, datetime('now'));
    `);
    
    // Insert sample attendance with check_in column
    db.exec(`
      INSERT INTO attendance (user_id, date, status, check_in, clock_in_time, notes, late, created_by, created_at) VALUES
      (1, '2025-07-16', 'present', '08:00', '08:00:00', 'On time', 0, 1, datetime('now')),
      (2, '2025-07-16', 'present', '08:30', '08:30:00', 'Slightly late', 1, 1, datetime('now')),
      (3, '2025-07-16', 'present', '07:45', '07:45:00', 'Early arrival', 0, 1, datetime('now'));
    `);
    
    // Insert sample leave requests with notes
    db.exec(`
      INSERT INTO leave_requests (user_id, start_date, end_date, days_count, leave_type, reason, status, notes, created_at) VALUES
      (2, '2025-07-20', '2025-07-22', 3, 'vacation', 'Family vacation', 'pending', 'Need time off for family trip', datetime('now')),
      (3, '2025-07-25', '2025-07-25', 1, 'sick', 'Medical appointment', 'approved', 'Doctor visit scheduled', datetime('now'));
    `);
    
    db.close();
    
    print('✅ Complete SQLite database created successfully!', 'green');
    print('📁 Database file: ./local_productivity_tracker.db', 'blue');
    print('👥 Sample data: 4 users, 3 clients, 3 projects, 3 attendance records', 'blue');
    print('🔑 Admin login: admin / admin123', 'green');
    print('🎯 ALL required columns included: check_in, notes, etc.', 'green');
    
  } catch (error) {
    print(`❌ Error creating database: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
createCompleteDatabase();