import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as betterAuthSchema from './better-auth-schema';
import dotenv from 'dotenv';

// Load .env file if it exists (for local development)
// In production (Amplify), environment variables are already in process.env
dotenv.config();

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  // Diagnostic: Show available env vars (first 10) for debugging
  const envKeys = Object.keys(process.env).sort();
  const sampleKeys = envKeys.slice(0, 10).join(', ');
  const hasDatabaseVars = envKeys.some(key => 
    key.includes('POSTGRES') || key.includes('DATABASE') || key.includes('DB_')
  );
  
  const errorMessage = [
    'POSTGRES_URL environment variable is not set.',
    '',
    'To fix this:',
    '1. Go to AWS Amplify Console',
    '2. Select your app → App settings → Environment variables',
    '3. Add POSTGRES_URL with your database connection string',
    '   Example: postgres://user:pass@host:5432/dbname?sslmode=require',
    '4. Save and redeploy the app',
    '',
    `Diagnostics: ${envKeys.length} environment variables found`,
    hasDatabaseVars 
      ? 'Found database-related env vars, but POSTGRES_URL is missing'
      : 'No database-related environment variables found',
    `Sample env vars: ${sampleKeys || 'none'}`
  ].join('\n');
  
  throw new Error(errorMessage);
}

export const client = postgres(POSTGRES_URL);
export const db = drizzle(client, { 
  schema: betterAuthSchema 
});
