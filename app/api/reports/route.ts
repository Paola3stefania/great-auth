import 'server-only';

import { auth } from "@/lib/auth/auth";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  const agentSession = await auth.api.getAgentSession({ headers: req.headers });

  if (session) {
    return Response.json({
      reports: ["Q1 Report", "Q2 Report", "Q3 Report", "Q4 Report"],
      actor: "user",
      userId: session.user.id,
    });
  }

  if (agentSession) {
    if (!agentSession.agent.scopes.includes("reports.read")) {
      return Response.json({ error: "Forbidden: missing reports.read scope" }, { status: 403 });
    }
    return Response.json({
      reports: ["Q1 Report", "Q2 Report", "Q3 Report", "Q4 Report"],
      actor: "agent",
      agentId: agentSession.agent.id,
      agentName: agentSession.agent.name,
      onBehalfOf: agentSession.user.id,
    });
  }

  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
