import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Helpful error during runtime if DATABASE_URL is missing
  console.warn('DATABASE_URL is not set in environment variables.');
}

// Disable prefetch as it is not supported in transaction pool mode (e.g., Supabase / Neon / PgBouncer)
const client = postgres(connectionString || '', { prepare: false });

export const db = drizzle(client, { schema });
