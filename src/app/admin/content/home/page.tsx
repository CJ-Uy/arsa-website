import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllHomepageContent } from "@/app/admin/landing/actions";
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

	return (
		<HomeContentManagement
			initialContent={JSON.parse(
				JSON.stringify({
					hero: content.hero,
					events: content.events,
					quickActions: content.quickActions,
					socials: content.socials,
				}),
			)}
		/>
	);
}
