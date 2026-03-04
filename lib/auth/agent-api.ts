"use client";

/**
 * Typed helpers for agent-auth API calls.
 * The agentAuthClient plugin is registered on authClient but TypeScript
 * can't infer the `.agent` namespace through the local symlink.
 * These wrappers call the Better Auth endpoints directly via fetch.
 */

export type AgentHost = {
  id: string;
  userId: string | null;
  referenceId: string | null;
  scopes: string[];
  status: "active" | "pending" | "revoked" | "rejected";
  activatedAt: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Agent = {
  id: string;
  name: string;
  userId: string | null;
  hostId: string;
  status: "active" | "pending" | "expired" | "revoked" | "rejected";
  mode: "delegated" | "autonomous";
  lastUsedAt: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentPermission = {
  id: string;
  agentId: string;
  scope: string;
  status: "active" | "pending";
  referenceId: string | null;
  grantedBy: string | null;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function base() {
  return typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:4000";
}

async function api<T>(
  path: string,
  opts?: { method?: string; body?: unknown; query?: Record<string, string> }
): Promise<{ data: T | null; error: string | null }> {
  const method = opts?.method || "GET";
  const url = new URL(`/api/auth${path}`, base());
  if (opts?.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v);
    }
  }
  try {
    const res = await fetch(url.toString(), {
      method,
      credentials: "include",
      headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) {
      return { data: null, error: json?.message || `HTTP ${res.status}` };
    }
    return { data: json as T, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : "Request failed" };
  }
}

// ── Host management ─────────────────────────────────────────────────────

export async function listHosts() {
  return api<{ hosts: AgentHost[] }>("/agent/host/list");
}

export async function getHost(hostId: string) {
  return api<AgentHost>("/agent/host/get", { query: { hostId } });
}

export async function createHost(body: {
  scopes?: string[];
  publicKey?: Record<string, unknown>;
  jwksUrl?: string;
}) {
  return api<AgentHost>("/agent/host/create", { method: "POST", body });
}

export async function revokeHost(hostId: string) {
  return api<{ success: boolean }>("/agent/host/revoke", {
    method: "POST",
    body: { hostId },
  });
}

// ── Agent management ────────────────────────────────────────────────────

export async function listAgents() {
  const res = await api<Agent[] | { agents: Agent[] }>("/agent/list");
  if (res.data && !Array.isArray(res.data) && Array.isArray(res.data.agents)) {
    return { data: res.data.agents, error: null };
  }
  return res as { data: Agent[] | null; error: string | null };
}

export async function getAgent(agentId: string) {
  return api<Agent>("/agent/get", { query: { agentId } });
}

export async function revokeAgent(agentId: string) {
  return api<{ success: boolean }>("/agent/revoke", {
    method: "POST",
    body: { agentId },
  });
}

export async function revokeAllAgents(): Promise<{ revoked: number; errors: string[] }> {
  const list = await listAgents();
  if (list.error || !list.data) return { revoked: 0, errors: [list.error || "Failed to list agents"] };
  const active = list.data.filter((a) => a.status === "active");
  const errors: string[] = [];
  let revoked = 0;
  await Promise.all(
    active.map(async (agent) => {
      const res = await revokeAgent(agent.id);
      if (res.error) errors.push(`${agent.name}: ${res.error}`);
      else revoked++;
    })
  );
  return { revoked, errors };
}

// ── Permissions ─────────────────────────────────────────────────────────

export async function grantPermission(body: {
  agentId: string;
  scope: string;
  reason?: string;
}) {
  return api<AgentPermission>("/agent/grant-permission", { method: "POST", body });
}

// ── Discovery ───────────────────────────────────────────────────────────

export type DiscoveryResponse = {
  protocol_version: string;
  provider_name: string;
  description: string;
  issuer: string;
  algorithms: string[];
  modes: string[];
  approval_methods: string[];
  endpoints: Record<string, string>;
  jwt_max_age: number;
  session_ttl: number;
  max_lifetime: number;
  absolute_lifetime: number;
  blocked_scopes: string[];
};

export async function discover() {
  return api<DiscoveryResponse>("/agent/discover");
}

// ── Gateway ─────────────────────────────────────────────────────────────

export type GatewayProvider = {
  name: string;
  displayName: string;
  tools: Array<{ name: string; description: string }>;
};

export type GatewayDiscoverResponse = {
  providers: GatewayProvider[];
  cached: boolean;
};

export async function gatewayDiscover() {
  return api<GatewayDiscoverResponse>("/agent/gateway/discover");
}
