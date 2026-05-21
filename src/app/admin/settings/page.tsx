import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { getEmailSettings } from "@/lib/email";
import { EmailSettingsClient } from "./email-settings-client";

export default async function SettingsPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true },
	});
	if (!u?.isShopAdmin) redirect("/admin");

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
