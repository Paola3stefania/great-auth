import { EMAIL_TEMPLATES, EmailConfig, EmailTemplateId, EmailTemplateVariables, SendEmailOptions, SendEmailResult, createEmailSender, sendEmail } from "./email.mjs";
import * as better_auth0 from "better-auth";
import { APIError, BetterAuthPlugin, BetterAuthRateLimitOptions, HookEndpointContext } from "better-auth";
import "better-call";
import * as zod0 from "zod";
import * as better_auth_plugins0 from "better-auth/plugins";
export * from "better-call";

//#region src/validation/matchers.d.ts
type Matcher = (context: HookEndpointContext) => boolean;
//#endregion
//#region src/identification.d.ts
interface IPLocation {
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: {
    code: string;
    name: string;
  } | null;
  timezone: string | null;
}
interface Identification {
  visitorId: string;
  requestId: string;
  timestamp: number;
  url: string;
  ip: string | null;
  location: IPLocation | null;
  browser: {
    name: string | null;
    version: string | null;
    os: string | null;
    osVersion: string | null;
    device: string | null;
    userAgent: string | null;
  };
  confidence: number;
  incognito: boolean;
  bot: "notDetected" | "detected" | "unknown";
  isAnonymous: boolean;
}
//#endregion
//#region src/security.d.ts
type SecurityAction = "log" | "block" | "challenge";
interface ThresholdConfig {
  challenge?: number;
  block?: number;
}
interface SecurityOptions {
  unknownDeviceNotification?: boolean;
  credentialStuffing?: {
    enabled: boolean;
    thresholds?: ThresholdConfig;
    windowSeconds?: number;
    cooldownSeconds?: number;
  };
  impossibleTravel?: {
    enabled: boolean;
    maxSpeedKmh?: number;
    action?: SecurityAction;
  };
  geoBlocking?: {
    allowList?: string[];
    denyList?: string[];
    action?: "block" | "challenge";
  };
  botBlocking?: boolean | {
    action: SecurityAction;
  };
  suspiciousIpBlocking?: boolean | {
    action: SecurityAction;
  };
  velocity?: {
    enabled: boolean;
    thresholds?: ThresholdConfig;
    maxSignupsPerVisitor?: number;
    maxPasswordResetsPerIp?: number;
    maxSignInsPerIp?: number;
    windowSeconds?: number;
    action?: SecurityAction;
  };
  freeTrialAbuse?: {
    enabled: boolean;
    thresholds?: ThresholdConfig;
    maxAccountsPerVisitor?: number;
    action?: SecurityAction;
  };
  compromisedPassword?: {
    enabled: boolean;
    action?: SecurityAction;
    minBreachCount?: number;
  };
  emailValidation?: {
    enabled?: boolean;
    strictness?: "low" | "medium" | "high";
    action?: SecurityAction;
  };
  staleUsers?: {
    enabled: boolean;
    staleDays?: number;
    action?: SecurityAction;
    notifyUser?: boolean;
    notifyAdmin?: boolean;
    adminEmail?: string;
  };
  challengeDifficulty?: number;
}
interface SecurityVerdict {
  action: "allow" | "challenge" | "block";
  challenge?: string;
  reason?: string;
  details?: Record<string, unknown>;
}
interface CredentialStuffingResult {
  blocked: boolean;
  challenged?: boolean;
  challenge?: string;
  reason?: string;
  details?: Record<string, unknown>;
}
interface ImpossibleTravelResult {
  isImpossible: boolean;
  action?: "allow" | "challenge" | "block";
  challenged?: boolean;
  challenge?: string;
  distance?: number;
  timeElapsedHours?: number;
  speedRequired?: number;
  from?: {
    city: string | null;
    country: string | null;
  } | null;
  to?: {
    city: string | null;
    country: string | null;
  } | null;
}
interface CompromisedPasswordResult {
  compromised: boolean;
  breachCount?: number;
  action?: SecurityAction;
}
interface StaleUserResult {
  isStale: boolean;
  daysSinceLastActive?: number;
  staleDays?: number;
  lastActiveAt?: string | null;
  action?: SecurityAction;
  notifyUser?: boolean;
  notifyAdmin?: boolean;
}
interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  userId: string | null;
  visitorId: string | null;
  ip: string | null;
  country: string | null;
  details: Record<string, unknown>;
  action: "logged" | "blocked" | "challenged";
}
type SecurityEventType = "unknown_device" | "credential_stuffing" | "impossible_travel" | "geo_blocked" | "bot_blocked" | "suspicious_ip_detected" | "velocity_exceeded" | "free_trial_abuse" | "compromised_password" | "stale_account_reactivation";
//#endregion
//#region src/types.d.ts
/**
 * Configuration options for the infra plugin
 */
interface InfraOptions {
  /**
   * The URL of the Better Auth Infra API
   * @default "https://infra.better-auth.com"
   */
  apiUrl?: string;
  /**
   * The URL of the KV storage service
   * @default "https://kv.better-auth.com"
   */
  kvUrl?: string;
  /**
   * Your Better Auth Infra API key
   * @default process.env.BETTER_AUTH_API_KEY
   */
  apiKey?: string;
  /**
   * Security features configuration
   */
  security?: SecurityOptions;
  /**
   * User activity tracking configuration
   */
  activityTracking?: {
    /**
     * Whether to enable user activity tracking
     *
     * This requires a database schema change to the user table.
     * @default true
     */
    enabled?: boolean;
    /**
     * Interval in milliseconds to update lastActiveAt for active users
     * Set to 0 to disable interval-based tracking
     * @default 300000 (5 minutes)
     */
    updateInterval?: number;
  };
}
//#endregion
//#region src/routes/org-log-drains.d.ts
type OrgLogDrainDestinationType = "datadog" | "splunk" | "webhook";
type OrgLogDrainEventType = "auth" | "security" | "email" | "all";
//#endregion
//#region src/routes/directory-sync/types.d.ts
interface DirectorySyncConnection {
  organizationId: string;
  providerId: string;
  scimEndpoint: string;
}
//#endregion
//#region src/pow.d.ts
/**
 * Proof of Work Challenge System - Client Side
 *
 * Client-side PoW solver and encoding utilities.
 * Server-side challenge generation and verification moved to Infra API.
 */
interface PoWChallenge {
  /** Random nonce for this challenge */
  nonce: string;
  /** Number of leading zero bits required */
  difficulty: number;
  /** Timestamp when challenge was created */
  timestamp: number;
  /** Challenge expiry time in seconds */
  ttl: number;
}
interface PoWSolution {
  /** The nonce from the challenge */
  nonce: string;
  /** The counter value that produces valid hash */
  counter: number;
}
/** Default difficulty in bits (18 = ~500ms solve time) */
declare const DEFAULT_DIFFICULTY = 18;
/** Challenge TTL in seconds */
declare const CHALLENGE_TTL = 60;
/**
 * Solve a PoW challenge (browser-compatible)
 * This function is designed to run in a browser environment
 */
declare function solvePoWChallenge(challenge: PoWChallenge): Promise<PoWSolution>;
/**
 * Decode a base64-encoded challenge string (browser-compatible)
 */
declare function decodePoWChallenge(encoded: string): PoWChallenge | null;
/**
 * Encode a solution string (browser-compatible)
 */
declare function encodePoWSolution(solution: PoWSolution): string;
/**
 * Verify a PoW solution locally (for testing purposes)
 */
declare function verifyPoWSolution(nonce: string, counter: number, difficulty: number): Promise<boolean>;
//#endregion
//#region src/sms.d.ts
/**
 * SMS sending module for @better-auth/infra
 *
 * This module provides SMS sending functionality for OTP verification codes
 * with template support similar to emails.
 */
/**
 * SMS template definitions with their required variables
 */
declare const SMS_TEMPLATES: {
  readonly "phone-verification": {
    readonly variables: {
      code: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "two-factor": {
    readonly variables: {
      code: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "sign-in-otp": {
    readonly variables: {
      code: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
};
type SMSTemplateId = keyof typeof SMS_TEMPLATES;
type SMSTemplateVariables<T extends SMSTemplateId> = (typeof SMS_TEMPLATES)[T]["variables"];
interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
interface SMSConfig {
  apiKey?: string;
  apiUrl?: string;
}
/**
 * Options for sending SMS
 */
interface SendSMSOptions {
  /**
   * Phone number to send to (E.164 format, e.g., +1234567890)
   */
  to: string;
  /**
   * The OTP code to send
   */
  code: string;
  /**
   * The SMS template to use (optional - defaults to generic verification message)
   */
  template?: SMSTemplateId;
}
/**
 * Create an SMS sender instance
 */
declare function createSMSSender(config?: SMSConfig): {
  send: (options: SendSMSOptions) => Promise<SendSMSResult>;
};
/**
 * Send an SMS with OTP code via Better Auth Infra.
 *
 * @example
 * ```ts
 * import { sendSMS } from "@better-auth/infra";
 *
 * // For phone verification
 * await sendSMS({
 *   to: "+1234567890",
 *   code: "123456",
 *   template: "phone-verification",
 * });
 *
 * // For two-factor authentication
 * await sendSMS({
 *   to: "+1234567890",
 *   code: "123456",
 *   template: "two-factor",
 * });
 *
 * // Default (no template specified - uses generic message)
 * await sendSMS({
 *   to: "+1234567890",
 *   code: "123456",
 * });
 * ```
 */
declare function sendSMS(options: SendSMSOptions, config?: SMSConfig): Promise<SendSMSResult>;
//#endregion
//#region src/routes/events.d.ts
/**
 * All available event types that can be returned in audit logs
 */
declare const USER_EVENT_TYPES: {
  readonly ORGANIZATION_CREATED: "organization_created";
  readonly ORGANIZATION_UPDATED: "organization_updated";
  readonly ORGANIZATION_MEMBER_ADDED: "organization_member_added";
  readonly ORGANIZATION_MEMBER_REMOVED: "organization_member_removed";
  readonly ORGANIZATION_MEMBER_ROLE_UPDATED: "organization_member_role_updated";
  readonly ORGANIZATION_MEMBER_INVITED: "organization_member_invited";
  readonly ORGANIZATION_MEMBER_INVITE_CANCELED: "organization_member_invite_canceled";
  readonly ORGANIZATION_MEMBER_INVITE_ACCEPTED: "organization_member_invite_accepted";
  readonly ORGANIZATION_MEMBER_INVITE_REJECTED: "organization_member_invite_rejected";
  readonly ORGANIZATION_TEAM_CREATED: "organization_team_created";
  readonly ORGANIZATION_TEAM_UPDATED: "organization_team_updated";
  readonly ORGANIZATION_TEAM_DELETED: "organization_team_deleted";
  readonly ORGANIZATION_TEAM_MEMBER_ADDED: "organization_team_member_added";
  readonly ORGANIZATION_TEAM_MEMBER_REMOVED: "organization_team_member_removed";
  readonly USER_CREATED: "user_created";
  readonly USER_SIGNED_IN: "user_signed_in";
  readonly USER_SIGNED_OUT: "user_signed_out";
  readonly USER_SIGN_IN_FAILED: "user_sign_in_failed";
  readonly PASSWORD_RESET_REQUESTED: "password_reset_requested";
  readonly PASSWORD_RESET_COMPLETED: "password_reset_completed";
  readonly PASSWORD_CHANGED: "password_changed";
  readonly EMAIL_VERIFICATION_SENT: "email_verification_sent";
  readonly EMAIL_VERIFIED: "email_verified";
  readonly EMAIL_CHANGED: "email_changed";
  readonly PROFILE_UPDATED: "profile_updated";
  readonly PROFILE_IMAGE_UPDATED: "profile_image_updated";
  readonly SESSION_CREATED: "session_created";
  readonly SESSION_REVOKED: "session_revoked";
  readonly ALL_SESSIONS_REVOKED: "all_sessions_revoked";
  readonly TWO_FACTOR_ENABLED: "two_factor_enabled";
  readonly TWO_FACTOR_DISABLED: "two_factor_disabled";
  readonly TWO_FACTOR_VERIFIED: "two_factor_verified";
  readonly ACCOUNT_LINKED: "account_linked";
  readonly ACCOUNT_UNLINKED: "account_unlinked";
  readonly USER_BANNED: "user_banned";
  readonly USER_UNBANNED: "user_unbanned";
  readonly USER_DELETED: "user_deleted";
  readonly USER_IMPERSONATED: "user_impersonated";
  readonly USER_IMPERSONATED_STOPPED: "user_impersonated_stopped";
};
type UserEventType = (typeof USER_EVENT_TYPES)[keyof typeof USER_EVENT_TYPES];
/**
 * Location information associated with an event
 */
interface EventLocation {
  /** IP address from which the event originated */
  ipAddress?: string;
  /** City name */
  city?: string;
  /** Country name */
  country?: string;
  /** ISO 3166-1 alpha-2 country code */
  countryCode?: string;
}
/**
 * A single audit log event for the user
 */
interface UserEvent {
  /** The type of event (e.g., "user_signed_in", "password_changed") */
  eventType: UserEventType | string;
  /** Additional data about the event */
  eventData: Record<string, unknown>;
  /** Unique key for the event (typically the user ID) */
  eventKey: string;
  /** Project/organization ID */
  projectId: string;
  /** When the event occurred */
  createdAt: Date;
  /** When the event was last updated */
  updatedAt: Date;
  /** How old the event is in minutes (if available) */
  ageInMinutes?: number;
  /** Location information for the event */
  location?: EventLocation;
}
/**
 * Response from the user events endpoint
 */
interface UserEventsResponse {
  /** Array of audit log events */
  events: UserEvent[];
  /** Total number of events matching the query */
  total: number;
  /** Number of events returned in this response */
  limit: number;
  /** Number of events skipped */
  offset: number;
}
//#endregion
//#region src/index.d.ts
declare const infra: (options?: InfraOptions) => {
  id: "infra";
  init(ctx: better_auth0.AuthContext): {
    options: {
      databaseHooks: {
        user: {
          create: {
            before(user: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              email: string;
              emailVerified: boolean;
              name: string;
              image?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
            after(user: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              email: string;
              emailVerified: boolean;
              name: string;
              image?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
          update: {
            after(user: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              email: string;
              emailVerified: boolean;
              name: string;
              image?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
          delete: {
            after(user: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              email: string;
              emailVerified: boolean;
              name: string;
              image?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
        };
        session: {
          create: {
            before(session: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<{
              data: {
                loginMethod: string | null | undefined;
              };
            } | undefined>;
            after(session: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
          delete: {
            after(session: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
        };
        account: {
          create: {
            after(account: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              providerId: string;
              accountId: string;
              userId: string;
              accessToken?: string | null | undefined;
              refreshToken?: string | null | undefined;
              idToken?: string | null | undefined;
              accessTokenExpiresAt?: Date | null | undefined;
              refreshTokenExpiresAt?: Date | null | undefined;
              scope?: string | null | undefined;
              password?: string | null | undefined;
            }, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
          update: {
            after(account: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              providerId: string;
              accountId: string;
              userId: string;
              accessToken?: string | null | undefined;
              refreshToken?: string | null | undefined;
              idToken?: string | null | undefined;
              accessTokenExpiresAt?: Date | null | undefined;
              refreshTokenExpiresAt?: Date | null | undefined;
              scope?: string | null | undefined;
              password?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
          delete: {
            after(account: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              providerId: string;
              accountId: string;
              userId: string;
              accessToken?: string | null | undefined;
              refreshToken?: string | null | undefined;
              idToken?: string | null | undefined;
              accessTokenExpiresAt?: Date | null | undefined;
              refreshTokenExpiresAt?: Date | null | undefined;
              scope?: string | null | undefined;
              password?: string | null | undefined;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
        };
        verification: {
          create: {
            after(verification: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              value: string;
              expiresAt: Date;
              identifier: string;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
          delete: {
            after(verification: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              value: string;
              expiresAt: Date;
              identifier: string;
            } & Record<string, unknown>, ctx: better_auth0.GenericEndpointContext | null): Promise<void>;
          };
        };
      };
      session: {
        storeSessionInDatabase: boolean;
      };
    };
  };
  hooks: {
    before: ({
      matcher: Matcher;
      handler: (inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        context: {
          query: {
            email: string;
            normalizedEmail: string;
          };
          method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
          path: string;
          body: any;
          params: Record<string, any> & string;
          request: Request | undefined;
          headers: Headers | undefined;
          setHeader: ((key: string, value: string) => void) & ((key: string, value: string) => void);
          setStatus: (status: better_auth0.Status) => void;
          getHeader: ((key: string) => string | null) & ((key: string) => string | null);
          getCookie: (key: string, prefix?: better_auth0.CookiePrefixOptions) => string | null;
          getSignedCookie: (key: string, secret: string, prefix?: better_auth0.CookiePrefixOptions) => Promise<string | null | false>;
          setCookie: (key: string, value: string, options?: better_auth0.CookieOptions) => string;
          setSignedCookie: (key: string, value: string, secret: string, options?: better_auth0.CookieOptions) => Promise<string>;
          json: (<R extends Record<string, any> | null>(json: R, routerResponse?: {
            status?: number;
            headers?: Record<string, string>;
            response?: Response;
            body?: Record<string, string>;
          } | Response) => Promise<R>) & (<R extends Record<string, any> | null>(json: R, routerResponse?: {
            status?: number;
            headers?: Record<string, string>;
            response?: Response;
          } | Response) => Promise<R>);
          context: {
            [x: string]: any;
          } & {
            returned?: unknown | undefined;
            responseHeaders?: Headers | undefined;
            getPlugin: <Plugin extends BetterAuthPlugin>(pluginId: Plugin["id"]) => Plugin | null;
            appName: string;
            baseURL: string;
            version: string;
            options: better_auth0.BetterAuthOptions;
            trustedOrigins: string[];
            isTrustedOrigin: (url: string, settings?: {
              allowRelativePaths: boolean;
            }) => boolean;
            oauthConfig: {
              skipStateCookieCheck?: boolean | undefined;
              storeStateStrategy: "database" | "cookie";
            };
            newSession: {
              session: better_auth0.Session & Record<string, any>;
              user: better_auth0.User & Record<string, any>;
            } | null;
            session: {
              session: better_auth0.Session & Record<string, any>;
              user: better_auth0.User & Record<string, any>;
            } | null;
            setNewSession: (session: {
              session: better_auth0.Session & Record<string, any>;
              user: better_auth0.User & Record<string, any>;
            } | null) => void;
            socialProviders: better_auth0.OAuthProvider[];
            authCookies: better_auth0.BetterAuthCookies;
            logger: ReturnType<(options?: better_auth0.Logger | undefined) => better_auth0.InternalLogger>;
            rateLimit: {
              enabled: boolean;
              window: number;
              max: number;
              storage: "memory" | "database" | "secondary-storage";
            } & Omit<BetterAuthRateLimitOptions, "enabled" | "window" | "max" | "storage">;
            adapter: better_auth0.DBAdapter<better_auth0.BetterAuthOptions>;
            internalAdapter: better_auth0.InternalAdapter<better_auth0.BetterAuthOptions>;
            createAuthCookie: (cookieName: string, overrideAttributes?: Partial<better_auth0.CookieOptions> | undefined) => better_auth0.BetterAuthCookie;
            secret: string;
            sessionConfig: {
              updateAge: number;
              expiresIn: number;
              freshAge: number;
              cookieRefreshCache: false | {
                enabled: true;
                updateAge: number;
              };
            };
            generateId: (options: {
              model: better_auth0.ModelNames;
              size?: number | undefined;
            }) => string | false;
            secondaryStorage: better_auth0.SecondaryStorage | undefined;
            password: {
              hash: (password: string) => Promise<string>;
              verify: (data: {
                password: string;
                hash: string;
              }) => Promise<boolean>;
              config: {
                minPasswordLength: number;
                maxPasswordLength: number;
              };
              checkPassword: (userId: string, ctx: better_auth0.GenericEndpointContext<better_auth0.BetterAuthOptions>) => Promise<boolean>;
            };
            tables: better_auth0.BetterAuthDBSchema;
            runMigrations: () => Promise<void>;
            publishTelemetry: (event: {
              type: string;
              anonymousId?: string | undefined;
              payload: Record<string, any>;
            }) => Promise<void>;
            skipOriginCheck: boolean | string[];
            skipCSRFCheck: boolean;
            runInBackground: (promise: Promise<unknown>) => void;
            runInBackgroundOrAwait: (promise: Promise<unknown> | void) => better_auth0.Awaitable<unknown>;
          };
          redirect: (url: string) => APIError;
          error: (status: ("OK" | "CREATED" | "ACCEPTED" | "NO_CONTENT" | "MULTIPLE_CHOICES" | "MOVED_PERMANENTLY" | "FOUND" | "SEE_OTHER" | "NOT_MODIFIED" | "TEMPORARY_REDIRECT" | "BAD_REQUEST" | "UNAUTHORIZED" | "PAYMENT_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "NOT_ACCEPTABLE" | "PROXY_AUTHENTICATION_REQUIRED" | "REQUEST_TIMEOUT" | "CONFLICT" | "GONE" | "LENGTH_REQUIRED" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "URI_TOO_LONG" | "UNSUPPORTED_MEDIA_TYPE" | "RANGE_NOT_SATISFIABLE" | "EXPECTATION_FAILED" | "I'M_A_TEAPOT" | "MISDIRECTED_REQUEST" | "UNPROCESSABLE_ENTITY" | "LOCKED" | "FAILED_DEPENDENCY" | "TOO_EARLY" | "UPGRADE_REQUIRED" | "PRECONDITION_REQUIRED" | "TOO_MANY_REQUESTS" | "REQUEST_HEADER_FIELDS_TOO_LARGE" | "UNAVAILABLE_FOR_LEGAL_REASONS" | "INTERNAL_SERVER_ERROR" | "NOT_IMPLEMENTED" | "BAD_GATEWAY" | "SERVICE_UNAVAILABLE" | "GATEWAY_TIMEOUT" | "HTTP_VERSION_NOT_SUPPORTED" | "VARIANT_ALSO_NEGOTIATES" | "INSUFFICIENT_STORAGE" | "LOOP_DETECTED" | "NOT_EXTENDED" | "NETWORK_AUTHENTICATION_REQUIRED") | better_auth0.Status, body?: {
            message?: string;
            code?: string;
          } & Record<string, any>, headers?: HeadersInit) => APIError;
        };
      } | {
        context: {
          body: {
            email: string;
            normalizedEmail: string;
          };
          method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
          path: string;
          query: Record<string, any> | undefined;
          params: Record<string, any> & string;
          request: Request | undefined;
          headers: Headers | undefined;
          setHeader: ((key: string, value: string) => void) & ((key: string, value: string) => void);
          setStatus: (status: better_auth0.Status) => void;
          getHeader: ((key: string) => string | null) & ((key: string) => string | null);
          getCookie: (key: string, prefix?: better_auth0.CookiePrefixOptions) => string | null;
          getSignedCookie: (key: string, secret: string, prefix?: better_auth0.CookiePrefixOptions) => Promise<string | null | false>;
          setCookie: (key: string, value: string, options?: better_auth0.CookieOptions) => string;
          setSignedCookie: (key: string, value: string, secret: string, options?: better_auth0.CookieOptions) => Promise<string>;
          json: (<R extends Record<string, any> | null>(json: R, routerResponse?: {
            status?: number;
            headers?: Record<string, string>;
            response?: Response;
            body?: Record<string, string>;
          } | Response) => Promise<R>) & (<R extends Record<string, any> | null>(json: R, routerResponse?: {
            status?: number;
            headers?: Record<string, string>;
            response?: Response;
          } | Response) => Promise<R>);
          context: {
            [x: string]: any;
          } & {
            returned?: unknown | undefined;
            responseHeaders?: Headers | undefined;
            getPlugin: <Plugin extends BetterAuthPlugin>(pluginId: Plugin["id"]) => Plugin | null;
            appName: string;
            baseURL: string;
            version: string;
            options: better_auth0.BetterAuthOptions;
            trustedOrigins: string[];
            isTrustedOrigin: (url: string, settings?: {
              allowRelativePaths: boolean;
            }) => boolean;
            oauthConfig: {
              skipStateCookieCheck?: boolean | undefined;
              storeStateStrategy: "database" | "cookie";
            };
            newSession: {
              session: better_auth0.Session & Record<string, any>;
              user: better_auth0.User & Record<string, any>;
            } | null;
            session: {
              session: better_auth0.Session & Record<string, any>;
              user: better_auth0.User & Record<string, any>;
            } | null;
            setNewSession: (session: {
              session: better_auth0.Session & Record<string, any>;
              user: better_auth0.User & Record<string, any>;
            } | null) => void;
            socialProviders: better_auth0.OAuthProvider[];
            authCookies: better_auth0.BetterAuthCookies;
            logger: ReturnType<(options?: better_auth0.Logger | undefined) => better_auth0.InternalLogger>;
            rateLimit: {
              enabled: boolean;
              window: number;
              max: number;
              storage: "memory" | "database" | "secondary-storage";
            } & Omit<BetterAuthRateLimitOptions, "enabled" | "window" | "max" | "storage">;
            adapter: better_auth0.DBAdapter<better_auth0.BetterAuthOptions>;
            internalAdapter: better_auth0.InternalAdapter<better_auth0.BetterAuthOptions>;
            createAuthCookie: (cookieName: string, overrideAttributes?: Partial<better_auth0.CookieOptions> | undefined) => better_auth0.BetterAuthCookie;
            secret: string;
            sessionConfig: {
              updateAge: number;
              expiresIn: number;
              freshAge: number;
              cookieRefreshCache: false | {
                enabled: true;
                updateAge: number;
              };
            };
            generateId: (options: {
              model: better_auth0.ModelNames;
              size?: number | undefined;
            }) => string | false;
            secondaryStorage: better_auth0.SecondaryStorage | undefined;
            password: {
              hash: (password: string) => Promise<string>;
              verify: (data: {
                password: string;
                hash: string;
              }) => Promise<boolean>;
              config: {
                minPasswordLength: number;
                maxPasswordLength: number;
              };
              checkPassword: (userId: string, ctx: better_auth0.GenericEndpointContext<better_auth0.BetterAuthOptions>) => Promise<boolean>;
            };
            tables: better_auth0.BetterAuthDBSchema;
            runMigrations: () => Promise<void>;
            publishTelemetry: (event: {
              type: string;
              anonymousId?: string | undefined;
              payload: Record<string, any>;
            }) => Promise<void>;
            skipOriginCheck: boolean | string[];
            skipCSRFCheck: boolean;
            runInBackground: (promise: Promise<unknown>) => void;
            runInBackgroundOrAwait: (promise: Promise<unknown> | void) => better_auth0.Awaitable<unknown>;
          };
          redirect: (url: string) => APIError;
          error: (status: ("OK" | "CREATED" | "ACCEPTED" | "NO_CONTENT" | "MULTIPLE_CHOICES" | "MOVED_PERMANENTLY" | "FOUND" | "SEE_OTHER" | "NOT_MODIFIED" | "TEMPORARY_REDIRECT" | "BAD_REQUEST" | "UNAUTHORIZED" | "PAYMENT_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "NOT_ACCEPTABLE" | "PROXY_AUTHENTICATION_REQUIRED" | "REQUEST_TIMEOUT" | "CONFLICT" | "GONE" | "LENGTH_REQUIRED" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "URI_TOO_LONG" | "UNSUPPORTED_MEDIA_TYPE" | "RANGE_NOT_SATISFIABLE" | "EXPECTATION_FAILED" | "I'M_A_TEAPOT" | "MISDIRECTED_REQUEST" | "UNPROCESSABLE_ENTITY" | "LOCKED" | "FAILED_DEPENDENCY" | "TOO_EARLY" | "UPGRADE_REQUIRED" | "PRECONDITION_REQUIRED" | "TOO_MANY_REQUESTS" | "REQUEST_HEADER_FIELDS_TOO_LARGE" | "UNAVAILABLE_FOR_LEGAL_REASONS" | "INTERNAL_SERVER_ERROR" | "NOT_IMPLEMENTED" | "BAD_GATEWAY" | "SERVICE_UNAVAILABLE" | "GATEWAY_TIMEOUT" | "HTTP_VERSION_NOT_SUPPORTED" | "VARIANT_ALSO_NEGOTIATES" | "INSUFFICIENT_STORAGE" | "LOOP_DETECTED" | "NOT_EXTENDED" | "NETWORK_AUTHENTICATION_REQUIRED") | better_auth0.Status, body?: {
            message?: string;
            code?: string;
          } & Record<string, any>, headers?: HeadersInit) => APIError;
        };
      } | undefined>;
    } | {
      matcher: Matcher;
      handler: (inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<void>;
    })[];
    after: {
      matcher: (ctx: better_auth0.HookEndpointContext) => boolean;
      handler: (inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<void>;
    }[];
  };
  endpoints: {
    getDashConfig: better_auth0.StrictEndpoint<"/dash/config", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      socialProviders: string[];
      emailAndPassword: {
        enabled: boolean;
        disableSignUp?: boolean;
        requireEmailVerification?: boolean;
        maxPasswordLength?: number;
        minPasswordLength?: number;
        sendResetPassword?: (data: {
          user: better_auth0.User;
          url: string;
          token: string;
        }, request?: Request) => Promise<void>;
        resetPasswordTokenExpiresIn?: number;
        onPasswordReset?: (data: {
          user: better_auth0.User;
        }, request?: Request) => Promise<void>;
        password?: {
          hash?: (password: string) => Promise<string>;
          verify?: (data: {
            hash: string;
            password: string;
          }) => Promise<boolean>;
        };
        autoSignIn?: boolean;
        revokeSessionsOnPasswordReset?: boolean;
      } | undefined;
      plugins: {
        id: better_auth0.LiteralString;
        schema: better_auth0.BetterAuthPluginDBSchema | undefined;
        options: Record<string, any> | undefined;
      }[] | undefined;
      organization: {
        sendInvitationEmailEnabled: boolean;
        additionalFields: {
          name: string;
          type: better_auth0.DBFieldType;
          required: boolean | undefined;
          input: boolean | undefined;
          unique: boolean | undefined;
          hasDefaultValue: boolean;
          references: {
            model: string;
            field: string;
            onDelete?: "no action" | "restrict" | "cascade" | "set null" | "set default";
          } | undefined;
          returned: boolean | undefined;
          bigInt: boolean | undefined;
        }[];
      };
      user: {
        fields: {
          name: string;
          type: better_auth0.DBFieldType | undefined;
          required: boolean | undefined;
          input: boolean | undefined;
          unique: boolean | undefined;
          hasDefaultValue: boolean;
          references: {
            model: string;
            field: string;
            onDelete?: "no action" | "restrict" | "cascade" | "set null" | "set default";
          } | undefined;
          returned: boolean | undefined;
          bigInt: boolean | undefined;
        }[];
        additionalFields: {
          name: string;
          type: better_auth0.DBFieldType | undefined;
          required: boolean | undefined;
          input: boolean | undefined;
          unique: boolean | undefined;
          hasDefaultValue: boolean;
          references: {
            model: string;
            field: string;
            onDelete?: "no action" | "restrict" | "cascade" | "set null" | "set default";
          } | undefined;
          returned: boolean | undefined;
          bigInt: boolean | undefined;
        }[];
        deleteUserEnabled: boolean;
        modelName: string | undefined;
      };
      baseURL: string | undefined;
      basePath: string;
      emailVerification: {
        sendVerificationEmailEnabled: boolean;
      };
      insights: {
        hasDatabase: boolean;
        cookies: {
          key: string;
          name: string | undefined;
          sameSite: string | undefined;
        }[] | null;
        hasIpAddressHeaders: boolean;
        ipAddressHeaders: string[] | null;
        disableIpTracking: boolean;
        disableCSRFCheck: boolean;
        disableOriginCheck: boolean;
        allowDifferentEmails: boolean;
        skipStateCookieCheck: boolean;
        storeStateCookieStrategy: "database" | "cookie" | null;
        cookieCache: {
          enabled: boolean;
          strategy: "compact" | "jwt" | "jwe" | null;
          refreshCache: boolean | null;
        };
        sessionFreshAge: number | null;
        disableVerificationCleanup: boolean;
        minPasswordLength: number | null;
        maxPasswordLength: number | null;
        hasRateLimitDisabled: boolean;
        rateLimitStorage: "database" | "memory" | "secondary-storage" | null;
        storeSessionInDatabase: boolean;
        preserveSessionInDatabase: boolean;
        secretEntropy: number;
        useSecureCookies: boolean | null;
        crossSubDomainCookiesEnabled: boolean;
        crossSubDomainCookiesDomain: string | undefined;
        defaultCookieAttributes: {
          sameSite: "none" | "strict" | "Strict" | "Lax" | "None" | "lax" | null;
          httpOnly: boolean | null;
          prefix: better_auth0.CookiePrefixOptions | null;
          partitioned: boolean | null;
          secure: boolean | null;
        } | null;
        appName: string | null;
        hasJoinsEnabled: boolean;
      };
    }>;
    getDashUsers: better_auth0.StrictEndpoint<"/dash/list-users", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      query: zod0.ZodOptional<zod0.ZodObject<{
        limit: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodNumber, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<number, string>>]>>;
        offset: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodNumber, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<number, string>>]>>;
        sortBy: zod0.ZodOptional<zod0.ZodString>;
        sortOrder: zod0.ZodOptional<zod0.ZodEnum<{
          asc: "asc";
          desc: "desc";
        }>>;
        where: zod0.ZodOptional<zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<any, string>>>;
        countWhere: zod0.ZodOptional<zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<any, string>>>;
      }, better_auth0.$strip>>;
    }, {
      users: {
        banned: boolean;
        banReason: string | null;
        banExpires: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined;
      }[];
      total: number;
      offset: number;
      limit: number;
      onlineUsers: number;
      activityTrackingEnabled: boolean;
    }>;
    getOnlineUsersCount: better_auth0.StrictEndpoint<"/dash/online-users-count", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      onlineUsers: number;
    }>;
    createDashUser: better_auth0.StrictEndpoint<"/dash/create-user", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId?: string | undefined;
          organizationRole?: string | undefined;
        };
      }>)[];
      body: zod0.ZodObject<{
        name: zod0.ZodString;
        email: zod0.ZodString;
        image: zod0.ZodOptional<zod0.ZodString>;
        password: zod0.ZodOptional<zod0.ZodString>;
        generatePassword: zod0.ZodOptional<zod0.ZodBoolean>;
        emailVerified: zod0.ZodOptional<zod0.ZodBoolean>;
        sendVerificationEmail: zod0.ZodOptional<zod0.ZodBoolean>;
        sendOrganizationInvite: zod0.ZodOptional<zod0.ZodBoolean>;
        organizationRole: zod0.ZodOptional<zod0.ZodString>;
        organizationId: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$loose>;
    }, Record<string, any> & {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined;
    }>;
    deleteDashUser: better_auth0.StrictEndpoint<"/dash/delete-user", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, void>;
    listDashOrganizations: better_auth0.StrictEndpoint<"/dash/list-organizations", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      query: zod0.ZodOptional<zod0.ZodObject<{
        limit: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodNumber, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<number, string>>]>>;
        offset: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodNumber, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<number, string>>]>>;
        sortBy: zod0.ZodOptional<zod0.ZodEnum<{
          name: "name";
          createdAt: "createdAt";
          slug: "slug";
          members: "members";
        }>>;
        sortOrder: zod0.ZodOptional<zod0.ZodEnum<{
          asc: "asc";
          desc: "desc";
        }>>;
        search: zod0.ZodOptional<zod0.ZodString>;
        startDate: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodDate, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<Date, string>>]>>;
        endDate: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodDate, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<Date, string>>]>>;
      }, better_auth0.$strip>>;
    }, {
      organizations: {
        members: {
          id: string;
          name: string;
          email: string;
          image: string | null | undefined;
        }[];
        memberCount: number;
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        logo?: string | null | undefined;
        metadata?: any;
        member: better_auth_plugins0.Member[];
      }[];
      total: number;
      offset: number;
      limit: number;
    }>;
    getDashOrganization: better_auth0.StrictEndpoint<"/dash/organization/:id", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      logo?: string | null | undefined;
      metadata?: any;
    } & {
      memberCount: number;
    }>;
    listDashOrganizationMembers: better_auth0.StrictEndpoint<"/dash/organization/:id/members", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      user: {
        id: string;
        email: string;
        name: string;
        image: string | null;
      } | null;
      invitedBy: {
        id: string;
        name: string;
        email: string;
        image: string | null;
      } | null;
      id: string;
      organizationId: string;
      userId: string;
      role: string;
      createdAt: Date;
    }[]>;
    listDashOrganizationInvitations: better_auth0.StrictEndpoint<"/dash/organization/:id/invitations", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
      } | null;
      id: string;
      organizationId: string;
      email: string;
      role: string;
      status: "pending" | "accepted" | "rejected" | "canceled";
      inviterId: string;
      expiresAt: Date;
      createdAt: Date;
      teamId?: string | null | undefined;
    }[]>;
    listDashOrganizationTeams: better_auth0.StrictEndpoint<"/dash/organization/:id/teams", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, any[]>;
    listDashOrganizationSsoProviders: better_auth0.StrictEndpoint<"/dash/organization/:id/sso-providers", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
    }, {
      id: string;
      providerId: string;
      issuer: string;
      domain: string;
      oidcConfig?: unknown;
      samlConfig?: unknown;
      organizationId: string;
      userId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }[]>;
    createDashSsoProvider: better_auth0.StrictEndpoint<"/dash/organization/:id/sso-provider/create", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
        domain: zod0.ZodString;
        protocol: zod0.ZodEnum<{
          SAML: "SAML";
          OIDC: "OIDC";
        }>;
        userId: zod0.ZodString;
        samlConfig: zod0.ZodOptional<zod0.ZodObject<{
          idpMetadata: zod0.ZodOptional<zod0.ZodObject<{
            metadata: zod0.ZodOptional<zod0.ZodString>;
            metadataUrl: zod0.ZodOptional<zod0.ZodString>;
          }, better_auth0.$strip>>;
          entryPoint: zod0.ZodOptional<zod0.ZodString>;
          cert: zod0.ZodOptional<zod0.ZodString>;
          entityId: zod0.ZodOptional<zod0.ZodString>;
          mapping: zod0.ZodOptional<zod0.ZodObject<{
            id: zod0.ZodOptional<zod0.ZodString>;
            email: zod0.ZodOptional<zod0.ZodString>;
            emailVerified: zod0.ZodOptional<zod0.ZodString>;
            name: zod0.ZodOptional<zod0.ZodString>;
            firstName: zod0.ZodOptional<zod0.ZodString>;
            lastName: zod0.ZodOptional<zod0.ZodString>;
            extraFields: zod0.ZodOptional<zod0.ZodRecord<zod0.ZodString, zod0.ZodAny>>;
          }, better_auth0.$strip>>;
        }, better_auth0.$strip>>;
        oidcConfig: zod0.ZodOptional<zod0.ZodObject<{
          clientId: zod0.ZodString;
          clientSecret: zod0.ZodOptional<zod0.ZodString>;
          discoveryUrl: zod0.ZodOptional<zod0.ZodString>;
          issuer: zod0.ZodOptional<zod0.ZodString>;
          mapping: zod0.ZodOptional<zod0.ZodObject<{
            id: zod0.ZodOptional<zod0.ZodString>;
            email: zod0.ZodOptional<zod0.ZodString>;
            emailVerified: zod0.ZodOptional<zod0.ZodString>;
            name: zod0.ZodOptional<zod0.ZodString>;
            image: zod0.ZodOptional<zod0.ZodString>;
            extraFields: zod0.ZodOptional<zod0.ZodRecord<zod0.ZodString, zod0.ZodAny>>;
          }, better_auth0.$strip>>;
        }, better_auth0.$strip>>;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      provider: {
        id: unknown;
        providerId: {};
        domain: {};
      };
      domainVerification: {
        txtRecordName: string;
        verificationToken: {} | null;
      };
    }>;
    updateDashSsoProvider: better_auth0.StrictEndpoint<"/dash/organization/:id/sso-provider/update", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
        domain: zod0.ZodString;
        protocol: zod0.ZodEnum<{
          SAML: "SAML";
          OIDC: "OIDC";
        }>;
        samlConfig: zod0.ZodOptional<zod0.ZodObject<{
          idpMetadata: zod0.ZodOptional<zod0.ZodObject<{
            metadata: zod0.ZodOptional<zod0.ZodString>;
            metadataUrl: zod0.ZodOptional<zod0.ZodString>;
          }, better_auth0.$strip>>;
          entryPoint: zod0.ZodOptional<zod0.ZodString>;
          cert: zod0.ZodOptional<zod0.ZodString>;
          entityId: zod0.ZodOptional<zod0.ZodString>;
          mapping: zod0.ZodOptional<zod0.ZodObject<{
            id: zod0.ZodOptional<zod0.ZodString>;
            email: zod0.ZodOptional<zod0.ZodString>;
            emailVerified: zod0.ZodOptional<zod0.ZodString>;
            name: zod0.ZodOptional<zod0.ZodString>;
            firstName: zod0.ZodOptional<zod0.ZodString>;
            lastName: zod0.ZodOptional<zod0.ZodString>;
            extraFields: zod0.ZodOptional<zod0.ZodRecord<zod0.ZodString, zod0.ZodAny>>;
          }, better_auth0.$strip>>;
        }, better_auth0.$strip>>;
        oidcConfig: zod0.ZodOptional<zod0.ZodObject<{
          clientId: zod0.ZodString;
          clientSecret: zod0.ZodOptional<zod0.ZodString>;
          discoveryUrl: zod0.ZodOptional<zod0.ZodString>;
          issuer: zod0.ZodOptional<zod0.ZodString>;
          mapping: zod0.ZodOptional<zod0.ZodObject<{
            id: zod0.ZodOptional<zod0.ZodString>;
            email: zod0.ZodOptional<zod0.ZodString>;
            emailVerified: zod0.ZodOptional<zod0.ZodString>;
            name: zod0.ZodOptional<zod0.ZodString>;
            image: zod0.ZodOptional<zod0.ZodString>;
            extraFields: zod0.ZodOptional<zod0.ZodRecord<zod0.ZodString, zod0.ZodAny>>;
          }, better_auth0.$strip>>;
        }, better_auth0.$strip>>;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      provider: {
        id: {};
        providerId: {};
        domain: {};
      };
    }>;
    requestDashSsoVerificationToken: better_auth0.StrictEndpoint<"/dash/organization/:id/sso-provider/request-verification-token", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      providerId: string;
      domain: string;
      verificationToken: string;
      txtRecordName: string;
    }>;
    verifyDashSsoProviderDomain: better_auth0.StrictEndpoint<"/dash/organization/:id/sso-provider/verify-domain", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      verified: boolean;
      message: string;
    }>;
    deleteDashSsoProvider: better_auth0.StrictEndpoint<"/dash/organization/:id/sso-provider/delete", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      message: string;
    }>;
    markDashSsoProviderDomainVerified: better_auth0.StrictEndpoint<"/dash/organization/:id/sso-provider/mark-domain-verified", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
        verified: zod0.ZodBoolean;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      domainVerified: boolean;
      message: string;
    }>;
    listDashTeamMembers: better_auth0.StrictEndpoint<"/dash/organization/:orgId/teams/:teamId/members", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null | undefined;
      } | null;
      id: string;
      teamId: string;
      userId: string;
      createdAt: Date;
    }[]>;
    createDashOrganization: better_auth0.StrictEndpoint<"/dash/organization/create", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
          skipDefaultTeam: boolean;
        };
      }>)[];
      body: zod0.ZodObject<{
        name: zod0.ZodString;
        slug: zod0.ZodString;
        logo: zod0.ZodOptional<zod0.ZodString>;
        defaultTeamName: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$loose>;
    }, {
      members: {
        id: string;
        organizationId: string;
        userId: string;
        role: string;
        createdAt: Date;
      }[];
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      logo?: string | null | undefined;
      metadata?: any;
    }>;
    deleteDashOrganization: better_auth0.StrictEndpoint<"/dash/organization/delete", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        organizationId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    getDashOrganizationOptions: better_auth0.StrictEndpoint<"/dash/organization/options", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      teamsEnabled: any;
    }>;
    deleteDashSessions: better_auth0.StrictEndpoint<"/dash/delete-sessions", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      message: string;
    }>;
    getDashUser: better_auth0.StrictEndpoint<"/dash/user", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      lastActiveAt: Date | null;
      banned: boolean;
      banReason: string | null;
      banExpires: number | null;
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined;
      account: better_auth0.Account[];
      session: better_auth0.Session[];
    }>;
    getDashUserOrganizations: better_auth0.StrictEndpoint<"/dash/user-organizations", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      organizations: {
        id: string;
        name: string;
        logo: string | null | undefined;
        createdAt: Date;
        slug: string;
        role: string | undefined;
        teams: {
          id: string;
          name: string;
          organizationId: string;
          createdAt: Date;
          updatedAt?: Date | undefined;
        }[];
      }[];
    }>;
    updateDashUser: better_auth0.StrictEndpoint<"/dash/update-user", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        name: zod0.ZodOptional<zod0.ZodString>;
        email: zod0.ZodOptional<zod0.ZodString>;
        image: zod0.ZodOptional<zod0.ZodString>;
        emailVerified: zod0.ZodOptional<zod0.ZodBoolean>;
      }, better_auth0.$loose>;
    }, {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined;
    } & Record<string, any>>;
    setDashPassword: better_auth0.StrictEndpoint<"/dash/set-password", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        password: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    unlinkDashAccount: better_auth0.StrictEndpoint<"/dash/unlink-account", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
        accountId: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    listAllDashSessions: better_auth0.StrictEndpoint<"/dash/list-all-sessions", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      query: zod0.ZodOptional<zod0.ZodObject<{
        limit: zod0.ZodOptional<zod0.ZodNumber>;
        offset: zod0.ZodOptional<zod0.ZodNumber>;
      }, better_auth0.$strip>>;
    }, {
      sessions: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
      }[];
      id: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      emailVerified: boolean;
      name: string;
      image?: string | null | undefined;
    }[]>;
    dashRevokeSession: better_auth0.StrictEndpoint<"/dash/sessions/revoke", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      metadata: {
        allowedMediaTypes: string[];
      };
    }, {
      success: boolean;
    }>;
    dashRevokeAllSessions: better_auth0.StrictEndpoint<"/dash/sessions/revoke-all", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      body: zod0.ZodObject<{
        userId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    dashImpersonateUser: better_auth0.StrictEndpoint<"/dash/impersonate-user", {
      method: "GET";
      query: zod0.ZodObject<{
        impersonation_token: zod0.ZodString;
      }, better_auth0.$strip>;
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
          redirectUrl: string;
          impersonatedBy?: string | undefined;
        };
      }>)[];
    }, never>;
    updateDashOrganization: better_auth0.StrictEndpoint<"/dash/organization/update", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        logo: zod0.ZodOptional<zod0.ZodString>;
        name: zod0.ZodOptional<zod0.ZodString>;
        slug: zod0.ZodOptional<zod0.ZodString>;
        metadata: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$loose>;
    }, {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      logo?: string | null | undefined;
      metadata?: any;
    } | null>;
    createDashTeam: better_auth0.StrictEndpoint<"/dash/organization/create-team", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        name: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      id: string;
      name: string;
      organizationId: string;
      createdAt: Date;
      updatedAt?: Date | undefined;
    }>;
    updateDashTeam: better_auth0.StrictEndpoint<"/dash/organization/update-team", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        teamId: zod0.ZodString;
        name: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$strip>;
    }, {
      id: string;
      name: string;
      organizationId: string;
      createdAt: Date;
      updatedAt?: Date | undefined;
    } | null>;
    deleteDashTeam: better_auth0.StrictEndpoint<"/dash/organization/delete-team", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        teamId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    addDashTeamMember: better_auth0.StrictEndpoint<"/dash/organization/add-team-member", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        teamId: zod0.ZodString;
        userId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      id: string;
      teamId: string;
      userId: string;
      createdAt: Date;
    }>;
    removeDashTeamMember: better_auth0.StrictEndpoint<"/dash/organization/remove-team-member", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        teamId: zod0.ZodString;
        userId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    addDashMember: better_auth0.StrictEndpoint<"/dash/organization/add-member", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        userId: zod0.ZodString;
        role: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      id: string;
      organizationId: string;
      userId: string;
      role: string;
      createdAt: Date;
    }>;
    removeDashMember: better_auth0.StrictEndpoint<"/dash/organization/remove-member", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        memberId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    updateDashMemberRole: better_auth0.StrictEndpoint<"/dash/organization/update-member-role", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        memberId: zod0.ZodString;
        role: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      id: string;
      organizationId: string;
      userId: string;
      role: string;
      createdAt: Date;
    } | null>;
    inviteDashMember: better_auth0.StrictEndpoint<"/dash/organization/invite-member", {
      method: "POST";
      body: zod0.ZodObject<{
        email: zod0.ZodString;
        role: zod0.ZodString;
        invitedBy: zod0.ZodString;
      }, better_auth0.$strip>;
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
          invitedBy: string;
        };
      }>)[];
    }, any>;
    cancelDashInvitation: better_auth0.StrictEndpoint<"/dash/organization/cancel-invitation", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
          invitationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        invitationId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    resendDashInvitation: better_auth0.StrictEndpoint<"/dash/organization/resend-invitation", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
          invitationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        invitationId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    dashCheckUserByEmail: better_auth0.StrictEndpoint<"/dash/organization/check-user-by-email", {
      method: "POST";
      body: zod0.ZodObject<{
        email: zod0.ZodString;
      }, better_auth0.$strip>;
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
    }, {
      exists: boolean;
      user: null;
      isAlreadyMember: boolean;
    } | {
      exists: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        image: string | null | undefined;
      };
      isAlreadyMember: boolean;
    }>;
    dashGetUserStats: better_auth0.StrictEndpoint<"/dash/user-stats", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      daily: {
        signUps: number;
        percentage: number;
      };
      weekly: {
        signUps: number;
        percentage: number;
      };
      monthly: {
        signUps: number;
        percentage: number;
      };
      total: number;
      activeUsers: {
        daily: {
          active: number;
          percentage: number;
        };
        weekly: {
          active: number;
          percentage: number;
        };
        monthly: {
          active: number;
          percentage: number;
        };
      };
    }>;
    dashGetUserGraphData: better_auth0.StrictEndpoint<"/dash/user-graph-data", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      query: zod0.ZodObject<{
        period: zod0.ZodDefault<zod0.ZodEnum<{
          daily: "daily";
          weekly: "weekly";
          monthly: "monthly";
        }>>;
      }, better_auth0.$strip>;
    }, {
      data: {
        date: Date;
        label: string;
        totalUsers: number;
        newUsers: number;
        activeUsers: number;
      }[];
      period: "daily" | "weekly" | "monthly";
    }>;
    dashGetUserRetentionData: better_auth0.StrictEndpoint<"/dash/user-retention-data", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      query: zod0.ZodObject<{
        period: zod0.ZodDefault<zod0.ZodEnum<{
          daily: "daily";
          weekly: "weekly";
          monthly: "monthly";
        }>>;
      }, better_auth0.$strip>;
    }, {
      data: {
        n: number;
        label: string;
        cohortStart: string;
        cohortEnd: string;
        activeStart: string;
        activeEnd: string;
        cohortSize: number;
        retained: number;
        retentionRate: number;
      }[];
      period: "daily" | "weekly" | "monthly";
    }>;
    dashGetUserMapData: better_auth0.StrictEndpoint<"/dash/user-map-data", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      countries: {
        country_code: string;
        country_name: string;
        user_count: number;
      }[];
      cities: {
        city: string;
        country: string;
        country_code: string;
        user_count: number;
      }[];
      total: number;
    }>;
    dashBanUser: better_auth0.StrictEndpoint<"/dash/ban-user", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        banReason: zod0.ZodOptional<zod0.ZodString>;
        banExpires: zod0.ZodOptional<zod0.ZodNumber>;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    dashUnbanUser: better_auth0.StrictEndpoint<"/dash/unban-user", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      success: boolean;
    }>;
    dashSendVerificationEmail: better_auth0.StrictEndpoint<"/dash/send-verification-email", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        callbackUrl: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    dashSendResetPasswordEmail: better_auth0.StrictEndpoint<"/dash/send-reset-password-email", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        callbackUrl: zod0.ZodString;
      }, better_auth0.$strip>;
    }, never>;
    dashEnableTwoFactor: better_auth0.StrictEndpoint<"/dash/enable-two-factor", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      success: boolean;
      totpURI: string;
      secret: string;
      backupCodes: string[];
    }>;
    dashViewTwoFactorTotpUri: better_auth0.StrictEndpoint<"/dash/view-two-factor-totp-uri", {
      method: "POST";
      metadata: {
        scope: "http";
      };
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      totpURI: string;
      secret: string;
    }>;
    dashViewBackupCodes: better_auth0.StrictEndpoint<"/dash/view-backup-codes", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      backupCodes: string[];
    }>;
    dashDisableTwoFactor: better_auth0.StrictEndpoint<"/dash/disable-two-factor", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      success: boolean;
    }>;
    dashGenerateBackupCodes: better_auth0.StrictEndpoint<"/dash/generate-backup-codes", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          userId: string;
        };
      }>)[];
    }, {
      backupCodes: string[];
    }>;
    getUserEvents: better_auth0.StrictEndpoint<"/events/list", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        session: {
          session: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
          };
          user: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
          };
        };
      }>)[];
      query: zod0.ZodOptional<zod0.ZodObject<{
        limit: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodNumber, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<number, string>>]>>;
        offset: zod0.ZodOptional<zod0.ZodUnion<[zod0.ZodNumber, zod0.ZodPipe<zod0.ZodString, zod0.ZodTransform<number, string>>]>>;
        eventType: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$strip>>;
    }, {
      events: UserEvent[];
      total: number;
      limit: number;
      offset: number;
    }>;
    getEventTypes: better_auth0.StrictEndpoint<"/events/types", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        session: {
          session: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
          };
          user: Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
          };
        };
      }>)[];
    }, {
      user: {
        readonly USER_CREATED: "user_created";
        readonly USER_SIGNED_IN: "user_signed_in";
        readonly USER_SIGNED_OUT: "user_signed_out";
        readonly USER_SIGN_IN_FAILED: "user_sign_in_failed";
        readonly PASSWORD_RESET_REQUESTED: "password_reset_requested";
        readonly PASSWORD_RESET_COMPLETED: "password_reset_completed";
        readonly PASSWORD_CHANGED: "password_changed";
        readonly EMAIL_VERIFICATION_SENT: "email_verification_sent";
        readonly EMAIL_VERIFIED: "email_verified";
        readonly EMAIL_CHANGED: "email_changed";
        readonly PROFILE_UPDATED: "profile_updated";
        readonly PROFILE_IMAGE_UPDATED: "profile_image_updated";
        readonly SESSION_CREATED: "session_created";
        readonly SESSION_REVOKED: "session_revoked";
        readonly ALL_SESSIONS_REVOKED: "all_sessions_revoked";
        readonly TWO_FACTOR_ENABLED: "two_factor_enabled";
        readonly TWO_FACTOR_DISABLED: "two_factor_disabled";
        readonly TWO_FACTOR_VERIFIED: "two_factor_verified";
        readonly ACCOUNT_LINKED: "account_linked";
        readonly ACCOUNT_UNLINKED: "account_unlinked";
        readonly USER_BANNED: "user_banned";
        readonly USER_UNBANNED: "user_unbanned";
        readonly USER_DELETED: "user_deleted";
        readonly USER_IMPERSONATED: "user_impersonated";
        readonly USER_IMPERSONATED_STOPPED: "user_impersonated_stopped";
      };
      organization: {
        readonly ORGANIZATION_CREATED: "organization_created";
        readonly ORGANIZATION_UPDATED: "organization_updated";
        readonly ORGANIZATION_MEMBER_ADDED: "organization_member_added";
        readonly ORGANIZATION_MEMBER_REMOVED: "organization_member_removed";
        readonly ORGANIZATION_MEMBER_ROLE_UPDATED: "organization_member_role_updated";
        readonly ORGANIZATION_MEMBER_INVITED: "organization_member_invited";
        readonly ORGANIZATION_MEMBER_INVITE_CANCELED: "organization_member_invite_canceled";
        readonly ORGANIZATION_MEMBER_INVITE_ACCEPTED: "organization_member_invite_accepted";
        readonly ORGANIZATION_MEMBER_INVITE_REJECTED: "organization_member_invite_rejected";
        readonly ORGANIZATION_TEAM_CREATED: "organization_team_created";
        readonly ORGANIZATION_TEAM_UPDATED: "organization_team_updated";
        readonly ORGANIZATION_TEAM_DELETED: "organization_team_deleted";
        readonly ORGANIZATION_TEAM_MEMBER_ADDED: "organization_team_member_added";
        readonly ORGANIZATION_TEAM_MEMBER_REMOVED: "organization_team_member_removed";
      };
      all: {
        readonly ORGANIZATION_CREATED: "organization_created";
        readonly ORGANIZATION_UPDATED: "organization_updated";
        readonly ORGANIZATION_MEMBER_ADDED: "organization_member_added";
        readonly ORGANIZATION_MEMBER_REMOVED: "organization_member_removed";
        readonly ORGANIZATION_MEMBER_ROLE_UPDATED: "organization_member_role_updated";
        readonly ORGANIZATION_MEMBER_INVITED: "organization_member_invited";
        readonly ORGANIZATION_MEMBER_INVITE_CANCELED: "organization_member_invite_canceled";
        readonly ORGANIZATION_MEMBER_INVITE_ACCEPTED: "organization_member_invite_accepted";
        readonly ORGANIZATION_MEMBER_INVITE_REJECTED: "organization_member_invite_rejected";
        readonly ORGANIZATION_TEAM_CREATED: "organization_team_created";
        readonly ORGANIZATION_TEAM_UPDATED: "organization_team_updated";
        readonly ORGANIZATION_TEAM_DELETED: "organization_team_deleted";
        readonly ORGANIZATION_TEAM_MEMBER_ADDED: "organization_team_member_added";
        readonly ORGANIZATION_TEAM_MEMBER_REMOVED: "organization_team_member_removed";
        readonly USER_CREATED: "user_created";
        readonly USER_SIGNED_IN: "user_signed_in";
        readonly USER_SIGNED_OUT: "user_signed_out";
        readonly USER_SIGN_IN_FAILED: "user_sign_in_failed";
        readonly PASSWORD_RESET_REQUESTED: "password_reset_requested";
        readonly PASSWORD_RESET_COMPLETED: "password_reset_completed";
        readonly PASSWORD_CHANGED: "password_changed";
        readonly EMAIL_VERIFICATION_SENT: "email_verification_sent";
        readonly EMAIL_VERIFIED: "email_verified";
        readonly EMAIL_CHANGED: "email_changed";
        readonly PROFILE_UPDATED: "profile_updated";
        readonly PROFILE_IMAGE_UPDATED: "profile_image_updated";
        readonly SESSION_CREATED: "session_created";
        readonly SESSION_REVOKED: "session_revoked";
        readonly ALL_SESSIONS_REVOKED: "all_sessions_revoked";
        readonly TWO_FACTOR_ENABLED: "two_factor_enabled";
        readonly TWO_FACTOR_DISABLED: "two_factor_disabled";
        readonly TWO_FACTOR_VERIFIED: "two_factor_verified";
        readonly ACCOUNT_LINKED: "account_linked";
        readonly ACCOUNT_UNLINKED: "account_unlinked";
        readonly USER_BANNED: "user_banned";
        readonly USER_UNBANNED: "user_unbanned";
        readonly USER_DELETED: "user_deleted";
        readonly USER_IMPERSONATED: "user_impersonated";
        readonly USER_IMPERSONATED_STOPPED: "user_impersonated_stopped";
      };
    }>;
    dashAcceptInvitation: better_auth0.StrictEndpoint<"/dash/accept-invitation", {
      method: "GET";
      query: zod0.ZodObject<{
        token: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      status: ("OK" | "CREATED" | "ACCEPTED" | "NO_CONTENT" | "MULTIPLE_CHOICES" | "MOVED_PERMANENTLY" | "FOUND" | "SEE_OTHER" | "NOT_MODIFIED" | "TEMPORARY_REDIRECT" | "BAD_REQUEST" | "UNAUTHORIZED" | "PAYMENT_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "NOT_ACCEPTABLE" | "PROXY_AUTHENTICATION_REQUIRED" | "REQUEST_TIMEOUT" | "CONFLICT" | "GONE" | "LENGTH_REQUIRED" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "URI_TOO_LONG" | "UNSUPPORTED_MEDIA_TYPE" | "RANGE_NOT_SATISFIABLE" | "EXPECTATION_FAILED" | "I'M_A_TEAPOT" | "MISDIRECTED_REQUEST" | "UNPROCESSABLE_ENTITY" | "LOCKED" | "FAILED_DEPENDENCY" | "TOO_EARLY" | "UPGRADE_REQUIRED" | "PRECONDITION_REQUIRED" | "TOO_MANY_REQUESTS" | "REQUEST_HEADER_FIELDS_TOO_LARGE" | "UNAVAILABLE_FOR_LEGAL_REASONS" | "INTERNAL_SERVER_ERROR" | "NOT_IMPLEMENTED" | "BAD_GATEWAY" | "SERVICE_UNAVAILABLE" | "GATEWAY_TIMEOUT" | "HTTP_VERSION_NOT_SUPPORTED" | "VARIANT_ALSO_NEGOTIATES" | "INSUFFICIENT_STORAGE" | "LOOP_DETECTED" | "NOT_EXTENDED" | "NETWORK_AUTHENTICATION_REQUIRED") | better_auth0.Status;
      body: ({
        message?: string;
        code?: string;
        cause?: unknown;
      } & Record<string, any>) | undefined;
      headers: HeadersInit;
      statusCode: number;
      name: string;
      message: string;
      stack?: string;
      cause?: unknown;
    }>;
    dashCompleteInvitation: better_auth0.StrictEndpoint<"/dash/complete-invitation", {
      method: "POST";
      body: zod0.ZodObject<{
        token: zod0.ZodString;
        password: zod0.ZodOptional<zod0.ZodString>;
        providerId: zod0.ZodOptional<zod0.ZodString>;
        providerAccountId: zod0.ZodOptional<zod0.ZodString>;
        accessToken: zod0.ZodOptional<zod0.ZodString>;
        refreshToken: zod0.ZodOptional<zod0.ZodString>;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      redirectUrl: string;
    }>;
    dashCheckUserExists: better_auth0.StrictEndpoint<"/dash/check-user-exists", {
      method: "POST";
      body: zod0.ZodObject<{
        email: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      exists: boolean;
      userId: string | null;
    }>;
    listDashOrganizationLogDrains: better_auth0.StrictEndpoint<"/dash/organization/:id/log-drains", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, {
      config: Record<string, unknown>;
      id: string;
      organizationId: string;
      name: string;
      enabled: boolean;
      destinationType: OrgLogDrainDestinationType;
      eventTypes: OrgLogDrainEventType[];
      createdAt: Date | string;
      updatedAt: Date | string;
    }[]>;
    createDashOrganizationLogDrain: better_auth0.StrictEndpoint<"/dash/organization/log-drain/create", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        name: zod0.ZodString;
        destinationType: zod0.ZodEnum<{
          datadog: "datadog";
          splunk: "splunk";
          webhook: "webhook";
        }>;
        eventTypes: zod0.ZodArray<zod0.ZodEnum<{
          auth: "auth";
          email: "email";
          security: "security";
          all: "all";
        }>>;
        config: zod0.ZodRecord<zod0.ZodString, zod0.ZodUnknown>;
        enabled: zod0.ZodDefault<zod0.ZodOptional<zod0.ZodBoolean>>;
      }, better_auth0.$strip>;
    }, {
      config: Record<string, unknown>;
      id: string;
      organizationId: string;
      name: string;
      enabled: boolean;
      destinationType: OrgLogDrainDestinationType;
      eventTypes: OrgLogDrainEventType[];
      createdAt: Date | string;
      updatedAt: Date | string;
    }>;
    updateDashOrganizationLogDrain: better_auth0.StrictEndpoint<"/dash/organization/log-drain/update", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        logDrainId: zod0.ZodString;
        name: zod0.ZodOptional<zod0.ZodString>;
        destinationType: zod0.ZodOptional<zod0.ZodEnum<{
          datadog: "datadog";
          splunk: "splunk";
          webhook: "webhook";
        }>>;
        eventTypes: zod0.ZodOptional<zod0.ZodArray<zod0.ZodEnum<{
          auth: "auth";
          email: "email";
          security: "security";
          all: "all";
        }>>>;
        config: zod0.ZodOptional<zod0.ZodRecord<zod0.ZodString, zod0.ZodUnknown>>;
        enabled: zod0.ZodOptional<zod0.ZodBoolean>;
      }, better_auth0.$strip>;
    }, {
      config: Record<string, unknown>;
      id: string;
      organizationId: string;
      name: string;
      enabled: boolean;
      destinationType: OrgLogDrainDestinationType;
      eventTypes: OrgLogDrainEventType[];
      createdAt: Date | string;
      updatedAt: Date | string;
    }>;
    deleteDashOrganizationLogDrain: better_auth0.StrictEndpoint<"/dash/organization/log-drain/delete", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        logDrainId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    testDashOrganizationLogDrain: better_auth0.StrictEndpoint<"/dash/organization/log-drain/test", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        destinationType: zod0.ZodEnum<{
          datadog: "datadog";
          splunk: "splunk";
          webhook: "webhook";
        }>;
        config: zod0.ZodRecord<zod0.ZodString, zod0.ZodUnknown>;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      error?: undefined;
    } | {
      success: boolean;
      error: string;
    }>;
    listDashOrganizationDirectories: better_auth0.StrictEndpoint<"/dash/organization/:id/directories", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
    }, DirectorySyncConnection[]>;
    createDashOrganizationDirectory: better_auth0.StrictEndpoint<"/dash/organization/directory/create", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
        ownerUserId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      organizationId: string;
      providerId: string;
      scimEndpoint: string;
      scimToken: string;
    }>;
    deleteDashOrganizationDirectory: better_auth0.StrictEndpoint<"/dash/organization/directory/delete", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
    }>;
    regenerateDashDirectoryToken: better_auth0.StrictEndpoint<"/dash/organization/directory/regenerate-token", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: {
          organizationId: string;
        };
      }>)[];
      body: zod0.ZodObject<{
        providerId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      success: boolean;
      scimToken: string;
      scimEndpoint: string;
    }>;
    getDashDirectoryDetails: better_auth0.StrictEndpoint<"/dash/organization/:orgId/directory", {
      method: "GET";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      query: zod0.ZodObject<{
        providerId: zod0.ZodString;
      }, better_auth0.$strip>;
    }, {
      organizationId: string;
      providerId: string;
      scimEndpoint: string;
    }>;
    dashExecuteAdapter: better_auth0.StrictEndpoint<"/dash/execute-adapter", {
      method: "POST";
      use: ((inputContext: better_auth0.MiddlewareInputContext<better_auth0.MiddlewareOptions>) => Promise<{
        payload: Record<string, unknown>;
      }>)[];
      body: zod0.ZodDiscriminatedUnion<[zod0.ZodObject<{
        action: zod0.ZodLiteral<"findOne">;
        model: zod0.ZodString;
        where: zod0.ZodOptional<zod0.ZodArray<zod0.ZodObject<{
          field: zod0.ZodString;
          value: zod0.ZodUnknown;
          operator: zod0.ZodOptional<zod0.ZodEnum<{
            in: "in";
            gte: "gte";
            eq: "eq";
            ne: "ne";
            lt: "lt";
            lte: "lte";
            gt: "gt";
            contains: "contains";
            starts_with: "starts_with";
            ends_with: "ends_with";
          }>>;
          connector: zod0.ZodOptional<zod0.ZodEnum<{
            AND: "AND";
            OR: "OR";
          }>>;
        }, better_auth0.$strip>>>;
        select: zod0.ZodOptional<zod0.ZodArray<zod0.ZodString>>;
        join: zod0.ZodOptional<zod0.ZodRecord<zod0.ZodString, zod0.ZodBoolean>>;
      }, better_auth0.$strip>, zod0.ZodObject<{
        action: zod0.ZodLiteral<"findMany">;
        model: zod0.ZodString;
        where: zod0.ZodOptional<zod0.ZodArray<zod0.ZodObject<{
          field: zod0.ZodString;
          value: zod0.ZodUnknown;
          operator: zod0.ZodOptional<zod0.ZodEnum<{
            in: "in";
            gte: "gte";
            eq: "eq";
            ne: "ne";
            lt: "lt";
            lte: "lte";
            gt: "gt";
            contains: "contains";
            starts_with: "starts_with";
            ends_with: "ends_with";
          }>>;
          connector: zod0.ZodOptional<zod0.ZodEnum<{
            AND: "AND";
            OR: "OR";
          }>>;
        }, better_auth0.$strip>>>;
        limit: zod0.ZodOptional<zod0.ZodNumber>;
        offset: zod0.ZodOptional<zod0.ZodNumber>;
        sortBy: zod0.ZodOptional<zod0.ZodObject<{
          field: zod0.ZodString;
          direction: zod0.ZodEnum<{
            asc: "asc";
            desc: "desc";
          }>;
        }, better_auth0.$strip>>;
        join: zod0.ZodOptional<zod0.ZodRecord<zod0.ZodString, zod0.ZodBoolean>>;
      }, better_auth0.$strip>, zod0.ZodObject<{
        action: zod0.ZodLiteral<"create">;
        model: zod0.ZodString;
        data: zod0.ZodRecord<zod0.ZodString, zod0.ZodUnknown>;
      }, better_auth0.$strip>, zod0.ZodObject<{
        action: zod0.ZodLiteral<"update">;
        model: zod0.ZodString;
        where: zod0.ZodArray<zod0.ZodObject<{
          field: zod0.ZodString;
          value: zod0.ZodUnknown;
          operator: zod0.ZodOptional<zod0.ZodEnum<{
            in: "in";
            gte: "gte";
            eq: "eq";
            ne: "ne";
            lt: "lt";
            lte: "lte";
            gt: "gt";
            contains: "contains";
            starts_with: "starts_with";
            ends_with: "ends_with";
          }>>;
          connector: zod0.ZodOptional<zod0.ZodEnum<{
            AND: "AND";
            OR: "OR";
          }>>;
        }, better_auth0.$strip>>;
        update: zod0.ZodRecord<zod0.ZodString, zod0.ZodUnknown>;
      }, better_auth0.$strip>, zod0.ZodObject<{
        action: zod0.ZodLiteral<"count">;
        model: zod0.ZodString;
        where: zod0.ZodOptional<zod0.ZodArray<zod0.ZodObject<{
          field: zod0.ZodString;
          value: zod0.ZodUnknown;
          operator: zod0.ZodOptional<zod0.ZodEnum<{
            in: "in";
            gte: "gte";
            eq: "eq";
            ne: "ne";
            lt: "lt";
            lte: "lte";
            gt: "gt";
            contains: "contains";
            starts_with: "starts_with";
            ends_with: "ends_with";
          }>>;
          connector: zod0.ZodOptional<zod0.ZodEnum<{
            AND: "AND";
            OR: "OR";
          }>>;
        }, better_auth0.$strip>>>;
      }, better_auth0.$strip>], "action">;
    }, {
      result: unknown;
      count?: undefined;
    } | {
      count: number;
      result?: undefined;
    }>;
  };
  schema: {
    user?: {
      fields: {
        lastActiveAt: {
          type: "date";
        };
      };
    } | undefined;
  };
};
//#endregion
export { CHALLENGE_TTL, type CompromisedPasswordResult, type CredentialStuffingResult, DEFAULT_DIFFICULTY, EMAIL_TEMPLATES, type EmailConfig, type EmailTemplateId, type EmailTemplateVariables, type EventLocation, type IPLocation, type Identification, type ImpossibleTravelResult, type InfraOptions, type PoWChallenge, type PoWSolution, type SMSConfig, type SMSTemplateId, type SMSTemplateVariables, SMS_TEMPLATES, type SecurityEvent, type SecurityEventType, type SecurityOptions, type SecurityVerdict, type SendEmailOptions, type SendEmailResult, type SendSMSOptions, type SendSMSResult, type StaleUserResult, type ThresholdConfig, USER_EVENT_TYPES, type UserEvent, type UserEventType, type UserEventsResponse, createEmailSender, createSMSSender, decodePoWChallenge, encodePoWSolution, infra, sendEmail, sendSMS, solvePoWChallenge, verifyPoWSolution };