import { getAllHomepageContent, getSiteContent } from "./actions";
import { HomepageContentManagement } from "./homepage-content-management";

export default async function HomepageContentPage() {
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
		<HomepageContentManagement
			initialContentJson={JSON.stringify({ ...content, activeMajorEvent })}
		/>
	);
}
