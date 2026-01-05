'use client';

import Link from 'next/link';
import { use, useState, useEffect, Suspense } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { BetterAuthShieldLogo } from '@/components/ui/better-auth-shield-logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, useSession } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Ensure client-side only rendering to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  function handleSecurityClick() {
    setIsMenuOpen(false);
    router.push('/dashboard/security');
  }

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
    router.push('/');
          router.refresh();
        },
      },
    });
  }

  // Don't render anything on server or before mount
  if (!isMounted) {
    return <div className="h-9 w-9" />;
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
          <AvatarFallback>
            {user.name
              ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
              : user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={handleSecurityClick}
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>Security</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={handleSignOut}
        >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <BetterAuthShieldLogo className="h-6 w-6" />
          <span className="ml-2 text-xl font-semibold text-gray-900">auth made easy</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}
