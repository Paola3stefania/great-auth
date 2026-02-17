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
    // Show comprehensive diagnostic info when env var is missing
    const envKeys = Object.keys(process.env).sort();
    
    // Find similar variable names (case variations, etc.)
    const similarKeys = envKeys.filter(key => 
      key.toLowerCase() === name.toLowerCase() ||
      key.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(key.toLowerCase())
    );
    
    // Check for database-related variables
    const databaseKeys = envKeys.filter(key => 
      key.includes('POSTGRES') || 
      key.includes('DATABASE') || 
      key.includes('DB_') ||
      key.includes('RDS_')
    );
    
    const sampleKeys = envKeys.slice(0, 15).join(', ');
    
    let diagnosticMessage = `[env] Missing required environment variable: ${name}\n\n`;
    diagnosticMessage += `Diagnostics:\n`;
    diagnosticMessage += `- Total env vars found: ${envKeys.length}\n`;
    
    if (similarKeys.length > 0) {
      diagnosticMessage += `- Similar variable names found: ${similarKeys.join(', ')}\n`;
      diagnosticMessage += `  ⚠️  Check for typos or case sensitivity issues!\n`;
    }
    
    if (databaseKeys.length > 0) {
      diagnosticMessage += `- Database-related vars found: ${databaseKeys.join(', ')}\n`;
    } else {
      diagnosticMessage += `- Database-related vars: None found\n`;
    }
    
    diagnosticMessage += `- Sample env vars: ${sampleKeys}\n\n`;
    
    // Amplify-specific guidance
    diagnosticMessage += `How to fix in Amplify:\n`;
    diagnosticMessage += `1. Go to: Amplify Console → Your App → App settings → Environment variables\n`;
    diagnosticMessage += `2. Make sure variable is set for your branch/environment (e.g., "main")\n`;
    diagnosticMessage += `3. Variable name must be exactly: ${name} (case-sensitive)\n`;
    diagnosticMessage += `4. Save and trigger a NEW deployment (variables only apply to new deployments)\n`;
    diagnosticMessage += `5. If using Secrets, ensure it's linked to your branch/environment\n\n`;
    
    diagnosticMessage += `Note: Environment variables set during build are different from runtime variables.\n`;
    diagnosticMessage += `Make sure POSTGRES_URL is in "App settings → Environment variables" (for runtime), `;
    diagnosticMessage += `not just "Build settings → Environment variables" (for build-time only).\n`;
    
    throw new Error(diagnosticMessage);
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
  // Note: Better Auth reads BETTER_AUTH_SECRET directly from process.env (not from this object)
  // Better Auth has a default secret in development: "better-auth-secret-123456789"
  // In production, Better Auth will throw an error if not set
  // We don't validate it here since Better Auth handles it internally
  BETTER_AUTH_URL: optional('BETTER_AUTH_URL') || optional('BASE_URL') || 'http://localhost:3000',
  BASE_URL: optional('BASE_URL') || optional('BETTER_AUTH_URL') || 'http://localhost:3000',

  // Google OAuth (for SSO)
  GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET', ''),

  // Better Auth Infra
  BETTER_AUTH_API_KEY: optional('BETTER_AUTH_API_KEY', ''),
  BETTER_AUTH_API_URL: optional('BETTER_AUTH_API_URL', 'http://localhost:8000'),
  BETTER_AUTH_KV_URL: optional('BETTER_AUTH_KV_URL', 'http://localhost:8787'),

  // SSO OIDC Provider
  SSO_PROVIDER_ID: optional('SSO_PROVIDER_ID', ''),
  SSO_ISSUER: optional('SSO_ISSUER', ''),
  SSO_DOMAIN: optional('SSO_DOMAIN', ''),
  SSO_CLIENT_ID: optional('SSO_CLIENT_ID', ''),
  SSO_CLIENT_SECRET: optional('SSO_CLIENT_SECRET', ''),
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
    BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET || 'using Better Auth default',
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

