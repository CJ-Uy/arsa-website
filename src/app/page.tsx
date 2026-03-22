import { getAllHomepageContent, getSiteContent } from "./admin/landing/actions";
import { HomePageClient } from "./home-client";
import { MajorEventSection } from "./major-event-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const { hero, events, quickActions, socials } = await getAllHomepageContent();

	// Fetch active major event slug from admin settings
	let activeMajorEvent: string | null = null;
	try {
		const setting = await getSiteContent("homepage-active-major-event");
		if (setting && typeof setting === "object" && "slug" in (setting as Record<string, unknown>)) {
			activeMajorEvent = (setting as { slug: string }).slug || null;
		}
	} catch {
		// No active major event
	}

	return (
		<>
			{activeMajorEvent && (
				<>
					<MajorEventSection slug={activeMajorEvent} />
					<div id="major-event-end" />
				</>
			)}
			<HomePageClient content={{ hero, events, quickActions, socials }} />
		</>
	);
}
