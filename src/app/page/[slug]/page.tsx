import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentPage } from "@/db/schema";
import { ContentRenderer } from "./content-renderer";

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const page = await db.query.contentPage.findFirst({
		where: and(eq(contentPage.slug, slug), eq(contentPage.isPublished, true)),
		columns: { title: true, description: true },
	});

	if (!page) return { title: "Page Not Found" };

	return {
		title: page.title,
		description: page.description || undefined,
	};
}

export default async function ContentPageRoute({ params }: Props) {
	const { slug } = await params;
	const page = await db.query.contentPage.findFirst({
		where: and(eq(contentPage.slug, slug), eq(contentPage.isPublished, true)),
	});

	if (!page) notFound();

	return (
		<div className="bg-background min-h-screen">
			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h1 className="text-foreground mb-8 text-4xl font-bold">{page.title}</h1>
					{page.description && (
						<p className="text-muted-foreground mb-8 text-lg">{page.description}</p>
					)}
					<ContentRenderer content={page.content} />
				</div>
			</section>
		</div>
	);
}
