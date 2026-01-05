import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file (if present)
// In Lambda, environment variables are set via Lambda configuration
dotenv.config();

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is required');
}

export const handler = async (event: any, context: any) => {
  console.log('Starting database migration...');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Create postgres client
  const client = postgres(POSTGRES_URL, { max: 1 });
  const db = drizzle(client);

  try {
    // Get migrations folder path
    // In Lambda, migrations are in the same directory as the handler
    const migrationsFolder = path.join(__dirname, 'migrations');
    
    console.log('Migrations folder:', migrationsFolder);
    
    // Check if migrations folder exists
    if (!fs.existsSync(migrationsFolder)) {
      throw new Error(`Migrations folder not found: ${migrationsFolder}`);
    }

    console.log('Running migrations...');
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Migrations completed successfully',
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Migration failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Migration failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
    };
  } finally {
    await client.end();
    // Lambda will reuse the execution context, but we should clean up
    context.callbackWaitsForEmptyEventLoop = false;
  }
};
