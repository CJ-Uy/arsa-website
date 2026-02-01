import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [
		process.env.BETTER_AUTH_URL!,
		process.env.NEXT_PUBLIC_APP_URL!,
	].filter(Boolean),
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	emailAndPassword: {
		enabled: false, // Only allow OAuth login
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes - reduces DB lookups
		},
	},
	advanced: {
		// Use secure cookies in production (requires HTTPS)
		useSecureCookies: isProduction,
		// Cookie prefix for namespacing
		cookiePrefix: "arsa",
		// Cross-subdomain cookies (set to your domain if using subdomains)
		// crossSubDomainCookies: { enabled: true, domain: ".yourdomain.com" },
	},
	user: {
		additionalFields: {
			isShopAdmin: {
				type: "boolean",
				defaultValue: false,
			},
			isRedirectsAdmin: {
				type: "boolean",
				defaultValue: false,
			},
		},
		async onCreate(user: { name?: string; email: string }) {
			// Auto-populate firstName and lastName from Google name
			if (user.name) {
				const nameParts = user.name.trim().split(" ");
				const firstName = nameParts[0] || "";
				const lastName = nameParts.slice(1).join(" ") || "";

				await prisma.user.update({
					where: { email: user.email },
					data: {
						firstName,
						lastName,
					},
				});
			}
		},
	},
});

export type Session = typeof auth.$Infer.Session;
