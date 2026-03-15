import { prisma } from "@/lib/prisma";
import { ContentManagement } from "./content-management";

export default async function ContentPage() {
	const pages = await prisma.contentPage.findMany({
		orderBy: { updatedAt: "desc" },
	});

	return <ContentManagement initialPages={JSON.parse(JSON.stringify(pages))} />;
}
