# Great Auth - Better Auth Integration Demo

This repository demonstrates how to integrate **Better Auth** authentication (SSO, password/username) into a Next.js application.

## About

This project is built using the [Next.js SaaS Starter](https://vercel.com/templates/authentication/next-js-saas-starter) as a starter template and showcases integration with Better Auth for various authentication methods including:

- **Password & Username Authentication**
- **Single Sign-On (SSO)**
- Multiple authentication providers

The starter template provides a solid foundation with authentication, database setup, and dashboard functionality, which we'll enhance with Better Auth integration.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15.4 (with App Router and experimental PPR)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) 
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

**Note:** This project uses **Next.js 15.4 canary** with experimental features (PPR - Partial Prerendering). Better Auth supports Next.js 14+ (including Next.js 15 and 16), but **Next.js 15 PPR is experimental** and may cause compatibility issues. If you encounter PPR/prerendering issues, consider using **Next.js 14** (stable) instead, or follow the PPR compatibility guidance in the [Troubleshooting](#troubleshooting) section.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker (for local Postgres) or a remote Postgres database

**Important:** This project uses **Next.js 15.4 canary** with experimental PPR. Better Auth supports Next.js 14+, but **Next.js 15 PPR is experimental** and may cause compatibility issues. If you prefer stability, you can downgrade to Next.js 14 (stable) to avoid PPR issues. See [Next.js Build/Prerendering Issues](#5-nextjs-buildprerendering-issues-better-auth--nextjs-15-ppr) for PPR-specific troubleshooting.

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd great-auth
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   
   **First, follow the Better Auth installation guide**: https://www.better-auth.com/docs/installation
   
   Create a `.env` file in the root directory:
   ```bash
   # Better Auth required variables
   BETTER_AUTH_SECRET=your_generated_secret_here
   BETTER_AUTH_URL=http://localhost:3000
   
   # Database
   POSTGRES_URL=postgres://postgres:postgres@localhost:54322/postgres
   
   # Google OAuth (for SSO)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
   
   Generate BETTER_AUTH_SECRET:
   ```bash
   openssl rand -hex 32
   ```
   
   **Google OAuth Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID (Web application)
   - Set Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret to your `.env` file

4. Set up local Postgres (or use the interactive setup):
   ```bash
   pnpm db:setup
   ```
   Choose "L" for local Docker Postgres when prompted.

5. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

6. Seed the database:
   ```bash
   pnpm db:seed
   ```
   
   This creates a default user:
   - Email: `test@test.com`
   - Password: `admin123`

7. Start the development server:
   ```bash
   pnpm dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Better Auth Integration

This repository demonstrates Better Auth integration with Google SSO. To get started:

1. **First, follow the Better Auth installation guide**: https://www.better-auth.com/docs/installation
   - This will help you understand the basic setup and configuration
   - Install Better Auth in your project
   - Set up environment variables (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
   - Configure your database adapter

2. **Then, set up Google SSO** using the configuration in `lib/auth/auth.ts`

### Current Integration Status

- ✅ Basic setup and configuration
- ✅ Google SSO integration
- 🔄 Better Auth schema generation
- 🔄 Provider-specific configurations

### Generating Better Auth Schema

Better Auth's `migrate` command only works with the built-in Kysely adapter. Since this project uses **Drizzle ORM**, you need to use a different workflow:

**The Problem:**
```bash
❌ npx @better-auth/cli migrate  # Only works with Kysely
```

**For Drizzle, use the `generate` command and then Drizzle's own migration tools:**

#### Step 1: Generate the Better Auth Schema

**⚠️ Critical:** If your `lib/auth/auth.ts` file contains `import 'server-only'`, you must temporarily remove it before running the CLI, then re-add it afterwards. The CLI cannot resolve the configuration with `server-only` included.

**Temporary fix:**
```bash
# 1. In lib/auth/auth.ts, comment out or remove the 'server-only' import:
#    Change: import 'server-only';
#    To:     // import 'server-only';

# 2. Run the CLI
npx @better-auth/cli@latest generate --config lib/auth/auth.ts

# 3. Re-add the 'server-only' import after running the CLI:
#    Uncomment: import 'server-only';
```

**Default Output:** This will create a file named `schema.ts` in your project **root directory** (not in `lib/db/`). The default filename is just `schema.ts`.

**Alternative:** You can specify a custom output path using the `--output` flag:
```bash
npx @better-auth/cli@latest generate --config lib/auth/auth.ts --output lib/db/better-auth-schema.ts
```

If you use the default command (without `--output`), the file will be created in the root as `schema.ts` with all the required Better Auth tables:
- `user` - User information
- `session` - Active user sessions
- `account` - OAuth provider accounts (Google, etc.)
- `verification` - Email verification tokens

#### Step 2: Move the Generated Schema (if using default filename)

If you used the default command (which creates `schema.ts` in root), move it to your schema directory:

```bash
mv schema.ts lib/db/better-auth-schema.ts
```

**Note:** If you used `--output lib/db/better-auth-schema.ts`, you can skip this step.

#### Step 3: **IMPORTANT - Manual Schema Adjustments for Plugins**

**⚠️ Critical:** The generated schema does **NOT** automatically include fields for Better Auth plugins. If you're using plugins (like `username()`), you must **manually add** the required fields to the schema.

**For the Username Plugin:**

Open `lib/db/better-auth-schema.ts` and add these fields to the `user` table:

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // ⬇️ ADD THESE FIELDS FOR USERNAME PLUGIN:
  username: text("username").unique(),
  displayUsername: text("display_username"),
});
```

**Why this is needed:** Better Auth plugins require database fields, but the CLI `generate` command doesn't know about your plugin configuration. You must manually add plugin-specific fields based on the Better Auth plugin documentation.

**Check plugin documentation** for required schema fields when adding new plugins.

#### Step 4: Update Drizzle Configuration Files

You need to update **3 files** to integrate the Better Auth schema:

**A. `lib/db/drizzle.ts`** - Import and merge schemas:
```typescript
import * as betterAuthSchema from './better-auth-schema';
import * as appSchema from './schema';

export const db = drizzle(client, { 
  schema: { ...appSchema, ...betterAuthSchema } 
});
```

**B. `drizzle.config.ts`** - Reference schema for migrations:
```typescript
export default {
  schema: ['./lib/db/better-auth-schema.ts'], // Add Better Auth schema
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
```

**C. `lib/auth/auth.ts`** - Pass schema to Drizzle adapter:
```typescript
import * as betterAuthSchema from "@/lib/db/better-auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: betterAuthSchema, // ⬅️ MUST pass schema here
  }),
  // ... rest of config
});
```

**⚠️ Critical:** The `schema: betterAuthSchema` option in `drizzleAdapter` is **required**. Without it, Better Auth won't know how to map its tables.

#### Step 5: Generate and Apply Drizzle Migrations

Generate the migration files (creates SQL):
```bash
pnpm db:generate
```

Apply the migration to create tables in your database:
```bash
pnpm db:migrate
```

**⚠️ Critical:** You must run **both** `db:generate` AND `db:migrate`. Without `db:migrate`, the tables don't exist and you'll get errors like `relation "verification" does not exist`.

#### Step 6: Verify Schema is Correct

Check that tables were created:
```bash
# Option 1: Use Drizzle Studio
pnpm db:studio

# Option 2: Use psql
psql $POSTGRES_URL
\dt  # List all tables
```

You should see these Better Auth tables:
- `user`
- `session`
- `account`
- `verification`

#### Updating Schema After Adding Plugins

If you add new Better Auth plugins later (e.g., two-factor authentication):

1. **Add plugin to `lib/auth/auth.ts`**
2. **Check plugin docs** for required database fields
3. **Manually add fields** to `lib/db/better-auth-schema.ts`
4. **Regenerate migrations:**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

**Summary - Complete Workflow:**
```bash
# 1. ⚠️ Temporarily comment out 'server-only' in lib/auth/auth.ts
#    (Better Auth CLI cannot resolve config with 'server-only')

# 2. Generate Better Auth schema (creates schema.ts in root)
npx @better-auth/cli@latest generate --config lib/auth/auth.ts

# 3. Re-add 'server-only' import in lib/auth/auth.ts

# 4. Move to schema directory (or use --output flag to skip this step)
mv schema.ts lib/db/better-auth-schema.ts

# 5. ⚠️ MANUALLY add plugin fields (e.g., username, displayUsername)
#    Edit lib/db/better-auth-schema.ts

# 4. Update 3 config files (see Step 4 above):
#    - lib/db/drizzle.ts
#    - drizzle.config.ts
#    - lib/auth/auth.ts

# 5. Generate Drizzle migration
pnpm db:generate

# 6. Apply migration
pnpm db:migrate

# 7. Verify tables exist
pnpm db:studio
```

**Common Mistakes:**
- ❌ Using `npx @better-auth/cli migrate` (only works with Kysely)
- ❌ Not manually adding plugin fields to schema
- ❌ Forgetting to pass `schema: betterAuthSchema` to `drizzleAdapter`
- ❌ Running `db:generate` but forgetting `db:migrate`
- ❌ Not updating `drizzle.config.ts` to include Better Auth schema

## Deployment

### Deploying to AWS Amplify

This project can be deployed to [AWS Amplify](https://aws.amazon.com/amplify/).

#### Step 1: Set up Database

AWS Amplify doesn't include built-in Postgres. Use one of these:

**Option A: [Neon](https://neon.tech)**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

**Option B: [Supabase](https://supabase.com)**
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (URI format)

**Option C: AWS RDS PostgreSQL**
1. Go to AWS RDS Console
2. Create a PostgreSQL database instance
3. Get connection details from the RDS Console:
   - **Endpoint**: Found in "Connectivity & security" tab (e.g., `database-1.abc123.us-east-2.rds.amazonaws.com`)
   - **Port**: Default is `5432` (shown in "Connectivity & security" tab)
   - **Master username**: Found in "Configuration" tab
   - **Master password**: The password you set when creating the database
   - **Database name**: Found in "Configuration" tab (default is usually `postgres`)
4. Construct the connection string:
   ```
   postgres://USERNAME:PASSWORD@ENDPOINT:PORT/DATABASE_NAME?sslmode=require
   ```
   **Example:**
   ```
   postgres://postgres:MyPassword123@database-1.cbu4uk4ein2c.us-east-2.rds.amazonaws.com:5432/postgres?sslmode=require
   ```
   
   **Important:** AWS RDS PostgreSQL requires SSL encryption. Always include `?sslmode=require` at the end of the connection string, or connections will fail with "no encryption" error.

**Option D: [Nile](https://www.thenile.dev/)**
1. Sign up at [thenile.dev](https://www.thenile.dev/)
2. Create a new database
3. Copy the connection string

#### Step 2: Connect Repository to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your GitHub/GitLab/Bitbucket repository
4. Select the `great-auth` repository
5. Select the `main` branch

#### Step 3: Configure Build Settings

Amplify should auto-detect Next.js. Verify these settings:

- **App build command:** `npm run build` or `pnpm build`
- **Base directory:** `/` (root)
- **Node version:** `18.x` or `20.x`

#### Step 4: Configure Environment Variables

In Amplify Console → App Settings → Environment variables, add:

```bash
# Better Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -hex 32>
BETTER_AUTH_URL=https://your-app-id.amplifyapp.com

# Database (from your chosen provider)
# IMPORTANT: For RDS, add ?sslmode=require for SSL encryption
POSTGRES_URL=postgres://USERNAME:PASSWORD@host:5432/dbname?sslmode=require

# Base URL (optional)
BASE_URL=https://your-app-id.amplifyapp.com

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

**Important for RDS:** AWS RDS PostgreSQL requires SSL encryption. Always include `?sslmode=require` in your `POSTGRES_URL` connection string, otherwise connections will fail with "no encryption" error.

**Important:** Update Google OAuth redirect URIs:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Edit your OAuth 2.0 Client ID
3. Add to "Authorized redirect URIs":
   ```
   https://your-app-id.amplifyapp.com/api/auth/callback/google
   ```

#### Step 5: Run Database Migrations

**Option A: Run migrations during Amplify build (recommended):**

Set up `env.production` file or environment variables in Amplify Console so migrations can run during build. The `amplify.yml` file will run migrations automatically if `POSTGRES_URL` is available.

```bash
# In Amplify Console → Environment variables, set:
POSTGRES_URL=postgres://USERNAME:PASSWORD@host:5432/dbname?sslmode=require
```

**Option B: Run migrations manually from your local machine:**

```bash
# Set your production database URL
# IMPORTANT: RDS requires SSL - add ?sslmode=require to the connection string
export POSTGRES_URL="postgres://USERNAME:PASSWORD@database-1.cbu4uk4ein2c.us-east-2.rds.amazonaws.com:5432/postgres?sslmode=require"

# Generate migrations (if needed)
npm run db:generate

# Run migrations
npm run db:migrate
```

**Note:** AWS RDS PostgreSQL requires SSL encryption by default. Always include `?sslmode=require` in your connection string, or RDS will reject the connection with "no encryption" error.

#### Step 6: Deploy

1. Click "Save and deploy" in Amplify Console
2. Amplify will build and deploy your app
3. Wait for deployment to complete

#### Step 7: Verify

- ✅ App loads: `https://your-app-id.amplifyapp.com`
- ✅ Better Auth routes: `https://your-app-id.amplifyapp.com/api/auth`
- ✅ Google SSO login works
- ✅ Database tables created (verify with `pnpm db:studio`)

## Troubleshooting

This section addresses common issues encountered during setup and deployment, based on real-world experience.

### 📋 Quick Reference: Main Pain Points

**🔥 BIGGEST PAIN POINT:**
1. ⚠️ **Better Auth Schema Generation with Drizzle** - Generated schema is **incomplete** (missing plugin fields), requires manual editing, and must update 3 files. See detailed solution below.

**Top 3 Deployment Issues:**
2. 🔴 **Environment Variables in Amplify** - Variables not available at runtime (wrong location: use "App Settings", not "Hosting" or "Secrets")
3. 🔴 **RDS Connection String** - Missing `?sslmode=require` or special characters in password not URL-encoded
4. 🔴 **Database Migrations** - Set up `env.production` or environment variables in Amplify Console so migrations can run during build

**Other Common Issues:**
5. ⚠️ **Better Auth + Next.js 15 PPR** - This project uses Next.js 15 canary with experimental PPR. Better Auth supports Next.js 14+, but Next.js 15 PPR is experimental. React postpone signals from `auth.api.getSession({ headers })` must be re-thrown, not caught. **Workaround:** Use Next.js 14 (stable) or Next.js 15 without PPR to avoid these issues.
6. Google OAuth redirect URI mismatch (must match exactly, including protocol and path)
7. Package manager confusion (pnpm vs npm, lockfile conflicts)

**Jump to detailed solutions below ↓**

---

### 🔴 Critical Pain Points

#### 1. Environment Variables in AWS Amplify

**Problem:** Environment variables set in Amplify Console not available at runtime, even though they work during build.

**Symptoms:**
- `POSTGRES_URL environment variable is not set` error at runtime
- Variables available during `npm run build` but missing when app runs
- Secrets vs Environment Variables confusion

**Root Causes:**
1. **Wrong location:** Amplify has two places for environment variables:
   - ❌ **Hosting → Environment variables** (per-branch, sometimes doesn't work)
   - ✅ **App Settings → Environment variables** (app-wide, recommended)
   
2. **Secrets vs Variables:**
   - ❌ **Secrets** use AWS Systems Manager Parameter Store (requires SSM setup)
   - ✅ **Environment Variables** are simple key-value pairs (recommended)

3. **Build vs Runtime:**
   - Variables set in `amplify.yml` with `export` only exist during **build**
   - Runtime variables must be set in **Amplify Console → App Settings → Environment variables**

**Solution:**
1. Go to **AWS Amplify Console** → Your App
2. Navigate to **App Settings** → **Environment variables** (NOT "Secrets" or "Hosting")
3. Add all required variables:
   - `POSTGRES_URL`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `BASE_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. **Important:** Select the correct **branch/environment** when adding variables
5. Click **Save**
6. **Redeploy** the app (variables don't apply until next deployment)

**Verification:**
- Check build logs for `POSTGRES_URL` (should be visible during build)
- Check runtime logs/errors for missing variables
- Test database connection in your app

**Note:** Don't use `export VAR=value` in `amplify.yml` for runtime variables. Only use it for build-time configuration.

---

#### 2. AWS RDS Connection String Issues

**Problem:** Database connection fails with "no encryption" or "connection timeout" errors.

**Symptoms:**
- `PostgresError: no pg_hba.conf entry for host ... no encryption`
- `CONNECT_TIMEOUT` errors
- Connection works locally but not in production

**Root Causes:**
1. **Missing SSL parameter:** RDS requires SSL encryption by default
2. **Special characters in password:** Passwords with commas, spaces, or special chars need URL encoding
3. **Network/VPC restrictions:** RDS in private subnet can't be reached from Amplify build environment
4. **Security group rules:** Amplify build environment can't reach RDS port 5432

**Solution:**

**For SSL (always required):**
```bash
# ✅ Correct - includes ?sslmode=require
POSTGRES_URL=postgres://user:pass@host:5432/dbname?sslmode=require

# ❌ Wrong - missing SSL parameter
POSTGRES_URL=postgres://user:pass@host:5432/dbname
```

**For special characters in password:**
If your password contains special characters (e.g., `My,Password123`), URL encode them:
- `,` becomes `%2C`
- ` ` (space) becomes `%20`
- `@` becomes `%40`
- `:` becomes `%3A`
- `/` becomes `%2F`
- `?` becomes `%3F`
- `&` becomes `%26`
- `=` becomes `%3D`

**Example:**
```bash
# Password: My,Password123
# URL encoded: My%2CPassword123
POSTGRES_URL=postgres://user:My%2CPassword123@host:5432/dbname?sslmode=require
```

**For VPC/Network issues:**
1. Ensure RDS security group allows inbound connections from:
   - Amplify build environment (if running migrations during build)
   - Your local IP (for manual migrations)
2. If RDS is in a VPC, make it publicly accessible or configure Amplify to access the VPC

---

#### 3. Database Migrations in Amplify

**Problem:** Migrations fail during Amplify build or can't connect to RDS.

**Symptoms:**
- `CONNECT_TIMEOUT` during build
- `POSTGRES_URL environment variable is not set` during build
- `relation "user" does not exist` at runtime
- Build hangs trying to connect to database

**Root Causes:**
1. `POSTGRES_URL` not available during build (environment variables not set correctly)
2. Database not publicly accessible or security group blocking Amplify build environment
3. Missing `?sslmode=require` in connection string (RDS requires SSL)

**Solution:**

**✅ Run migrations during Amplify build (recommended):**

Set up `env.production` file or environment variables in Amplify Console:

1. **In Amplify Console → App Settings → Environment variables**, add:
   ```bash
   POSTGRES_URL=postgres://USERNAME:PASSWORD@host:5432/dbname?sslmode=require
   ```

2. The `amplify.yml` file will run migrations during build if `POSTGRES_URL` is available

3. **Important:** For RDS, ensure:
   - RDS has public access enabled (or Amplify can reach it)
   - Security group allows inbound connections from Amplify build environment
   - Connection string includes `?sslmode=require` for SSL

**Alternative: Run migrations manually from your local machine:**
```bash
# From your local machine
export POSTGRES_URL="postgres://user:pass@rds-host:5432/dbname?sslmode=require"
npm run db:migrate
```

**Verify migrations:**
```bash
# Connect to database and check tables
npm run db:studio
# Or use psql directly
```

---

#### 4. Better Auth Schema Generation with Drizzle (⚠️ BIGGEST PAIN POINT)

**Problem:** `npx @better-auth/cli migrate` doesn't work with Drizzle ORM, and the generated schema is missing plugin fields.

**Symptoms:**
- `BetterAuthError: migrate command only works with Kysely adapter`
- `relation "verification" does not exist` errors
- `column "username" does not exist` (when using username plugin)
- Schema files generated but missing required fields for plugins
- Better Auth not working even after migrations

**Root Causes:**
1. Better Auth's `migrate` command only works with Kysely adapter, not Drizzle
2. **CRITICAL:** The `generate` command does **NOT** automatically add fields for plugins (like `username()`)
3. Multiple files must be updated manually (3 files: `drizzle.ts`, `drizzle.config.ts`, `auth.ts`)
4. Easy to forget `db:migrate` after `db:generate`

**Solution:**

**Step 1: Generate schema**

**⚠️ Important:** If your `lib/auth/auth.ts` contains `import 'server-only'`, temporarily comment it out before running the CLI, then re-add it afterwards.

```bash
# 1. Temporarily comment out 'server-only' in lib/auth/auth.ts
#    Change: import 'server-only';
#    To:     // import 'server-only';

# 2. Generate schema (creates schema.ts in root)
npx @better-auth/cli@latest generate --config lib/auth/auth.ts
mv schema.ts lib/db/better-auth-schema.ts

# OR use --output to create it directly in the right location:
# npx @better-auth/cli@latest generate --config lib/auth/auth.ts --output lib/db/better-auth-schema.ts

# 3. Re-add 'server-only' import in lib/auth/auth.ts
#    Uncomment: import 'server-only';
```

**Step 2: ⚠️ CRITICAL - Manually add plugin fields**

The generated schema is **incomplete** if you use plugins. You must manually add fields:

**For Username Plugin:**
```typescript
// In lib/db/better-auth-schema.ts - ADD these to user table:
username: text("username").unique(),
displayUsername: text("display_username"),
```

**For other plugins:** Check Better Auth plugin docs for required schema fields.

**Step 3: Update 3 configuration files**

**A. `lib/db/drizzle.ts`:**
```typescript
import * as betterAuthSchema from './better-auth-schema';
import * as appSchema from './schema';

export const db = drizzle(client, { 
  schema: { ...appSchema, ...betterAuthSchema } // Merge schemas
});
```

**B. `drizzle.config.ts`:**
```typescript
export default {
  schema: ['./lib/db/better-auth-schema.ts'], // Include Better Auth schema
  // ... rest
};
```

**C. `lib/auth/auth.ts`:**
```typescript
database: drizzleAdapter(db, {
  provider: "pg",
  schema: betterAuthSchema, // ⬅️ MUST pass schema here
}),
```

**Step 4: Generate and apply migrations**
```bash
npm run db:generate  # Creates SQL migration files
npm run db:migrate   # Creates tables in database (DON'T FORGET THIS!)
```

**Step 5: Verify**
```bash
npm run db:studio  # Check tables exist
```

**Why This is the Biggest Pain Point:**
1. ❌ The workflow is **non-obvious** (generate → move → manually edit → update 3 files → migrate)
2. ❌ **No clear error** when plugin fields are missing (silent failures)
3. ❌ **Documentation doesn't mention** manual plugin field additions
4. ❌ Easy to forget `db:migrate` after `db:generate`
5. ❌ Easy to forget passing `schema` to `drizzleAdapter`

**Common Mistakes:**
- ❌ Using `npx @better-auth/cli migrate` (only works with Kysely)
- ❌ **Not removing `server-only` import before running CLI** (CLI can't resolve config)
- ❌ **Not manually adding plugin fields to schema** (biggest mistake!)
- ❌ **Forgetting to pass `schema: betterAuthSchema` to `drizzleAdapter`**
- ❌ Running `db:generate` but forgetting `db:migrate`
- ❌ Not updating `drizzle.config.ts` to include Better Auth schema
- ❌ Not updating `lib/db/drizzle.ts` to merge schemas

**Quick Checklist:**
- [ ] Generated schema with `npx @better-auth/cli generate`
- [ ] Moved schema to `lib/db/better-auth-schema.ts`
- [ ] **Manually added plugin fields** (username, displayUsername, etc.)
- [ ] Updated `lib/db/drizzle.ts` to import and merge schemas
- [ ] Updated `drizzle.config.ts` to reference schema
- [ ] Updated `lib/auth/auth.ts` to pass `schema: betterAuthSchema` to adapter
- [ ] Ran `db:generate` AND `db:migrate`
- [ ] Verified tables exist with `db:studio`

---

#### 5. Next.js Build/Prerendering Issues (Better Auth + Next.js 15 PPR)

**Problem:** Build fails with `Route / needs to bail out of prerendering` or `useSearchParams() should be wrapped in Suspense`. Better Auth's session fetching causes PPR (Partial Prerendering) bailouts.

**Symptoms:**
- `Route / needs to bail out of prerendering at this point because it used headers()`
- `useSearchParams() should be wrapped in a suspense boundary`
- `Error getting user from session: Error: Route / needs to bail out...`
- Build succeeds but app crashes at runtime with prerender errors

**Root Causes:**
1. **Better Auth's `auth.api.getSession({ headers: await headers() })`** causes Next.js 15 PPR to bail out (can't prerender routes that use `headers()`)
2. **`useSearchParams()`** in components that also use Better Auth's `useSession()` hook needs Suspense
3. Next.js 15 PPR (Partial Prerendering) tries to prerender dynamic routes that fetch sessions
4. React postpone signals not being handled correctly in error handlers

**Solution:**

**A. For Better Auth Session Fetching in Server Components:**

Better Auth's `getSession` uses `headers()`, which causes PPR bailouts. Handle React postpone signals:

```tsx
// ❌ Wrong - doesn't handle PPR bailout
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(), // Causes PPR bailout!
  });
  return session?.user;
}

// ✅ Correct - handle React postpone signals
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export async function getUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return null;
    }
    return session.user;
  } catch (error: unknown) {
    // ⬇️ CRITICAL: Don't catch React postpone signals
    // Let them propagate so Next.js can handle PPR bailout
    if (
      error && 
      typeof error === 'object' && 
      '$$typeof' in error && 
      error.$$typeof === Symbol.for('react.postpone')
    ) {
      throw error; // Re-throw postpone signals
    }
    // Only catch actual errors
    console.error('Error getting user from session:', error);
    return null;
  }
}
```

**B. For `useSearchParams()` with Better Auth Components:**

If your component uses both `useSearchParams()` and Better Auth's `useSession()`, wrap in Suspense:

```tsx
// ❌ Wrong - no Suspense boundary
export default function Page() {
  return <AuthForm />; // AuthForm uses useSearchParams()
}

// ✅ Correct - wrap component that uses useSearchParams()
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm /> {/* Uses useSearchParams() and useSession() */}
    </Suspense>
  );
}
```

**C. For Server Components Using Better Auth:**

Mark routes as dynamic if they fetch sessions:

```tsx
// ❌ Wrong - PPR tries to prerender
export default async function Page() {
  const user = await getUser(); // Uses headers()
  return <div>Hello {user?.name}</div>;
}

// ✅ Correct - disable prerendering for dynamic routes
export const dynamic = 'force-dynamic'; // Disable PPR for this route

export default async function Page() {
  const user = await getUser(); // OK now
  return <div>Hello {user?.name}</div>;
}
```

**D. For Layout/SWR Config:**

Don't fetch user data during build/prerender:

```tsx
// ❌ Wrong - tries to fetch during build
<SWRConfig
  value={{
    fallback: {
      '/api/user': getUser(), // Can't fetch during build!
    }
  }}
>

// ✅ Correct - fetch client-side only
<SWRConfig
  value={{
    fallback: {
      // User data will be fetched client-side via useSession hook
      // Don't fetch during build/prerender to avoid PPR issues
    }
  }}
>
```

**Why Better Auth Docs Don't Fully Cover This:**
- **Better Auth supports Next.js 14+** (including Next.js 15 and 16), but **Next.js 15 PPR is experimental**
- This project uses **Next.js 15.4 canary** with experimental PPR features that aren't stable yet
- Better Auth works fine with Next.js 14 (stable) and Next.js 15 without PPR; PPR compatibility issues are specific to **Next.js 15 experimental features**
- The `react.postpone` signal handling for PPR isn't well documented in Better Auth or Next.js docs yet
- **Solution:** If you want to avoid these issues, use **Next.js 14** (stable) or Next.js 15 without PPR instead of Next.js 15 canary with PPR

**Common Mistakes:**
- ❌ Catching React postpone signals in error handlers (prevents PPR from working)
- ❌ Not wrapping `useSearchParams()` components in Suspense
- ❌ Trying to fetch sessions during build/prerender
- ❌ Not marking dynamic routes as `force-dynamic`

---

#### 6. Google OAuth Redirect URI Mismatch

**Problem:** Google OAuth login fails with "redirect_uri_mismatch" error.

**Symptoms:**
- `Error 400: redirect_uri_mismatch`
- OAuth flow starts but fails at callback
- Works locally but not in production

**Root Cause:**
Google OAuth redirect URI must **exactly match** what's configured in Google Cloud Console.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-app-id.amplifyapp.com/api/auth/callback/google`
5. Click **Save**
6. Wait a few minutes for changes to propagate

**Important:**
- URIs are **case-sensitive**
- Must include `http://` or `https://`
- Must include full path: `/api/auth/callback/google`
- Trailing slashes matter (don't add `/` at the end)

**Verification:**
- Check Google Cloud Console redirect URIs list
- Check your `BETTER_AUTH_URL` environment variable matches
- Check browser network tab for exact redirect URI being used

---
 
#### 7. Package Manager Confusion (pnpm vs npm)

**Problem:** Build fails with "package not found" or lockfile issues.

**Symptoms:**
- `pnpm: command not found` in Amplify build
- Lockfile conflicts between `pnpm-lock.yaml` and `package-lock.json`
- Dependencies not installed correctly

**Root Cause:**
Amplify may not have `pnpm` installed, or you have conflicting lockfiles.

**Solution:**

**Option A: Use npm (recommended for Amplify)**
```yaml
# amplify.yml
preBuild:
  commands:
    - npm ci  # Use npm instead of pnpm
build:
  commands:
    - npm run build
```

**Option B: Install pnpm in Amplify**
```yaml
# amplify.yml
preBuild:
  commands:
    - corepack enable
    - corepack prepare pnpm@latest --activate
    - pnpm install
```

**Clean up lockfiles:**
- Remove `pnpm-lock.yaml` if using npm
- Remove `package-lock.json` if using pnpm
- Commit only one lockfile

---

### 🟡 Common Issues

#### Environment Variable Not Found Locally

**Problem:** `POSTGRES_URL` not found when running locally.

**Solution:**
1. Create `.env` file in project root
2. Add all required variables
3. Restart dev server after adding variables
4. Verify with `console.log(process.env.POSTGRES_URL)`

#### Database Tables Missing

**Problem:** `relation "user" does not exist` errors.

**Solution:**
1. Verify Better Auth schema is generated: `lib/db/better-auth-schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`
4. Verify tables exist: `npm run db:studio`

#### Better Auth Routes Not Working

**Problem:** `/api/auth/*` routes return 404 or errors.

**Solution:**
1. Verify `app/api/auth/[...all]/route.ts` exists
2. Check `lib/auth/auth.ts` has correct `basePath: "/api/auth"`
3. Verify `BETTER_AUTH_URL` matches your app URL
4. Check API route logs for specific errors

#### Session Not Persisting

**Problem:** User gets logged out on page refresh.

**Solution:**
1. Verify `BETTER_AUTH_SECRET` is set (different for dev/prod)
2. Check cookie settings in Better Auth config
3. Verify domain matches (localhost vs production domain)
4. Check browser console for cookie errors

---

### 🟢 Quick Fixes Checklist

Before asking for help, verify:

**Better Auth Schema (BIGGEST PAIN POINT):**
- [ ] **Temporarily removed `server-only` import** before running CLI (CLI can't resolve config with it)
- [ ] Better Auth schema generated with `npx @better-auth/cli generate`
- [ ] **Re-added `server-only` import** after running CLI
- [ ] **Manually added plugin fields** to `lib/db/better-auth-schema.ts` (username, displayUsername, etc.)
- [ ] Updated `lib/db/drizzle.ts` to import and merge schemas
- [ ] Updated `drizzle.config.ts` to reference Better Auth schema
- [ ] Updated `lib/auth/auth.ts` to pass `schema: betterAuthSchema` to `drizzleAdapter`
- [ ] Ran **both** `db:generate` AND `db:migrate` (not just generate!)

**Deployment:**
- [ ] All environment variables set in Amplify Console → App Settings → Environment variables
- [ ] `POSTGRES_URL` includes `?sslmode=require` for RDS
- [ ] Password URL-encoded if it has special characters
- [ ] Database migrations configured (either during build via env variables or run manually)

**Next.js + Better Auth (PPR Compatibility):**
- [ ] Better Auth session fetching handles React postpone signals (re-throws, doesn't catch)
- [ ] Components using `useSearchParams()` wrapped in Suspense
- [ ] Server components using Better Auth marked as `dynamic = 'force-dynamic'`
- [ ] SWR config doesn't fetch sessions during build/prerender

**Configuration:**
- [ ] Google OAuth redirect URIs match exactly (local and production)
- [ ] Lockfiles consistent (only one: npm or pnpm)

---

## Contributing

This is a demonstration repository for Better Auth integration patterns. Contributions and suggestions are welcome!

## License

This project is based on the Next.js SaaS Starter template.