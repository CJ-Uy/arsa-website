import { getAllHomepageContent } from "./admin/landing/actions";
import { HomePageClient } from "./home-client";

export default async function HomePage() {
	const { hero, events, faq, quickActions, socials } = await getAllHomepageContent();

	return (
		<HomePageClient
			content={JSON.parse(JSON.stringify({ hero, events, faq, quickActions, socials }))}
		/>
	);
}
