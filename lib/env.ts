import 'server-only';

/**
 * This module is server-only.
 * If it ever ends up in a client bundle, something is very wrong.
 */
if (typeof window !== 'undefined') {
  throw new Error('env.ts must not be imported from the browser.');
}

/**
 * Helper to read required env vars with nice error messages.
 */
const required = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    // Show diagnostic info when env var is missing
    const envKeys = Object.keys(process.env).sort();
    const sampleKeys = envKeys.slice(0, 10).join(', ');
    const hasDatabaseVars = envKeys.some(key => 
      key.includes('POSTGRES') || key.includes('DATABASE') || key.includes('DB_')
    );
    
    throw new Error(
      `[env] Missing required environment variable: ${name}.\n` +
      `Make sure it's set in Amplify:\n` +
      `- App settings → Environment variables (for runtime/SSR)\n` +
      `- Build settings → Environment variables (for build-time)\n\n` +
      `Diagnostics:\n` +
      `- Total env vars found: ${envKeys.length}\n` +
      `- Database-related vars: ${hasDatabaseVars ? 'Found some' : 'None found'}\n` +
      `- Sample vars: ${sampleKeys}\n\n` +
      `Note: In Amplify, environment variables must be set in App Settings → Environment variables ` +
      `for the RUNTIME environment (Lambda/SSR), not just during build.`
    );
  }
  return value;
};

/**
 * Helper to read optional env vars with an optional default.
 */
const optional = (name: string, fallback?: string): string | undefined => {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
};

/**
 * Tiny helper to know if we're in an Amplify SSR Lambda runtime.
 * (Not bulletproof but good enough for logging/debugging.)
 */
const isAmplifySSRRuntime =
  typeof process !== 'undefined' &&
  !!process.env.AWS_REGION &&
  !!process.env._X_AMZN_TRACE_ID;

const nodeEnv = (process.env.NODE_ENV ?? 'development') as
  | 'development'
  | 'production'
  | 'test';

export const env = {
  // Generic
  NODE_ENV: nodeEnv,
  IS_PROD: nodeEnv === 'production',
  IS_DEV: nodeEnv === 'development',
  IS_TEST: nodeEnv === 'test',
  IS_AMPLIFY_SSR: isAmplifySSRRuntime,

  // Database
  POSTGRES_URL: required('POSTGRES_URL'),

  // Better Auth
  BETTER_AUTH_SECRET: required('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: optional('BETTER_AUTH_URL') || optional('BASE_URL') || 'http://localhost:3000',
  BASE_URL: optional('BASE_URL') || optional('BETTER_AUTH_URL') || 'http://localhost:3000',

  // Google OAuth (for SSO)
  GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET', ''),
} as const;

/**
 * Optional: call this somewhere early in your app (e.g. a route handler)
 * to force validation at runtime and emit a nice log in Amplify.
 */
export function assertEnvReady() {
  // Accessing env.* will trigger the required() checks
  const summary = {
    NODE_ENV: env.NODE_ENV,
    IS_AMPLIFY_SSR: env.IS_AMPLIFY_SSR,
    POSTGRES_URL: !!env.POSTGRES_URL ? `set (${env.POSTGRES_URL.substring(0, 20)}...)` : 'missing',
    BETTER_AUTH_SECRET: !!env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!env.GOOGLE_CLIENT_SECRET,
  };

  console.log('[env] Runtime configuration OK:', summary);
  
  // Warn if Google OAuth is not configured
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      '[env] Google OAuth not configured. Google SSO will not work. ' +
      'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Amplify Console.'
    );
  }
}

