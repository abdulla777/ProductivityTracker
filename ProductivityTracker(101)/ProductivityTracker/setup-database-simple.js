const { Client } = require('pg');

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/productivity_tracker'
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Create basic tables - our automated migrations will handle the rest
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'employee',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        is_present BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO users (username, password, full_name, role) 
      VALUES ('admin', 'admin123', 'مدير النظام', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('✅ Basic database schema created');
    console.log('✅ Admin user created (admin/admin123)');
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

setupDatabase().catch(console.error);
