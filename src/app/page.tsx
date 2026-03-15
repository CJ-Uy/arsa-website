import { getAllHomepageContent } from "./admin/landing/actions";
import { HomePageClient } from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const { hero, events, faq, quickActions, socials } = await getAllHomepageContent();

	return <HomePageClient content={{ hero, events, faq, quickActions, socials }} />;
}
