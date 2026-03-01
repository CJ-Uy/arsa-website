"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Server Actions
import {
	createRedirect,
	deleteRedirect,
	updateRedirect,
	createTag,
	updateTag,
	deleteTag,
	exportRedirects,
	importRedirects,
	type RedirectTagData,
	type ImportMode,
} from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import {
	RefreshCw,
	Search,
	ArrowUp,
	ArrowDown,
	Download,
	Upload,
	Loader2,
	Tags,
	Plus,
	Pencil,
	Trash2,
	X,
} from "lucide-react";
import { AnalyticsModal } from "./analyticsModal";

// Types
type TagInfo = {
	id: string;
	name: string;
	color: string;
};

type Redirect = {
	id: string;
	newURL: string;
	redirectCode: string;
	clicks: number;
	tags: TagInfo[];
	createdAt: Date;
};

type SortField = "redirectCode" | "clicks" | "createdAt";
type SortDirection = "asc" | "desc";

// Preset colors for tag color picker
const TAG_COLORS = [
	"#6b7280", // gray
	"#ef4444", // red
	"#f97316", // orange
	"#eab308", // yellow
	"#22c55e", // green
	"#06b6d4", // cyan
	"#3b82f6", // blue
	"#8b5cf6", // violet
	"#ec4899", // pink
];

export function DashboardClient({
	initialRedirects,
	initialTags,
}: {
	initialRedirects: Redirect[];
	initialTags: RedirectTagData[];
}) {
	const router = useRouter();
	const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects);
	const [allTags, setAllTags] = useState<RedirectTagData[]>(initialTags);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Search and sort state
	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<SortField>("redirectCode");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Tag filter state
	const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);

	// Analytics modal state
	const [selectedRedirect, setSelectedRedirect] = useState<Redirect | null>(null);
	const [analyticsOpen, setAnalyticsOpen] = useState(false);

	// Tag management state
	const [tagDialogOpen, setTagDialogOpen] = useState(false);
	const [editingTag, setEditingTag] = useState<RedirectTagData | null>(null);
	const [newTagName, setNewTagName] = useState("");
	const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

	// Export/Import state
	const [exporting, setExporting] = useState(false);
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [importFileContent, setImportFileContent] = useState<string | null>(null);
	const [importFileInfo, setImportFileInfo] = useState<{
		count: number;
		tagCount: number;
		exportedAt: string;
	} | null>(null);
	const [importMode, setImportMode] = useState<ImportMode>("skip");
	const [importing, setImporting] = useState(false);

	// Filtered and sorted redirects
	const filteredRedirects = useMemo(() => {
		let result = [...redirects];

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(r) =>
					r.redirectCode.toLowerCase().includes(query) ||
					r.newURL.toLowerCase().includes(query) ||
					r.tags.some((t) => t.name.toLowerCase().includes(query)),
			);
		}

		// Filter by active tags
		if (activeTagFilters.length > 0) {
			result = result.filter((r) =>
				activeTagFilters.every((tagId) => r.tags.some((t) => t.id === tagId)),
			);
		}

		// Sort
		result.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case "redirectCode":
					comparison = a.redirectCode.localeCompare(b.redirectCode);
					break;
				case "clicks":
					comparison = a.clicks - b.clicks;
					break;
				case "createdAt":
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});

		return result;
	}, [redirects, searchQuery, sortField, sortDirection, activeTagFilters]);

	const toggleSortDirection = () => {
		setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	const handleRowClick = (redirect: Redirect) => {
		setSelectedRedirect(redirect);
		setAnalyticsOpen(true);
	};

	// --- CRUD Handlers ---

	const handleCreate = async (formData: FormData) => {
		const newURL = formData.get("newURL") as string;
		const redirectCode = formData.get("redirectCode") as string;
		const tagIds = formData.get("tagIds") as string;
		const selectedTagIds = tagIds ? tagIds.split(",").filter(Boolean) : [];

		const optimisticTags = selectedTagIds
			.map((id) => allTags.find((t) => t.id === id))
			.filter(Boolean) as TagInfo[];

		const tempId = `temp-${Date.now()}`;
		const optimisticRedirect: Redirect = {
			id: tempId,
			newURL,
			redirectCode,
			clicks: 0,
			tags: optimisticTags,
			createdAt: new Date(),
		};

		setRedirects((prev) => [...prev, optimisticRedirect]);
		setIsDialogOpen(false);

		const result = await createRedirect(formData);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			setRedirects((prev) => prev.filter((r) => r.id !== tempId));
			toast.error(result.message);
		}
	};

	const handleUpdate = async (formData: FormData) => {
		const id = formData.get("id") as string;
		const newURL = formData.get("newURL") as string;
		const redirectCode = formData.get("redirectCode") as string;
		const tagIds = formData.get("tagIds") as string;
		const selectedTagIds = tagIds ? tagIds.split(",").filter(Boolean) : [];

		const optimisticTags = selectedTagIds
			.map((id) => allTags.find((t) => t.id === id))
			.filter(Boolean) as TagInfo[];

		const oldRedirect = redirects.find((r) => r.id === id);

		setRedirects((prev) =>
			prev.map((r) => (r.id === id ? { ...r, newURL, redirectCode, tags: optimisticTags } : r)),
		);

		const result = await updateRedirect(formData);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			if (oldRedirect) {
				setRedirects((prev) => prev.map((r) => (r.id === id ? oldRedirect : r)));
			}
			toast.error(result.message);
		}
	};

	const handleDelete = async (id: string) => {
		const oldRedirect = redirects.find((r) => r.id === id);
		setRedirects((prev) => prev.filter((r) => r.id !== id));

		const result = await deleteRedirect(id);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			if (oldRedirect) {
				setRedirects((prev) => [...prev, oldRedirect]);
			}
			toast.error(result.message);
		}
	};

	// --- Tag Management Handlers ---

	const handleCreateTag = async () => {
		if (!newTagName.trim()) return;
		const result = await createTag(newTagName, newTagColor);
		if (result.success) {
			setAllTags((prev) => [...prev, result.tag].sort((a, b) => a.name.localeCompare(b.name)));
			setNewTagName("");
			setNewTagColor(TAG_COLORS[0]);
			toast.success("Tag created.");
		} else {
			toast.error(result.message);
		}
	};

	const handleUpdateTag = async () => {
		if (!editingTag || !newTagName.trim()) return;
		const result = await updateTag(editingTag.id, newTagName, newTagColor);
		if (result.success) {
			setAllTags((prev) =>
				prev
					.map((t) => (t.id === editingTag.id ? result.tag : t))
					.sort((a, b) => a.name.localeCompare(b.name)),
			);
			// Update tags in redirects too
			setRedirects((prev) =>
				prev.map((r) => ({
					...r,
					tags: r.tags.map((t) => (t.id === editingTag.id ? result.tag : t)),
				})),
			);
			setEditingTag(null);
			setNewTagName("");
			setNewTagColor(TAG_COLORS[0]);
			toast.success("Tag updated.");
		} else {
			toast.error(result.message);
		}
	};

	const handleDeleteTag = async (id: string) => {
		const result = await deleteTag(id);
		if (result.success) {
			setAllTags((prev) => prev.filter((t) => t.id !== id));
			setRedirects((prev) => prev.map((r) => ({ ...r, tags: r.tags.filter((t) => t.id !== id) })));
			setActiveTagFilters((prev) => prev.filter((f) => f !== id));
			toast.success(result.message);
		} else {
			toast.error(result.message);
		}
	};

	const startEditTag = (tag: RedirectTagData) => {
		setEditingTag(tag);
		setNewTagName(tag.name);
		setNewTagColor(tag.color);
	};

	const cancelEditTag = () => {
		setEditingTag(null);
		setNewTagName("");
		setNewTagColor(TAG_COLORS[0]);
	};

	// --- Export/Import Handlers ---

	const handleExport = async () => {
		setExporting(true);
		try {
			const result = await exportRedirects();
			if (result.success) {
				const blob = new Blob([JSON.stringify(result.data, null, 2)], {
					type: "application/json",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `redirects-backup-${new Date().toISOString().split("T")[0]}.json`;
				a.click();
				URL.revokeObjectURL(url);
				toast.success(`Exported ${result.data.redirects.length} redirects`);
			} else {
				toast.error(result.message);
			}
		} finally {
			setExporting(false);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const parsed = JSON.parse(content);
				setImportFileContent(content);
				setImportFileInfo({
					count: parsed.redirects?.length || 0,
					tagCount: parsed.tags?.length || 0,
					exportedAt: parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : "Unknown",
				});
			} catch {
				toast.error("Invalid JSON file");
				setImportFileContent(null);
				setImportFileInfo(null);
			}
		};
		reader.readAsText(file);
	};

	const handleImport = async () => {
		if (!importFileContent) return;
		setImporting(true);
		try {
			const result = await importRedirects(importFileContent, importMode);
			if (result.success) {
				toast.success(result.message);
				setImportDialogOpen(false);
				setImportFileContent(null);
				setImportFileInfo(null);
				router.refresh();
			} else {
				toast.error(result.message);
			}
		} finally {
			setImporting(false);
		}
	};

	return (
		<>
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Redirects Dashboard</h1>
				<div className="flex gap-x-2">
					{/* Export */}
					<Button
						variant="outline"
						size="icon"
						onClick={handleExport}
						disabled={exporting}
						title="Export"
					>
						{exporting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Download className="h-4 w-4" />
						)}
					</Button>

					{/* Import */}
					<Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" size="icon" title="Import">
								<Upload className="h-4 w-4" />
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Import Redirects</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<div>
									<Label htmlFor="importFile">JSON File</Label>
									<Input id="importFile" type="file" accept=".json" onChange={handleFileSelect} />
								</div>
								{importFileInfo && (
									<div className="rounded-lg border p-3 text-sm">
										<p className="font-medium">
											{importFileInfo.count} redirects, {importFileInfo.tagCount} tags
										</p>
										<p className="text-muted-foreground text-xs">
											Exported: {importFileInfo.exportedAt}
										</p>
									</div>
								)}
								<div className="space-y-2">
									<Label>When a code already exists:</Label>
									<Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="skip">Skip (keep existing)</SelectItem>
											<SelectItem value="update">Update (overwrite URL & tags)</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<Button
									onClick={handleImport}
									disabled={!importFileContent || importing}
									className="w-full"
								>
									{importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									{importing ? "Importing..." : "Import"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					{/* Manage Tags */}
					<Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" size="icon" title="Manage Tags">
								<Tags className="h-4 w-4" />
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Manage Tags</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								{/* Create / Edit Tag */}
								<div className="space-y-2">
									<Label>{editingTag ? "Edit Tag" : "New Tag"}</Label>
									<div className="flex gap-2">
										<Input
											placeholder="Tag name"
											value={newTagName}
											onChange={(e) => setNewTagName(e.target.value)}
											className="flex-1"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													editingTag ? handleUpdateTag() : handleCreateTag();
												}
											}}
										/>
										<Button
											size="sm"
											onClick={editingTag ? handleUpdateTag : handleCreateTag}
											disabled={!newTagName.trim()}
										>
											{editingTag ? "Save" : <Plus className="h-4 w-4" />}
										</Button>
										{editingTag && (
											<Button size="sm" variant="ghost" onClick={cancelEditTag}>
												<X className="h-4 w-4" />
											</Button>
										)}
									</div>
									<div className="flex flex-wrap gap-1.5">
										{TAG_COLORS.map((color) => (
											<button
												key={color}
												type="button"
												className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
												style={{
													backgroundColor: color,
													borderColor: newTagColor === color ? "#000" : "transparent",
												}}
												onClick={() => setNewTagColor(color)}
											/>
										))}
									</div>
								</div>

								{/* Tag List */}
								<div className="max-h-[300px] space-y-1 overflow-y-auto">
									{allTags.length === 0 ? (
										<p className="text-muted-foreground py-4 text-center text-sm">No tags yet.</p>
									) : (
										allTags.map((tag) => (
											<div
												key={tag.id}
												className="hover:bg-muted/50 flex items-center justify-between rounded-md px-2 py-1.5"
											>
												<Badge
													style={{
														backgroundColor: tag.color,
														color: "#fff",
													}}
												>
													{tag.name}
												</Badge>
												<div className="flex gap-1">
													<Button
														size="icon"
														variant="ghost"
														className="h-7 w-7"
														onClick={() => startEditTag(tag)}
													>
														<Pencil className="h-3 w-3" />
													</Button>
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																size="icon"
																variant="ghost"
																className="text-destructive h-7 w-7"
															>
																<Trash2 className="h-3 w-3" />
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Delete tag &ldquo;{tag.name}&rdquo;?
																</AlertDialogTitle>
															</AlertDialogHeader>
															<AlertDialogDescription>
																This will remove the tag from all redirects.
															</AlertDialogDescription>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>
																	Delete
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</DialogContent>
					</Dialog>

					{/* Refresh */}
					<Button
						variant="outline"
						size="icon"
						title="Refresh"
						onClick={() => {
							router.refresh();
							toast.success("Table data refreshed!");
						}}
					>
						<RefreshCw className="h-4 w-4" />
					</Button>

					{/* Add New */}
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button>Add New Redirect</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Redirect</DialogTitle>
							</DialogHeader>
							<RedirectForm allTags={allTags} onSubmit={handleCreate} />
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Search and Sort Controls */}
			<div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						placeholder="Search by code, URL, or tag..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					<Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="redirectCode">Short Code</SelectItem>
							<SelectItem value="clicks">Clicks</SelectItem>
							<SelectItem value="createdAt">Created Date</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" size="icon" onClick={toggleSortDirection}>
						{sortDirection === "asc" ? (
							<ArrowUp className="h-4 w-4" />
						) : (
							<ArrowDown className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Tag Filters */}
			{allTags.length > 0 && (
				<div className="mb-3 flex flex-wrap items-center gap-1.5">
					{allTags.map((tag) => (
						<Badge
							key={tag.id}
							variant={activeTagFilters.includes(tag.id) ? "default" : "outline"}
							className="cursor-pointer transition-colors select-none"
							style={
								activeTagFilters.includes(tag.id)
									? { backgroundColor: tag.color, color: "#fff", borderColor: tag.color }
									: { borderColor: tag.color, color: tag.color }
							}
							onClick={() => {
								setActiveTagFilters((prev) =>
									prev.includes(tag.id) ? prev.filter((f) => f !== tag.id) : [...prev, tag.id],
								);
							}}
						>
							{tag.name}
						</Badge>
					))}
					{activeTagFilters.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-6 text-xs"
							onClick={() => setActiveTagFilters([])}
						>
							Clear filters
						</Button>
					)}
				</div>
			)}

			{/* Results count */}
			<p className="text-muted-foreground mb-2 text-sm">
				{filteredRedirects.length} of {redirects.length} redirects
				{searchQuery && ` matching "${searchQuery}"`}
				{activeTagFilters.length > 0 &&
					` filtered by ${activeTagFilters.length} tag${activeTagFilters.length > 1 ? "s" : ""}`}
			</p>

			{/* Table */}
			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[200px]">Short Code</TableHead>
							<TableHead>Destination URL</TableHead>
							<TableHead className="hidden w-[100px] md:table-cell">Clicks</TableHead>
							<TableHead className="hidden w-[120px] lg:table-cell">Created</TableHead>
							<TableHead className="w-[150px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRedirects.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
									{searchQuery || activeTagFilters.length > 0
										? "No redirects match your search."
										: "No redirects yet."}
								</TableCell>
							</TableRow>
						) : (
							filteredRedirects.map((redirect) => (
								<TableRow
									key={redirect.id}
									className="hover:bg-muted/50 cursor-pointer transition-colors"
									onClick={() => handleRowClick(redirect)}
								>
									<TableCell className="font-medium">
										<div className="flex flex-col gap-1">
											<span>/{redirect.redirectCode}</span>
											{redirect.tags.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{redirect.tags.map((tag) => (
														<span
															key={tag.id}
															className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium text-white"
															style={{ backgroundColor: tag.color }}
														>
															{tag.name}
														</span>
													))}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell className="max-w-xs truncate">
										<a
											href={redirect.newURL}
											target="_blank"
											rel="noopener noreferrer"
											className="hover:underline"
											onClick={(e) => e.stopPropagation()}
										>
											{redirect.newURL}
										</a>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{redirect.clicks.toLocaleString()}
									</TableCell>
									<TableCell className="hidden lg:table-cell">
										{new Date(redirect.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="space-x-2 text-right">
										<Dialog>
											<DialogTrigger asChild>
												<Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
													Edit
												</Button>
											</DialogTrigger>
											<DialogContent onClick={(e) => e.stopPropagation()}>
												<DialogHeader>
													<DialogTitle>Edit Redirect</DialogTitle>
												</DialogHeader>
												<RedirectForm
													allTags={allTags}
													onSubmit={handleUpdate}
													defaultValues={{
														id: redirect.id,
														redirectCode: redirect.redirectCode,
														newURL: redirect.newURL,
														tagIds: redirect.tags.map((t) => t.id),
													}}
												/>
											</DialogContent>
										</Dialog>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant="destructive"
													size="sm"
													onClick={(e) => e.stopPropagation()}
												>
													Delete
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent onClick={(e) => e.stopPropagation()}>
												<AlertDialogHeader>
													<AlertDialogTitle>Are you sure?</AlertDialogTitle>
												</AlertDialogHeader>
												<AlertDialogDescription>
													This will permanently delete the redirect.
												</AlertDialogDescription>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={() => handleDelete(redirect.id)}>
														Continue
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Analytics Modal */}
			<AnalyticsModal
				redirect={selectedRedirect}
				open={analyticsOpen}
				onOpenChange={setAnalyticsOpen}
			/>
		</>
	);
}

// --- Redirect Form Component (shared between Create and Edit) ---

function RedirectForm({
	allTags,
	onSubmit,
	defaultValues,
}: {
	allTags: RedirectTagData[];
	onSubmit: (formData: FormData) => void;
	defaultValues?: {
		id: string;
		redirectCode: string;
		newURL: string;
		tagIds: string[];
	};
}) {
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>(defaultValues?.tagIds || []);

	const toggleTag = (tagId: string) => {
		setSelectedTagIds((prev) =>
			prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
		);
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const fd = new FormData(e.currentTarget);
				fd.set("tagIds", selectedTagIds.join(","));
				onSubmit(fd);
			}}
			className="space-y-4"
		>
			{defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
			<div>
				<Label className="mb-2" htmlFor="redirectCode">
					Short Code (ateneoarsa.org/[code])
				</Label>
				<Input
					id="redirectCode"
					name="redirectCode"
					placeholder="e.g., DOGS-Form"
					defaultValue={defaultValues?.redirectCode}
					required
				/>
			</div>
			<div>
				<Label className="mb-2" htmlFor="newURL">
					Destination URL
				</Label>
				<Input
					id="newURL"
					name="newURL"
					placeholder="https://..."
					defaultValue={defaultValues?.newURL}
					required
				/>
			</div>
			{allTags.length > 0 && (
				<div>
					<Label className="mb-2">Tags</Label>
					<div className="flex flex-wrap gap-1.5">
						{allTags.map((tag) => (
							<Badge
								key={tag.id}
								variant={selectedTagIds.includes(tag.id) ? "default" : "outline"}
								className="cursor-pointer transition-colors select-none"
								style={
									selectedTagIds.includes(tag.id)
										? {
												backgroundColor: tag.color,
												color: "#fff",
												borderColor: tag.color,
											}
										: { borderColor: tag.color, color: tag.color }
								}
								onClick={() => toggleTag(tag.id)}
							>
								{tag.name}
							</Badge>
						))}
					</div>
				</div>
			)}
			<Button type="submit">{defaultValues ? "Save Changes" : "Create"}</Button>
		</form>
	);
}
