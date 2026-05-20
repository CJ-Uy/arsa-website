import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentPage } from "@/db/schema";
import { ContentManagement } from "./content-management";

export default async function ContentPage() {
	const pages = await db.query.contentPage.findMany({
		orderBy: [desc(contentPage.updatedAt)],
	});

	return <ContentManagement initialPages={JSON.parse(JSON.stringify(pages))} />;
}
