import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EventsManagement } from "./events-management";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			isShopAdmin: true,
			isEventsAdmin: true,
			eventAdmins: {
				select: { eventId: true },
			},
		},
	});

	// Access: shop admin, global events admin, or assigned to specific events
	const hasAccess =
		user?.isShopAdmin || user?.isEventsAdmin || (user?.eventAdmins?.length ?? 0) > 0;

	if (!hasAccess) {
		redirect("/shop");
	}

	const isShopAdmin = user?.isShopAdmin ?? false;
	const isGlobalEventsAdmin = user?.isEventsAdmin ?? false;
	const assignedEventIds = user?.eventAdmins?.map((ea) => ea.eventId) ?? [];

	// Fetch events with their products and admins
	const allEvents = await prisma.shopEvent.findMany({
		include: {
			products: {
				include: {
					product: true,
					package: true,
				},
				orderBy: { sortOrder: "asc" },
			},
			admins: {
				include: {
					user: {
						select: {
							id: true,
							email: true,
							name: true,
							image: true,
						},
					},
				},
			},
			_count: {
				select: { orders: true },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Filter events based on access level
	const events =
		isShopAdmin || isGlobalEventsAdmin
			? allEvents
			: allEvents.filter((e) => assignedEventIds.includes(e.id));

	// Fetch all available products for the form
	const products = await prisma.product.findMany({
		where: { isAvailable: true },
		orderBy: { name: "asc" },
	});

	// Fetch all available packages for the form
	const packages = await prisma.package.findMany({
		where: { isAvailable: true },
		orderBy: { name: "asc" },
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
