# Agent Authentication (agent-auth + async-auth)

This document describes the AI agent authentication and authorization system in great-auth, powered by `@better-auth/agent-auth` with CIBA (Client-Initiated Backchannel Authentication) support.

## Overview

The system supports two approval methods for agent authentication:

1. **Device Authorization** — OAuth 2.0 Device Authorization Grant. The agent displays a user code and the user approves via `/device`.
2. **CIBA (Backchannel Authentication)** — The agent sends a backchannel request with the user's identity hint. The user approves asynchronously via `/async-auth`.

Both methods result in the agent receiving credentials (JWT keypair or access token) to make authenticated API calls on behalf of the user.

## Architecture

### Plugins

| Plugin | Package | Purpose |
|--------|---------|---------|
| `agentAuth` | `@better-auth/agent-auth` | Core agent lifecycle: registration, discovery, JWT auth, hosts, permissions |
| `deviceAuthorization` | `better-auth/plugins` | Device code flow (existing Better Auth plugin) |
| `asyncAuth` | `lib/auth/plugins/async-auth.ts` | CIBA endpoints: bc-authorize, verify, approve, reject, token poll |

### Data Model

```
agentHost (1) ──→ (N) agent (1) ──→ (N) agentPermission
                                         asyncAuthRequest (standalone)
```

- **agentHost** — Represents an agent host identity. Has optional public key or JWKS URL.
- **agent** — A specific agent instance, linked to a host. Has a mode (delegated or autonomous).
- **agentPermission** — Granular scope grants for an agent.
- **asyncAuthRequest** — Tracks CIBA request lifecycle (pending → approved/rejected/expired).

## Discovery

The discovery endpoint exposes server capabilities for agents to introspect:

```
GET /api/auth/agent/discover
GET /api/auth/.well-known/agent-configuration
```

Response includes `protocol_version`, `provider_name`, `modes`, `approval_methods`, and `endpoints` for both device authorization and CIBA flows.

## Approval Flows

### Device Authorization Flow

```
Agent                         Server                        User
  │                              │                            │
  ├─POST /device/code───────────►│                            │
  │◄─── device_code, user_code ──┤                            │
  │                              │                            │
  │  (display user_code)         │                            │
  │                              │     user visits /device    │
  │                              │◄───────────────────────────┤
  │                              │     enters user_code       │
  │                              │◄───────────────────────────┤
  │                              │     approves               │
  │                              │◄───────────────────────────┤
  │                              │                            │
  ├─POST /device/token──────────►│                            │
  │◄─── access_token ────────────┤                            │
```

### CIBA Flow

```
Agent                         Server                        User
  │                              │                            │
  ├─POST /oauth/bc-authorize────►│                            │
  │  { login_hint, scope }       │                            │
  │◄─── auth_req_id, interval ──┤                            │
  │                              │                            │
  │                              │  (push notification or     │
  │                              │   redirect to /async-auth) │
  │                              │───────────────────────────►│
  │                              │                            │
  │                              │  user views request info   │
  │                              │◄─GET /async-auth/verify────┤
  │                              │                            │
  │                              │  user approves             │
  │                              │◄─POST /async-auth/authorize┤
  │                              │                            │
  │  (polling)                   │                            │
  ├─POST /async-auth/token──────►│                            │
  │  { grant_type: ciba,         │                            │
  │    auth_req_id }             │                            │
  │◄─── access_token ────────────┤                            │
```

## Endpoints

### Agent-Auth (core)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agent/discover` | Discovery endpoint |
| GET | `/.well-known/agent-configuration` | Well-known discovery alias |
| POST | `/agent/register` | Register a new agent |
| GET | `/agent/list` | List user's agents |
| GET | `/agent/get` | Get agent details |
| POST | `/agent/revoke` | Revoke an agent |
| GET | `/agent/get-session` | Get agent session (via JWT Bearer) |
| POST | `/agent/host/create` | Create a host |
| GET | `/agent/host/list` | List user's hosts |
| POST | `/agent/host/revoke` | Revoke a host |
| POST | `/agent/grant-permission` | Grant a permission to an agent |
| POST | `/agent/cleanup` | Clean up expired agents |

### Async-Auth (CIBA)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/oauth/bc-authorize` | Start CIBA request |
| GET | `/async-auth/verify` | Get pending request details |
| POST | `/async-auth/authorize` | Approve a pending request |
| POST | `/async-auth/reject` | Reject a pending request |
| POST | `/async-auth/token` | Poll for access token |

### Device Authorization

| Method | Path | Description |
|--------|------|-------------|
| POST | `/device/code` | Request a device code |
| POST | `/device/token` | Poll for token |
| GET | `/device/verify` | Verify user code |
| POST | `/device/approve` | Approve device |
| POST | `/device/deny` | Deny device |

> **Why two path prefixes for CIBA?**
>
> `/oauth/bc-authorize` uses the `/oauth` prefix because it's the CIBA backchannel authorization endpoint per the OpenID CIBA specification. `/async-auth/*` endpoints are the approval/verification flows specific to this implementation. This separation keeps the standards-compliant entry point under `/oauth` while grouping the approval UI endpoints together.

## Configuration

```typescript
// lib/auth/auth.ts
import { agentAuth } from "@better-auth/agent-auth";
import { asyncAuth } from "@/lib/auth/plugins/async-auth";

export const auth = betterAuth({
  plugins: [
    agentAuth({
      approvalMethods: ["device_authorization", "ciba"],
      agentSessionTTL: 3600,
      modes: ["delegated", "autonomous"],
      providerName: "great-auth",
    }),
    deviceAuthorization(),
    asyncAuth({
      expiresIn: 300,        // CIBA request TTL in seconds
      pollingInterval: 5,    // Minimum seconds between token polls
    }),
  ],
});
```

## Running Tests

```bash
# Start the dev server
pnpm dev

# Run E2E tests
node --import tsx agents/e2e-test.ts
```

The E2E test suite covers:
1. Discovery endpoints (both paths, all CIBA + device endpoints)
2. Host and agent lifecycle (create, list, get, revoke)
3. JWT authentication (valid, wrong key, expired)
4. Cleanup of expired agents
5. Cross-user isolation
6. CIBA discovery endpoint presence
7. CIBA full flow (bc-authorize → verify → approve → token)
8. CIBA reject flow
9. CIBA edge cases (unknown user, bad grant type, unknown request ID)

## Agent Client SDK

For building agents that connect to this server:

```typescript
import { connectAgent, createAgentClient } from "@better-auth/agent-auth/agent-client";

const result = await connectAgent({
  appURL: "http://localhost:4000",
  name: "My Agent",
  scopes: ["reports.read"],
  mode: "delegated",
  onUserCode: ({ userCode, verificationUriComplete }) => {
    console.log(`Approve at: ${verificationUriComplete}`);
  },
});

const agent = createAgentClient({
  baseURL: "http://localhost:4000",
  agentId: result.agentId,
  privateKey: result.privateKey,
});

const session = await agent.getSession();
const res = await agent.fetch("/api/reports");
```

## Agent Gateway

The gateway lets agents call external service tools (GitHub, Slack, custom MCPs) through authenticated, scope-controlled endpoints.

### Architecture

```
Agent (MCP)                   great-auth                    GitHub API
  │                              │                            │
  ├─discover_tools──────────────►│                            │
  │◄─── providers + tools ───────┤                            │
  │                              │                            │
  ├─connect_agent───────────────►│                            │
  │  scopes: [github.list_issues]│                            │
  │◄─── agentId ─────────────────┤                            │
  │                              │                            │
  ├─call_gateway_tool───────────►│                            │
  │  tool: github.list_issues    ├─── GET /repos/.../issues──►│
  │                              │◄─── issues ────────────────┤
  │◄─── result ──────────────────┤                            │
```

### Gateway Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agent/gateway/discover` | Discover providers and tools (no auth) |
| GET | `/agent/gateway/tools` | List tools for authenticated agent |
| POST | `/agent/gateway/call` | Execute a tool (requires JWT + scope) |

### Configuration

The gateway is configured via `@better-auth/agent-gateway`:

```typescript
import { createGateway, githubProvider } from "@better-auth/agent-gateway";

agentAuth({
  // ...
  gateway: createGateway({
    providers: [
      githubProvider({
        async getAccessToken(userId) {
          // Look up per-user GitHub OAuth token, fall back to env
          const token = await getUserGitHubToken(userId);
          return token || process.env.AGENT_GATEWAY_GITHUB_TOKEN || null;
        },
      }),
    ],
  }),
});
```

### Token Resolution

GitHub tokens are resolved per-request in this order:
1. User's OAuth `account.accessToken` (if the user signed in with GitHub)
2. `AGENT_GATEWAY_GITHUB_TOKEN` env var (global fallback)

### Built-in Providers

| Provider | Tools | Token Source |
|----------|-------|-------------|
| `githubProvider` | list_repos, list_issues, get_issue, create_issue | Per-user OAuth or `AGENT_GATEWAY_GITHUB_TOKEN` |

### Adding Custom Providers

```typescript
import { mcpProvider, customProvider, registerGatewayPreset, mcpPreset } from "@better-auth/agent-gateway";

// Option 1: Connect to any MCP server
mcpProvider({
  id: "my-service",
  url: "http://localhost:8080/mcp",
  displayName: "My Service",
})

// Option 2: Custom provider with manual tool list + call handler
customProvider({
  id: "internal",
  displayName: "Internal API",
  getTools: async () => [
    { name: "search", description: "Search internal docs" },
  ],
  call: async ({ toolName, args }) => {
    // your implementation
  },
})

// Option 3: Register as a preset for reuse by name
registerGatewayPreset("my-mcp", mcpPreset("my-mcp"));
createGateway({ providers: ["github", "my-mcp"] });
```

### MCP Server Tools

The `@better-auth/agent-auth/mcp-tools` export provides ready-made MCP tool definitions:

- `discover_tools` — pre-connection tool discovery
- `connect_agent` — authenticate via device flow
- `list_gateway_tools` — list tools after connecting
- `call_gateway_tool` — execute a tool
- `agent_request` — make authenticated API calls
- `list_agents` / `disconnect_agent` / `agent_status`

### Environment Variables

```bash
# Comma-separated list of gateway providers
AGENT_GATEWAY_PROVIDERS=github

# GitHub token (fallback when no per-user OAuth)
AGENT_GATEWAY_GITHUB_TOKEN=ghp_...
```
