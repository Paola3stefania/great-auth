'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Bot, ShieldCheck, Clock, Trash2, RefreshCw } from 'lucide-react';
import { authClient, useSession } from '@/lib/auth/client';

type Agent = {
  id: string;
  name: string;
  status: 'active' | 'revoked';
  scopes: string[];
  role: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function AgentsPage() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await authClient.agent.list();
      if (res.error) {
        setError(res.error.message || 'Failed to load agents');
        return;
      }
      setAgents((res.data as Agent[]) || []);
    } catch {
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function handleRevoke(agentId: string) {
    setRevokingId(agentId);
    try {
      const res = await authClient.agent.revoke({ agentId });
      if (res.error) {
        setError(res.error.message || 'Failed to revoke agent');
        return;
      }
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: 'revoked' } : a))
      );
    } catch {
      setError('Failed to revoke agent');
    } finally {
      setRevokingId(null);
    }
  }

  const activeAgents = agents.filter((a) => a.status === 'active');
  const revokedAgents = agents.filter((a) => a.status === 'revoked');

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Connected Agents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} connected to your account
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAgents}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">Loading agents...</p>
          </CardContent>
        </Card>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Bot className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Agents Connected</h3>
            <p className="text-gray-500 text-center text-sm max-w-sm">
              AI agents can connect to your account using the device authorization flow.
              Run an agent script and approve it at <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/device</code>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeAgents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active</h2>
              {activeAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onRevoke={handleRevoke}
                  revoking={revokingId === agent.id}
                />
              ))}
            </div>
          )}

          {revokedAgents.length > 0 && (
            <div className="space-y-3 mt-8">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Revoked</h2>
              {revokedAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onRevoke={handleRevoke}
                  revoking={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AgentCard({
  agent,
  onRevoke,
  revoking,
}: {
  agent: Agent;
  onRevoke: (id: string) => void;
  revoking: boolean;
}) {
  const isActive = agent.status === 'active';
  const scopes = Array.isArray(agent.scopes) ? agent.scopes : [];

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isActive ? 'bg-green-50' : 'bg-gray-100'
            }`}>
              <Bot className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 truncate">{agent.name}</h3>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {agent.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {agent.role && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {agent.role}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last used: {formatRelativeTime(agent.lastUsedAt)}
                </span>
              </div>
              {scopes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {scopes.map((scope) => (
                    <span
                      key={scope}
                      className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 font-mono"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onRevoke(agent.id)}
              disabled={revoking}
            >
              {revoking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Revoke
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
