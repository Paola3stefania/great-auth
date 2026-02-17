import { connectAgent, createAgentClient } from "better-auth/plugins/agent-auth/agent-client";

const APP_URL = process.env.APP_URL || "http://localhost:4000";

async function main() {
  console.log(`Connecting to ${APP_URL}...\n`);

  const result = await connectAgent({
    appURL: APP_URL,
    name: "Local Test Agent",
    scopes: ["reports.read"],
    onUserCode: ({ userCode, verificationUriComplete }) => {
      console.log("Approve the connection in your browser:\n");
      console.log(`  ${verificationUriComplete}\n`);
      console.log(`Or go to ${APP_URL}/device and enter code: ${userCode}\n`);
      console.log("Waiting for approval...");
    },
    onPoll: (attempt) => {
      if (attempt % 6 === 0) console.log(`  Still waiting... (${attempt * 5}s)`);
    },
  });

  console.log(`\nConnected! Agent ID: ${result.agentId}`);
  console.log(`Scopes: ${result.scopes.join(", ")}`);

  const agent = createAgentClient({
    baseURL: APP_URL,
    agentId: result.agentId,
    privateKey: result.privateKey,
  });

  // Test: get agent session
  const session = await agent.getSession();
  console.log("\nAgent session:", JSON.stringify(session, null, 2));

  // Test: fetch protected reports endpoint
  const res = await agent.fetch("/api/reports");
  const data = await res.json();
  console.log("\nReports response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
