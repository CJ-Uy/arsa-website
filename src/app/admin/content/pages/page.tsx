import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentPage } from "@/db/schema";
import { PagesContentManagement } from "./content-management";

export default async function PagesContentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const pages = await db.query.contentPage.findMany({
		orderBy: [desc(contentPage.updatedAt)],
	});

	return <PagesContentManagement initialPages={JSON.parse(JSON.stringify(pages))} />;
}
