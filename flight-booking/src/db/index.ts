import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set in environment variables.');
}

// Disable prefetch as it is not supported in transaction pool mode (e.g., Supabase / Neon / PgBouncer)
const client = postgres(connectionString || '', {
  prepare: false,
  ssl: connectionString?.includes('sslmode=require') || connectionString?.includes('neon.tech') ? 'require' : undefined,
});

export const db = drizzle(client, { schema });
