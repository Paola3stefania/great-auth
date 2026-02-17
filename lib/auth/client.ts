"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient, organizationClient, agentAuthClient, deviceAuthorizationClient } from "better-auth/client/plugins";
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
    agentAuthClient(),
    deviceAuthorizationClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, changePassword, updateUser } = authClient;

