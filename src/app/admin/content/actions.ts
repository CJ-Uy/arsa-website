"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllContentPages() {
	try {
		const pages = await prisma.contentPage.findMany({
			orderBy: { updatedAt: "desc" },
		});
		return { success: true, pages };
	} catch (error) {
		console.error("Error fetching content pages:", error);
		return { success: false, message: "Failed to fetch content pages" };
	}
}

export async function getContentPage(id: string) {
	try {
		const page = await prisma.contentPage.findUnique({ where: { id } });
		if (!page) return { success: false, message: "Page not found" };
		return { success: true, page };
	} catch (error) {
		console.error("Error fetching content page:", error);
		return { success: false, message: "Failed to fetch content page" };
	}
}

export async function getContentPageBySlug(slug: string) {
	try {
		const page = await prisma.contentPage.findUnique({
			where: { slug, isPublished: true },
		});
		if (!page) return { success: false, message: "Page not found" };
		return { success: true, page };
	} catch (error) {
		console.error("Error fetching content page:", error);
		return { success: false, message: "Failed to fetch content page" };
	}
}

export async function createContentPage(data: {
	slug: string;
	title: string;
	description?: string;
	content: unknown;
	isPublished: boolean;
	updatedBy?: string;
}) {
	try {
		const slug = data.slug
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");

		if (!slug || !data.title) {
			return { success: false, message: "Slug and title are required" };
		}

		const existing = await prisma.contentPage.findUnique({ where: { slug } });
		if (existing) {
			return { success: false, message: `A page with slug "${slug}" already exists` };
		}

		const page = await prisma.contentPage.create({
			data: {
				slug,
				title: data.title,
				description: data.description || null,
				content: data.content as object,
				isPublished: data.isPublished,
				publishedAt: data.isPublished ? new Date() : null,
				updatedBy: data.updatedBy || null,
			},
		});

		revalidatePath("/admin/content");
		revalidatePath(`/page/${slug}`);

		return { success: true, message: "Page created successfully", page };
	} catch (error) {
		console.error("Error creating content page:", error);
		return { success: false, message: "Failed to create content page" };
	}
}

export async function updateContentPage(
	id: string,
	data: {
		slug?: string;
		title?: string;
		description?: string;
		content?: unknown;
		isPublished?: boolean;
		updatedBy?: string;
	},
) {
	try {
		const existing = await prisma.contentPage.findUnique({ where: { id } });
		if (!existing) return { success: false, message: "Page not found" };

		let slug = data.slug;
		if (slug) {
			slug = slug
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-")
				.replace(/-+/g, "-")
				.replace(/^-|-$/g, "");

			const conflict = await prisma.contentPage.findFirst({
				where: { slug, NOT: { id } },
			});
			if (conflict) {
				return { success: false, message: `A page with slug "${slug}" already exists` };
			}
		}

		const wasPublished = existing.isPublished;
		const willPublish = data.isPublished ?? existing.isPublished;

		const page = await prisma.contentPage.update({
			where: { id },
			data: {
				...(slug && { slug }),
				...(data.title && { title: data.title }),
				...(data.description !== undefined && { description: data.description || null }),
				...(data.content !== undefined && { content: data.content as object }),
				...(data.isPublished !== undefined && { isPublished: data.isPublished }),
				...(!wasPublished && willPublish && { publishedAt: new Date() }),
				updatedBy: data.updatedBy || existing.updatedBy,
			},
		});

		revalidatePath("/admin/content");
		revalidatePath(`/page/${existing.slug}`);
		if (slug && slug !== existing.slug) {
			revalidatePath(`/page/${slug}`);
		}

		return { success: true, message: "Page updated successfully", page };
	} catch (error) {
		console.error("Error updating content page:", error);
		return { success: false, message: "Failed to update content page" };
	}
}

export async function deleteContentPage(id: string) {
	try {
		const page = await prisma.contentPage.delete({ where: { id } });

		revalidatePath("/admin/content");
		revalidatePath(`/page/${page.slug}`);

		return { success: true, message: "Page deleted successfully" };
	} catch (error) {
		console.error("Error deleting content page:", error);
		return { success: false, message: "Failed to delete content page" };
	}
}

export async function toggleContentPagePublished(id: string, isPublished: boolean) {
	try {
		const page = await prisma.contentPage.update({
			where: { id },
			data: {
				isPublished,
				...(isPublished && { publishedAt: new Date() }),
			},
		});

		revalidatePath("/admin/content");
		revalidatePath(`/page/${page.slug}`);

		return { success: true, message: `Page ${isPublished ? "published" : "unpublished"}`, page };
	} catch (error) {
		console.error("Error toggling content page:", error);
		return { success: false, message: "Failed to update page status" };
	}
}
