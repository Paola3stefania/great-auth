//#region src/email.d.ts
/**
 * Email sending module for @better-auth/infra
 *
 * This module provides email sending functionality that integrates with
 * Better Auth Infra's template system.
 */
/**
 * Email template definitions with their required variables
 */
declare const EMAIL_TEMPLATES: {
  readonly "verify-email": {
    readonly variables: {
      verificationCode?: string;
      verificationUrl: string;
      userEmail: string;
      userName?: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "reset-password": {
    readonly variables: {
      resetLink: string;
      userEmail: string;
      userName?: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "change-email": {
    readonly variables: {
      confirmationLink: string;
      newEmail: string;
      currentEmail: string;
      userName?: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "sign-in-otp": {
    readonly variables: {
      otpCode: string;
      userEmail: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "verify-email-otp": {
    readonly variables: {
      otpCode: string;
      userEmail: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "reset-password-otp": {
    readonly variables: {
      otpCode: string;
      userEmail: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "magic-link": {
    readonly variables: {
      magicLink: string;
      userEmail: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "two-factor": {
    readonly variables: {
      otpCode: string;
      userEmail: string;
      userName?: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly invitation: {
    readonly variables: {
      inviteLink: string;
      inviterName: string;
      inviterEmail: string;
      organizationName: string;
      role: string;
      appName?: string;
      expirationDays?: string;
    };
  };
  readonly "application-invite": {
    readonly variables: {
      inviteLink: string;
      inviterName: string;
      inviterEmail: string;
      inviteeEmail: string;
      appName?: string;
      expirationDays?: string;
    };
  };
  readonly "delete-account": {
    readonly variables: {
      deletionLink: string;
      userEmail: string;
      userName?: string;
      appName?: string;
      expirationMinutes?: string;
    };
  };
  readonly "stale-account-user": {
    readonly variables: {
      userEmail: string;
      userName?: string;
      appName?: string;
      daysSinceLastActive: string;
      loginTime: string;
      loginLocation?: string;
      loginDevice?: string;
      loginIp?: string;
    };
  };
  readonly "stale-account-admin": {
    readonly variables: {
      userEmail: string;
      userName?: string;
      userId: string;
      appName?: string;
      daysSinceLastActive: string;
      loginTime: string;
      loginLocation?: string;
      loginDevice?: string;
      loginIp?: string;
      adminEmail: string;
    };
  };
};
type EmailTemplateId = keyof typeof EMAIL_TEMPLATES;
type EmailTemplateVariables<T extends EmailTemplateId> = (typeof EMAIL_TEMPLATES)[T]["variables"];
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
interface EmailConfig {
  apiKey?: string;
  apiUrl?: string;
}
/**
 * Type-safe send email options
 */
type SendEmailOptions<T extends EmailTemplateId = EmailTemplateId> = {
  /**
   * The template ID to use
   */
  template: T;
  /**
   * Email recipient
   */
  to: string;
  /**
   * Template variables (type-safe based on template)
   */
  variables: EmailTemplateVariables<T>;
  /**
   * Optional subject override (uses template default if not provided)
   */
  subject?: string;
};
/**
 * Create an email sender instance
 */
declare function createEmailSender(config?: EmailConfig): {
  send: <T extends EmailTemplateId>(options: SendEmailOptions<T>) => Promise<SendEmailResult>;
  getTemplates: () => Promise<{
    id: string;
    name: string;
    description?: string;
  }[]>;
};
/**
 * Send an email using the Better Auth dashboard's email templates.
 *
 * @example
 * ```ts
 * import { sendEmail } from "@better-auth/infra";
 *
 * // Type-safe - variables are inferred from template
 * await sendEmail({
 *   template: "reset-password",
 *   to: "user@example.com",
 *   variables: {
 *     resetLink: "https://...",
 *     userEmail: "user@example.com",
 *   },
 * });
 * ```
 */
declare function sendEmail<T extends EmailTemplateId>(options: SendEmailOptions<T>, config?: EmailConfig): Promise<SendEmailResult>;
//#endregion
export { EMAIL_TEMPLATES, EmailConfig, EmailTemplateId, EmailTemplateVariables, SendEmailOptions, SendEmailResult, createEmailSender, sendEmail };