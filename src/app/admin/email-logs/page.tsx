import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailLogsClient } from "./email-logs-client";
import { BulkSendClient } from "./bulk-send-client";
import { getEmailLogStats } from "@/lib/email-logs";
import { Mail, Send } from "lucide-react";

export default async function EmailLogsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	// Only shop admins can access email logs
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		redirect("/admin");
	}

	// Get initial stats
	const stats = await getEmailLogStats();

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Email Management</h1>
				<p className="text-muted-foreground mt-2">
					View email logs, send bulk confirmation emails, and manage email history
				</p>
			</div>

			<Tabs defaultValue="logs" className="space-y-6">
				<TabsList>
					<TabsTrigger value="logs" className="flex items-center gap-2">
						<Mail className="h-4 w-4" />
						Email Logs
					</TabsTrigger>
					<TabsTrigger value="bulk-send" className="flex items-center gap-2">
						<Send className="h-4 w-4" />
						Bulk Send
					</TabsTrigger>
				</TabsList>

				<TabsContent value="logs" className="space-y-6">
					<EmailLogsClient initialStats={stats} />
				</TabsContent>

				<TabsContent value="bulk-send" className="space-y-6">
					<BulkSendClient />
				</TabsContent>
			</Tabs>
		</div>
	);
}
