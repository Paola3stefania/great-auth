import 'server-only';

import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { assertEnvReady } from "@/lib/env";

// Validate environment variables on first API call
assertEnvReady();

// Wrap Better Auth handlers with error handling
const handler = toNextJsHandler(auth);

function handleAuthError(error: unknown, method: string) {
  console.error(`[Auth API] ${method} error:`, error);
  
  if (error instanceof Error) {
    console.error(`[Auth API] Error name:`, error.name);
    console.error(`[Auth API] Error message:`, error.message);
    if (error.stack) {
      console.error(`[Auth API] Error stack:`, error.stack);
    }
    
    // Check for common database errors
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    if (errorMessage.includes('postgres_url') || errorMessage.includes('environment variable')) {
      return {
        error: {
          message: 'Database configuration error',
          details: 'POSTGRES_URL environment variable is not set. Set it in Amplify Console → App Settings → Environment variables, then redeploy.',
        }
      };
    }
    
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return {
        error: {
          message: 'Database tables missing',
          details: 'Better Auth tables do not exist. Run database migrations: `npm run db:migrate` or use the Lambda function. See README.md for details.',
        }
      };
    }
    
    if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
      return {
        error: {
          message: 'Database connection failed',
          details: 'Cannot connect to the database. Check POSTGRES_URL is correct and the database is accessible.',
        }
      };
    }
  }
  
  return {
    error: {
      message: 'Authentication request failed',
      details: error instanceof Error ? error.message : String(error)
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    return await handler.GET(request);
  } catch (error) {
    const errorResponse = handleAuthError(error, 'GET');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handler.POST(request);
  } catch (error) {
    const errorResponse = handleAuthError(error, 'POST');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

