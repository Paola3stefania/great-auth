'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Suspense } from 'react';

type RequestInfo = {
  auth_req_id: string;
  client_id: string | null;
  scope: string | null;
  binding_message: string | null;
  user: { name: string; email: string | null } | null;
  expires_at: string;
};

type PageState =
  | { step: 'loading' }
  | { step: 'error'; message: string }
  | { step: 'confirm'; request: RequestInfo }
  | { step: 'approving' }
  | { step: 'rejecting' }
  | { step: 'approved' }
  | { step: 'rejected' };

function AsyncAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [state, setState] = useState<PageState>({ step: 'loading' });

  const authReqId = searchParams.get('auth_req_id');

  const loadRequest = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/auth/async-auth/verify?auth_req_id=${encodeURIComponent(id)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ step: 'error', message: data.message || 'Request not found or expired.' });
        return;
      }
      const data = await res.json();
      setState({ step: 'confirm', request: data });
    } catch {
      setState({ step: 'error', message: 'Failed to load the request.' });
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;

    if (!session?.user) {
      const callback = authReqId
        ? `/async-auth?auth_req_id=${encodeURIComponent(authReqId)}`
        : '/async-auth';
      router.push(`/?callbackURL=${encodeURIComponent(callback)}`);
      return;
    }

    if (!authReqId) {
      setState({ step: 'error', message: 'No auth_req_id provided.' });
      return;
    }

    loadRequest(authReqId);
  }, [session, sessionLoading, authReqId, router, loadRequest]);

  async function handleApprove(id: string) {
    setState({ step: 'approving' });
    try {
      const res = await fetch('/api/auth/async-auth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_req_id: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ step: 'error', message: data.message || 'Failed to approve.' });
        return;
      }
      setState({ step: 'approved' });
    } catch {
      setState({ step: 'error', message: 'Failed to approve the request.' });
    }
  }

  async function handleReject(id: string) {
    setState({ step: 'rejecting' });
    try {
      const res = await fetch('/api/auth/async-auth/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_req_id: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ step: 'error', message: data.message || 'Failed to reject.' });
        return;
      }
      setState({ step: 'rejected' });
    } catch {
      setState({ step: 'error', message: 'Failed to reject the request.' });
    }
  }

  if (state.step === 'loading' || sessionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (state.step === 'confirm') {
    const scopes = state.request.scope ? state.request.scope.split(' ').filter(Boolean) : [];
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Authorize Access</CardTitle>
          <CardDescription>
            An agent is requesting access to your account via backchannel authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
            {state.request.client_id && (
              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="font-medium">{state.request.client_id}</span>
              </div>
            )}
            {state.request.user && (
              <div className="flex justify-between">
                <span className="text-gray-500">Account</span>
                <span className="font-medium">{state.request.user.email || state.request.user.name}</span>
              </div>
            )}
            {scopes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Scopes</span>
                <span className="font-medium">{scopes.join(', ')}</span>
              </div>
            )}
            {state.request.binding_message && (
              <div className="pt-2 border-t">
                <span className="text-gray-500 block mb-1">Message</span>
                <span className="font-medium">{state.request.binding_message}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleReject(state.request.auth_req_id)}
            >
              Deny
            </Button>
            <Button
              className="flex-1 text-white hover:opacity-90"
              style={{ backgroundColor: '#397A4A' }}
              onClick={() => handleApprove(state.request.auth_req_id)}
            >
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.step === 'approving' || state.step === 'rejecting') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600">
            {state.step === 'approving' ? 'Approving access...' : 'Denying access...'}
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
          <h3 className="text-lg font-medium text-gray-900 mb-1">Access Approved</h3>
          <p className="text-gray-500 text-center text-sm">
            The agent has been granted access. You can close this page.
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

  if (state.step === 'rejected') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Access Denied</h3>
          <p className="text-gray-500 text-center text-sm">
            The authorization request was denied. No access was granted.
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
            onClick={() => router.push('/')}
          >
            Go Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function AsyncAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <AsyncAuthContent />
      </Suspense>
    </div>
  );
}
