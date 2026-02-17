import 'server-only';

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, organization, agentAuth, deviceAuthorization } from "better-auth/plugins";
import { infra } from "@better-auth/infra";
import { sso } from "@better-auth/sso";
import { db } from "@/lib/db/drizzle";
import * as betterAuthSchema from "@/lib/db/better-auth-schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: betterAuthSchema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
      prompt: "select_account",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    } : undefined,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
    },
  },
  plugins: [
    username({
      // Username length constraints
      minUsernameLength: 3,
      maxUsernameLength: 30,
      // Username validation - only alphanumeric, underscores, and dots
      usernameValidator: (username) => {
        // Prevent reserved usernames
        const reservedUsernames = ["admin", "administrator", "root", "api", "www"];
        if (reservedUsernames.includes(username.toLowerCase())) {
          return false;
        }
        // Default: only alphanumeric, underscores, and dots
        return /^[a-zA-Z0-9._]+$/.test(username);
      },
      // Username normalization - convert to lowercase
      usernameNormalization: (username) => {
        return username.toLowerCase();
      },
      // Display username validation - allow alphanumeric, underscores, dots, and hyphens
      displayUsernameValidator: (displayUsername) => {
        return /^[a-zA-Z0-9._-]+$/.test(displayUsername);
      },
      // Display username normalization - keep original case
      displayUsernameNormalization: false,
      // Validation order - validate after normalization
      validationOrder: {
        username: "post-normalization",
        displayUsername: "post-normalization",
      },
    }),
    organization(),
    infra({
      apiUrl: env.BETTER_AUTH_API_URL,
      kvUrl: env.BETTER_AUTH_KV_URL,
      apiKey: env.BETTER_AUTH_API_KEY,
    }),
    agentAuth({
      roles: {
        reader: ["reports.read"],
        writer: ["reports.read", "reports.write", "email.send"],
      },
      defaultRole: "reader",
    }),
    deviceAuthorization(),
    sso({
      domainVerification: { enabled: true },
      ...(env.SSO_PROVIDER_ID && env.SSO_ISSUER && env.SSO_CLIENT_ID ? (() => {
        const issuerBase = env.SSO_ISSUER!.replace(/\/+$/, ""); // strip trailing slashes for URLs
        return {
          defaultSSO: [
            {
              providerId: env.SSO_PROVIDER_ID,
              domain: env.SSO_DOMAIN || "",
              oidcConfig: {
                issuer: env.SSO_ISSUER!, // keep as-is for token verification (Auth0 uses trailing /)
                clientId: env.SSO_CLIENT_ID!,
                clientSecret: env.SSO_CLIENT_SECRET || "",
                discoveryEndpoint: `${issuerBase}/.well-known/openid-configuration`,
                jwksEndpoint: `${issuerBase}/.well-known/jwks.json`,
                authorizationEndpoint: `${issuerBase}/authorize`,
                tokenEndpoint: `${issuerBase}/oauth/token`,
                userInfoEndpoint: `${issuerBase}/userinfo`,
                pkce: true,
              },
            },
          ],
        };
      })() : {}),
    }),
  ],
  trustedOrigins: [
    ...(env.SSO_ISSUER ? [env.SSO_ISSUER.replace(/\/+$/, "")] : []),
    "http://localhost:4000",
  ],
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
});

export type Session = typeof auth.$Infer.Session;

