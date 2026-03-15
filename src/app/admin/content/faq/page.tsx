import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAllHomepageContent } from "@/app/admin/landing/actions";
import { FAQContentManagement } from "./faq-management";

export const dynamic = "force-dynamic";

export default async function AdminFAQContentPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	const content = await getAllHomepageContent();

	return <FAQContentManagement initialFaqJson={JSON.stringify(content.faq)} />;
}
