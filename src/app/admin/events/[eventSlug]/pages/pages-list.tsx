"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPage, deletePage } from "../actions";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, FileText } from "lucide-react";

type Page = {
	id: string;
	eventId: string;
	pageSlug: string;
	title: string;
	published: boolean;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
};

type PagesListProps = {
	eventId: string;
	eventSlug: string;
	pages: Page[];
};

export function PagesList({ eventId, eventSlug, pages: initialPages }: PagesListProps) {
	const router = useRouter();
	const [pages, setPages] = useState<Page[]>(initialPages);
	const [isPending, startTransition] = useTransition();

	// New page form state
	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

	const handleTitleChange = (value: string) => {
		setTitle(value);
		if (!slugManuallyEdited) {
			setSlug(
				value
					.toLowerCase()
					.replace(/[^a-z0-9\s-]/g, "")
					.replace(/\s+/g, "-")
					.replace(/-+/g, "-"),
			);
		}
	};

	const handleCreate = () => {
		const cleanTitle = title.trim();
		const cleanSlug = slug.trim().toLowerCase();

		if (!cleanTitle) {
			toast.error("Title is required");
			return;
		}
		if (!cleanSlug) {
			toast.error("Slug is required");
			return;
		}
		if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
			toast.error("Slug must be lowercase letters, numbers, and hyphens only");
			return;
		}
		if (pages.some((p) => p.pageSlug === cleanSlug)) {
			toast.error("A page with this slug already exists");
			return;
		}

		startTransition(async () => {
			try {
				const result = await createPage(eventId, cleanSlug, cleanTitle);
				toast.success("Page created");
				setTitle("");
				setSlug("");
				setSlugManuallyEdited(false);
				router.push(`/admin/events/${eventSlug}/pages/${result.pageSlug}`);
			} catch {
				toast.error("Failed to create page");
			}
		});
	};

	const handleDelete = (page: Page) => {
		if (!window.confirm(`Delete page "${page.title}"? This cannot be undone.`)) return;

		startTransition(async () => {
			try {
				await deletePage(page.id);
				setPages((prev) => prev.filter((p) => p.id !== page.id));
				toast.success("Page deleted");
			} catch {
				toast.error("Failed to delete page");
			}
		});
	};

	return (
		<div className="max-w-4xl space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-[#0e3663]">Pages</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Manage content pages for this event
					</p>
				</div>
			</header>

			{/* Pages list */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Published &amp; Draft Pages
					</CardTitle>
				</CardHeader>
				<CardContent>
					{pages.length === 0 ? (
						<p className="text-muted-foreground py-8 text-center text-sm">
							No pages yet. Create one below.
						</p>
					) : (
						<ul className="divide-y">
							{pages.map((page) => (
								<li key={page.id} className="flex items-center justify-between gap-4 py-3">
									<div className="min-w-0 flex-1 space-y-0.5">
										<div className="flex items-center gap-2">
											<span className="font-medium">{page.title}</span>
											<Badge variant={page.published ? "default" : "secondary"}>
												{page.published ? "Published" : "Draft"}
											</Badge>
										</div>
										<p className="text-muted-foreground font-mono text-xs">
											{page.pageSlug}
										</p>
									</div>
									<div className="flex shrink-0 gap-2">
										<Button variant="outline" size="icon" asChild title="Edit page">
											<Link
												href={`/admin/events/${eventSlug}/pages/${page.pageSlug}`}
											>
												<Pencil className="h-4 w-4" />
											</Link>
										</Button>
										<Button
											variant="outline"
											size="icon"
											title="Delete page"
											disabled={isPending}
											onClick={() => handleDelete(page)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			{/* New page form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plus className="h-5 w-5" />
						New Page
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="new-title">Title</Label>
							<Input
								id="new-title"
								value={title}
								placeholder="Page title"
								onChange={(e) => handleTitleChange(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-slug">Slug</Label>
							<Input
								id="new-slug"
								value={slug}
								placeholder="url-slug"
								onChange={(e) => {
									setSlug(e.target.value.toLowerCase());
									setSlugManuallyEdited(true);
								}}
							/>
							<p className="text-muted-foreground text-xs">
								Lowercase letters, numbers, and hyphens only
							</p>
						</div>
					</div>
					<Button onClick={handleCreate} disabled={isPending || !title.trim() || !slug.trim()}>
						{isPending ? "Creating…" : "Create page"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
