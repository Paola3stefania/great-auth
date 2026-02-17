import postgres from "postgres";

const POSTGRES_URL = process.env.POSTGRES_URL || "postgresql://postgres:postgres@localhost:54323/postgres";

async function migrate() {
  const sql = postgres(POSTGRES_URL);

  console.log("Creating agent table...");
  await sql`
    CREATE TABLE IF NOT EXISTS agent (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      org_id TEXT,
      scopes TEXT,
      role TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      public_key TEXT NOT NULL,
      kid TEXT,
      last_used_at TIMESTAMP,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_agent_user_id ON agent(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_agent_org_id ON agent(org_id)`;
  console.log("  ✓ agent table ready");

  console.log("Creating device_code table...");
  await sql`
    CREATE TABLE IF NOT EXISTS device_code (
      id TEXT PRIMARY KEY,
      device_code TEXT NOT NULL,
      user_code TEXT NOT NULL,
      user_id TEXT,
      expires_at TIMESTAMP NOT NULL,
      status TEXT NOT NULL,
      last_polled_at TIMESTAMP,
      polling_interval INTEGER,
      client_id TEXT,
      scope TEXT
    )
  `;
  console.log("  ✓ device_code table ready");

  await sql.end();
  console.log("\nDone! Agent auth tables created.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
