import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@/db/schema";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
	// Wrangler secrets aren't available at build time; fallback prevents
	// Better Auth from throwing "using default secret" during `next build`.
	// The real BETTER_AUTH_SECRET wrangler secret overrides this at runtime.
	secret: process.env.BETTER_AUTH_SECRET || "cf-build-placeholder-not-used-at-runtime",
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [process.env.BETTER_AUTH_URL!, process.env.NEXT_PUBLIC_APP_URL!].filter(Boolean),
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	emailAndPassword: {
		enabled: false,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	advanced: {
		useSecureCookies: isProduction,
		cookiePrefix: "arsa",
	},
	user: {
		additionalFields: {
			isShopAdmin: { type: "boolean", defaultValue: false },
			isEventsAdmin: { type: "boolean", defaultValue: false },
			isRedirectsAdmin: { type: "boolean", defaultValue: false },
			isTicketsAdmin: { type: "boolean", defaultValue: false },
			isSSO26Admin: { type: "boolean", defaultValue: false },
			isBackupAdmin: { type: "boolean", defaultValue: false },
			isSuperAdmin: { type: "boolean", defaultValue: false },
		},
		async onCreate(u: { name?: string; email: string }) {
			if (u.name) {
				const nameParts = u.name.trim().split(" ");
				const firstName = nameParts[0] || "";
				const lastName = nameParts.slice(1).join(" ") || "";

				await db
					.update(schema.user)
					.set({ firstName, lastName })
					.where(eq(schema.user.email, u.email));
			}
		},
	},
});

export type Session = typeof auth.$Infer.Session;
