import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: { message: 'Password is required' } },
        { status: 400 }
      );
    }

    // Use Better Auth's API to set password for the current user
    const result = await auth.api.setPassword({
      body: { newPassword },
      headers: request.headers,
    });

    if (!result.status) {
      return NextResponse.json(
        { error: { message: 'Failed to set password' } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { error: { message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

