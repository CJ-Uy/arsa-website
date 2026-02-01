import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEmailSettings } from "@/lib/email";
import { EmailSettingsClient } from "./email-settings-client";

export default async function SettingsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	// Only shop admins can access settings
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		redirect("/admin");
	}

	// Get current email settings
	const emailSettings = await getEmailSettings();

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Shop Settings</h1>
				<p className="text-muted-foreground mt-2">Configure shop-wide settings</p>
			</div>

			<EmailSettingsClient initialSettings={emailSettings} userEmail={session.user.email} />
		</div>
	);
}
