'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Loader2, Plug, RefreshCw, ExternalLink, Wrench,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import { gatewayDiscover, type GatewayProvider } from '@/lib/auth/agent-api';

export default function GatewayPage() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<GatewayProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await gatewayDiscover();
      if (res.error) {
        setError(res.error);
        return;
      }
      setProviders(res.data?.providers || []);
    } catch {
      setError('Failed to load gateway providers');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const totalTools = providers.reduce((sum, p) => sum + p.tools.length, 0);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Agent Gateway
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            External services and tools available to AI agents
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProviders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-gray-900">{providers.length}</p>
            <p className="text-xs text-gray-500">Providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-blue-600">{totalTools}</p>
            <p className="text-xs text-gray-500">Tools</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">Loading providers...</p>
          </CardContent>
        </Card>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Plug className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Providers Configured</h3>
            <p className="text-gray-500 text-center text-sm max-w-sm">
              The gateway has no providers configured. Add providers in the server configuration
              to enable agents to access external tools.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.name}
              provider={provider}
              expanded={expandedProvider === provider.name}
              onToggleExpand={() =>
                setExpandedProvider(
                  expandedProvider === provider.name ? null : provider.name
                )
              }
            />
          ))}

          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="text-center text-sm text-gray-500">
                <p className="font-medium text-gray-700 mb-1">How agents use the gateway</p>
                <p>
                  When agents connect via{' '}
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">connect_agent</code>,
                  they can request tool scopes like{' '}
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">github.list_issues</code>.
                  Approved scopes let the agent call tools through{' '}
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">call_gateway_tool</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

function ProviderCard({
  provider,
  expanded,
  onToggleExpand,
}: {
  provider: GatewayProvider;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const PROVIDER_ICONS: Record<string, { bg: string; icon: string; url: string }> = {
    github: { bg: 'bg-gray-900', icon: '🐙', url: 'https://github.com' },
    slack: { bg: 'bg-purple-600', icon: '💬', url: 'https://slack.com' },
  };

  const meta = PROVIDER_ICONS[provider.name] || {
    bg: 'bg-blue-600',
    icon: '🔌',
    url: '#',
  };

  return (
    <Card>
      <CardContent className="p-0">
        <button
          className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
          onClick={onToggleExpand}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg} text-white text-lg`}
          >
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{provider.displayName}</span>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                active
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                {provider.tools.length} tool{provider.tools.length !== 1 ? 's' : ''}
              </span>
              {meta.url !== '#' && (
                <a
                  href={meta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 hover:text-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  {meta.url.replace('https://', '')}
                </a>
              )}
            </div>
          </div>
          <div className="shrink-0 text-gray-400">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-gray-100 p-4">
            <Label className="text-xs text-gray-500 mb-2 block">
              Available Tools
            </Label>
            {provider.tools.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No tools discovered yet. Tools will appear after the first agent connection.
              </p>
            ) : (
              <div className="space-y-2">
                {provider.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <Wrench className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <code className="text-xs font-mono font-medium text-gray-800">
                        {provider.name}.{tool.name}
                      </code>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Agents request these tools as scopes when connecting. Example:{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">
                  {provider.name}.{provider.tools[0]?.name || 'tool_name'}
                </code>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
