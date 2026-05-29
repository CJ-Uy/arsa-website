import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserAccessibleEvents } from "@/lib/eventPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function EventsListPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const accessible = await getUserAccessibleEvents(session.user.id);
	if (!accessible.size) redirect("/shop");

	const ids = Array.from(accessible.keys());
	const events = await db.query.event.findMany({
		where: inArray(event.id, ids),
		orderBy: (e, { desc, asc }) => [desc(e.priority), asc(e.name)],
		columns: { id: true, name: true, slug: true, status: true, priority: true },
	});

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-[#0e3663]">Events</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{events.length} event{events.length !== 1 ? "s" : ""} accessible
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/events/new">
						<Plus className="mr-2 h-4 w-4" />
						New Event
					</Link>
				</Button>
			</header>

			{events.length === 0 ? (
				<div className="text-center py-16 text-muted-foreground">
					<p className="mb-4">No events yet.</p>
					<Button asChild variant="outline">
						<Link href="/admin/events/new">Create the first event</Link>
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{events.map((e) => (
						<Link key={e.id} href={`/admin/events/${e.slug}`}>
							<Card className="hover:shadow-md transition cursor-pointer h-full">
								<CardHeader className="pb-2">
									<div className="flex items-start justify-between gap-2">
										<CardTitle className="text-base leading-tight">{e.name}</CardTitle>
										<Badge
											variant={e.status === "active" ? "default" : "secondary"}
											className="shrink-0 text-xs"
										>
											{e.status}
										</Badge>
									</div>
									<p className="text-xs font-mono text-muted-foreground">/{e.slug}</p>
								</CardHeader>
								<CardContent>
									<p className="text-xs text-muted-foreground">
										{(accessible.get(e.id) ?? []).join(", ")}
									</p>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
