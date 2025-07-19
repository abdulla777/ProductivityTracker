#!/bin/bash

echo "🚀 Starting application with fixed migration system..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup-local.sh first."
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "✅ Environment loaded"
echo "📋 Database URL: ${DATABASE_URL}"

# Run simple database setup (not drizzle push)
echo "📋 Setting up basic database schema..."
node setup-database-simple.js

echo "🚀 Starting application..."
npm run dev
