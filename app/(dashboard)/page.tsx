import { Button } from '@/components/ui/button';
import { ArrowRight, Key, Shield, Database, Lock } from 'lucide-react';
import { AuthForm } from '@/components/auth/auth-form';
import { BetterAuthLogo } from '@/components/ui/better-auth-logo';
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl flex items-center gap-3">
                <BetterAuthLogo className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
                <span>
                  Better Auth
                  <span className="block" style={{ color: '#397A4A' }}>auth made easy</span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                A comprehensive demo showcasing how to integrate authentication
                with Better Auth. Includes SSO (Single Sign-On), password-based
                authentication, and username login - all in one easy-to-use solution.
              </p>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center lg:justify-center">
              <Suspense fallback={<div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 animate-pulse">Loading...</div>}>
                <AuthForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white" style={{ border: '1px solid #e5e7eb' }}>
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="nextjs-logo-mask" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                    <circle cx="50" cy="50" r="50" fill="black"/>
                  </mask>
                  <g mask="url(#nextjs-logo-mask)">
                    <circle cx="50" cy="50" r="48.335" fill="black" stroke="white" strokeWidth="3.33"/>
                    <path d="M83.06 87.5113L38.4122 30H30V69.9833H36.7298V38.5464L77.7773 91.5806C79.6293 90.3409 81.394 88.9808 83.06 87.5113Z" fill="url(#nextjs-gradient-b)"/>
                    <rect x="63.8887" y="30" width="6.66667" height="40" fill="url(#nextjs-gradient-c)"/>
                  </g>
                  <defs>
                    <linearGradient id="nextjs-gradient-b" x1="60.5556" y1="64.7222" x2="80.2778" y2="89.1667" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white"/>
                      <stop offset="0.604072" stopColor="white" stopOpacity="0"/>
                      <stop offset="1" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="nextjs-gradient-c" x1="67.222" y1="30" x2="67.1104" y2="59.3751" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white"/>
                      <stop offset="1" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Next.js Integration
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  This demo is built in Next.js. See the{' '}
                  <a
                    href="https://www.better-auth.com/docs/integrations/next"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Better Auth Next.js documentation
                  </a>{' '}
                  to see how to set it up.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white" style={{ border: '1px solid #e5e7eb' }}>
                <Key className="h-6 w-6 text-gray-900" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Password & Username
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Learn how to implement email/password and username authentication. See the{' '}
                  <a
                    href="https://www.better-auth.com/docs/authentication/email-password"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Email & Password
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://www.better-auth.com/docs/plugins/username"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Username
                  </a>{' '}
                  documentation for setup instructions.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white" style={{ border: '1px solid #e5e7eb' }}>
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Google SSO
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Learn how to configure Google SSO for your login. See the{' '}
                  <a
                    href="https://www.better-auth.com/docs/authentication/google"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Better Auth Google documentation
                  </a>{' '}
                  for step-by-step setup instructions.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white" style={{ border: '1px solid #e5e7eb' }}>
                <Shield className="h-6 w-6 text-gray-900" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Session Management
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Learn how to manage user sessions with expiration, freshness, and caching. See the{' '}
                  <a
                    href="https://www.better-auth.com/docs/concepts/session-management"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Better Auth Session Management documentation
                  </a>{' '}
                  for details.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white" style={{ border: '1px solid #e5e7eb' }}>
                <Database className="h-6 w-6 text-gray-900" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Drizzle ORM Adapter
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  This example uses PostgreSQL with Drizzle ORM adapter. See the{' '}
                  <a
                    href="https://www.better-auth.com/docs/adapters/drizzle"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Better Auth Drizzle adapter documentation
                  </a>{' '}
                  to see how to set it up.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white" style={{ border: '1px solid #e5e7eb' }}>
                <Lock className="h-6 w-6 text-gray-900" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Password Management
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Learn how to add passwords to OAuth-only accounts and manage user passwords. See the{' '}
                  <a
                    href="https://www.better-auth.com/docs/concepts/users-accounts#set-password"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Better Auth Password Management documentation
                  </a>{' '}
                  for details on setting passwords for existing users.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Want to know more about Better Auth?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Better Auth is the most comprehensive authentication framework for TypeScript.
                Learn more about all its features, plugins, and integrations.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a href="https://www.better-auth.com/" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  Go to Website
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
