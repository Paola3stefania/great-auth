import 'server-only';

import type { BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, organization, deviceAuthorization, oidcProvider, asyncAuth } from "better-auth/plugins";
import { agentAuth } from "@better-auth/agent-auth";
import { createGateway } from "@better-auth/agent-gateway";
import { sendEmail } from "@better-auth/infra/email";
import { infra } from "@better-auth/infra";
import { sso } from "@better-auth/sso";
import nodemailer from "nodemailer";
import { db } from "@/lib/db/drizzle";
import * as betterAuthSchema from "@/lib/db/better-auth-schema";
import { env } from "@/lib/env";

const gmailTransporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

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
      approvalMethods: ["device_authorization", "ciba"],
      agentSessionTTL: 3600,
      modes: ["delegated", "autonomous"],
      providerName: "great-auth",
      providerDescription: "Great Auth — agent authentication reference implementation",
      gateway: createGateway({
        mcpProviders: ["github"],
      }),
    }) as unknown as BetterAuthPlugin,
    deviceAuthorization(),
    oidcProvider({
      loginPage: "/sign-in",
    }),
    asyncAuth({
      requestLifetime: "5m",
      pollingInterval: "5s",
      approvalUri: "/async-auth",
      agents: [
        { name: "Local Agent", clientId: "local-agent", clientSecret: "dev-secret" },
      ],
      async sendNotification(data) {
        console.log(`\n🔐 CIBA Approval Request\n   User: ${data.user.email}\n   URL:  ${data.approvalUrl}\n`);
        if (gmailTransporter) {
          await gmailTransporter.sendMail({
            from: process.env.GMAIL_USER,
            to: data.user.email,
            subject: `Agent "${data.clientId}" requests your approval`,
            html: `
              <h2>Agent Approval Request</h2>
              <p>Hi ${data.user.name || "there"},</p>
              <p>An agent (<strong>${data.clientId}</strong>) is requesting permission to assist you.</p>
              ${data.bindingMessage ? `<p><strong>Task:</strong> ${data.bindingMessage}</p>` : ""}
              <p><strong>Scopes requested:</strong> ${data.scope}</p>
              <p>This request expires at: ${data.expiresAt.toLocaleString()}</p>
              <p>Review the details and approve if you recognize this request.</p>
              <p><a href="${data.approvalUrl}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Approve Request</a></p>
              <p style="color: #666; font-size: 13px;">Or copy this link: ${data.approvalUrl}</p>
            `,
          });
        } else {
          try {
            await sendEmail({
              template: "magic-link",
              to: data.user.email,
              subject: "Agent authorization request",
              variables: {
                magicLink: data.approvalUrl,
                userEmail: data.user.email,
                appName: "Great Auth",
                expirationMinutes: "5",
              },
            });
          } catch (e) {
            console.warn("Email notification failed (non-blocking):", (e as Error).message);
          }
        }
      },
    }),
    sso({
      domainVerification: { enabled: true },
      ...(env.SSO_PROVIDER_ID && env.SSO_ISSUER && env.SSO_CLIENT_ID ? (() => {
        const issuerBase = env.SSO_ISSUER!.replace(/\/+$/, "");
        return {
          defaultSSO: [
            {
              providerId: env.SSO_PROVIDER_ID,
              domain: env.SSO_DOMAIN || "",
              oidcConfig: {
                issuer: env.SSO_ISSUER!,
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
    }) as unknown as BetterAuthPlugin,
  ],
  trustedOrigins: [
    ...(env.SSO_ISSUER ? [env.SSO_ISSUER.replace(/\/+$/, "")] : []),
    "http://localhost:4000",
  ],
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
});

export type Session = typeof auth.$Infer.Session;

