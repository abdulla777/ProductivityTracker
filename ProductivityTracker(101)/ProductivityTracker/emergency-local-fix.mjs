#!/usr/bin/env node

/**
 * Emergency Local Database Fix - ES Module Version
 * Fixes missing columns in user's local PostgreSQL database
 * Run: node emergency-local-fix.mjs
 */

import pg from 'pg';
import readline from 'readline';

const { Pool } = pg;

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function print(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function printSuccess(message) {
    print('✅ ' + message, 'green');
}

function printError(message) {
    print('❌ ' + message, 'red');
}

function printWarning(message) {
    print('⚠️ ' + message, 'yellow');
}

function printInfo(message) {
    print('ℹ️ ' + message, 'blue');
}

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'productivity_tracker',
    user: 'postgres',
    password: 'postgres'
};

async function testDatabaseConnection() {
    print('\n🔌 Testing database connection...');
    
    try {
        const pool = new Pool(dbConfig);
        const client = await pool.connect();
        
        const result = await client.query('SELECT NOW()');
        printSuccess('Database connection successful');
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        printError('Database connection failed: ' + error.message);
        print('\n💡 Please check:');
        print('   - PostgreSQL is running on localhost:5432');
        print('   - Database "productivity_tracker" exists');
        print('   - Username/password are correct');
        return false;
    }
}

async function checkTableStructure() {
    print('\n📋 Checking attendance table structure...');
    
    try {
        const pool = new Pool(dbConfig);
        const client = await pool.connect();
        
        // Check if attendance table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'attendance'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            printError('attendance table does not exist');
            client.release();
            await pool.end();
            return false;
        }
        
        // Check for required columns
        const columnCheck = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'attendance' 
            ORDER BY ordinal_position;
        `);
        
        const columns = columnCheck.rows.map(row => row.column_name);
        const hasClockInTime = columns.includes('clock_in_time');
        const hasClockOutTime = columns.includes('clock_out_time');
        
        printInfo('Current attendance table columns:');
        columns.forEach(col => print('   - ' + col));
        
        if (!hasClockInTime || !hasClockOutTime) {
            printWarning('Missing required columns: clock_in_time and/or clock_out_time');
        } else {
            printSuccess('All required columns present');
        }
        
        client.release();
        await pool.end();
        return { hasClockInTime, hasClockOutTime };
    } catch (error) {
        printError('Failed to check table structure: ' + error.message);
        return false;
    }
}

async function applyDatabaseFix() {
    print('\n🔧 Applying database schema fix...');
    
    try {
        const pool = new Pool(dbConfig);
        const client = await pool.connect();
        
        // Add missing columns to attendance table
        print('Adding clock_in_time column...');
        await client.query(`
            ALTER TABLE attendance 
            ADD COLUMN IF NOT EXISTS clock_in_time TEXT;
        `);
        
        print('Adding clock_out_time column...');
        await client.query(`
            ALTER TABLE attendance 
            ADD COLUMN IF NOT EXISTS clock_out_time TEXT;
        `);
        
        // Create staff_evaluations table if missing
        print('Creating staff_evaluations table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS staff_evaluations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                project_id INTEGER REFERENCES projects(id),
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comments TEXT,
                evaluated_by INTEGER NOT NULL REFERENCES users(id),
                evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Add assigned_at column to project_staff
        print('Adding assigned_at column to project_staff...');
        await client.query(`
            ALTER TABLE project_staff 
            ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        
        // Create notifications table if missing
        print('Creating notifications table...');
        await client.query(`
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
        `);
        
        printSuccess('Database schema fix applied successfully!');
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        printError('Failed to apply database fix: ' + error.message);
        return false;
    }
}

async function testAttendanceCreation() {
    print('\n🧪 Testing attendance record creation...');
    
    try {
        const pool = new Pool(dbConfig);
        const client = await pool.connect();
        
        // Test inserting an attendance record
        const result = await client.query(`
            INSERT INTO attendance (user_id, date, clock_in_time, clock_out_time, is_present, notes, recorded_by) 
            VALUES (1, CURRENT_DATE, '09:00:00', '17:00:00', true, 'Emergency fix test', 1)
            RETURNING id, user_id, date, clock_in_time, clock_out_time, notes;
        `);
        
        if (result.rows.length > 0) {
            const record = result.rows[0];
            printSuccess('Attendance record created successfully!');
            print('   ID: ' + record.id);
            print('   User ID: ' + record.user_id);
            print('   Date: ' + record.date);
            print('   Clock In: ' + record.clock_in_time);
            print('   Clock Out: ' + record.clock_out_time);
            print('   Notes: ' + record.notes);
        }
        
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        printError('Failed to test attendance creation: ' + error.message);
        return false;
    }
}

async function main() {
    print('🚀 Emergency Local Database Fix for ProductivityTracker');
    print('================================================');
    
    // Step 1: Test database connection
    const connectionOk = await testDatabaseConnection();
    if (!connectionOk) {
        printError('Cannot proceed without database connection');
        process.exit(1);
    }
    
    // Step 2: Check table structure
    const tableStructure = await checkTableStructure();
    if (!tableStructure) {
        printError('Cannot proceed without valid table structure');
        process.exit(1);
    }
    
    // Step 3: Apply fix if needed
    if (!tableStructure.hasClockInTime || !tableStructure.hasClockOutTime) {
        const fixApplied = await applyDatabaseFix();
        if (!fixApplied) {
            printError('Database fix failed');
            process.exit(1);
        }
        
        // Step 4: Test the fix
        const testPassed = await testAttendanceCreation();
        if (!testPassed) {
            printWarning('Fix applied but test failed. Please check manually.');
            process.exit(1);
        }
    } else {
        printSuccess('Database schema is already correct!');
    }
    
    print('\n🎉 SUCCESS: Your local database is now fixed!');
    print('✅ Manual attendance registration should now work');
    print('✅ All HTTP 500 errors should be resolved');
    print('✅ Dashboard attendance views should load properly');
    
    print('\n📋 Next steps:');
    print('1. Restart your application: npm run dev');
    print('2. Test manual attendance registration');
    print('3. Verify dashboard functionality');
    
    print('\n🔗 If you still have issues, please check:');
    print('- The application is using the correct database connection');
    print('- No other database instances are interfering');
    print('- All required tables exist in your database');
}

// Run the fix
main().catch(error => {
    printError('Unexpected error: ' + error.message);
    process.exit(1);
});