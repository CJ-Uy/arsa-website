import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteContent } from "@/app/admin/landing/actions";
import { ContactManagement } from "./contact-management";

export default async function ContactContentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const content = await getSiteContent("page-contact");

	return <ContactManagement initialContent={content} />;
}
