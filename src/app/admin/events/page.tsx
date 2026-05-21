import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { asc, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	user,
	eventAdmin,
	shopEvent,
	eventProduct,
	eventCategory,
	product,
	packageTable,
} from "@/db/schema";
import { EventsManagement } from "./events-management";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true, isEventsAdmin: true },
	});
	const eventAdmins = await db.query.eventAdmin.findMany({
		where: eq(eventAdmin.userId, session.user.id),
		columns: { eventId: true },
	});

	const hasAccess = u?.isShopAdmin || u?.isEventsAdmin || eventAdmins.length > 0;
	if (!hasAccess) redirect("/shop");

	const isShopAdmin = u?.isShopAdmin ?? false;
	const isGlobalEventsAdmin = u?.isEventsAdmin ?? false;
	const assignedEventIds = eventAdmins.map((ea) => ea.eventId);

	const allEvents = await db.query.shopEvent.findMany({
		with: {
			products: {
				with: { product: true, package: true, category: true },
				orderBy: [asc(eventProduct.sortOrder)],
			},
			categories: { orderBy: [asc(eventCategory.displayOrder)] },
			admins: {
				with: {
					user: {
						columns: { id: true, email: true, name: true, image: true },
					},
				},
			},
			orders: { columns: { id: true } },
		},
		orderBy: [desc(shopEvent.createdAt)],
	});

	const eventsDecorated = allEvents.map((e) => ({
		...e,
		_count: { orders: e.orders.length },
	}));

	const events =
		isShopAdmin || isGlobalEventsAdmin
			? eventsDecorated
			: eventsDecorated.filter((e) => assignedEventIds.includes(e.id));

	const products = await db.query.product.findMany({
		where: eq(product.isAvailable, true),
		orderBy: [asc(product.name)],
	});

	const packages = await db.query.packageTable.findMany({
		where: eq(packageTable.isAvailable, true),
		orderBy: [asc(packageTable.name)],
	});

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Events Management</h2>
				<p className="text-muted-foreground mt-1">
					{isShopAdmin
						? "Create and manage special shop events with custom themes and checkout options"
						: "Manage your assigned events"}
				</p>
			</div>

			<EventsManagement
				initialEvents={events}
				availableProducts={products}
				availablePackages={packages}
				isShopAdmin={isShopAdmin}
			/>
		</div>
	);
}
