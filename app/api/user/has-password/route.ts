import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { account } from '@/lib/db/better-auth-schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use Better Auth's API to get the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ hasPassword: false });
    }

    // Check if user has a credential account (password account)
    const credentialAccount = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    return NextResponse.json({ 
      hasPassword: credentialAccount.length > 0 && !!credentialAccount[0].password 
    });
  } catch (error) {
    console.error('Error checking password account:', error);
    return NextResponse.json({ hasPassword: false });
  }
}

