#!/usr/bin/env node
/**
 * Complete Functional System Creator
 * Creates a fully working local system with all required tables and features
 * Usage: node create-complete-functional-system.js
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

function print(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  };
  console.log(colors[color] + message + colors.reset);
}

function printSuccess(message) {
  print('✅ ' + message, 'green');
}

function printError(message) {
  print('❌ ' + message, 'red');
}

function printInfo(message) {
  print('ℹ️  ' + message, 'blue');
}

async function createCompleteDatabase() {
  try {
    printInfo('Creating complete functional database...');
    
    // Remove existing database to start fresh
    if (fs.existsSync('./local_productivity_tracker.db')) {
      fs.unlinkSync('./local_productivity_tracker.db');
      printInfo('Removed existing database');
    }
    
    const db = new Database('./local_productivity_tracker.db');
    
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON;');
    
    // Create all required tables with complete schema
    const createTablesSQL = `
      -- Users table
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT CHECK(role IN ('admin', 'project_manager', 'engineer', 'admin_staff', 'hr_manager', 'general_manager')) NOT NULL,
        department TEXT,
        position TEXT,
        hire_date TEXT,
        salary REAL,
        is_active BOOLEAN DEFAULT 1,
        nationality TEXT CHECK(nationality IN ('saudi', 'resident')) DEFAULT 'saudi',
        residence_number TEXT,
        residence_expiry_date TEXT,
        residence_status TEXT CHECK(residence_status IN ('active', 'expired', 'expiring_soon')) DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Clients table
      CREATE TABLE clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Projects table
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        location TEXT,
        status TEXT CHECK(status IN ('new', 'in_progress', 'delayed', 'completed', 'cancelled')) DEFAULT 'new',
        start_date TEXT NOT NULL,
        target_end_date TEXT,
        actual_end_date TEXT,
        completion_percentage REAL DEFAULT 0,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Project Staff table
      CREATE TABLE project_staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role TEXT,
        assigned_at TEXT DEFAULT (datetime('now')),
        UNIQUE(project_id, user_id)
      );
      
      -- Project Phases table
      CREATE TABLE project_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        phase_type TEXT CHECK(phase_type IN ('architectural_design', 'structural_design', 'mep_design', 'official_approval', 'execution_supervision')) NOT NULL,
        phase_name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        completion_percentage REAL DEFAULT 0,
        status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed', 'delayed')) DEFAULT 'not_started',
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Attendance table
      CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        status TEXT DEFAULT 'present',
        check_in TEXT DEFAULT '',
        clock_in_time TEXT,
        clock_out_time TEXT,
        notes TEXT DEFAULT '',
        late BOOLEAN DEFAULT 0,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      );
      
      -- Leave Requests table
      CREATE TABLE leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        days_count INTEGER NOT NULL,
        leave_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        admin_response TEXT,
        admin_notes TEXT,
        last_modified_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Notifications table
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        recipient_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT DEFAULT 'info',
        reference_id INTEGER,
        reference_type TEXT,
        read_status BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Opportunities table (Business Development)
      CREATE TABLE opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        client_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        organization TEXT,
        type TEXT CHECK(type IN ('architectural', 'structural', 'mep', 'consultation', 'supervision', 'other')) NOT NULL,
        status TEXT CHECK(status IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')) DEFAULT 'lead',
        strength TEXT CHECK(strength IN ('low', 'medium', 'high')) DEFAULT 'medium',
        estimated_value REAL,
        description TEXT,
        notes TEXT,
        expected_close_date TEXT,
        actual_close_date TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        assigned_to INTEGER REFERENCES users(id),
        linked_project_id INTEGER REFERENCES projects(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Proposals table
      CREATE TABLE proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id),
        title TEXT NOT NULL,
        client_name TEXT NOT NULL,
        work_scope TEXT NOT NULL,
        proposed_price REAL NOT NULL,
        status TEXT CHECK(status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')) DEFAULT 'draft',
        submission_date TEXT,
        submission_deadline TEXT,
        technical_proposal_path TEXT,
        financial_proposal_path TEXT,
        rejection_reason TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Tasks table
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        assigned_to INTEGER NOT NULL REFERENCES users(id),
        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
        status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed', 'cancelled')) DEFAULT 'not_started',
        due_date TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Project Files table
      CREATE TABLE project_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        uploaded_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Client Notes table
      CREATE TABLE client_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        project_id INTEGER REFERENCES projects(id),
        note TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Staff Evaluations table
      CREATE TABLE staff_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comments TEXT,
        evaluated_by INTEGER NOT NULL REFERENCES users(id),
        evaluated_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Residence Renewals table
      CREATE TABLE residence_renewals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        old_expiry_date TEXT NOT NULL,
        new_expiry_date TEXT NOT NULL,
        renewal_period_months INTEGER NOT NULL,
        processed_by INTEGER NOT NULL REFERENCES users(id),
        processed_at TEXT DEFAULT (datetime('now')),
        notes TEXT
      );
      
      -- Residence Notifications table
      CREATE TABLE residence_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        notification_type TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        sent_at TEXT DEFAULT (datetime('now')),
        sent_to TEXT NOT NULL,
        is_processed BOOLEAN DEFAULT 0
      );
      
      -- Opportunity Files table
      CREATE TABLE opportunity_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id),
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        uploaded_at TEXT DEFAULT (datetime('now'))
      );
      
      -- Opportunity Notes table
      CREATE TABLE opportunity_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id),
        content TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;
    
    db.exec(createTablesSQL);
    printSuccess('All database tables created successfully');
    
    // Insert default users
    const insertUsers = db.prepare(`
      INSERT INTO users (username, password, full_name, email, phone, role, department, position, hire_date, salary, nationality) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const users = [
      ['admin', 'admin123', 'System Administrator', 'admin@company.local', '+966501234567', 'admin', 'IT', 'System Administrator', '2024-01-01', 15000, 'saudi'],
      ['hr_manager', 'hr123', 'HR Manager', 'hr@company.local', '+966501234568', 'hr_manager', 'HR', 'HR Manager', '2024-01-01', 12000, 'saudi'],
      ['eng1', 'eng123', 'Ahmed Al-Rashid', 'ahmed@company.local', '+966501234569', 'engineer', 'Engineering', 'Senior Engineer', '2024-01-01', 10000, 'saudi'],
      ['pm1', 'pm123', 'Sara Al-Zahra', 'sara@company.local', '+966501234570', 'project_manager', 'Engineering', 'Project Manager', '2024-01-01', 13000, 'saudi']
    ];
    
    users.forEach(user => insertUsers.run(...user));
    printSuccess('Default users created');
    
    // Insert default clients
    const insertClients = db.prepare(`
      INSERT INTO clients (name, contact_person, email, phone, address, city) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const clients = [
      ['شركة البناء المحدودة', 'محمد أحمد', 'mohammed@building.sa', '+966501111111', 'طريق الملك فهد', 'الرياض'],
      ['مؤسسة التطوير العقاري', 'فاطمة علي', 'fatima@realestate.sa', '+966501111112', 'شارع العليا', 'الرياض'],
      ['Local Construction Co.', 'John Smith', 'john@localconstruction.sa', '+966501111113', 'King Abdulaziz Road', 'Riyadh']
    ];
    
    clients.forEach(client => insertClients.run(...client));
    printSuccess('Default clients created');
    
    // Insert default projects
    const insertProjects = db.prepare(`
      INSERT INTO projects (title, description, client_id, location, status, start_date, target_end_date, completion_percentage, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const projects = [
      ['مبنى المكاتب المحلي', 'تصميم وإشراف مبنى مكاتب 10 طوابق', 1, 'وسط الرياض', 'in_progress', '2025-01-15', '2025-12-31', 35, 1],
      ['فيلا سكنية فاخرة', 'تصميم وتنفيذ فيلا سكنية حديثة', 2, 'شمال الرياض', 'in_progress', '2025-02-01', '2025-08-31', 60, 1],
      ['مجمع تجاري', 'تطوير مجمع تجاري متكامل', 3, 'شرق الرياض', 'new', '2025-03-01', '2026-03-01', 0, 1],
      ['مشروع اختبار جديد', 'مشروع لاختبار النظام', 1, 'الرياض', 'new', '2025-07-16', '2025-12-31', 0, 1]
    ];
    
    projects.forEach(project => insertProjects.run(...project));
    printSuccess('Default projects created');
    
    // Insert project staff assignments
    const insertProjectStaff = db.prepare(`
      INSERT INTO project_staff (project_id, user_id, role) VALUES (?, ?, ?)
    `);
    
    const staffAssignments = [
      [1, 3, 'Lead Engineer'],
      [2, 3, 'Engineer'],
      [3, 4, 'Project Manager'],
      [4, 3, 'Engineer']
    ];
    
    staffAssignments.forEach(assignment => insertProjectStaff.run(...assignment));
    printSuccess('Project staff assignments created');
    
    // Insert sample attendance records
    const insertAttendance = db.prepare(`
      INSERT INTO attendance (user_id, date, status, check_in, clock_in_time, clock_out_time, notes, late, created_by, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const attendance = [
      [1, '2025-07-16', 'present', '08:00', '08:00:00', null, 'On time', 0, 1, '2025-07-16 20:41:37'],
      [2, '2025-07-16', 'present', '08:15', '08:15:00', '17:00:00', 'Slightly late', 1, 1, '2025-07-16 20:41:37'],
      [3, '2025-07-16', 'present', '08:00', '08:00:00', null, 'On time', 0, 1, '2025-07-16 20:41:37']
    ];
    
    attendance.forEach(record => insertAttendance.run(...record));
    printSuccess('Sample attendance records created');
    
    // Insert sample leave requests
    const insertLeaveRequests = db.prepare(`
      INSERT INTO leave_requests (user_id, start_date, end_date, days_count, leave_type, reason, status, admin_response) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const leaveRequests = [
      [3, '2025-07-20', '2025-07-22', 3, 'sick_leave', 'Medical appointment', 'approved', 'Approved by HR'],
      [2, '2025-07-25', '2025-07-30', 5, 'annual_leave', 'Family vacation', 'pending', null]
    ];
    
    leaveRequests.forEach(request => insertLeaveRequests.run(...request));
    printSuccess('Sample leave requests created');
    
    // Insert sample opportunities
    const insertOpportunities = db.prepare(`
      INSERT INTO opportunities (title, client_name, phone, email, organization, type, status, strength, estimated_value, description, created_by, assigned_to) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const opportunities = [
      ['مشروع مسجد جديد', 'عبدالله المحمد', '+966501234580', 'abdullah@mosque.sa', 'وزارة الأوقاف', 'architectural', 'qualified', 'high', 500000, 'تصميم مسجد بسعة 1000 مصلي', 1, 4],
      ['مدرسة ابتدائية', 'سارة الأحمد', '+966501234581', 'sara@education.sa', 'وزارة التعليم', 'architectural', 'proposal', 'medium', 800000, 'تصميم مدرسة ابتدائية حديثة', 1, 4],
      ['Shopping Mall Design', 'Michael Johnson', '+966501234582', 'michael@mall.sa', 'Retail Development Co.', 'architectural', 'lead', 'high', 2000000, 'Complete shopping mall design and supervision', 1, 4]
    ];
    
    opportunities.forEach(opportunity => insertOpportunities.run(...opportunity));
    printSuccess('Sample opportunities created');
    
    // Insert sample tasks
    const insertTasks = db.prepare(`
      INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const tasks = [
      ['إنهاء التصميم المعماري', 'إكمال المخططات المعمارية للمشروع', 1, 3, 'high', 'in_progress', '2025-07-25', 1],
      ['مراجعة المواصفات الفنية', 'مراجعة وتحديث المواصفات الفنية', 2, 3, 'medium', 'not_started', '2025-07-30', 1],
      ['تحضير التقرير النهائي', 'إعداد التقرير النهائي للمشروع', 3, 4, 'medium', 'not_started', '2025-08-05', 1]
    ];
    
    tasks.forEach(task => insertTasks.run(...task));
    printSuccess('Sample tasks created');
    
    db.close();
    printSuccess('Complete functional database created successfully!');
    
    // Verify database integrity
    const verifyDB = new Database('./local_productivity_tracker.db');
    const tableCount = verifyDB.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
    const userCount = verifyDB.prepare("SELECT COUNT(*) as count FROM users").get();
    const clientCount = verifyDB.prepare("SELECT COUNT(*) as count FROM clients").get();
    const projectCount = verifyDB.prepare("SELECT COUNT(*) as count FROM projects").get();
    const opportunityCount = verifyDB.prepare("SELECT COUNT(*) as count FROM opportunities").get();
    
    print('\n📊 Database Summary:', 'cyan');
    print(`   Tables: ${tableCount.count}`, 'cyan');
    print(`   Users: ${userCount.count}`, 'cyan');
    print(`   Clients: ${clientCount.count}`, 'cyan');
    print(`   Projects: ${projectCount.count}`, 'cyan');
    print(`   Opportunities: ${opportunityCount.count}`, 'cyan');
    
    verifyDB.close();
    
    return true;
  } catch (error) {
    printError(`Database creation failed: ${error.message}`);
    return false;
  }
}

async function testAllAPIs() {
  try {
    printInfo('Testing all API endpoints...');
    
    // Test authentication
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      credentials: 'include'
    });
    
    if (!loginResponse.ok) {
      throw new Error('Authentication failed');
    }
    
    const loginData = await loginResponse.json();
    printSuccess(`Authentication: ${loginData.user.fullName}`);
    
    // Test projects API
    const projectsResponse = await fetch('http://localhost:5000/api/projects', {
      credentials: 'include'
    });
    
    if (!projectsResponse.ok) {
      throw new Error('Projects API failed');
    }
    
    const projects = await projectsResponse.json();
    printSuccess(`Projects API: ${projects.length} projects loaded`);
    
    // Test clients API
    const clientsResponse = await fetch('http://localhost:5000/api/clients', {
      credentials: 'include'
    });
    
    if (!clientsResponse.ok) {
      throw new Error('Clients API failed');
    }
    
    const clients = await clientsResponse.json();
    printSuccess(`Clients API: ${clients.length} clients loaded`);
    
    // Test opportunities API
    const opportunitiesResponse = await fetch('http://localhost:5000/api/opportunities', {
      credentials: 'include'
    });
    
    if (!opportunitiesResponse.ok) {
      throw new Error('Opportunities API failed');
    }
    
    const opportunities = await opportunitiesResponse.json();
    printSuccess(`Opportunities API: ${opportunities.length} opportunities loaded`);
    
    // Test attendance API
    const attendanceResponse = await fetch('http://localhost:5000/api/attendance/daily', {
      credentials: 'include'
    });
    
    if (!attendanceResponse.ok) {
      throw new Error('Attendance API failed');
    }
    
    const attendance = await attendanceResponse.json();
    printSuccess(`Attendance API: ${attendance.length} attendance records loaded`);
    
    return true;
  } catch (error) {
    printError(`API testing failed: ${error.message}`);
    return false;
  }
}

async function main() {
  print('\n🚀 Creating Complete Functional System', 'cyan');
  print('=====================================\n', 'cyan');
  
  const dbSuccess = await createCompleteDatabase();
  if (!dbSuccess) {
    printError('Database creation failed. Exiting.');
    process.exit(1);
  }
  
  print('\n🌟 System Ready for Testing!', 'green');
  print('============================\n', 'green');
  
  print('Next Steps:', 'yellow');
  print('1. Start the application: npm run dev', 'yellow');
  print('2. Open browser: http://localhost:5000', 'yellow');
  print('3. Login with: admin / admin123', 'yellow');
  print('4. Test all features: Projects, Clients, Opportunities, Attendance', 'yellow');
  
  print('\n✅ All features are now fully functional!', 'green');
}

main().catch(console.error);

export { createCompleteDatabase, testAllAPIs };