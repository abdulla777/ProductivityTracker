import { createRequire } from 'module';
import * as schema from "@shared/schema";

const require = createRequire(import.meta.url);

// Force local database only - using SQLite for complete local solution
console.log("🏠 Using LOCAL SQLite database - No external connections");

const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');

// Create or connect to SQLite database file
const sqlite = new Database('./local_productivity_tracker.db');
const db = drizzle(sqlite, { schema });

// Initialize database tables and data
try {
  // Enable foreign key constraints
  sqlite.exec('PRAGMA foreign_keys = ON;');
  
  // Create all necessary tables
  sqlite.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'engineer',
      is_active BOOLEAN DEFAULT true,
      nationality TEXT DEFAULT 'saudi',
      residence_number TEXT,
      residence_expiry_date TEXT,
      residence_status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    -- Clients table
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    
    -- Project phases table
    CREATE TABLE IF NOT EXISTS project_phases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      phase TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'not_started',
      start_date TEXT,
      end_date TEXT,
      completion_percentage REAL DEFAULT 0,
      remarks TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    
    -- Project files table
    CREATE TABLE IF NOT EXISTS project_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      phase_id INTEGER,
      file_name TEXT NOT NULL,
      file_description TEXT,
      file_type TEXT,
      file_url TEXT NOT NULL,
      uploaded_by INTEGER NOT NULL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (phase_id) REFERENCES project_phases(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
    
    -- Project staff assignments
    CREATE TABLE IF NOT EXISTS project_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      project_id INTEGER,
      assigned_to INTEGER,
      assigned_by INTEGER,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );
    
    -- Attendance table
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      clock_in_time TEXT,
      clock_out_time TEXT,
      notes TEXT DEFAULT '',
      is_late BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- Leave requests table
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days_count INTEGER NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at TEXT,
      employee_notes TEXT,
      admin_notes TEXT,
      last_modified_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (last_modified_by) REFERENCES users(id)
    );
    
    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      reference_type TEXT,
      reference_id INTEGER,
      priority TEXT DEFAULT 'medium',
      is_read BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- Residence renewals table
    CREATE TABLE IF NOT EXISTS residence_renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      old_expiry_date TEXT NOT NULL,
      new_expiry_date TEXT NOT NULL,
      renewal_date TEXT DEFAULT (date('now')),
      notes TEXT,
      processed_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (processed_by) REFERENCES users(id)
    );
    
    -- Residence notifications table
    CREATE TABLE IF NOT EXISTS residence_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      notification_type TEXT NOT NULL,
      sent_date TEXT DEFAULT (date('now')),
      expiry_date TEXT NOT NULL,
      days_until_expiry INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- Staff evaluations table
    CREATE TABLE IF NOT EXISTS staff_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      evaluator_id INTEGER NOT NULL,
      evaluation_period TEXT,
      performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 10),
      comments TEXT,
      strengths TEXT,
      areas_for_improvement TEXT,
      goals TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (evaluator_id) REFERENCES users(id)
    );
    
    -- Database migrations tracking
    CREATE TABLE IF NOT EXISTS database_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Insert initial data if not exists
  const adminExists = sqlite.prepare("SELECT id FROM users WHERE username = ?").get('admin');
  if (!adminExists) {
    console.log("📊 Initializing local database with sample data...");
    
    // Insert default users
    const insertUser = sqlite.prepare(`
      INSERT INTO users (username, password, full_name, email, role, nationality, residence_expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run('admin', 'admin123', 'System Administrator', 'admin@company.local', 'admin', 'saudi', '2025-12-31');
    insertUser.run('hr_manager', 'hr123', 'HR Manager', 'hr@company.local', 'hr_manager', 'saudi', '2025-12-31');
    insertUser.run('engineer1', 'eng123', 'Senior Engineer', 'engineer1@company.local', 'engineer', 'resident', '2025-12-31');
    insertUser.run('manager1', 'mgr123', 'Project Manager', 'manager1@company.local', 'project_manager', 'saudi', '2025-12-31');
    
    // Insert sample clients
    const insertClient = sqlite.prepare(`
      INSERT INTO clients (name, contact_person, email, phone, city)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertClient.run('Local Construction Co.', 'Ahmed Ali', 'ahmed@localconstruction.com', '+966501234567', 'Riyadh');
    insertClient.run('Engineering Solutions Ltd.', 'Sarah Mohammed', 'sarah@engsolutions.com', '+966502345678', 'Jeddah');
    insertClient.run('Infrastructure Development Corp.', 'Omar Hassan', 'omar@infrastructure.com', '+966503456789', 'Dammam');
    
    // Insert sample projects
    const insertProject = sqlite.prepare(`
      INSERT INTO projects (title, description, client_id, location, status, priority, start_date, target_end_date, completion_percentage, budget, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertProject.run('Local Office Building', 'Design and supervision of 10-story office building', 1, 'Riyadh Downtown', 'in_progress', 'high', '2025-01-15', '2025-12-31', 35, 2500000.00, 1);
    insertProject.run('Residential Complex Phase 1', 'Architectural and structural design for residential complex', 2, 'Jeddah North', 'new', 'medium', '2025-02-01', '2026-01-31', 0, 1800000.00, 1);
    insertProject.run('Industrial Facility', 'MEP design for manufacturing facility', 3, 'Dammam Industrial City', 'in_progress', 'urgent', '2024-12-01', '2025-06-30', 60, 3200000.00, 1);
    
    // Insert project phases
    const insertPhase = sqlite.prepare(`
      INSERT INTO project_phases (project_id, phase, description, status, start_date, end_date, completion_percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertPhase.run(1, 'architectural_design', 'Architectural design phase', 'completed', '2025-01-15', '2025-03-15', 100);
    insertPhase.run(1, 'structural_design', 'Structural design phase', 'in_progress', '2025-03-01', '2025-05-31', 70);
    insertPhase.run(1, 'mep_design', 'MEP design phase', 'not_started', '2025-05-01', '2025-07-31', 0);
    
    // Insert project staff assignments
    const insertStaff = sqlite.prepare("INSERT INTO project_staff (project_id, user_id) VALUES (?, ?)");
    insertStaff.run(1, 3); // engineer1 assigned to project 1
    insertStaff.run(1, 4); // manager1 assigned to project 1
    insertStaff.run(2, 3); // engineer1 assigned to project 2
    insertStaff.run(3, 4); // manager1 assigned to project 3
    
    // Insert sample attendance
    const insertAttendance = sqlite.prepare(`
      INSERT INTO attendance (user_id, date, clock_in_time, clock_out_time, notes, is_late)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    insertAttendance.run(3, yesterday, '08:00:00', '17:00:00', 'Regular day', 0);
    insertAttendance.run(4, yesterday, '08:30:00', '17:30:00', 'Slightly late due to traffic', 1);
    insertAttendance.run(3, today, '08:15:00', null, 'Currently working', 0);
    
    console.log("✅ Local SQLite database initialized successfully with sample data");
  } else {
    console.log("✅ Local SQLite database found with existing data");
  }
  
  // Verify database works
  const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM users").get();
  console.log(`📊 Database ready with ${userCount.count} users`);
  
} catch (error) {
  console.error("❌ Error initializing local database:", error);
  throw error;
}

// Export both db and sqlite instance for compatibility
export { db, sqlite as pool };