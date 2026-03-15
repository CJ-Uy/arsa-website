import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PagesContentManagement } from "./content-management";

export default async function PagesContentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const pages = await prisma.contentPage.findMany({
		orderBy: { updatedAt: "desc" },
	});

	return <PagesContentManagement initialPages={JSON.parse(JSON.stringify(pages))} />;
}
