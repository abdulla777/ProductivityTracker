#!/usr/bin/env node

/**
 * Local Development Starter
 * Ensures proper environment loading before starting the application
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printStatus(message) {
  print(`✓ ${message}`, 'green');
}

function printError(message) {
  print(`✗ ${message}`, 'red');
}

function printInfo(message) {
  print(`ℹ ${message}`, 'blue');
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    printError('.env file not found');
    print('Please run setup-local.sh first to create the environment file', 'yellow');
    process.exit(1);
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    }
    
    printStatus('.env file loaded successfully');
    return true;
  } catch (error) {
    printError(`Failed to load .env file: ${error.message}`);
    return false;
  }
}

function validateEnvironment() {
  const requiredVars = ['DATABASE_URL', 'NODE_ENV'];
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    printError(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  // Set local development flags
  process.env.LOCAL_DEVELOPMENT = 'true';
  process.env.DISABLE_WEBSOCKETS = 'true';
  
  printInfo(`DATABASE_URL: ${process.env.DATABASE_URL}`);
  printInfo(`NODE_ENV: ${process.env.NODE_ENV}`);
  printInfo(`LOCAL_DEVELOPMENT: ${process.env.LOCAL_DEVELOPMENT}`);
  printStatus('Environment validation passed');
  return true;
}

function testDatabaseConnection() {
  return new Promise((resolve) => {
    if (!process.env.PGPASSWORD || !process.env.PGUSER || !process.env.PGDATABASE) {
      printError('Database environment variables not properly set');
      resolve(false);
      return;
    }
    
    const { spawn } = require('child_process');
    const psql = spawn('psql', [
      '-h', 'localhost',
      '-U', process.env.PGUSER,
      '-d', process.env.PGDATABASE,
      '-c', 'SELECT 1;'
    ], {
      env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD },
      stdio: 'pipe'
    });
    
    psql.on('close', (code) => {
      if (code === 0) {
        printStatus('Database connection test passed');
        resolve(true);
      } else {
        printError('Database connection test failed');
        print('Make sure PostgreSQL is running and credentials are correct', 'yellow');
        resolve(false);
      }
    });
    
    psql.on('error', (error) => {
      printError(`Database test error: ${error.message}`);
      resolve(false);
    });
  });
}

async function startApplication() {
  print('🚀 Starting Consulting Engineers Management System (Local)', 'blue');
  print('================================================', 'blue');
  
  // Step 1: Load environment
  printInfo('Loading environment variables...');
  if (!loadEnvFile()) {
    process.exit(1);
  }
  
  // Step 2: Validate environment
  printInfo('Validating environment...');
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  // Step 3: Test database connection
  printInfo('Testing database connection...');
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    print('Database connection failed. Please check:', 'yellow');
    print('1. PostgreSQL service is running: sudo systemctl status postgresql', 'yellow');
    print('2. Database exists: psql -h localhost -U postgres -l', 'yellow');
    print('3. Credentials in .env file are correct', 'yellow');
    process.exit(1);
  }
  
  // Step 4: Start the application
  print('', 'reset');
  printStatus('All checks passed! Starting application...');
  print('', 'reset');
  
  // Start npm run dev with the loaded environment
  const npmProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: process.env
  });
  
  npmProcess.on('close', (code) => {
    print(`Application exited with code ${code}`, code === 0 ? 'green' : 'red');
  });
  
  npmProcess.on('error', (error) => {
    printError(`Failed to start application: ${error.message}`);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    print('\nShutting down application...', 'yellow');
    npmProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    print('\nShutting down application...', 'yellow');
    npmProcess.kill('SIGTERM');
  });
}

// Run the starter
if (require.main === module) {
  startApplication().catch((error) => {
    printError(`Startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { startApplication };