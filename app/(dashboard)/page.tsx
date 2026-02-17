import { Button } from '@/components/ui/button';
import { Bot, ArrowRight } from 'lucide-react';
import { AuthForm } from '@/components/auth/auth-form';
import { BetterAuthLogo } from '@/components/ui/better-auth-logo';
import { Suspense } from 'react';
import Link from 'next/link';

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
                with Better Auth. Includes agent auth, SSO, password-based
                authentication, and username login.
              </p>
              <div className="mt-8">
                <Link href="/dashboard/agents">
                  <Button
                    size="lg"
                    className="text-white hover:opacity-90 rounded-full text-lg px-8"
                    style={{ backgroundColor: '#397A4A' }}
                  >
                    <Bot className="mr-2 h-5 w-5" />
                    Connected Agents
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center lg:justify-center">
              <Suspense fallback={<div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 animate-pulse">Loading...</div>}>
                <AuthForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
