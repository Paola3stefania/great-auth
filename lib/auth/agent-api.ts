"use client";

/**
 * Typed helpers for agent auth API calls.
 * The agentAuthClient plugin is registered on authClient but TypeScript
 * can't infer the `.agent` namespace through the local symlink.
 * These wrappers call the Better Auth endpoints directly via fetch.
 */

export type Agent = {
  id: string;
  name: string;
  status: "active" | "revoked";
  scopes: string[];
  role: string | null;
  orgId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
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

export async function listAgents(orgId?: string) {
  return api<Agent[]>("/agent/list", {
    query: orgId ? { orgId } : undefined,
  });
}

export async function getAgent(agentId: string) {
  return api<Agent>("/agent/get", { query: { agentId } });
}

export async function updateAgent(body: {
  agentId: string;
  name?: string;
  scopes?: string[];
  role?: string;
  metadata?: Record<string, unknown>;
}) {
  return api<Agent>("/agent/update", { method: "POST", body });
}

export async function revokeAgent(agentId: string) {
  return api<{ success: boolean }>("/agent/revoke", {
    method: "POST",
    body: { agentId },
  });
}

export type AgentActivity = {
  id: string;
  agentId: string;
  userId: string;
  method: string;
  path: string;
  status: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export async function getAgentActivity(opts: {
  agentId?: string;
  limit?: number;
  offset?: number;
}) {
  const query: Record<string, string> = {};
  if (opts.agentId) query.agentId = opts.agentId;
  if (opts.limit) query.limit = String(opts.limit);
  if (opts.offset) query.offset = String(opts.offset);
  return api<AgentActivity[]>("/agent/activity", { query });
}
