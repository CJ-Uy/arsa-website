import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllHomepageContent, getSiteContent } from "@/app/admin/landing/actions";
import { HomeContentManagement } from "./home-management";

export const dynamic = "force-dynamic";

export default async function AdminHomeContentPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	const content = await getAllHomepageContent();

	// Fetch active major event slug
	let activeMajorEvent = "";
	try {
		const setting = await getSiteContent("homepage-active-major-event");
		if (setting && typeof setting === "object" && "slug" in (setting as Record<string, unknown>)) {
			activeMajorEvent = (setting as { slug: string }).slug || "";
		}
	} catch {
		// No active major event
	}

	return (
		<HomeContentManagement
			initialContent={{
				hero: content.hero,
				events: content.events,
				quickActions: content.quickActions,
				socials: content.socials,
				activeMajorEvent,
			}}
		/>
	);
}
