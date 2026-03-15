"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	createContentPage,
	updateContentPage,
	deleteContentPage,
	toggleContentPagePublished,
} from "@/app/admin/pages/actions";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, ExternalLink } from "lucide-react";
import { RichTextEditor } from "@/app/admin/pages/rich-text-editor";

type ContentPageData = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	content: unknown;
	isPublished: boolean;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
	updatedBy: string | null;
};

type PagesContentManagementProps = {
	initialPages: ContentPageData[];
};

type EditorMode = "list" | "create" | "edit";

export function PagesContentManagement({ initialPages }: PagesContentManagementProps) {
	const [pages, setPages] = useState<ContentPageData[]>(initialPages);
	const [mode, setMode] = useState<EditorMode>("list");
	const [editingPage, setEditingPage] = useState<ContentPageData | null>(null);
	const [deletePageId, setDeletePageId] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [saving, setSaving] = useState(false);

	// Form state
	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [description, setDescription] = useState("");
	const [content, setContent] = useState<unknown>({ type: "doc", content: [] });
	const [isPublished, setIsPublished] = useState(false);
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

	const resetForm = () => {
		setTitle("");
		setSlug("");
		setDescription("");
		setContent({ type: "doc", content: [] });
		setIsPublished(false);
		setSlugManuallyEdited(false);
	};

	const startCreate = () => {
		resetForm();
		setEditingPage(null);
		setMode("create");
	};

	const startEdit = (page: ContentPageData) => {
		setTitle(page.title);
		setSlug(page.slug);
		setDescription(page.description || "");
		setContent(page.content);
		setIsPublished(page.isPublished);
		setSlugManuallyEdited(true);
		setEditingPage(page);
		setMode("edit");
	};

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

	const handleContentChange = useCallback((json: unknown) => {
		setContent(json);
	}, []);

	const handleSave = async () => {
		if (!title.trim() || !slug.trim()) {
			toast.error("Title and slug are required");
			return;
		}

		setSaving(true);
		try {
			if (mode === "create") {
				const result = await createContentPage({
					title: title.trim(),
					slug: slug.trim(),
					description: description.trim() || undefined,
					content,
					isPublished,
				});
				if (result.success && result.page) {
					setPages([JSON.parse(JSON.stringify(result.page)), ...pages]);
					toast.success(result.message);
					setMode("list");
					resetForm();
				} else {
					toast.error(result.message || "Failed to create page");
				}
			} else if (mode === "edit" && editingPage) {
				const result = await updateContentPage(editingPage.id, {
					title: title.trim(),
					slug: slug.trim(),
					description: description.trim() || undefined,
					content,
					isPublished,
				});
				if (result.success && result.page) {
					const updated = JSON.parse(JSON.stringify(result.page));
					setPages(pages.map((p) => (p.id === editingPage.id ? updated : p)));
					toast.success(result.message);
					setMode("list");
					resetForm();
				} else {
					toast.error(result.message || "Failed to update page");
				}
			}
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deletePageId) return;
		const result = await deleteContentPage(deletePageId);
		if (result.success) {
			setPages(pages.filter((p) => p.id !== deletePageId));
			toast.success(result.message);
			setShowDeleteDialog(false);
			setDeletePageId(null);
		} else {
			toast.error(result.message || "Failed to delete page");
		}
	};

	const handleTogglePublished = async (id: string, published: boolean) => {
		const result = await toggleContentPagePublished(id, published);
		if (result.success && result.page) {
			const updated = JSON.parse(JSON.stringify(result.page));
			setPages(pages.map((p) => (p.id === id ? updated : p)));
			toast.success(result.message);
		} else {
			toast.error(result.message || "Failed to toggle status");
		}
	};

	if (mode === "create" || mode === "edit") {
		return (
			<div>
				<div className="mb-6 flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => setMode("list")}>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex-1">
						<h2 className="text-2xl font-bold">
							{mode === "create" ? "Create New Page" : "Edit Page"}
						</h2>
					</div>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : "Save Page"}
					</Button>
				</div>

				<div className="space-y-6">
					{/* Meta fields */}
					<Card>
						<CardContent className="space-y-4 pt-6">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="title">Title</Label>
									<Input
										id="title"
										value={title}
										onChange={(e) => handleTitleChange(e.target.value)}
										placeholder="Page title"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="slug">URL Slug</Label>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-sm">/page/</span>
										<Input
											id="slug"
											value={slug}
											onChange={(e) => {
												setSlug(e.target.value);
												setSlugManuallyEdited(true);
											}}
											placeholder="url-slug"
										/>
									</div>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description (optional)</Label>
								<Input
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Brief description for SEO and page previews"
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} />
								<Label htmlFor="isPublished">Published</Label>
							</div>
						</CardContent>
					</Card>

					{/* Rich Text Editor */}
					<Card>
						<CardContent className="pt-6">
							<Label className="mb-3 block">Content</Label>
							<RichTextEditor content={content} onChange={handleContentChange} />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Content Management</h2>
					<p className="text-muted-foreground text-sm">
						Create and manage content pages for the website
					</p>
				</div>
				<Button onClick={startCreate}>
					<Plus className="mr-2 h-4 w-4" />
					New Page
				</Button>
			</div>

			{/* Info Card */}
			<Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
				<CardContent className="pt-6">
					<div className="space-y-2 text-sm">
						<p>
							<strong>Tip:</strong> Pages are accessible at{" "}
							<code className="rounded bg-blue-100 px-1 dark:bg-blue-900">/page/your-slug</code>
						</p>
						<p>
							<strong>Note:</strong> Only published pages are visible to the public. Draft pages can
							only be previewed by admins.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Pages List */}
			<div className="space-y-4">
				{pages.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center">
							<p className="text-muted-foreground">No content pages created yet</p>
						</CardContent>
					</Card>
				) : (
					pages.map((page) => (
						<Card key={page.id}>
							<CardContent className="p-6">
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
									<div className="flex-1 space-y-2">
										<div className="flex items-center gap-3">
											<Badge variant={page.isPublished ? "default" : "secondary"}>
												{page.isPublished ? "Published" : "Draft"}
											</Badge>
											<span className="text-muted-foreground text-xs">
												Updated: {new Date(page.updatedAt).toLocaleDateString()}
											</span>
										</div>
										<p className="text-lg font-medium">{page.title}</p>
										<p className="text-muted-foreground text-sm">
											/page/{page.slug}
											{page.description && ` — ${page.description}`}
										</p>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="icon" asChild title="View page">
											<a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="h-4 w-4" />
											</a>
										</Button>
										<Button
											variant="outline"
											size="icon"
											onClick={() => handleTogglePublished(page.id, !page.isPublished)}
											title={page.isPublished ? "Unpublish" : "Publish"}
										>
											{page.isPublished ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
										<Button variant="outline" size="icon" onClick={() => startEdit(page)}>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											onClick={() => {
												setDeletePageId(page.id);
												setShowDeleteDialog(true);
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Delete Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete this content page.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
