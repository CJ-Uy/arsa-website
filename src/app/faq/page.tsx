import { getAllHomepageContent } from "@/app/admin/landing/actions";
import { FAQPageClient } from "./faq-client";

export const dynamic = "force-dynamic";

export default async function FAQPage() {
	const content = await getAllHomepageContent();

	return <FAQPageClient faqJson={JSON.stringify(content.faq)} />;
}
