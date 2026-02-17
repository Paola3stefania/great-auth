'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Bot } from 'lucide-react';
import { Suspense } from 'react';

type DeviceInfo = {
  userCode: string;
  clientId: string;
  scope?: string;
  expiresAt: string;
};

type PageState =
  | { step: 'loading' }
  | { step: 'enter-code' }
  | { step: 'verifying' }
  | { step: 'confirm'; device: DeviceInfo }
  | { step: 'approving' }
  | { step: 'denying' }
  | { step: 'approved' }
  | { step: 'denied' }
  | { step: 'error'; message: string };

function DeviceApprovalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [state, setState] = useState<PageState>({ step: 'loading' });
  const [codeInput, setCodeInput] = useState('');

  const userCodeFromURL = searchParams.get('user_code');

  const verifyCode = useCallback(async (code: string) => {
    setState({ step: 'verifying' });

    try {
      const res = await fetch(`/api/auth/device?user_code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ step: 'error', message: data.message || data.error_description || 'Invalid or expired code.' });
        return;
      }
      const data = await res.json();
      setState({
        step: 'confirm',
        device: {
          userCode: code,
          clientId: data.client_id || data.clientId || 'unknown',
          scope: data.scope,
          expiresAt: data.expires_at || data.expiresAt,
        },
      });
    } catch {
      setState({ step: 'error', message: 'Failed to verify the code. Please try again.' });
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;

    if (!session?.user) {
      const callbackPath = userCodeFromURL
        ? `/device?user_code=${encodeURIComponent(userCodeFromURL)}`
        : '/device';
      router.push(`/?callbackURL=${encodeURIComponent(callbackPath)}`);
      return;
    }

    if (userCodeFromURL) {
      verifyCode(userCodeFromURL);
    } else {
      setState({ step: 'enter-code' });
    }
  }, [session, sessionLoading, userCodeFromURL, router, verifyCode]);

  async function handleApprove(userCode: string) {
    setState({ step: 'approving' });
    try {
      const res = await fetch('/api/auth/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ step: 'error', message: data.message || 'Failed to approve the connection.' });
        return;
      }
      setState({ step: 'approved' });
    } catch {
      setState({ step: 'error', message: 'Failed to approve the connection.' });
    }
  }

  async function handleDeny(userCode: string) {
    setState({ step: 'denying' });
    try {
      const res = await fetch('/api/auth/device/deny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ step: 'error', message: data.message || 'Failed to deny the connection.' });
        return;
      }
      setState({ step: 'denied' });
    } catch {
      setState({ step: 'error', message: 'Failed to deny the connection.' });
    }
  }

  function handleSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed) {
      verifyCode(trimmed);
    }
  }

  if (state.step === 'loading' || sessionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (state.step === 'enter-code') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Bot className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle>Connect an Agent</CardTitle>
          <CardDescription>
            Enter the code shown by your AI agent to approve its connection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div>
              <Label htmlFor="user_code" className="mb-2">Agent Code</Label>
              <Input
                id="user_code"
                placeholder="e.g. ABCD-1234"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="text-center text-lg tracking-widest font-mono"
                autoFocus
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: '#397A4A' }}
              disabled={!codeInput.trim()}
            >
              Verify Code
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'verifying') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600">Verifying code...</p>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'confirm') {
    const scopes = state.device.scope ? state.device.scope.split(' ').filter(Boolean) : [];
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Approve Agent Connection</CardTitle>
          <CardDescription>
            An agent is requesting access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Code</span>
              <span className="font-mono font-medium">{state.device.userCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Client</span>
              <span className="font-medium">{state.device.clientId}</span>
            </div>
            {scopes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Scopes</span>
                <span className="font-medium">{scopes.join(', ')}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleDeny(state.device.userCode)}
            >
              Deny
            </Button>
            <Button
              className="flex-1 text-white hover:opacity-90"
              style={{ backgroundColor: '#397A4A' }}
              onClick={() => handleApprove(state.device.userCode)}
            >
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'approving' || state.step === 'denying') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600">
            {state.step === 'approving' ? 'Approving connection...' : 'Denying connection...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'approved') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Connection Approved</h3>
          <p className="text-gray-500 text-center text-sm">
            The agent is now connected to your account. You can manage it from your dashboard.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push('/dashboard/agents')}
          >
            View Connected Agents
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'denied') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Connection Denied</h3>
          <p className="text-gray-500 text-center text-sm">
            The agent connection was denied. No access was granted.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'error') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Something Went Wrong</h3>
          <p className="text-red-500 text-center text-sm mb-4">{state.message}</p>
          <Button
            variant="outline"
            onClick={() => {
              setCodeInput('');
              setState({ step: 'enter-code' });
            }}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function DevicePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <DeviceApprovalContent />
      </Suspense>
    </div>
  );
}
