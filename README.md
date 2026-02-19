# Great Auth - Better Auth Integration Demo

A Next.js application demonstrating [Better Auth](https://www.better-auth.com/) integration with agent authentication, SSO, device authorization, and more.

## Features

- **Email & Password** authentication with username support
- **Google OAuth** social login
- **SSO via OIDC** (configured with Auth0)
- **Agent Auth** -- AI agents connect via device authorization flow, with scoped permissions and role-based access
- **Device Authorization** -- `/device` page where users approve agent connections by entering a code
- **Organizations** -- multi-tenant support via the organization plugin
- **Better Auth Infra** -- integration with the Better Auth infrastructure service

### Dashboard

The app includes a dashboard at `/dashboard` with:

- **General** -- update account name
- **Security** -- change password, or create one for SSO-only accounts
- **Agents** -- list, edit, and revoke connected AI agents; view agent activity logs

### Agent Auth

Agents authenticate using the [device authorization flow](https://www.better-auth.com/docs/plugins/device-authorization):

1. An agent (CLI script, MCP server, etc.) initiates a device code request
2. The user opens `/device` in their browser, enters the code, and approves
3. The agent receives a keypair and signs JWTs to make authenticated API calls on behalf of the user

Roles and scopes are configured in `lib/auth/auth.ts`:

```typescript
agentAuth({
  roles: {
    reader: ["reports.read"],
    writer: ["reports.read", "reports.write", "email.send"],
  },
  defaultRole: "reader",
}),
```

A sample local agent script is included at `agents/local-agent.ts` (run with `pnpm agent:local`).

A protected `/api/reports` endpoint demonstrates scope-based access control for both users and agents.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15.4 canary (App Router, Turbopack, experimental PPR)
- **Authentication**: [Better Auth](https://www.better-auth.com/) 1.5.0-beta.13
- **Database**: [PostgreSQL](https://www.postgresql.org/) 16 (via Docker)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) v4

## Project Structure

```
app/
  (dashboard)/
    dashboard/
      general/page.tsx      # Account settings
      security/page.tsx     # Password management
      agents/page.tsx       # Agent management dashboard
      layout.tsx            # Dashboard sidebar layout
    page.tsx                # Home page with auth form
    layout.tsx              # Root app shell
  api/
    auth/[...all]/route.ts  # Better Auth API handler
    reports/route.ts        # Protected reports endpoint (user + agent)
    user/                   # User API routes (has-password, set-password)
  device/page.tsx           # Device authorization approval page
agents/
  local-agent.ts            # Sample agent script
components/
  auth/auth-form.tsx        # Sign-in / sign-up form
  ui/                       # shadcn/ui components
lib/
  auth/
    auth.ts                 # Better Auth server config (plugins, providers)
    client.ts               # Better Auth client (React hooks, actions)
    agent-api.ts            # Typed helpers for agent auth API calls
  db/
    better-auth-schema.ts   # Drizzle schema for Better Auth tables
    schema.ts               # App-specific schema
    drizzle.ts              # Drizzle client
    migrations/             # Generated migration files
    seed.ts                 # Database seeder
    setup.ts                # Interactive DB setup script
  env.ts                    # Server-only env var helpers with diagnostics
  hooks/
    use-has-password.ts     # Hook for checking if user has a password
packages/
  better-auth-infra/        # Local @better-auth/infra package
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker (for local PostgreSQL)

### Installation

1. Clone and install:

   ```bash
   git clone <your-repo-url>
   cd great-auth
   pnpm install
   ```

2. Create a `.env` file (see `.env.example`):

   ```bash
   # Database (Docker Compose exposes port 54323)
   POSTGRES_URL=postgres://postgres:postgres@localhost:54323/postgres

   # Better Auth
   BETTER_AUTH_SECRET=<openssl rand -hex 32>
   BETTER_AUTH_URL=http://localhost:4000

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret

   # Better Auth Infra (optional)
   BETTER_AUTH_API_KEY=your_api_key
   BETTER_AUTH_API_URL=http://localhost:8000
   BETTER_AUTH_KV_URL=http://localhost:8787

   # SSO OIDC Provider (optional, e.g. Auth0)
   SSO_PROVIDER_ID=auth0
   SSO_ISSUER=https://your-tenant.auth0.com/
   SSO_DOMAIN=your-domain.com
   SSO_CLIENT_ID=your_client_id
   SSO_CLIENT_SECRET=your_client_secret
   ```

3. Start PostgreSQL and run migrations:

   ```bash
   docker compose up -d
   pnpm db:migrate
   ```

4. Seed the database (creates a test user -- `test@test.com` / `admin123`):

   ```bash
   pnpm db:seed
   ```

5. Start the dev server (runs on port 4000 with Turbopack):

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:4000](http://localhost:4000)

### Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server on port 4000 (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm db:setup` | Interactive database setup |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed database with test user |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm agent:local` | Run the sample local agent script |

## Better Auth Configuration

The server-side config lives in `lib/auth/auth.ts` with these plugins:

| Plugin | Purpose |
|---|---|
| `username()` | Username-based auth with validation and normalization |
| `organization()` | Multi-tenant organizations |
| `agentAuth()` | AI agent authentication with roles and scopes |
| `deviceAuthorization()` | Device auth flow for agents and CLI tools |
| `infra()` | Better Auth infrastructure service integration |
| `sso()` | Enterprise SSO via OIDC (Auth0, etc.) with domain verification |

The client config (`lib/auth/client.ts`) mirrors these with their client-side counterparts.

### Database Schema

Better Auth tables are defined in `lib/db/better-auth-schema.ts`:

- `user` -- users with optional username
- `session` -- active sessions with organization context
- `account` -- OAuth provider accounts
- `verification` -- email verification tokens
- `ssoProvider` -- SSO provider configurations
- `organization` -- organizations
- `member` -- organization membership
- `invitation` -- organization invitations
- `agent` -- registered AI agents with public keys
- `agentActivity` -- agent request audit log
- `deviceCode` -- pending device authorization codes

### Generating the Schema

Better Auth's `migrate` CLI command only works with the Kysely adapter. For Drizzle, use `generate` instead:

```bash
# Temporarily comment out `import 'server-only'` in lib/auth/auth.ts first
npx @better-auth/cli@latest generate --config lib/auth/auth.ts --output lib/db/better-auth-schema.ts

# Then re-add the 'server-only' import

# Generate and apply Drizzle migrations
pnpm db:generate
pnpm db:migrate
```

The generated schema may not include fields for all plugins. Check plugin docs and add missing columns manually (e.g., `username` and `displayUsername` for the username plugin).

## MCP Agent Integration

This project includes an MCP server config (`.cursor/mcp.json`) for the Better Auth Agent Auth plugin. This lets AI coding assistants (like Cursor) connect to the app as authenticated agents via the device authorization flow.

The agent's private key is stored at `~/.better-auth/agents/connections/<agentId>.json` with `chmod 0600` permissions.

## Deployment

### AWS Amplify

1. **Database**: Use Neon, Supabase, AWS RDS, or any PostgreSQL provider. For RDS, always include `?sslmode=require` in the connection string.

2. **Environment variables**: Set in **Amplify Console > App Settings > Environment variables** (not Hosting or Secrets):
   - `POSTGRES_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

3. **Migrations**: Run during build via `amplify.yml`, or manually from your local machine with the production `POSTGRES_URL`.

4. **Google OAuth**: Add your Amplify domain to authorized redirect URIs in Google Cloud Console: `https://your-app.amplifyapp.com/api/auth/callback/google`

## Troubleshooting

### Schema Generation with Drizzle

The CLI `generate` command does not automatically add fields for plugins. If you see errors like `column "username" does not exist`, manually add the missing columns to `lib/db/better-auth-schema.ts` and re-run `pnpm db:generate && pnpm db:migrate`.

The `schema: betterAuthSchema` option in `drizzleAdapter()` is required. Without it, Better Auth won't map its tables correctly.

### Next.js 15 PPR Compatibility

This project uses Next.js 15.4 canary with experimental PPR. Better Auth's `auth.api.getSession({ headers })` uses `headers()` which causes PPR bailouts. Handle React postpone signals by re-throwing them in catch blocks:

```typescript
try {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
} catch (error: unknown) {
  if (error && typeof error === 'object' && '$$typeof' in error &&
      error.$$typeof === Symbol.for('react.postpone')) {
    throw error; // Re-throw postpone signals
  }
  return null;
}
```

Components using `useSearchParams()` must be wrapped in `<Suspense>`. If PPR causes too many issues, consider Next.js 14 (stable) or disabling PPR.

### AWS RDS Connection

- Always include `?sslmode=require` in the connection string
- URL-encode special characters in passwords (`,` -> `%2C`, `@` -> `%40`, etc.)
- Ensure the security group allows inbound connections on port 5432

### Amplify Environment Variables

Set variables in **App Settings > Environment variables**, not in build settings or Secrets. Variables only take effect after a new deployment.

## License

Based on the [Next.js SaaS Starter](https://vercel.com/templates/authentication/next-js-saas-starter) template.
