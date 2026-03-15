import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteContent } from "@/app/admin/landing/actions";
import { BridgesManagement } from "./bridges-management";

export default async function BridgesContentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const content = await getSiteContent("page-bridges");

	return <BridgesManagement initialContent={content} />;
}
