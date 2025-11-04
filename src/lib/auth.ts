import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
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
	async onRequest(request: Request) {
		// Hook to validate email domain during OAuth sign-in
		const url = new URL(request.url);

		// Check if this is a callback from Google OAuth
		if (url.pathname.includes("/api/auth/callback/google")) {
			// The email will be available in the user object during the callback
			// We'll validate it in the user creation hook instead
		}
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
		async onCreate(user: { email: string }) {
			// Validate that the email is from @student.ateneo.edu domain
			if (!user.email.endsWith("@student.ateneo.edu")) {
				throw new Error("Only @student.ateneo.edu email addresses are allowed");
			}
		},
	},
});

export type Session = typeof auth.$Infer.Session;
