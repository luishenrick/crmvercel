import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();


if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Force Transaction Mode (port 6543) for Supabase to avoid connection limit issues
let connectionString = process.env.POSTGRES_URL;
if (connectionString.includes('pooler.supabase.com') && connectionString.includes(':5432')) {
  console.log('🔄 Auto-correcting database connection to Transaction Mode (port 6543)');
  connectionString = connectionString.replace(':5432', ':6543');
}

export const client = postgres(connectionString, { prepare: false, max: 1 });
export const db = drizzle(client, { schema });
