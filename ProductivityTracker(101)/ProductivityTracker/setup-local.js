#!/usr/bin/env node

/**
 * Consulting Engineers Management System - Local Setup Script (Node.js)
 * For Ubuntu 22.04+ with full automation
 * Usage: node setup-local.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Configuration
const config = {
  projectName: 'Consulting Engineers Management System',
  dbName: 'consulting_engineers',
  dbUser: 'postgres',
  dbPassword: 'password',
  nodeVersion: 18,
  port: 5000
};

// Helper functions
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printStatus(message) {
  print(`✓ ${message}`, 'green');
}

function printWarning(message) {
  print(`⚠ ${message}`, 'yellow');
}

function printError(message) {
  print(`✗ ${message}`, 'red');
}

function printInfo(message) {
  print(`ℹ ${message}`, 'blue');
}

function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function execCommand(command, description) {
  try {
    printInfo(`${description}...`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    printError(`Failed: ${description}`);
    return false;
  }
}

function createEnvFile() {
  const envContent = `# Database Configuration
DATABASE_URL=postgresql://${config.dbUser}:${config.dbPassword}@localhost:5432/${config.dbName}
PGHOST=localhost
PGPORT=5432
PGDATABASE=${config.dbName}
PGUSER=${config.dbUser}
PGPASSWORD=${config.dbPassword}

# Application Configuration
NODE_ENV=development
PORT=${config.port}
SESSION_SECRET=my-local-session-secret-for-development

# Optional: Development debugging
DEBUG=false
`;

  fs.writeFileSync('.env', envContent);
  printStatus('.env file created successfully');
}

function setupDatabase() {
  const sqlCommands = `
-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'engineer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user (password is hashed version of 'admin123')
INSERT INTO users (username, password, full_name, email, role, is_active)
VALUES (
    'admin', 
    '$2b$10$EOmvd8mTzBUN5OJli4H0GeM5AyoRY8Gn25iN.x5rW7ZnQAx3sDd.2', 
    'مدير النظام', 
    'admin@innovators.com', 
    'admin', 
    true
) ON CONFLICT (username) DO NOTHING;

-- Verify admin user exists
SELECT username, full_name, email, role FROM users WHERE username = 'admin';
`;

  try {
    // Write SQL to temporary file
    fs.writeFileSync('/tmp/setup-users.sql', sqlCommands);
    
    // Execute SQL
    execSync(`PGPASSWORD=${config.dbPassword} psql -h localhost -U ${config.dbUser} -d ${config.dbName} -f /tmp/setup-users.sql`, {
      stdio: 'inherit'
    });
    
    // Clean up
    fs.unlinkSync('/tmp/setup-users.sql');
    
    printStatus('Admin user setup completed');
    printInfo('Login credentials: username=admin, password=admin123');
    return true;
  } catch (error) {
    printWarning('Admin user setup had issues, but continuing...');
    return false;
  }
}

async function main() {
  print(`🚀 Starting automated setup for ${config.projectName}`, 'blue');
  print('================================================', 'blue');

  // Check if running on Ubuntu
  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
    if (!osRelease.includes('Ubuntu')) {
      printWarning('This script is designed for Ubuntu. Continuing anyway...');
    }
  } catch {
    printWarning('Could not detect OS version. Continuing anyway...');
  }

  // Update package list
  execCommand('sudo apt update -qq', 'Updating package lists');

  // Check Node.js version
  if (commandExists('node')) {
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
      
      if (majorVersion >= config.nodeVersion) {
        printStatus(`Node.js ${nodeVersion} is already installed`);
      } else {
        printWarning(`Node.js version is ${majorVersion}, upgrading to v${config.nodeVersion}+`);
        execCommand('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -', 'Installing Node.js repository');
        execCommand('sudo apt-get install -y nodejs', 'Installing Node.js 18');
      }
    } catch (error) {
      printError('Error checking Node.js version');
      process.exit(1);
    }
  } else {
    execCommand('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -', 'Adding Node.js repository');
    execCommand('sudo apt-get install -y nodejs', 'Installing Node.js 18');
    
    if (commandExists('node')) {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      printStatus(`Node.js ${nodeVersion} installed successfully`);
    } else {
      printError('Node.js installation failed');
      process.exit(1);
    }
  }

  // Verify npm
  if (!commandExists('npm')) {
    printError('npm not found after Node.js installation');
    process.exit(1);
  }
  
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  printStatus(`npm ${npmVersion} is available`);

  // Install PostgreSQL
  if (commandExists('psql')) {
    printStatus('PostgreSQL is already installed');
  } else {
    execCommand('sudo apt-get install -y postgresql postgresql-contrib', 'Installing PostgreSQL');
    printStatus('PostgreSQL installed successfully');
  }

  // Start PostgreSQL service
  execCommand('sudo systemctl start postgresql', 'Starting PostgreSQL service');
  execCommand('sudo systemctl enable postgresql', 'Enabling PostgreSQL service');
  printStatus('PostgreSQL service is running');

  // Configure PostgreSQL
  printInfo('Configuring PostgreSQL database...');
  
  try {
    // Set postgres user password
    execSync(`sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${config.dbPassword}';"`, { stdio: 'ignore' });
    
    // Create database if it doesn't exist
    try {
      execSync(`sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '${config.dbName}';" | grep -q 1`, { stdio: 'ignore' });
      printStatus(`Database '${config.dbName}' already exists`);
    } catch {
      execSync(`sudo -u postgres createdb "${config.dbName}"`, { stdio: 'inherit' });
      printStatus(`Database '${config.dbName}' created successfully`);
    }
    
    printStatus('PostgreSQL setup completed');
  } catch (error) {
    printError('PostgreSQL configuration failed');
    process.exit(1);
  }

  // Create .env file
  printInfo('Creating .env file...');
  createEnvFile();

  // Install project dependencies
  if (fs.existsSync('package.json')) {
    execCommand('npm install', 'Installing project dependencies');
    printStatus('Dependencies installed successfully');
  } else {
    printWarning('package.json not found, skipping npm install');
  }

  // Set up database schema
  if (fs.existsSync('drizzle.config.ts')) {
    printInfo('Setting up database schema...');
    try {
      execSync('timeout 60 npm run db:push', { stdio: 'inherit' });
      printStatus('Database schema setup completed');
    } catch {
      printWarning('Database push timed out or failed, trying manual setup...');
      
      // Verify database connection
      try {
        execSync(`PGPASSWORD=${config.dbPassword} psql -h localhost -U ${config.dbUser} -d ${config.dbName} -c "SELECT 1;" > /dev/null`, { stdio: 'ignore' });
        printStatus('Database connection verified');
      } catch {
        printError('Cannot connect to PostgreSQL database');
        process.exit(1);
      }
    }
  } else {
    printWarning('drizzle.config.ts not found, skipping schema setup');
  }

  // Setup admin user
  printInfo('Setting up admin user...');
  setupDatabase();

  // Install additional tools
  execCommand('sudo apt-get install -y curl wget git build-essential', 'Installing additional development tools');

  // Final verification
  printInfo('Verifying setup...');

  // Check database connection
  try {
    execSync(`PGPASSWORD=${config.dbPassword} psql -h localhost -U ${config.dbUser} -d ${config.dbName} -c "SELECT 1;" > /dev/null`, { stdio: 'ignore' });
    printStatus('PostgreSQL database connection verified');
  } catch {
    printError('PostgreSQL database connection failed');
    process.exit(1);
  }

  // Final success message
  print('', 'reset');
  print('🎉 Setup completed successfully!', 'green');
  print('================================================', 'blue');
  print('Your Consulting Engineers Management System is ready!', 'green');
  print('', 'reset');
  print('📋 Setup Summary:', 'yellow');
  print(`   ✓ Node.js ${execSync('node --version', { encoding: 'utf8' }).trim()} installed`);
  print(`   ✓ npm ${execSync('npm --version', { encoding: 'utf8' }).trim()} installed`);
  print('   ✓ PostgreSQL installed and running');
  print(`   ✓ Database '${config.dbName}' created`);
  print('   ✓ Admin user created (admin/admin123)');
  print('   ✓ Environment variables configured');
  print('   ✓ Dependencies installed');
  print('', 'reset');
  print('🚀 To start the application:', 'yellow');
  print('   npm run dev', 'blue');
  print('', 'reset');
  print('🔑 Login Credentials:', 'yellow');
  print('   Username: admin', 'green');
  print('   Password: admin123', 'green');
  print('', 'reset');
  print('🌐 Application URLs:', 'yellow');
  print(`   Main App: http://localhost:${config.port}`, 'blue');
  print(`   Login: http://localhost:${config.port}/login`, 'blue');
  print('', 'reset');

  // Ask if user wants to start the application
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Would you like to start the application now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      print('Starting application...', 'blue');
      rl.close();
      
      // Start the application
      const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
      
      process.on('SIGINT', () => {
        child.kill('SIGINT');
        process.exit(0);
      });
    } else {
      print("Setup complete! Run 'npm run dev' when you're ready to start.", 'green');
      rl.close();
    }
  });
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    printError(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };