import { logger } from "better-auth";

//#region src/constants.ts
/**
* Infrastructure API URL
* Can be overridden via plugin config or BETTER_AUTH_API_URL env var for local development
*/
const INFRA_API_URL = process.env.BETTER_AUTH_API_URL || "https://infra.better-auth.com";
/**
* KV Storage URL
* Can be overridden via plugin config or BETTER_AUTH_KV_URL env var for local development
*/
const INFRA_KV_URL = process.env.BETTER_AUTH_KV_URL || "https://kv.better-auth.com";

//#endregion
//#region src/email.ts
/**
* Email sending module for @better-auth/infra
*
* This module provides email sending functionality that integrates with
* Better Auth Infra's template system.
*/
/**
* Email template definitions with their required variables
*/
const EMAIL_TEMPLATES = {
	"verify-email": { variables: {} },
	"reset-password": { variables: {} },
	"change-email": { variables: {} },
	"sign-in-otp": { variables: {} },
	"verify-email-otp": { variables: {} },
	"reset-password-otp": { variables: {} },
	"magic-link": { variables: {} },
	"two-factor": { variables: {} },
	invitation: { variables: {} },
	"application-invite": { variables: {} },
	"delete-account": { variables: {} },
	"stale-account-user": { variables: {} },
	"stale-account-admin": { variables: {} }
};
/**
* Create an email sender instance
*/
function createEmailSender(config) {
	const baseUrl = config?.apiUrl || process.env.BETTER_AUTH_API_URL || INFRA_API_URL;
	const apiUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
	const apiKey = config?.apiKey || process.env.BETTER_AUTH_API_KEY || "";
	if (!apiKey) logger.warn("[Dash] No API key provided for email sending. Set BETTER_AUTH_API_KEY environment variable or pass apiKey in config.");
	/**
	* Send an email using a template from Better Auth Infra
	*/
	async function send(options) {
		if (!apiKey) return {
			success: false,
			error: "API key not configured"
		};
		try {
			const response = await fetch(`${apiUrl}/v1/email/send`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					template: options.template,
					to: options.to,
					variables: options.variables || {},
					subject: options.subject
				})
			});
			if (!response.ok) return {
				success: false,
				error: (await response.json().catch(() => ({ message: "Unknown error" }))).message || `HTTP ${response.status}`
			};
			return {
				success: true,
				messageId: (await response.json()).messageId
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Failed to send email"
			};
		}
	}
	/**
	* Get available email templates
	*/
	async function getTemplates() {
		if (!apiKey) return [];
		try {
			const response = await fetch(`${apiUrl}/v1/email/templates`, { headers: { Authorization: `Bearer ${apiKey}` } });
			if (!response.ok) return [];
			return response.json();
		} catch {
			return [];
		}
	}
	return {
		send,
		getTemplates
	};
}
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
async function sendEmail(options, config) {
	return createEmailSender(config).send(options);
}

//#endregion
export { INFRA_KV_URL as a, INFRA_API_URL as i, createEmailSender as n, sendEmail as r, EMAIL_TEMPLATES as t };