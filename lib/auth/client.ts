"use client";

import type { BetterAuthClientPlugin } from "better-auth/client";
import { createAuthClient } from "better-auth/react";
import { usernameClient, organizationClient, deviceAuthorizationClient, asyncAuthClient } from "better-auth/client/plugins";
import { agentAuthClient } from "@better-auth/agent-auth/client";
import { infraClient } from "@better-auth/infra/client";
import { ssoClient } from "@better-auth/sso/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [
    usernameClient(),
    organizationClient(),
    infraClient(),
    ssoClient(),
    agentAuthClient() as unknown as BetterAuthClientPlugin,
    deviceAuthorizationClient(),
    asyncAuthClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, changePassword, updateUser } = authClient;

