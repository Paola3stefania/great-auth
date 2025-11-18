import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "@/lib/db/drizzle";
import * as betterAuthSchema from "@/lib/db/better-auth-schema";

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
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
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
  ],
  baseURL: process.env.BASE_URL || "http://localhost:3000",
  basePath: "/api/auth",
});

export type Session = typeof auth.$Infer.Session;

