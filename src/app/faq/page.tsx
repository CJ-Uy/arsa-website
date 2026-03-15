import { getAllHomepageContent } from "@/app/admin/landing/actions";
import { FAQPageClient } from "./faq-client";

export default async function FAQPage() {
	const content = await getAllHomepageContent();

	return <FAQPageClient faq={content.faq} />;
}
