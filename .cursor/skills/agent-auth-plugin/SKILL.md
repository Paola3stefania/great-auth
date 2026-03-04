---
name: agent-auth-plugin
description: Agent authentication plugin architecture for great-auth. Covers agent-auth, CIBA async-auth, agent-gateway, device authorization, and MCP tools. Use when working on agent endpoints, gateway providers, CIBA flow, approval methods, MCP integration, createGateway, mcpProviders, or any agent-related feature in this repo.
---

# Agent Auth Plugin Architecture

## Upstream Skill

The **canonical** gateway setup guide lives in the agent-auth repo:
`~/Coding/betterAuth/better-auth-2/agent-auth/packages/agent-gateway/skill/agent-auth-gateway/SKILL.md`

Read that file for full `createGateway` API patterns (mcpProviders, getProviderToken, useProvider, registerGatewayPreset, mcpPreset, customProvider, etc.). What follows here is project-specific context.

## Local Package Links

Both `@better-auth/agent-auth` and `@better-auth/agent-gateway` are **locally linked** from the `better-auth-2` monorepo. After any source changes there:

```bash
cd ~/Coding/betterAuth/better-auth-2/agent-auth/packages/agent-auth && pnpm build
cd ~/Coding/betterAuth/better-auth-2/agent-auth/packages/agent-gateway && pnpm build
cd ~/Coding/great-auth && pnpm install --no-frozen-lockfile
```

Source locations:
- `agent-auth`: `~/Coding/betterAuth/better-auth-2/agent-auth/packages/agent-auth/src/`
- `agent-gateway`: `~/Coding/betterAuth/better-auth-2/agent-auth/packages/agent-gateway/src/`
- `better-auth` (core): `~/Coding/betterAuth/better-auth-2/better-auth/packages/better-auth/src/`

## Plugin Stack

Registered in `lib/auth/auth.ts`:

| Plugin | Source | Purpose |
|--------|--------|---------|
| `agentAuth` | `@better-auth/agent-auth` | Agent lifecycle, discovery, JWT auth, enrollments, permissions, gateway |
| `deviceAuthorization` | `better-auth/plugins` | OAuth 2.0 device code flow |
| `asyncAuth` | `lib/auth/plugins/async-auth.ts` | CIBA backchannel auth (local plugin) |
| `createGateway` | `@better-auth/agent-gateway` | Gateway provider config (passed to `agentAuth({ gateway })`) |

### Type Cast Requirement

The `agentAuth()` return must be cast due to duplicate `@better-auth/core` types between the linked packages:

```typescript
agentAuth({ ... }) as unknown as BetterAuthPlugin,
```

Same for `agentAuthClient()` on the client. Do NOT remove the casts.

## Key Files

| File | Purpose |
|------|---------|
| `lib/auth/auth.ts` | Main auth config — all plugins registered here |
| `lib/auth/client.ts` | Client-side auth — `agentAuthClient()` also needs cast |
| `lib/auth/agent-api.ts` | Typed fetch wrappers for agent endpoints (client-side) |
| `lib/auth/plugins/async-auth.ts` | CIBA plugin — 5 endpoints, uses `adapter.findMany<CibaRequest>()` |
| `lib/db/better-auth-schema.ts` | Drizzle schema — `agentHost`, `agent`, `agentPermission`, `asyncAuthRequest` |
| `app/async-auth/page.tsx` | CIBA approval UI |
| `app/(dashboard)/dashboard/agents/page.tsx` | Agent management dashboard |
| `app/(dashboard)/dashboard/gateway/page.tsx` | Gateway providers dashboard |
| `agents/local-agent.ts` | Sample agent using `connectAgent` + `createAgentClient` |
| `agents/e2e-test.ts` | E2E tests — run with `node --import tsx agents/e2e-test.ts` |

## Agent Auth Features (from upstream README)

- **Ed25519 Keypair Identity** — agents authenticate with asymmetric keys; private keys never touch the server
- **Enrollments** — persistent app-level consent for silent agent creation
- **Three Lifetime Clocks** — `agentSessionTTL` (sliding), `agentMaxLifetime` (per-activation), `absoluteLifetime` (permanent)
- **Scopes & Roles** — wildcard matching (`github.*`), blocked scopes, fresh session enforcement
- **Scope Escalation** — agents can request additional scopes with user approval
- **Key Rotation & Revocation** — rotate keys without downtime, revoke with credential wipe and cascade
- **MCP Tools** — expose agent management as MCP server tools
- **Workgroups** — group agents within organizations

## Gateway Config (this project)

Currently uses minimal env-based config:

```typescript
agentAuth({
  gateway: createGateway({
    mcpProviders: ["github"],
  }),
})
```

Token resolved from `AGENT_GATEWAY_GITHUB_TOKEN` or `GITHUB_TOKEN` env var. For per-user tokens or more providers, see the upstream skill.

## CIBA / Async-Auth Endpoints (local plugin)

- `POST /oauth/bc-authorize` — start backchannel request
- `GET /async-auth/verify` — get pending request details
- `POST /async-auth/authorize` — approve (requires user session)
- `POST /async-auth/reject` — reject (requires user session)
- `POST /async-auth/token` — poll with `grant_type: "urn:openid:params:grant-type:ciba"`

## Writing async-auth Plugin Endpoints

The local CIBA plugin uses Better Auth's plugin API:

```typescript
import { createAuthEndpoint, APIError, getSessionFromCtx } from "better-auth/api";

const results = await ctx.context.adapter.findMany<MyType>({ model, where, limit });
const session = await getSessionFromCtx(ctx);
const found = await ctx.context.internalAdapter.findUserByEmail(email);
// found.user.id — NOT found.id
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `AGENT_GATEWAY_GITHUB_TOKEN` | GitHub token for gateway |
| `AGENT_GATEWAY_PROVIDERS` | Comma-separated provider list |
