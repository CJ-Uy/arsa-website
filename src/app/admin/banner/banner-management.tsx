"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/alert-dialog";
import { createBanner, updateBanner, deleteBanner, toggleBannerStatus } from "./actions";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";

type Banner = {
	id: string;
	message: string;
	deadline: Date | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

type BannerManagementProps = {
	initialBanners: Banner[];
};

export function BannerManagement({ initialBanners }: BannerManagementProps) {
	const [banners, setBanners] = useState<Banner[]>(initialBanners);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
	const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

	const handleCreate = async (formData: FormData) => {
		const result = await createBanner(formData);
		if (result.success && result.banner) {
			setBanners([result.banner, ...banners]);
			toast.success(result.message);
			setShowCreateDialog(false);
		} else {
			toast.error(result.message || "Failed to create banner");
		}
	};

	const handleUpdate = async (formData: FormData) => {
		const result = await updateBanner(formData);
		if (result.success && result.banner) {
			setBanners(banners.map((b) => (b.id === result.banner!.id ? result.banner! : b)));
			toast.success(result.message);
			setShowEditDialog(false);
			setSelectedBanner(null);
		} else {
			toast.error(result.message || "Failed to update banner");
		}
	};

	const handleDelete = async () => {
		if (!bannerToDelete) return;

		const result = await deleteBanner(bannerToDelete);
		if (result.success) {
			setBanners(banners.filter((b) => b.id !== bannerToDelete));
			toast.success(result.message);
			setShowDeleteDialog(false);
			setBannerToDelete(null);
		} else {
			toast.error(result.message || "Failed to delete banner");
		}
	};

	const handleToggleStatus = async (id: string, isActive: boolean) => {
		const result = await toggleBannerStatus(id, isActive);
		if (result.success && result.banner) {
			// Update the toggled banner and deactivate others if this one is being activated
			setBanners(
				banners.map((b) => {
					if (b.id === id) return { ...b, isActive };
					if (isActive && b.isActive) return { ...b, isActive: false };
					return b;
				}),
			);
			toast.success(result.message);
		} else {
			toast.error(result.message || "Failed to toggle banner status");
		}
	};

	const formatDeadline = (deadline: Date | null) => {
		if (!deadline) return "No deadline";
		return new Date(deadline).toLocaleString();
	};

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Banner Management</h2>
					<p className="text-muted-foreground text-sm">
						Create and manage announcement banners with countdown timers
					</p>
				</div>
				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Banner
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Create New Banner</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleCreate(new FormData(e.currentTarget));
							}}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label htmlFor="message">Banner Message</Label>
								<Textarea
									id="message"
									name="message"
									placeholder="e.g., Order now! Preorders close in {timer}"
									required
									rows={3}
								/>
								<p className="text-muted-foreground text-xs">
									Use {"{timer}"} as a placeholder for the countdown timer
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="deadline">Deadline (Optional)</Label>
								<Input id="deadline" name="deadline" type="datetime-local" />
								<p className="text-muted-foreground text-xs">
									Set a deadline to show a countdown timer
								</p>
							</div>
							<div className="flex items-center space-x-2">
								<Switch id="isActive" name="isActive" value="true" defaultChecked />
								<Label htmlFor="isActive">Activate banner immediately</Label>
							</div>
							<Button type="submit">Create Banner</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Info Card */}
			<Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
				<CardContent className="pt-6">
					<div className="space-y-2 text-sm">
						<p>
							<strong>Tip:</strong> Use {"{timer}"} in your message to display a live countdown.
						</p>
						<p>
							<strong>Example:</strong> "Order now! Preorders close in {"{timer}"}" will show as
							"Order now! Preorders close in 2d 14h 30m 15s"
						</p>
						<p>
							<strong>Note:</strong> Only one banner can be active at a time. Activating a new
							banner will automatically deactivate the current one.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Banners List */}
			<div className="space-y-4">
				{banners.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center">
							<p className="text-muted-foreground">No banners created yet</p>
						</CardContent>
					</Card>
				) : (
					banners.map((banner) => (
						<Card key={banner.id}>
							<CardContent className="p-6">
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
									<div className="flex-1 space-y-2">
										<div className="flex items-center gap-3">
											<Badge variant={banner.isActive ? "default" : "secondary"}>
												{banner.isActive ? "Active" : "Inactive"}
											</Badge>
											<span className="text-muted-foreground text-xs">
												Updated: {new Date(banner.updatedAt).toLocaleDateString()}
											</span>
										</div>
										<p className="font-medium">{banner.message}</p>
										<p className="text-muted-foreground text-sm">
											Deadline: {formatDeadline(banner.deadline)}
										</p>
									</div>

									<div className="flex gap-2">
										<Button
											variant="outline"
											size="icon"
											onClick={() => handleToggleStatus(banner.id, !banner.isActive)}
											title={banner.isActive ? "Deactivate" : "Activate"}
										>
											{banner.isActive ? (
												<PowerOff className="h-4 w-4" />
											) : (
												<Power className="h-4 w-4" />
											)}
										</Button>
										<Button
											variant="outline"
											size="icon"
											onClick={() => {
												setSelectedBanner(banner);
												setShowEditDialog(true);
											}}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											onClick={() => {
												setBannerToDelete(banner.id);
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

			{/* Edit Dialog */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Edit Banner</DialogTitle>
					</DialogHeader>
					{selectedBanner && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleUpdate(new FormData(e.currentTarget));
							}}
							className="space-y-4"
						>
							<input type="hidden" name="id" value={selectedBanner.id} />
							<div className="space-y-2">
								<Label htmlFor="edit-message">Banner Message</Label>
								<Textarea
									id="edit-message"
									name="message"
									defaultValue={selectedBanner.message}
									required
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-deadline">Deadline (Optional)</Label>
								<Input
									id="edit-deadline"
									name="deadline"
									type="datetime-local"
									defaultValue={
										selectedBanner.deadline
											? new Date(selectedBanner.deadline).toISOString().slice(0, 16)
											: ""
									}
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="edit-isActive"
									name="isActive"
									value="true"
									defaultChecked={selectedBanner.isActive}
								/>
								<Label htmlFor="edit-isActive">Active</Label>
							</div>
							<Button type="submit">Update Banner</Button>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the banner.
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
