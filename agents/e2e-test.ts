/**
 * End-to-end test script for @better-auth/agent-auth plugin.
 *
 * Prerequisites:
 *   1. Dev server running on APP_URL (default http://localhost:4000)
 *   2. A user session cookie — the script signs up / signs in automatically
 *
 * Usage:
 *   node --import tsx agents/e2e-test.ts
 */

import {
  generateKeypair,
  connectAgent,
  createAgentClient,
  signAgentJWT,
} from "@better-auth/agent-auth/agent-client";

const APP_URL = process.env.APP_URL || "http://localhost:4000";
const AUTH = `${APP_URL}/api/auth`;

// ── Helpers ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string, detail?: string) {
  if (cond) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
    failures.push(label);
  }
}

const ORIGIN = APP_URL;

async function jsonPost(path: string, body: unknown, headers?: Record<string, string>) {
  const res = await fetch(`${AUTH}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
  return { res, data: await res.json().catch(() => null) };
}

async function jsonGet(path: string, headers?: Record<string, string>) {
  const res = await fetch(`${AUTH}${path}`, { headers: { Origin: ORIGIN, ...headers } });
  return { res, data: await res.json().catch(() => null) };
}

// ── Auth helpers ─────────────────────────────────────────────────────────

async function getSessionCookie(email: string, password: string, name: string): Promise<string> {
  const signUp = await fetch(`${AUTH}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email, password, name }),
    redirect: "manual",
  });

  let cookie = extractCookie(signUp);
  if (cookie) return cookie;

  const signIn = await fetch(`${AUTH}/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });

  cookie = extractCookie(signIn);
  if (cookie) return cookie;

  throw new Error(`Could not authenticate ${email}. Status: ${signIn.status} Body: ${await signIn.text()}`);
}

function extractCookie(res: Response): string | null {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) {
    if (sc.includes("session_token")) {
      return sc.split(";")[0];
    }
  }
  return null;
}

// ═════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════

async function testDiscovery() {
  console.log("\n══ 1. Discovery Endpoints ══");

  const { res, data } = await jsonGet("/agent/discover");
  assert(res.ok, "Discovery endpoint accessible", `status=${res.status}`);
  assert(data?.protocol_version === "1.0-draft", "Protocol version is 1.0-draft");
  assert(data?.provider_name === "great-auth", "Provider name is great-auth");
  assert(Array.isArray(data?.approval_methods), "approval_methods is an array");
  assert(data?.approval_methods?.includes("device_authorization"), "Includes device_authorization method");
  assert(data?.approval_methods?.includes("ciba"), "Includes ciba method");
  assert(Array.isArray(data?.modes), "modes is an array");
  assert(data?.modes?.includes("delegated"), "Includes delegated mode");
  assert(data?.modes?.includes("autonomous"), "Includes autonomous mode");

  // CIBA endpoints should be present
  assert(!!data?.endpoints?.ciba_authorize, "Discovery has ciba_authorize endpoint");
  assert(!!data?.endpoints?.ciba_token, "Discovery has ciba_token endpoint");
  assert(!!data?.endpoints?.async_auth_verify, "Discovery has async_auth_verify endpoint");
  assert(!!data?.endpoints?.async_auth_authorize, "Discovery has async_auth_authorize endpoint");
  assert(!!data?.endpoints?.async_auth_reject, "Discovery has async_auth_reject endpoint");

  // Device authorization endpoints
  assert(!!data?.endpoints?.device_authorization, "Discovery has device_authorization endpoint");
  assert(!!data?.endpoints?.device_token, "Discovery has device_token endpoint");

  // Core agent endpoints
  assert(!!data?.endpoints?.register, "Discovery has register endpoint");
  assert(!!data?.endpoints?.capabilities, "Discovery has capabilities endpoint");
  assert(!!data?.endpoints?.request_scope, "Discovery has request_scope endpoint");
  assert(!!data?.endpoints?.status, "Discovery has status endpoint");
  assert(!!data?.endpoints?.revoke, "Discovery has revoke endpoint");
  assert(!!data?.endpoints?.introspect, "Discovery has introspect endpoint");

  // Well-known alias
  const { res: wkRes, data: wkData } = await jsonGet("/.well-known/agent-configuration");
  assert(wkRes.ok, "Well-known discovery endpoint accessible");
  assert(wkData?.protocol_version === data?.protocol_version, "Well-known matches /agent/discover");
}

async function testHostAndAgentLifecycle(cookie: string) {
  console.log("\n══ 2. Host & Agent Lifecycle ══");

  // Create a host
  const { res: hostRes, data: hostData } = await jsonPost(
    "/agent/host/create",
    { scopes: ["reports.read", "reports.write"] },
    { Cookie: cookie }
  );
  assert(hostRes.ok, "Create host", `status=${hostRes.status}`);
  const hostId = hostData?.id;
  assert(!!hostId, "Host ID returned", hostId);

  // List hosts
  const { res: listHostRes, data: listHostData } = await jsonGet(
    "/agent/host/list",
    { Cookie: cookie }
  );
  assert(listHostRes.ok, "List hosts", `status=${listHostRes.status}`);

  // Register an agent via session (user acts as host)
  const { res: regRes, data: regData } = await jsonPost(
    "/agent/register",
    {
      name: "E2E Test Agent",
      scopes: ["reports.read"],
      mode: "delegated",
    },
    { Cookie: cookie }
  );
  assert(regRes.ok, "Register agent", `status=${regRes.status}`);
  const agentId = regData?.agentId;
  assert(!!agentId, "Agent ID returned", agentId);
  assert(regData?.mode === "delegated", "Agent mode is delegated");
  assert(!!regData?.hostId, "Agent has hostId");

  // List agents
  const { res: listRes, data: listData } = await jsonGet(
    "/agent/list",
    { Cookie: cookie }
  );
  assert(listRes.ok, "List agents", `status=${listRes.status}`);
  const agents = Array.isArray(listData) ? listData : (listData?.agents ?? []);
  assert(agents.some((a: any) => a.id === agentId), "Registered agent in list");

  // Get single agent
  const { res: getRes, data: getAgent } = await jsonGet(
    `/agent/get?agentId=${agentId}`,
    { Cookie: cookie }
  );
  assert(getRes.ok, "Get single agent", `status=${getRes.status}`);
  assert(getAgent?.name === "E2E Test Agent", "Agent name matches");

  // Revoke agent
  const { res: revokeRes } = await jsonPost(
    "/agent/revoke",
    { agentId },
    { Cookie: cookie }
  );
  assert(revokeRes.ok, "Revoke agent", `status=${revokeRes.status}`);

  return { hostId, agentId };
}

async function testJWTAuthentication(cookie: string) {
  console.log("\n══ 3. Agent JWT Authentication ══");

  const keypair = await generateKeypair();

  // Create host with the keypair
  const { data: hostData } = await jsonPost(
    "/agent/host/create",
    {
      scopes: ["reports.read"],
      publicKey: keypair.publicKey,
    },
    { Cookie: cookie }
  );
  assert(!!hostData?.id, "Created host for JWT tests");

  // Register agent
  const { data: regData } = await jsonPost(
    "/agent/register",
    {
      name: "JWT Test Agent",
      scopes: ["reports.read"],
      mode: "delegated",
    },
    { Cookie: cookie }
  );
  const agentId = regData?.agentId;
  assert(!!agentId, "Registered agent for JWT tests");

  // Sign a valid JWT
  const jwt = await signAgentJWT({
    agentId: agentId!,
    privateKey: keypair.privateKey,
    expiresIn: 60,
  });
  assert(jwt.split(".").length === 3, "JWT has 3 segments");

  // Hit protected endpoint with JWT
  const { res: sessionRes, data: sessionData } = await jsonGet("/agent/get-session", {
    Authorization: `Bearer ${jwt}`,
  });
  assert(sessionRes.ok, "Agent session populated via JWT");
  assert(sessionData?.agent?.id === agentId, "Session contains correct agentId");

  // Verify permissions are in session
  assert(Array.isArray(sessionData?.permissions), "Session has permissions array");

  // Wrong key rejection
  const wrongKeypair = await generateKeypair();
  const wrongJwt = await signAgentJWT({
    agentId: agentId!,
    privateKey: wrongKeypair.privateKey,
    expiresIn: 60,
  });
  const { res: wrongRes } = await jsonGet("/agent/get-session", {
    Authorization: `Bearer ${wrongJwt}`,
  });
  assert(!wrongRes.ok, "Wrong key JWT rejected", `status=${wrongRes.status}`);

  // Expired JWT rejection
  const expiredJwt = await signAgentJWT({
    agentId: agentId!,
    privateKey: keypair.privateKey,
    expiresIn: 1,
  });
  await new Promise((r) => setTimeout(r, 2000));
  const { res: expiredRes } = await jsonGet("/agent/get-session", {
    Authorization: `Bearer ${expiredJwt}`,
  });
  assert(!expiredRes.ok, "Expired JWT rejected", `status=${expiredRes.status}`);

  // Cleanup
  await jsonPost("/agent/revoke", { agentId }, { Cookie: cookie });
}

async function testCleanupExpired(cookie: string) {
  console.log("\n══ 4. Cleanup Expired Agents ══");

  const { res: cleanupRes, data: cleanupData } = await jsonPost(
    "/agent/cleanup",
    {},
    { Cookie: cookie }
  );
  assert(cleanupRes.ok, "Cleanup expired agents", `status=${cleanupRes.status}`);
  console.log(`  ℹ️  Cleanup result: ${JSON.stringify(cleanupData)}`);
}

async function testCrossUserIsolation(cookie1: string) {
  console.log("\n══ 5. Cross-User Isolation ══");

  let cookie2: string;
  try {
    cookie2 = await getSessionCookie(
      "e2e-user-b@test.local",
      "TestPass123!B",
      "E2E User B"
    );
  } catch {
    console.log("  ⚠️  Could not create second user, skipping cross-user tests");
    return;
  }

  // Register agent as User A
  const { data: regA } = await jsonPost(
    "/agent/register",
    {
      name: "User A Agent",
      scopes: ["reports.read"],
      mode: "delegated",
    },
    { Cookie: cookie1 }
  );
  const agentAId = regA?.agentId;
  assert(!!agentAId, "Registered agent as User A");

  // User B cannot see User A's agent
  const { data: listB } = await jsonGet("/agent/list", { Cookie: cookie2 });
  const agents = Array.isArray(listB) ? listB : (listB?.agents ?? []);
  const bSees = agents.some((a: any) => a.id === agentAId);
  assert(!bSees, "User B cannot see User A's agent in list");

  // User B cannot get User A's agent
  const { res: getBRes } = await jsonGet(`/agent/get?agentId=${agentAId}`, { Cookie: cookie2 });
  assert(!getBRes.ok || getBRes.status === 404 || getBRes.status === 403, "User B cannot get User A's agent");

  // User B cannot revoke User A's agent
  const { res: revokeBRes } = await jsonPost(
    "/agent/revoke",
    { agentId: agentAId },
    { Cookie: cookie2 }
  );
  assert(!revokeBRes.ok, "User B cannot revoke User A's agent");

  // Cleanup
  await jsonPost("/agent/revoke", { agentId: agentAId }, { Cookie: cookie1 });
}

async function testCIBADiscovery() {
  console.log("\n══ 6. CIBA Discovery ══");

  const { data } = await jsonGet("/agent/discover");

  assert(data?.approval_methods?.includes("ciba"), "CIBA in approval_methods");

  const defaultEndpoints = {
    ciba_authorize: "/oauth/bc-authorize",
    ciba_token: "/oauth2/token",
    async_auth_verify: "/async-auth/verify",
    async_auth_authorize: "/async-auth/authorize",
    async_auth_reject: "/async-auth/reject",
  };

  for (const [key, expected] of Object.entries(defaultEndpoints)) {
    assert(
      data?.endpoints?.[key] === expected,
      `endpoints.${key} = ${expected}`,
      `got="${data?.endpoints?.[key]}"`
    );
  }
}

async function testCIBAFullFlow(cookie: string) {
  console.log("\n══ 7. CIBA Full Flow (bc-authorize → verify → approve → token) ══");

  const userEmail = "e2e-agent-test@test.local";

  // 1. Start backchannel auth request (upstream plugin requires client credentials + openid scope)
  const { res: bcRes, data: bcData } = await jsonPost("/oauth/bc-authorize", {
    client_id: "local-agent",
    client_secret: "dev-secret",
    login_hint: userEmail,
    scope: "openid reports.read",
    binding_message: "E2E test CIBA request",
  });
  assert(bcRes.ok, "bc-authorize succeeds", `status=${bcRes.status} body=${JSON.stringify(bcData)}`);
  const authReqId = bcData?.auth_req_id;
  assert(!!authReqId, "auth_req_id returned", authReqId);
  assert(typeof bcData?.expires_in === "number", "expires_in is a number");
  assert(typeof bcData?.interval === "number", "interval is a number");

  // 2. Verify the pending request
  const { res: verifyRes, data: verifyData } = await jsonGet(
    `/async-auth/verify?auth_req_id=${encodeURIComponent(authReqId)}`
  );
  assert(verifyRes.ok, "async-auth/verify returns request info", `status=${verifyRes.status}`);
  assert(verifyData?.auth_req_id === authReqId, "Verify returns same auth_req_id");
  assert(verifyData?.scope?.includes("reports.read"), "Verify returns correct scope");
  assert(verifyData?.binding_message === "E2E test CIBA request", "Verify returns binding message");

  // 3. Poll for token via /oauth2/token — should get authorization_pending
  const { res: pendingRes, data: pendingData } = await jsonPost("/oauth2/token", {
    grant_type: "urn:openid:params:grant-type:ciba",
    auth_req_id: authReqId,
    client_id: "local-agent",
    client_secret: "dev-secret",
  });
  assert(pendingRes.status === 400, "Token poll returns 400 while pending");
  assert(pendingData?.error === "authorization_pending", "Error is authorization_pending");

  // 4. Approve the request (user approves via session)
  const { res: approveRes, data: approveData } = await jsonPost(
    "/async-auth/authorize",
    { auth_req_id: authReqId },
    { Cookie: cookie }
  );
  assert(approveRes.ok, "async-auth/authorize approves", `status=${approveRes.status}`);
  assert(approveData?.success === true, "Response has success: true");

  // 5. Poll for token — should now succeed
  await new Promise((r) => setTimeout(r, 5500));

  const { res: tokenRes, data: tokenData } = await jsonPost("/oauth2/token", {
    grant_type: "urn:openid:params:grant-type:ciba",
    auth_req_id: authReqId,
    client_id: "local-agent",
    client_secret: "dev-secret",
  });
  assert(tokenRes.ok, "Token poll returns 200 after approval", `status=${tokenRes.status}`);
  assert(!!tokenData?.access_token, "access_token returned");
  assert(tokenData?.token_type === "Bearer", "token_type is Bearer");

  // 6. Verify re-approve fails
  const { res: reapproveRes } = await jsonPost(
    "/async-auth/authorize",
    { auth_req_id: authReqId },
    { Cookie: cookie }
  );
  assert(!reapproveRes.ok, "Re-approve of already approved request fails");
}

async function testCIBARejectFlow(cookie: string) {
  console.log("\n══ 8. CIBA Reject Flow ══");

  const { data: bcData } = await jsonPost("/oauth/bc-authorize", {
    client_id: "local-agent",
    client_secret: "dev-secret",
    login_hint: "e2e-agent-test@test.local",
    scope: "openid reports.write",
    binding_message: "E2E test — reject this",
  });
  const authReqId = bcData?.auth_req_id;
  assert(!!authReqId, "bc-authorize for reject test");

  // Reject it
  const { res: rejectRes, data: rejectData } = await jsonPost(
    "/async-auth/reject",
    { auth_req_id: authReqId },
    { Cookie: cookie }
  );
  assert(rejectRes.ok, "async-auth/reject succeeds", `status=${rejectRes.status}`);
  assert(rejectData?.success === true, "Response has success: true");

  // Token poll should return access_denied
  const { res: tokenRes, data: tokenData } = await jsonPost("/oauth2/token", {
    grant_type: "urn:openid:params:grant-type:ciba",
    auth_req_id: authReqId,
    client_id: "local-agent",
    client_secret: "dev-secret",
  });
  assert(tokenRes.status === 400, "Token poll returns 400 after rejection");
  assert(tokenData?.error === "access_denied", "Error is access_denied");
}

async function testCIBAEdgeCases() {
  console.log("\n══ 9. CIBA Edge Cases ══");

  // Unknown login_hint
  const { res: unknownRes, data: unknownData } = await jsonPost("/oauth/bc-authorize", {
    client_id: "local-agent",
    client_secret: "dev-secret",
    login_hint: "unknown-user-does-not-exist@example.com",
    scope: "openid reports.read",
  });
  assert(!unknownRes.ok, "Unknown login_hint rejected");
  assert(
    unknownData?.error === "unknown_user_id",
    "Error code is unknown_user_id",
    `got error=${unknownData?.error} message=${unknownData?.message}`
  );

  // Missing client credentials
  const { res: noAuthRes } = await jsonPost("/oauth/bc-authorize", {
    login_hint: "e2e-agent-test@test.local",
    scope: "openid",
  });
  assert(!noAuthRes.ok, "bc-authorize without client credentials rejected");

  // Verify with unknown auth_req_id
  const { res: unknownVerifyRes } = await jsonGet(
    "/async-auth/verify?auth_req_id=nonexistent-req-id-456"
  );
  assert(!unknownVerifyRes.ok, "Verify with unknown auth_req_id fails");
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n🔬 Agent-Auth E2E Tests — ${APP_URL}\n`);

  // Health check
  try {
    const health = await fetch(`${APP_URL}/api/auth/ok`, { headers: { Origin: ORIGIN } });
    if (!health.ok) throw new Error(`status ${health.status}`);
  } catch {
    console.error(`❌ Cannot reach ${APP_URL}. Is the dev server running?`);
    console.error(`   Run: pnpm dev`);
    process.exit(1);
  }
  console.log("✓ Server reachable\n");

  // Authenticate
  console.log("Authenticating test user...");
  const cookie = await getSessionCookie(
    "e2e-agent-test@test.local",
    "TestPass123!",
    "E2E Agent Tester"
  );
  console.log("✓ Authenticated\n");

  // Run test suites
  await testDiscovery();
  await testHostAndAgentLifecycle(cookie);
  await testJWTAuthentication(cookie);
  await testCleanupExpired(cookie);
  await testCrossUserIsolation(cookie);
  await testCIBADiscovery();
  await testCIBAFullFlow(cookie);
  await testCIBARejectFlow(cookie);
  await testCIBAEdgeCases();

  // Summary
  console.log("\n══════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`  Failures:`);
    for (const f of failures) {
      console.log(`    - ${f}`);
    }
  }
  console.log("══════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
