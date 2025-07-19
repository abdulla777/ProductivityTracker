#!/usr/bin/env node

/**
 * Dependency Checker for Local Development
 * Validates that all required dependencies and configurations are in place
 */

import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log('🔍 Checking project dependencies and configuration...\n');

let hasErrors = false;
let hasWarnings = false;

function checkFile(filePath, description, required = true) {
  if (fs.existsSync(filePath)) {
    console.log(`${GREEN}✅ ${description}${RESET}`);
    return true;
  } else {
    if (required) {
      console.log(`${RED}❌ ${description} - Missing: ${filePath}${RESET}`);
      hasErrors = true;
    } else {
      console.log(`${YELLOW}⚠️  ${description} - Optional: ${filePath}${RESET}`);
      hasWarnings = true;
    }
    return false;
  }
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`${GREEN}✅ ${description}${RESET}`);
    return true;
  } else {
    console.log(`${RED}❌ ${description} - Missing directory: ${dirPath}${RESET}`);
    hasErrors = true;
    return false;
  }
}

// Check core project structure
console.log('📁 Project Structure:');
checkDirectory('client', 'Frontend directory');
checkDirectory('client/src', 'Frontend source directory');
checkDirectory('server', 'Backend directory');
checkDirectory('shared', 'Shared types directory');
checkFile('package.json', 'Package configuration');
checkFile('tsconfig.json', 'TypeScript configuration');

// Check configuration files
console.log('\n⚙️  Configuration Files:');
checkFile('vite.config.ts', 'Vite configuration');
checkFile('tailwind.config.ts', 'Tailwind configuration');
checkFile('drizzle.config.ts', 'Drizzle ORM configuration');
checkFile('.env', 'Environment variables', false);
checkFile('.env.example', 'Environment variables example');

// Check key source files
console.log('\n📄 Key Source Files:');
checkFile('client/src/App.tsx', 'Main React app');
checkFile('client/src/main.tsx', 'React entry point');
checkFile('server/index.ts', 'Server entry point');
checkFile('shared/schema.ts', 'Database schema');
checkFile('client/src/components/ui/toaster.tsx', 'Toast component');
checkFile('client/src/hooks/use-toast.ts', 'Toast hook');

// Check critical UI components
console.log('\n🧩 Critical UI Components:');
const uiComponents = [
  'button.tsx', 'card.tsx', 'dialog.tsx', 'form.tsx', 'input.tsx',
  'label.tsx', 'select.tsx', 'table.tsx', 'toast.tsx', 'tooltip.tsx'
];

uiComponents.forEach(component => {
  checkFile(`client/src/components/ui/${component}`, `UI Component: ${component}`);
});

// Check package.json dependencies
console.log('\n📦 Package Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'react', 'react-dom', 'typescript', 'vite', 'express',
    'drizzle-orm', 'tailwindcss', '@tanstack/react-query'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`${GREEN}✅ ${dep}${RESET}`);
    } else {
      console.log(`${RED}❌ Missing dependency: ${dep}${RESET}`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log(`${RED}❌ Error reading package.json: ${error.message}${RESET}`);
  hasErrors = true;
}

// Check for local development files
console.log('\n🛠️  Local Development Files:');
checkFile('README.md', 'Project documentation');
checkFile('vite.config.local.ts', 'Local Vite configuration', false);
checkFile('package.local.json', 'Local package configuration', false);
checkFile('setup-local.js', 'Local setup script', false);

// Environment check
console.log('\n🌍 Environment Check:');
if (fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('DATABASE_URL=')) {
      console.log(`${GREEN}✅ DATABASE_URL configured in .env${RESET}`);
    } else {
      console.log(`${YELLOW}⚠️  DATABASE_URL not found in .env${RESET}`);
      hasWarnings = true;
    }
  } catch (error) {
    console.log(`${YELLOW}⚠️  Could not read .env file${RESET}`);
    hasWarnings = true;
  }
} else {
  console.log(`${YELLOW}⚠️  .env file not found - copy from .env.example${RESET}`);
  hasWarnings = true;
}

// Summary
console.log('\n📊 Summary:');
if (hasErrors) {
  console.log(`${RED}❌ Found ${hasErrors ? 'errors' : 'no errors'} that must be fixed before running the project${RESET}`);
  console.log('\nTo fix errors:');
  console.log('1. Run: npm install');
  console.log('2. Copy .env.example to .env and configure DATABASE_URL');
  console.log('3. Ensure all required files are present');
} else if (hasWarnings) {
  console.log(`${YELLOW}⚠️  Found warnings but project should run${RESET}`);
  console.log('\nRecommended actions:');
  console.log('1. Create .env file from .env.example');
  console.log('2. Configure DATABASE_URL in .env');
} else {
  console.log(`${GREEN}✅ All dependencies and configurations look good!${RESET}`);
  console.log('\nYou can now run:');
  console.log('- npm run dev (start the application)');
  console.log('- npm run db:push (setup database schema)');
}

process.exit(hasErrors ? 1 : 0);