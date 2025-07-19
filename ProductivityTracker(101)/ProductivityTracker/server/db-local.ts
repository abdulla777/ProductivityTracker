import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

console.log('Using local PostgreSQL connection');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/consulting_engineers';

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

// Test connection
pool.connect()
  .then((client) => {
    console.log('✅ Local PostgreSQL connected successfully');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Local PostgreSQL connection failed:', err.message);
  });