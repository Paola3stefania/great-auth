# Great Auth - Better Auth Integration Demo

This repository demonstrates how to integrate **Better Auth** authentication (SSO, password/username) into a Next.js application.

## About

This project is built using the [Next.js SaaS Starter](https://vercel.com/templates/authentication/next-js-saas-starter) as a starter template and showcases integration with Better Auth for various authentication methods including:

- **Password & Username Authentication**
- **Single Sign-On (SSO)**
- Multiple authentication providers

The starter template provides a solid foundation with authentication, database setup, and dashboard functionality, which we'll enhance with Better Auth integration.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) with App Router
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) 
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker (for local Postgres) or a remote Postgres database

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

1. **Generate the Better Auth schema** using Better Auth CLI:
   ```bash
   npx @better-auth/cli@latest generate --config lib/auth/auth.ts
   ```
   
   This will create a `schema.ts` file in your project root with all the required Better Auth tables:
   - `user` - User information
   - `session` - Active user sessions
   - `account` - OAuth provider accounts (Google, etc.)
   - `verification` - Email verification tokens

2. **Move the generated schema** to your schema directory:
   ```bash
   mv schema.ts lib/db/better-auth-schema.ts
   ```

3. **Update Drizzle configuration** (already done in this project):
   - The schema is integrated in `lib/db/drizzle.ts`
   - Both schemas are included in `drizzle.config.ts`

4. **Generate and apply the migration** to create Better Auth tables in your database:
   ```bash
   # Generate the migration (creates SQL migration files)
   pnpm db:generate
   
   # Apply the migration (creates tables in database)
   pnpm db:migrate
   ```
   
   **Important**: You must run both `pnpm db:generate` and `pnpm db:migrate` after integrating the Better Auth schema. Without these migrations, you'll get errors like `relation "verification" does not exist`.

**Summary:**
- ✅ `npx @better-auth/cli@latest generate --config lib/auth/auth.ts` - Generate Better Auth schema
- ✅ Move schema to `lib/db/better-auth-schema.ts`
- ✅ Update `lib/db/drizzle.ts` and `drizzle.config.ts` (already done)
- ✅ `pnpm db:generate` - Generate Drizzle migration
- ✅ `pnpm db:migrate` - Apply migration to database
- ❌ Do NOT use `npx @better-auth/cli migrate` - This only works with Kysely adapter


## Contributing

This is a demonstration repository for Better Auth integration patterns. Contributions and suggestions are welcome!

## License

This project is based on the Next.js SaaS Starter template.
