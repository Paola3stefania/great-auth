import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as betterAuthSchema from './better-auth-schema';
import * as appSchema from './schema';
import { env } from '../env';

// Initialize database connection using validated environment variable
export const client = postgres(env.POSTGRES_URL);
export const db = drizzle(client, { 
  schema: { ...appSchema, ...betterAuthSchema } 
});
