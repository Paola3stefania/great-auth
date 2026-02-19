'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2, Bot, ShieldCheck, Clock, RefreshCw,
  Pencil, X, Check, ChevronDown, ChevronRight, Copy, AlertTriangle,
  Activity, ChevronLeft,
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import {
  listAgents, updateAgent, revokeAgent, revokeAllAgents, getAgentActivity,
  type Agent, type AgentActivity,
} from '@/lib/auth/agent-api';

const AVAILABLE_SCOPES = [
  'reports.read',
  'reports.write',
  'email.send',
];

const AVAILABLE_ROLES: Record<string, string[]> = {
  reader: ['reports.read'],
  writer: ['reports.read', 'reports.write', 'email.send'],
};

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

  function handleAgentUpdated(updated: Partial<Agent> & { id: string }) {
    setAgents((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    );
  }

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
  const revokedAgents = agents.filter((a) => a.status === 'revoked');

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

      {/* Summary cards */}
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
            <p className="text-2xl font-semibold text-gray-400">{revokedAgents.length}</p>
            <p className="text-xs text-gray-500">Revoked</p>
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
              AI agents can connect to your account using the device authorization flow.
              Run an agent script and approve it at <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/device</code>.
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
                  onUpdated={handleAgentUpdated}
                  onRevoked={handleAgentRevoked}
                  onError={setError}
                />
              ))}
            </>
          )}
          {revokedAgents.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-8">Revoked</h2>
              {revokedAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  expanded={expandedId === agent.id}
                  onToggleExpand={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  onUpdated={handleAgentUpdated}
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
  onUpdated,
  onRevoked,
  onError,
}: {
  agent: Agent;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdated: (a: Partial<Agent> & { id: string }) => void;
  onRevoked: (id: string) => void;
  onError: (msg: string) => void;
}) {
  const isActive = agent.status === 'active';
  const scopes = Array.isArray(agent.scopes) ? agent.scopes : [];

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(agent.name);
  const [editingScopes, setEditingScopes] = useState(false);
  const [scopeValues, setScopeValues] = useState<string[]>(scopes);
  const [editingRole, setEditingRole] = useState(false);
  const [roleValue, setRoleValue] = useState(agent.role || '');
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  async function saveName() {
    if (!nameValue.trim() || nameValue === agent.name) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      const res = await updateAgent({ agentId: agent.id, name: nameValue.trim() });
      if (res.error) {
        onError(res.error);
      } else {
        onUpdated({ id: agent.id, name: nameValue.trim() });
      }
    } catch {
      onError('Failed to update name');
    } finally {
      setSaving(false);
      setEditingName(false);
    }
  }

  async function saveScopes() {
    setSaving(true);
    try {
      const res = await updateAgent({ agentId: agent.id, scopes: scopeValues });
      if (res.error) {
        onError(res.error);
      } else {
        onUpdated({ id: agent.id, scopes: scopeValues });
      }
    } catch {
      onError('Failed to update scopes');
    } finally {
      setSaving(false);
      setEditingScopes(false);
    }
  }

  async function saveRole() {
    setSaving(true);
    const newRole = roleValue || undefined;
    try {
      const res = await updateAgent({
        agentId: agent.id,
        role: newRole,
        scopes: newRole && AVAILABLE_ROLES[newRole] ? AVAILABLE_ROLES[newRole] : undefined,
      });
      if (res.error) {
        onError(res.error);
      } else {
        onUpdated({
          id: agent.id,
          role: newRole || null,
          scopes: newRole && AVAILABLE_ROLES[newRole] ? AVAILABLE_ROLES[newRole] : agent.scopes,
        });
        if (newRole && AVAILABLE_ROLES[newRole]) {
          setScopeValues(AVAILABLE_ROLES[newRole]);
        }
      }
    } catch {
      onError('Failed to update role');
    } finally {
      setSaving(false);
      setEditingRole(false);
    }
  }

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

  function toggleScope(scope: string) {
    setScopeValues((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  return (
    <Card className={!isActive ? 'opacity-60' : ''}>
      <CardContent className="p-0">
        {/* Header row */}
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
                isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {agent.status}
              </span>
              {agent.role && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <ShieldCheck className="h-3 w-3" />
                  {agent.role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(agent.lastUsedAt)}
              </span>
              <span>{scopes.length} scope{scopes.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="shrink-0 text-gray-400">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </button>

        {/* Expanded detail panel */}
        {expanded && (
          <div className="border-t border-gray-100">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === 'details'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
                {activeTab === 'details' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'activity'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Activity
                {activeTab === 'activity' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full" />
                )}
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="p-4 space-y-5">
                {/* Agent ID */}
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

                {/* Name */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Name</Label>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveName();
                          if (e.key === 'Escape') { setEditingName(false); setNameValue(agent.name); }
                        }}
                      />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={saveName} disabled={saving}>
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingName(false); setNameValue(agent.name); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{agent.name}</span>
                      {isActive && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingName(true)}>
                          <Pencil className="h-3 w-3 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Role</Label>
                  {editingRole ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(AVAILABLE_ROLES).map(([r, roleScopes]) => (
                          <button
                            key={r}
                            onClick={() => setRoleValue(r)}
                            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                              roleValue === r
                                ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-medium">{r}</span>
                            <span className="ml-1.5 text-gray-400">({roleScopes.length} scopes)</span>
                          </button>
                        ))}
                      </div>
                      {roleValue && AVAILABLE_ROLES[roleValue] && (
                        <p className="text-xs text-gray-500">
                          Includes: {AVAILABLE_ROLES[roleValue].join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={saveRole}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Save Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setEditingRole(false); setRoleValue(agent.role || ''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${agent.role ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {agent.role || 'No role assigned'}
                      </span>
                      {isActive && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingRole(true)}>
                          <Pencil className="h-3 w-3 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Scopes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs text-gray-500">Scopes</Label>
                    {isActive && !editingScopes && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setEditingScopes(true); setScopeValues(scopes); }}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {editingScopes ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SCOPES.map((scope) => {
                          const active = scopeValues.includes(scope);
                          return (
                            <button
                              key={scope}
                              onClick={() => toggleScope(scope)}
                              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-mono border transition-colors ${
                                active
                                  ? 'border-green-600 bg-green-50 text-green-700'
                                  : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                              }`}
                            >
                              {active && <Check className="h-3 w-3 mr-1" />}
                              {scope}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={saveScopes}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Save Scopes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setEditingScopes(false); setScopeValues(scopes); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {scopes.length > 0 ? scopes.map((scope) => (
                        <span
                          key={scope}
                          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 font-mono"
                        >
                          {scope}
                        </span>
                      )) : (
                        <span className="text-sm text-gray-400 italic">No scopes</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamps */}
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

                {/* Metadata (if any) */}
                {agent.metadata && Object.keys(agent.metadata).length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Metadata</Label>
                    <pre className="text-xs bg-gray-50 border rounded p-2 font-mono text-gray-600 overflow-x-auto">
                      {JSON.stringify(agent.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Danger zone */}
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
            ) : (
              <AgentActivityTab agentId={agent.id} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PAGE_SIZE = 10;

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-50 text-blue-700',
  POST: 'bg-green-50 text-green-700',
  PUT: 'bg-amber-50 text-amber-700',
  PATCH: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-red-50 text-red-700',
};

function statusColor(status: number | null): string {
  if (!status) return 'text-gray-400';
  if (status < 300) return 'text-green-600';
  if (status < 400) return 'text-amber-600';
  return 'text-red-600';
}

function AgentActivityTab({ agentId }: { agentId: string }) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAgentActivity({
          agentId,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
        });
        if (res.error) {
          setError(res.error);
          return;
        }
        const data = res.data || [];
        setActivities(data);
        setHasMore(data.length >= PAGE_SIZE);
      } catch {
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    },
    [agentId]
  );

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          Showing page {page + 1}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => fetchPage(page)}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      {loading && activities.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mb-2" />
          <p className="text-xs text-gray-500">Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <Activity className="h-5 w-5 text-gray-300 mb-2" />
          <p className="text-xs text-gray-500">No activity recorded yet</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Method</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Path</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        METHOD_COLORS[act.method] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {act.method}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-700 truncate max-w-[200px]">
                      {act.path}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`font-semibold ${statusColor(act.status)}`}>
                        {act.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(act.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Previous
            </Button>
            <span className="text-xs text-gray-500">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={!hasMore || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
