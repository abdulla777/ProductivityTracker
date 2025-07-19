#!/usr/bin/env node

/**
 * إصلاح شامل لقاعدة البيانات المحلية
 * Complete Local Database Fix Script
 * 
 * Usage: node apply-local-database-fix.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

// تحميل متغيرات البيئة
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// دالة طباعة ملونة
function print(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fixDatabase() {
  try {
    print('🔧 بدء إصلاح قاعدة البيانات المحلية...', 'cyan');
    
    // قراءة سكريبت الإصلاح
    const sqlScript = fs.readFileSync('./fix-local-database-complete.sql', 'utf8');
    
    // تنفيذ السكريبت
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // تقسيم السكريبت إلى أوامر منفصلة
      const commands = sqlScript.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            await client.query(command);
            print(`✅ تم تنفيذ: ${command.trim().substring(0, 50)}...`, 'green');
          } catch (error) {
            if (error.code !== '42P07' && error.code !== '42701') { // تجاهل "already exists" errors
              print(`⚠️  خطأ في: ${command.trim().substring(0, 50)}... - ${error.message}`, 'yellow');
            }
          }
        }
      }
      
      await client.query('COMMIT');
      print('✅ تم إصلاح قاعدة البيانات بنجاح!', 'green');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    print(`❌ خطأ في إصلاح قاعدة البيانات: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function testConnection() {
  try {
    print('🔍 اختبار الاتصال بقاعدة البيانات...', 'blue');
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    print('✅ الاتصال بقاعدة البيانات ناجح!', 'green');
    return true;
  } catch (error) {
    print(`❌ فشل الاتصال بقاعدة البيانات: ${error.message}`, 'red');
    return false;
  }
}

async function verifyFix() {
  try {
    print('🔍 التحقق من الإصلاح...', 'blue');
    
    const client = await pool.connect();
    
    // فحص project_files
    const filesResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'project_files' AND column_name IN ('phase_id', 'file_description', 'file_type')
    `);
    
    // فحص project_phases
    const phasesResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'project_phases' AND column_name = 'description'
    `);
    
    client.release();
    
    if (filesResult.rows.length >= 3 && phasesResult.rows.length >= 1) {
      print('✅ جميع الأعمدة المطلوبة موجودة!', 'green');
      return true;
    } else {
      print('❌ بعض الأعمدة لا تزال مفقودة!', 'red');
      return false;
    }
    
  } catch (error) {
    print(`❌ خطأ في التحقق: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  print('🚀 بدء سكريبت إصلاح قاعدة البيانات المحلية', 'magenta');
  
  // اختبار الاتصال
  if (!(await testConnection())) {
    return;
  }
  
  // إصلاح قاعدة البيانات
  await fixDatabase();
  
  // التحقق من الإصلاح
  if (await verifyFix()) {
    print('🎉 تم إصلاح قاعدة البيانات بنجاح! يمكنك الآن استخدام النظام.', 'green');
  } else {
    print('❌ فشل في إصلاح قاعدة البيانات. يرجى المحاولة مرة أخرى.', 'red');
  }
  
  await pool.end();
}

// تشغيل السكريبت
main().catch(console.error);