# 🚀 Quick Setup for Ubuntu Local Development

## One-Command Setup

Choose one of these methods to automatically set up everything:

### Option 1: Bash Script (Recommended)
```bash
chmod +x setup-local.sh && ./setup-local.sh
```

### Option 2: Node.js Script
```bash
node setup-local.js
```

### Option 3: One-Liner Download & Run
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/main/setup-local.sh | bash
```

## What Gets Installed & Configured

### ✅ System Dependencies
- **Node.js 18+** (via NodeSource repository)
- **npm** (latest version)
- **PostgreSQL** (with service auto-start)
- **Git, curl, wget** (development tools)

### ✅ Database Setup
- **Database Created**: `consulting_engineers`
- **User**: `postgres` with password `password`
- **Admin Account**: username=`admin`, password=`admin123`
- **Full Schema**: All 16 tables created automatically

### ✅ Project Configuration
- **Environment File**: `.env` with all required variables
- **Dependencies**: All npm packages installed
- **Session Secret**: Secure local development secret
- **Port**: Application runs on `http://localhost:5000`

## Manual Setup (If Scripts Fail)

If the automated scripts don't work, here's the manual process:

### 1. Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install PostgreSQL
```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Configure Database
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
sudo -u postgres createdb consulting_engineers
```

### 4. Create .env File
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/consulting_engineers
NODE_ENV=development
PORT=5000
SESSION_SECRET=my-local-session-secret-for-development
PGHOST=localhost
PGPORT=5432
PGDATABASE=consulting_engineers
PGUSER=postgres
PGPASSWORD=password
EOF
```

### 5. Install Dependencies & Setup Schema
```bash
npm install
npm run db:push
```

### 6. Seed Admin User
```bash
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers << 'EOF'
INSERT INTO users (username, password, full_name, email, role, is_active)
VALUES ('admin', '$2b$10$EOmvd8mTzBUN5OJli4H0GeM5AyoRY8Gn25iN.x5rW7ZnQAx3sDd.2', 'مدير النظام', 'admin@innovators.com', 'admin', true)
ON CONFLICT (username) DO NOTHING;
EOF
```

### 7. Start Application
```bash
npm run dev
```

## Verification Commands

Test your setup with these commands:

### Check Node.js & npm
```bash
node --version  # Should be v18+
npm --version   # Should be 8+
```

### Check PostgreSQL
```bash
sudo systemctl status postgresql  # Should be active
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT 1;"
```

### Check Database Schema
```bash
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "\dt"
```

### Check Admin User
```bash
PGPASSWORD=password psql -h localhost -U postgres -d consulting_engineers -c "SELECT username, role FROM users WHERE username = 'admin';"
```

### Test Authentication API
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -c cookies.txt

# Test session persistence
curl http://localhost:5000/api/auth/me -b cookies.txt
```

## Default Configuration

| Setting | Value |
|---------|-------|
| Database Name | `consulting_engineers` |
| Database User | `postgres` |
| Database Password | `password` |
| Database Host | `localhost:5432` |
| App Port | `5000` |
| Admin Username | `admin` |
| Admin Password | `admin123` |
| Session Secret | `my-local-session-secret-for-development` |

## Application URLs

- **Main Application**: http://localhost:5000
- **Login Page**: http://localhost:5000/login
- **API Base**: http://localhost:5000/api

## Troubleshooting

### Common Issues

#### "Permission denied" during setup
```bash
sudo chown -R $USER:$USER ~/.npm
sudo chmod +x setup-local.sh
```

#### PostgreSQL connection failed
```bash
sudo systemctl restart postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
```

#### Port 5000 already in use
```bash
sudo lsof -ti:5000 | xargs sudo kill -9
# Or change PORT in .env file
```

#### Node.js version too old
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### npm install fails
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Getting Help

1. Check console output for specific errors
2. Verify all prerequisites are installed
3. Ensure PostgreSQL service is running
4. Check .env file configuration
5. Review the detailed logs in the setup scripts

## Production Deployment

For production deployment, update these settings:

1. Change database password from `password`
2. Use a strong `SESSION_SECRET`
3. Set `NODE_ENV=production`
4. Configure proper SSL/HTTPS
5. Use environment-specific database URL

## Success Indicators

You'll know setup is complete when:

✅ `npm run dev` starts without errors  
✅ Application loads at http://localhost:5000  
✅ Login with admin/admin123 works  
✅ Dashboard displays properly  
✅ No console errors in browser  

**Your consulting engineering management system is ready for local development!**