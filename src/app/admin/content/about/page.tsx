import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteContent } from "@/app/admin/landing/actions";
import { AboutManagement } from "./about-management";

export default async function AboutContentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const content = await getSiteContent("page-about");

	return <AboutManagement initialContent={content} />;
}
