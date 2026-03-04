'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Loader2, Bot, Clock, RefreshCw,
  ChevronDown, ChevronRight, Copy, AlertTriangle,
  Check, Shield,
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import {
  listAgents, revokeAgent, revokeAllAgents,
  type Agent,
} from '@/lib/auth/agent-api';

function formatDate(d: string | Date | null): string {
  if (!d) return 'Never';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString();
}

function formatRelativeTime(d: string | Date | null): string {
  if (!d) return 'Never';
  const date = d instanceof Date ? d : new Date(d);
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

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  expired: 'bg-orange-50 text-orange-700',
  revoked: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-50 text-red-700',
};

export default function AgentsPage() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);

  const fetchAgents = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listAgents();
      if (res.error) {
        setError(res.error);
        return;
      }
      setAgents(res.data || []);
    } catch {
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  function handleAgentRevoked(agentId: string) {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: 'revoked' as const } : a))
    );
  }

  async function handleRevokeAll() {
    setRevokingAll(true);
    try {
      const result = await revokeAllAgents();
      if (result.errors.length > 0) {
        setError(`Revoked ${result.revoked}, but ${result.errors.length} failed`);
      }
      setAgents((prev) =>
        prev.map((a) => a.status === 'active' ? { ...a, status: 'revoked' as const } : a)
      );
    } catch {
      setError('Failed to revoke agents');
    } finally {
      setRevokingAll(false);
      setShowRevokeAllConfirm(false);
    }
  }

  const activeAgents = agents.filter((a) => a.status === 'active');
  const otherAgents = agents.filter((a) => a.status !== 'active');

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Connected Agents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage AI agents connected to your account
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAgents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-gray-900">{agents.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-green-600">{activeAgents.length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-gray-400">{otherAgents.length}</p>
            <p className="text-xs text-gray-500">Inactive</p>
          </CardContent>
        </Card>
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
              AI agents can connect to your account using the device authorization flow
              or CIBA backchannel authentication.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeAgents.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active</h2>
                {activeAgents.length > 0 && (
                  showRevokeAllConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Revoke all {activeAgents.length} agents?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={handleRevokeAll}
                        disabled={revokingAll}
                      >
                        {revokingAll ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowRevokeAllConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => setShowRevokeAllConfirm(true)}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Revoke All
                    </Button>
                  )
                )}
              </div>
              {activeAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  expanded={expandedId === agent.id}
                  onToggleExpand={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  onRevoked={handleAgentRevoked}
                  onError={setError}
                />
              ))}
            </>
          )}
          {otherAgents.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-8">Inactive</h2>
              {otherAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  expanded={expandedId === agent.id}
                  onToggleExpand={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  onRevoked={handleAgentRevoked}
                  onError={setError}
                />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function AgentCard({
  agent,
  expanded,
  onToggleExpand,
  onRevoked,
  onError,
}: {
  agent: Agent;
  expanded: boolean;
  onToggleExpand: () => void;
  onRevoked: (id: string) => void;
  onError: (msg: string) => void;
}) {
  const isActive = agent.status === 'active';
  const [revoking, setRevoking] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  async function handleRevoke() {
    setRevoking(true);
    try {
      const res = await revokeAgent(agent.id);
      if (res.error) {
        onError(res.error);
      } else {
        onRevoked(agent.id);
      }
    } catch {
      onError('Failed to revoke agent');
    } finally {
      setRevoking(false);
      setShowRevokeConfirm(false);
    }
  }

  function handleCopyId() {
    navigator.clipboard.writeText(agent.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <CardContent className="p-0">
        <button
          className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
          onClick={onToggleExpand}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isActive ? 'bg-green-50' : 'bg-gray-100'
          }`}>
            <Bot className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{agent.name}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[agent.status] || 'bg-gray-100 text-gray-500'
              }`}>
                {agent.status}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                {agent.mode}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(agent.lastUsedAt)}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-gray-400">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-4 space-y-5">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Agent ID</Label>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-50 border rounded px-2 py-1 font-mono text-gray-700 truncate flex-1">
                  {agent.id}
                </code>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopyId}>
                  {copiedId ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Name</Label>
              <span className="text-sm text-gray-900">{agent.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Mode</Label>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-medium capitalize">
                  {agent.mode}
                </span>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Host ID</Label>
                <code className="text-xs text-gray-500 font-mono truncate block">
                  {agent.hostId}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Created</Label>
                <p className="text-sm text-gray-700">{formatDate(agent.createdAt)}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Last Used</Label>
                <p className="text-sm text-gray-700">{formatDate(agent.lastUsedAt)}</p>
              </div>
            </div>

            {agent.activatedAt && (
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Activated</Label>
                <p className="text-sm text-gray-700">{formatDate(agent.activatedAt)}</p>
              </div>
            )}

            {agent.metadata && Object.keys(agent.metadata).length > 0 && (
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Metadata</Label>
                <pre className="text-xs bg-gray-50 border rounded p-2 font-mono text-gray-600 overflow-x-auto">
                  {JSON.stringify(agent.metadata, null, 2)}
                </pre>
              </div>
            )}

            {isActive && (
              <div className="pt-3 border-t border-gray-100">
                {showRevokeConfirm ? (
                  <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700 flex-1">
                      Are you sure? This agent will be permanently disabled.
                    </p>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={handleRevoke}
                      disabled={revoking}
                    >
                      {revoking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Confirm Revoke
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowRevokeConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => setShowRevokeConfirm(true)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Revoke Agent
                    </Button>
                    <p className="text-xs text-gray-400 mt-1">
                      Permanently disables this agent. It will no longer be able to authenticate.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
