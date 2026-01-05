import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export async function getUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
    return null;
  }
    return session.user;
  } catch (error: unknown) {
    // Check if this is a React postpone signal (PPR bailout)
    // Don't catch postpone signals - let them propagate
    if (error && typeof error === 'object' && '$$typeof' in error && error.$$typeof === Symbol.for('react.postpone')) {
      throw error;
  }
    // Only catch actual errors, not prerendering bailouts
    console.error('Error getting user from session:', error);
    return null;
  }
}
