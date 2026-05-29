"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	createCategory,
	updateCategory,
	deleteCategory,
	reorderCategory,
} from "../../actions";
import { ChevronUp, ChevronDown, Pencil, Trash2, Check, X, Loader2, Plus } from "lucide-react";

type Category = {
	id: string;
	eventId: string;
	name: string;
	displayOrder: number;
	color: string | null;
	createdAt: Date;
	updatedAt: Date;
};

type CategoriesClientProps = {
	eventId: string;
	initialCategories: Category[];
};

export function CategoriesClient({ eventId, initialCategories }: CategoriesClientProps) {
	const [categories, setCategories] = useState<Category[]>(initialCategories);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [editColor, setEditColor] = useState("");
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// New category form
	const [newName, setNewName] = useState("");
	const [newColor, setNewColor] = useState("");
	const [adding, setAdding] = useState(false);

	function startEdit(cat: Category) {
		setEditingId(cat.id);
		setEditName(cat.name);
		setEditColor(cat.color ?? "");
	}

	function cancelEdit() {
		setEditingId(null);
		setEditName("");
		setEditColor("");
	}

	async function handleUpdate(cat: Category) {
		if (!editName.trim()) {
			toast.error("Category name cannot be empty");
			return;
		}
		setSaving(true);
		try {
			await updateCategory(cat.id, editName.trim(), editColor.trim() || null);
			setCategories((prev) =>
				prev.map((c) =>
					c.id === cat.id
						? { ...c, name: editName.trim(), color: editColor.trim() || null }
						: c,
				),
			);
			cancelEdit();
			toast.success("Category updated");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to update category");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(catId: string) {
		setSaving(true);
		try {
			await deleteCategory(catId);
			setCategories((prev) => prev.filter((c) => c.id !== catId));
			toast.success("Category deleted");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to delete category");
		} finally {
			setSaving(false);
			setDeletingId(null);
		}
	}

	async function handleReorder(index: number, direction: "up" | "down") {
		const swapIndex = direction === "up" ? index - 1 : index + 1;
		if (swapIndex < 0 || swapIndex >= categories.length) return;

		const current = categories[index];
		const swap = categories[swapIndex];

		// Optimistic update
		const newCategories = [...categories];
		newCategories[index] = { ...swap, displayOrder: current.displayOrder };
		newCategories[swapIndex] = { ...current, displayOrder: swap.displayOrder };
		setCategories(newCategories);

		try {
			await reorderCategory(current.id, swap.displayOrder);
			await reorderCategory(swap.id, current.displayOrder);
		} catch (err) {
			// Revert on error
			setCategories(categories);
			toast.error(err instanceof Error ? err.message : "Failed to reorder categories");
		}
	}

	async function handleAdd() {
		if (!newName.trim()) {
			toast.error("Category name cannot be empty");
			return;
		}
		setAdding(true);
		try {
			const id = await createCategory(eventId, newName.trim(), newColor.trim() || null);
			const maxOrder = categories.reduce((m, c) => Math.max(m, c.displayOrder), -1);
			const now = new Date();
			setCategories((prev) => [
				...prev,
				{
					id,
					eventId,
					name: newName.trim(),
					color: newColor.trim() || null,
					displayOrder: maxOrder + 1,
					createdAt: now,
					updatedAt: now,
				},
			]);
			setNewName("");
			setNewColor("");
			toast.success("Category created");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to create category");
		} finally {
			setAdding(false);
		}
	}

	return (
		<div className="space-y-4">
			{/* Category list */}
			<Card>
				<CardHeader>
					<CardTitle>
						{categories.length} categor{categories.length !== 1 ? "ies" : "y"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{categories.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No categories yet. Add one below to get started.
						</p>
					) : (
						<ul className="divide-y">
							{categories.map((cat, index) => (
								<li key={cat.id} className="flex items-center gap-3 py-3">
									{/* Reorder buttons */}
									<div className="flex flex-col gap-0.5">
										<Button
											size="icon"
											variant="ghost"
											className="h-6 w-6"
											disabled={index === 0 || saving}
											onClick={() => handleReorder(index, "up")}
										>
											<ChevronUp className="h-3 w-3" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											className="h-6 w-6"
											disabled={index === categories.length - 1 || saving}
											onClick={() => handleReorder(index, "down")}
										>
											<ChevronDown className="h-3 w-3" />
										</Button>
									</div>

									{/* Color swatch */}
									{cat.color && (
										<span
											className="inline-block h-4 w-4 rounded-full flex-shrink-0 border"
											style={{ backgroundColor: cat.color }}
										/>
									)}

									{/* Name / Edit form */}
									{editingId === cat.id ? (
										<div className="flex flex-1 items-center gap-2 flex-wrap">
											<Input
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
												className="h-8 w-40"
												onKeyDown={(e) => {
													if (e.key === "Enter") handleUpdate(cat);
													if (e.key === "Escape") cancelEdit();
												}}
											/>
											<Input
												type="color"
												value={editColor || "#6b7280"}
												onChange={(e) => setEditColor(e.target.value)}
												className="h-8 w-12 p-0.5 cursor-pointer"
											/>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8"
												onClick={() => handleUpdate(cat)}
												disabled={saving}
											>
												{saving ? (
													<Loader2 className="h-3 w-3 animate-spin" />
												) : (
													<Check className="h-3 w-3" />
												)}
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8"
												onClick={cancelEdit}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									) : (
										<span className="flex-1 text-sm font-medium">{cat.name}</span>
									)}

									{/* Badge for order */}
									<Badge variant="outline" className="text-xs tabular-nums">
										#{cat.displayOrder + 1}
									</Badge>

									{/* Actions (hidden while editing) */}
									{editingId !== cat.id && (
										<div className="flex items-center gap-1">
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8"
												onClick={() => startEdit(cat)}
											>
												<Pencil className="h-3 w-3" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 text-destructive hover:text-destructive"
												onClick={() => setDeletingId(cat.id)}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									)}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			{/* Add category form */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Add Category</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-3 flex-wrap">
						<div className="space-y-1.5 flex-1 min-w-[180px]">
							<Label htmlFor="newCatName">Name</Label>
							<Input
								id="newCatName"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="e.g. Solo Flowers"
								onKeyDown={(e) => {
									if (e.key === "Enter") handleAdd();
								}}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="newCatColor">Color</Label>
							<Input
								id="newCatColor"
								type="color"
								value={newColor || "#6b7280"}
								onChange={(e) => setNewColor(e.target.value)}
								className="h-9 w-14 p-0.5 cursor-pointer"
							/>
						</div>
						<Button onClick={handleAdd} disabled={adding}>
							{adding ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Plus className="mr-2 h-4 w-4" />
							)}
							Add
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Delete confirmation */}
			<AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete category?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove the category. Products assigned to it will become uncategorised.
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingId && handleDelete(deletingId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
