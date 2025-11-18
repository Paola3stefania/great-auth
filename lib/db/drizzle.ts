import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as appSchema from './schema';
import * as betterAuthSchema from './better-auth-schema';
import dotenv from 'dotenv';

// Load .env file if it exists (for local development)
// In production (Amplify), environment variables are already in process.env
dotenv.config();

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  throw new Error(
    'POSTGRES_URL environment variable is not set. ' +
    'Set it in Amplify Console → App Settings → Environment variables, then redeploy.'
  );
}

export const client = postgres(POSTGRES_URL);
export const db = drizzle(client, { 
  schema: { ...appSchema, ...betterAuthSchema } 
});
