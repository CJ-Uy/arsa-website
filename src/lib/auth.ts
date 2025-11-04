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
