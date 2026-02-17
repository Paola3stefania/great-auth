import 'server-only';

import { auth } from "@/lib/auth/auth";

type AgentSession = {
  agent: {
    id: string;
    name: string;
    scopes: string[];
    role: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  // getAgentSession is provided by the agentAuth plugin
  const getAgentSession = (auth.api as Record<string, Function>).getAgentSession;
  let agentSession: AgentSession | null = null;
  if (getAgentSession) {
    try {
      agentSession = await getAgentSession({ headers: req.headers });
    } catch {
      // Not an agent request
    }
  }

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
