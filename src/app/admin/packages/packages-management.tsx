"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { createPackage, updatePackage, deletePackage, type PackageFormData } from "./actions";
import { toast } from "sonner";
import {
	Package,
	Plus,
	Edit2,
	Trash2,
	X,
	GripVertical,
	RotateCw,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { ProductImageCarousel } from "@/components/features/product-image-carousel";
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
import { Checkbox } from "@/components/ui/checkbox";

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
	availableSizes: string[];
};

type PackageItem = {
	id: string;
	productId: string;
	quantity: number;
	product: Product;
};

type PackagePoolOption = {
	id: string;
	productId: string;
	product: Product;
};

type PackagePool = {
	id: string;
	name: string;
	selectCount: number;
	options: PackagePoolOption[];
};

type PackageType = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
	isAvailable: boolean;
	specialNote: string | null;
	items: PackageItem[];
	pools: PackagePool[];
};

type PackagesManagementProps = {
	initialPackages: PackageType[];
	availableProducts: Product[];
};

type FormPackageItem = {
	productId: string;
	quantity: number;
};

type FormPackagePool = {
	name: string;
	selectCount: number;
	productIds: string[];
};

type FormData = {
	name: string;
	description: string;
	price: number;
	image: string;
	imageUrls: string[];
	isAvailable: boolean;
	specialNote: string;
	items: FormPackageItem[];
	pools: FormPackagePool[];
};

export function PackagesManagement({
	initialPackages,
	availableProducts,
}: PackagesManagementProps) {
	const [packages, setPackages] = useState<PackageType[]>(initialPackages);
	const [showDialog, setShowDialog] = useState(false);
	const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [loading, setLoading] = useState(false);
	const [expandedPools, setExpandedPools] = useState<Record<number, boolean>>({});

	const [formData, setFormData] = useState<FormData>({
		name: "",
		description: "",
		price: 0,
		image: "",
		imageUrls: [],
		isAvailable: true,
		specialNote: "",
		items: [],
		pools: [],
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: 0,
			image: "",
			imageUrls: [],
			isAvailable: true,
			specialNote: "",
			items: [],
			pools: [],
		});
		setEditingPackage(null);
		setExpandedPools({});
	};

	const handleOpenDialog = (pkg?: PackageType) => {
		if (pkg) {
			setEditingPackage(pkg);
			setFormData({
				name: pkg.name,
				description: pkg.description,
				price: pkg.price,
				image: pkg.image || "",
				imageUrls: pkg.imageUrls || [],
				isAvailable: pkg.isAvailable,
				specialNote: pkg.specialNote || "",
				items: pkg.items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
				})),
				pools: pkg.pools.map((pool) => ({
					name: pool.name,
					selectCount: pool.selectCount,
					productIds: pool.options.map((opt) => opt.productId),
				})),
			});
		} else {
			resetForm();
		}
		setShowDialog(true);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
		resetForm();
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
		if (validFiles.length === 0) {
			toast.error("Please upload image files only");
			return;
		}

		setUploading(true);
		try {
			const uploadPromises = validFiles.map(async (file) => {
				const formDataUpload = new FormData();
				formDataUpload.append("file", file);
				formDataUpload.append("type", "product");

				const response = await fetch("/api/upload", {
					method: "POST",
					body: formDataUpload,
				});

				if (!response.ok) {
					throw new Error(`Upload failed for ${file.name}`);
				}

				const { url } = await response.json();
				return url;
			});

			const urls = await Promise.all(uploadPromises);

			setFormData((prev) => ({
				...prev,
				imageUrls: [...prev.imageUrls, ...urls],
				image: prev.image || urls[0],
			}));

			toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
		} catch (error) {
			toast.error("Failed to upload images");
		} finally {
			setUploading(false);
			e.target.value = "";
		}
	};

	const handleRemoveImage = (index: number) => {
		setFormData((prev) => ({
			...prev,
			imageUrls: prev.imageUrls.filter((_, i) => i !== index),
		}));
	};

	// Package Items Management
	const addPackageItem = () => {
		setFormData((prev) => ({
			...prev,
			items: [...prev.items, { productId: "", quantity: 1 }],
		}));
	};

	const updatePackageItem = (
		index: number,
		field: keyof FormPackageItem,
		value: string | number,
	) => {
		setFormData((prev) => ({
			...prev,
			items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
		}));
	};

	const removePackageItem = (index: number) => {
		setFormData((prev) => ({
			...prev,
			items: prev.items.filter((_, i) => i !== index),
		}));
	};

	// Package Pools Management
	const addPackagePool = () => {
		const newIndex = formData.pools.length;
		setFormData((prev) => ({
			...prev,
			pools: [...prev.pools, { name: "", selectCount: 1, productIds: [] }],
		}));
		setExpandedPools((prev) => ({ ...prev, [newIndex]: true }));
	};

	const updatePackagePool = (
		index: number,
		field: keyof FormPackagePool,
		value: string | number | string[],
	) => {
		setFormData((prev) => ({
			...prev,
			pools: prev.pools.map((pool, i) => (i === index ? { ...pool, [field]: value } : pool)),
		}));
	};

	const removePackagePool = (index: number) => {
		setFormData((prev) => ({
			...prev,
			pools: prev.pools.filter((_, i) => i !== index),
		}));
	};

	const togglePoolProduct = (poolIndex: number, productId: string) => {
		const pool = formData.pools[poolIndex];
		const newProductIds = pool.productIds.includes(productId)
			? pool.productIds.filter((id) => id !== productId)
			: [...pool.productIds, productId];
		updatePackagePool(poolIndex, "productIds", newProductIds);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Validate items have products selected
			if (formData.items.some((item) => !item.productId)) {
				toast.error("Please select a product for all package items");
				setLoading(false);
				return;
			}

			// Validate pools have products selected and valid selectCount
			for (const pool of formData.pools) {
				if (!pool.name) {
					toast.error("Please provide a name for all selection pools");
					setLoading(false);
					return;
				}
				if (pool.productIds.length === 0) {
					toast.error(`Please select products for pool "${pool.name}"`);
					setLoading(false);
					return;
				}
				if (pool.selectCount > pool.productIds.length) {
					toast.error(`Selection count for "${pool.name}" cannot exceed available options`);
					setLoading(false);
					return;
				}
			}

			const result = editingPackage
				? await updatePackage(editingPackage.id, formData as PackageFormData)
				: await createPackage(formData as PackageFormData);

			if (result.success) {
				toast.success(editingPackage ? "Package updated" : "Package created");
				handleCloseDialog();
				window.location.reload();
			} else {
				toast.error(result.message || "Failed to save package");
			}
		} catch (error) {
			toast.error("An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!packageToDelete) return;

		const result = await deletePackage(packageToDelete);
		if (result.success) {
			setPackages(packages.filter((p) => p.id !== packageToDelete));
			toast.success("Package deleted");
			setShowDeleteDialog(false);
			setPackageToDelete(null);
		} else {
			toast.error(result.message || "Failed to delete package");
		}
	};

	const getProductName = (productId: string) => {
		const product = availableProducts.find((p) => p.id === productId);
		return product?.name || "Unknown Product";
	};

	const calculateOriginalPrice = (pkg: PackageType) => {
		let total = 0;
		for (const item of pkg.items) {
			total += item.product.price * item.quantity;
		}
		// For pools, we can't calculate exact original price since user chooses
		// Just show the fixed items total
		return total;
	};

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<p className="text-muted-foreground text-sm">Total Packages: {packages.length}</p>
				</div>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className="mr-2 h-4 w-4" />
					Create Package
				</Button>
			</div>

			{/* Packages Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{packages.length === 0 ? (
					<Card className="col-span-full">
						<CardContent className="py-12 text-center">
							<Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<p className="text-muted-foreground">No packages yet</p>
							<p className="text-muted-foreground mt-1 text-sm">
								Create packages to bundle products together
							</p>
						</CardContent>
					</Card>
				) : (
					packages.map((pkg) => (
						<Card key={pkg.id} className="border-primary/20 border-2">
							<CardHeader>
								<div className="relative mb-4">
									{pkg.imageUrls && pkg.imageUrls.length > 0 ? (
										<ProductImageCarousel
											images={pkg.imageUrls}
											productName={pkg.name}
											aspectRatio="landscape"
											showThumbnails={false}
										/>
									) : pkg.image ? (
										<ProductImageCarousel
											images={[pkg.image]}
											productName={pkg.name}
											aspectRatio="landscape"
											showThumbnails={false}
										/>
									) : (
										<div className="bg-muted flex aspect-video items-center justify-center rounded-lg">
											<Package className="text-muted-foreground h-16 w-16" />
										</div>
									)}
									<Badge className="bg-primary absolute top-2 left-2 z-10">Package</Badge>
								</div>
								<div className="flex items-start justify-between">
									<CardTitle className="text-lg">{pkg.name}</CardTitle>
									<Badge variant={pkg.isAvailable ? "default" : "secondary"}>
										{pkg.isAvailable ? "Available" : "Unavailable"}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-muted-foreground line-clamp-2 text-sm">{pkg.description}</p>

								{/* Package Contents Summary */}
								<div className="space-y-2">
									<p className="text-sm font-medium">Contains:</p>
									<ul className="text-muted-foreground space-y-1 text-sm">
										{pkg.items.map((item) => (
											<li key={item.id}>
												• {item.quantity}x {item.product.name}
											</li>
										))}
										{pkg.pools.map((pool) => (
											<li key={pool.id} className="text-primary">
												• Choose {pool.selectCount} from {pool.name} ({pool.options.length} options)
											</li>
										))}
									</ul>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<span className="text-2xl font-bold">₱{pkg.price.toFixed(2)}</span>
										{pkg.items.length > 0 && (
											<span className="text-muted-foreground ml-2 text-sm line-through">
												₱{calculateOriginalPrice(pkg).toFixed(2)}
											</span>
										)}
									</div>
								</div>

								<div className="flex gap-2 pt-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1"
										onClick={() => handleOpenDialog(pkg)}
									>
										<Edit2 className="mr-2 h-4 w-4" />
										Edit
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setPackageToDelete(pkg.id);
											setShowDeleteDialog(true);
										}}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Add/Edit Package Dialog */}
			<Dialog open={showDialog} onOpenChange={handleCloseDialog}>
				<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingPackage ? "Edit Package" : "Create New Package"}</DialogTitle>
						<DialogDescription>
							{editingPackage
								? "Update the package details below"
								: "Create a bundle of products with optional selection pools"}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Basic Info */}
						<div className="space-y-4">
							<h3 className="font-semibold">Basic Information</h3>

							<div>
								<Label htmlFor="name">Package Name *</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									placeholder="e.g., Ultimate Merch Bundle"
									required
								/>
							</div>

							<div>
								<Label htmlFor="description">Description *</Label>
								<Textarea
									id="description"
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									rows={3}
									placeholder="Describe what's included in this package..."
									required
								/>
							</div>

							<div>
								<Label htmlFor="specialNote">Checkout Warning (Optional)</Label>
								<Textarea
									id="specialNote"
									value={formData.specialNote}
									onChange={(e) => setFormData({ ...formData, specialNote: e.target.value })}
									rows={2}
									placeholder="e.g., Please specify size preferences for each item in special instructions."
								/>
							</div>

							<div>
								<Label htmlFor="price">Bundle Price *</Label>
								<Input
									id="price"
									type="number"
									step="0.01"
									min="0"
									value={formData.price}
									onChange={(e) =>
										setFormData({
											...formData,
											price: parseFloat(e.target.value) || 0,
										})
									}
									required
								/>
								<p className="text-muted-foreground mt-1 text-xs">
									Set the discounted bundle price (usually less than individual items total)
								</p>
							</div>

							{/* Images */}
							<div>
								<Label>Package Images</Label>
								<div className="mt-2 flex items-center gap-2">
									<Input
										type="file"
										accept="image/*"
										multiple
										onChange={handleImageUpload}
										disabled={uploading}
										className="flex-1"
									/>
									{uploading && <p className="text-muted-foreground text-sm">Uploading...</p>}
								</div>
								{formData.imageUrls.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-2">
										{formData.imageUrls.map((url, index) => (
											<div key={index} className="group relative">
												<img
													src={url}
													alt={`Package ${index + 1}`}
													className="h-20 w-20 rounded border object-cover"
												/>
												<button
													type="button"
													onClick={() => handleRemoveImage(index)}
													className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
												>
													<X className="h-3 w-3" />
												</button>
												{index === 0 && (
													<div className="bg-primary/90 text-primary-foreground absolute right-0 bottom-0 left-0 py-0.5 text-center text-xs">
														Main
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id="available"
									checked={formData.isAvailable}
									onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
								/>
								<Label htmlFor="available">Package is available for purchase</Label>
							</div>
						</div>

						{/* Fixed Items */}
						<div className="space-y-4 border-t pt-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold">Fixed Items</h3>
									<p className="text-muted-foreground text-sm">
										Products that are always included in this package
									</p>
								</div>
								<Button type="button" variant="outline" size="sm" onClick={addPackageItem}>
									<Plus className="mr-2 h-4 w-4" />
									Add Item
								</Button>
							</div>

							{formData.items.length === 0 ? (
								<p className="text-muted-foreground py-4 text-center text-sm">
									No fixed items yet. Add items that will always be included.
								</p>
							) : (
								<div className="space-y-3">
									{formData.items.map((item, index) => (
										<div key={index} className="flex items-center gap-3">
											<Select
												value={item.productId}
												onValueChange={(value) => updatePackageItem(index, "productId", value)}
											>
												<SelectTrigger className="flex-1">
													<SelectValue placeholder="Select product" />
												</SelectTrigger>
												<SelectContent>
													{availableProducts.map((product) => (
														<SelectItem key={product.id} value={product.id}>
															{product.name} - ₱{product.price.toFixed(2)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<div className="flex items-center gap-2">
												<Label className="text-sm">Qty:</Label>
												<Input
													type="number"
													min="1"
													value={item.quantity}
													onChange={(e) =>
														updatePackageItem(index, "quantity", parseInt(e.target.value) || 1)
													}
													className="w-20"
												/>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => removePackageItem(index)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Selection Pools */}
						<div className="space-y-4 border-t pt-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold">Selection Pools</h3>
									<p className="text-muted-foreground text-sm">
										Let customers choose from a set of options (e.g., "Pick 2 shirts from 5")
									</p>
								</div>
								<Button type="button" variant="outline" size="sm" onClick={addPackagePool}>
									<Plus className="mr-2 h-4 w-4" />
									Add Pool
								</Button>
							</div>

							{formData.pools.length === 0 ? (
								<p className="text-muted-foreground py-4 text-center text-sm">
									No selection pools yet. Add pools to let customers choose between options.
								</p>
							) : (
								<div className="space-y-4">
									{formData.pools.map((pool, poolIndex) => (
										<Card key={poolIndex}>
											<CardHeader className="pb-3">
												<div className="flex items-center justify-between">
													<div className="flex flex-1 items-center gap-3">
														<Input
															value={pool.name}
															onChange={(e) => updatePackagePool(poolIndex, "name", e.target.value)}
															placeholder="Pool name (e.g., Choose your shirts)"
															className="flex-1"
														/>
														<div className="flex items-center gap-2">
															<Label className="text-sm whitespace-nowrap">Select:</Label>
															<Input
																type="number"
																min="1"
																max={pool.productIds.length || 1}
																value={pool.selectCount}
																onChange={(e) =>
																	updatePackagePool(
																		poolIndex,
																		"selectCount",
																		parseInt(e.target.value) || 1,
																	)
																}
																className="w-20"
															/>
														</div>
													</div>
													<div className="flex items-center gap-1">
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() =>
																setExpandedPools((prev) => ({
																	...prev,
																	[poolIndex]: !prev[poolIndex],
																}))
															}
														>
															{expandedPools[poolIndex] ? (
																<ChevronUp className="h-4 w-4" />
															) : (
																<ChevronDown className="h-4 w-4" />
															)}
														</Button>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => removePackagePool(poolIndex)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</div>
											</CardHeader>
											{expandedPools[poolIndex] && (
												<CardContent>
													<p className="text-muted-foreground mb-3 text-sm">
														Select products for this pool ({pool.productIds.length} selected):
													</p>
													<div className="grid grid-cols-2 gap-2 md:grid-cols-3">
														{availableProducts.map((product) => (
															<div
																key={product.id}
																className={`flex cursor-pointer items-center gap-2 rounded border p-2 transition-colors ${
																	pool.productIds.includes(product.id)
																		? "border-primary bg-primary/5"
																		: "hover:bg-muted"
																}`}
																onClick={() => togglePoolProduct(poolIndex, product.id)}
															>
																<Checkbox
																	checked={pool.productIds.includes(product.id)}
																	onCheckedChange={() => togglePoolProduct(poolIndex, product.id)}
																/>
																<div className="min-w-0 flex-1">
																	<p className="truncate text-sm font-medium">{product.name}</p>
																	<p className="text-muted-foreground text-xs">
																		₱{product.price.toFixed(2)}
																	</p>
																</div>
															</div>
														))}
													</div>
												</CardContent>
											)}
										</Card>
									))}
								</div>
							)}
						</div>

						<div className="flex gap-2 border-t pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseDialog}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || uploading} className="flex-1">
								{loading ? "Saving..." : editingPackage ? "Update Package" : "Create Package"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the package.
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
