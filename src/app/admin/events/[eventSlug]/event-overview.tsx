import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Ticket as TicketIcon, FileText, Layout } from "lucide-react";
import type { EventRole } from "@/lib/eventPermissions";

type EventWithModules = {
	id: string;
	slug: string;
	name: string;
	status: string;
	shop: { enabled: boolean } | null;
	tickets: { enabled: boolean } | null;
	landing: { published: boolean; codePath: string | null } | null;
};

function StatusChip({ live, label }: { live: boolean; label: string }) {
	if (live) return <Badge className="bg-[#f7bc37] text-[#0e3663]">LIVE</Badge>;
	return <Badge variant="secondary">{label}</Badge>;
}

export function EventOverview({
	event,
	pageCount,
	roles,
}: { event: EventWithModules; pageCount: number; roles: EventRole[] }) {
	const isOverseer = roles.includes("overseer");
	const canShop = isOverseer || roles.includes("shop_admin");
	const canTickets = isOverseer || roles.includes("tickets_admin");
	const canContent = isOverseer || roles.includes("content_admin");

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.08em] text-[#a2250f] font-bold">Event Workspace</p>
					<h1 className="text-3xl font-bold text-[#0e3663]">{event.name}</h1>
					<p className="text-sm text-muted-foreground font-mono">/{event.slug}</p>
				</div>
				<Badge variant={event.status === "active" ? "default" : "secondary"} className="uppercase">
					{event.status}
				</Badge>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{canShop && (
					<Link href={`/admin/events/${event.slug}/shop`}>
						<Card className="hover:shadow-md transition">
							<CardHeader className="flex flex-row items-center gap-2 pb-2">
								<ShoppingBag className="h-4 w-4 text-[#a2250f]" />
								<CardTitle className="text-sm uppercase tracking-wider">Shop</CardTitle>
							</CardHeader>
							<CardContent>
								<StatusChip live={!!event.shop?.enabled} label={event.shop ? "PAUSED" : "NOT CONFIGURED"} />
							</CardContent>
						</Card>
					</Link>
				)}
				{canTickets && (
					<Link href={`/admin/events/${event.slug}/tickets`}>
						<Card className="hover:shadow-md transition">
							<CardHeader className="flex flex-row items-center gap-2 pb-2">
								<TicketIcon className="h-4 w-4 text-[#a2250f]" />
								<CardTitle className="text-sm uppercase tracking-wider">Tickets</CardTitle>
							</CardHeader>
							<CardContent>
								<StatusChip live={!!event.tickets?.enabled} label={event.tickets ? "PAUSED" : "NOT CONFIGURED"} />
							</CardContent>
						</Card>
					</Link>
				)}
				{canContent && (
					<>
						<Link href={`/admin/events/${event.slug}/landing`}>
							<Card className="hover:shadow-md transition">
								<CardHeader className="flex flex-row items-center gap-2 pb-2">
									<Layout className="h-4 w-4 text-[#a2250f]" />
									<CardTitle className="text-sm uppercase tracking-wider">Landing</CardTitle>
								</CardHeader>
								<CardContent>
									<StatusChip live={!!event.landing?.published} label={event.landing ? "DRAFT" : "NOT CONFIGURED"} />
									{event.landing?.codePath && (
										<p className="text-xs mt-1 text-muted-foreground">Code override active</p>
									)}
								</CardContent>
							</Card>
						</Link>
						<Link href={`/admin/events/${event.slug}/pages`}>
							<Card className="hover:shadow-md transition">
								<CardHeader className="flex flex-row items-center gap-2 pb-2">
									<FileText className="h-4 w-4 text-[#a2250f]" />
									<CardTitle className="text-sm uppercase tracking-wider">Pages</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{pageCount}</p>
									<p className="text-xs text-muted-foreground">total</p>
								</CardContent>
							</Card>
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
