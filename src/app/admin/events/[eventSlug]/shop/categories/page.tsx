import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventCategory } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { CategoriesClient } from "./categories-client";

export default async function EventShopCategoriesPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("shop_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	// eventCategory.eventId references shopEvent.id which equals event.id (IDs preserved in backfill)
	const categories = await db
		.select()
		.from(eventCategory)
		.where(eq(eventCategory.eventId, e.id))
		.orderBy(asc(eventCategory.displayOrder));

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-[#0e3663]">Categories</h1>
				<p className="text-sm text-muted-foreground">
					Organise products within this event into categories
				</p>
			</div>
			<CategoriesClient eventId={e.id} initialCategories={categories} />
		</div>
	);
}
