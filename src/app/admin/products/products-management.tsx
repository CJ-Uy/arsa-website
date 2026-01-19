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
import { createProduct, updateProduct, deleteProduct } from "./actions";
import { toast } from "sonner";
import { Package, Plus, Edit2, Trash2, Upload, X, RotateCw, GripVertical } from "lucide-react";
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

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: "merch" | "arsari-sari" | "other";
	image: string | null;
	imageUrls: string[];
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	availableSizes: string[];
	specialNote: string | null;
	isEventExclusive: boolean;
	sizePricing: Record<string, number> | null;
	eventProducts: Array<{ eventId: string; eventPrice: number | null }>;
};

type ProductsManagementProps = {
	initialProducts: Product[];
	availableEvents: Array<{ id: string; name: string }>;
};

type ProductFormData = {
	name: string;
	description: string;
	price: number;
	category: "merch" | "arsari-sari" | "other";
	image: string;
	imageUrls: string[];
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	availableSizes: string[];
	specialNote: string;
	isEventExclusive: boolean;
	sizePricing: Record<string, number>;
	assignedEvents: Array<{ eventId: string; eventPrice: number | null }>;
};

export function ProductsManagement({ initialProducts, availableEvents }: ProductsManagementProps) {
	const [products, setProducts] = useState<Product[]>(initialProducts);
	const [showDialog, setShowDialog] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [productToDelete, setProductToDelete] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [loading, setLoading] = useState(false);

	const [formData, setFormData] = useState<ProductFormData>({
		name: "",
		description: "",
		price: 0,
		category: "merch",
		image: "",
		imageUrls: [],
		stock: null,
		isAvailable: true,
		isPreOrder: false,
		availableSizes: [],
		specialNote: "",
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: 0,
			category: "merch",
			image: "",
			imageUrls: [],
			stock: null,
			isAvailable: true,
			isPreOrder: false,
			availableSizes: [],
			specialNote: "",
			isEventExclusive: false,
			sizePricing: {},
			assignedEvents: [],
		});
		setEditingProduct(null);
	};

	const handleOpenDialog = (product?: Product) => {
		if (product) {
			setEditingProduct(product);
			setFormData({
				name: product.name,
				description: product.description,
				price: product.price,
				category: product.category,
				image: product.image || "",
				imageUrls: product.imageUrls || [],
				stock: product.stock,
				isAvailable: product.isAvailable,
				isPreOrder: product.isPreOrder,
				availableSizes: product.availableSizes,
				specialNote: product.specialNote || "",
				isEventExclusive: product.isEventExclusive,
				sizePricing: product.sizePricing || {},
				assignedEvents: product.eventProducts || [],
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

		// Validate all files are images
		const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
		if (validFiles.length === 0) {
			toast.error("Please upload image files only");
			return;
		}

		if (validFiles.length !== files.length) {
			toast.error("Some files were skipped (not images)");
		}

		setUploading(true);
		try {
			const uploadPromises = validFiles.map(async (file) => {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("type", "product");

				const response = await fetch("/api/upload", {
					method: "POST",
					body: formData,
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
				// Set first image as main image if not set
				image: prev.image || urls[0],
			}));

			toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
		} catch (error) {
			toast.error("Failed to upload images");
		} finally {
			setUploading(false);
			// Reset the file input
			e.target.value = "";
		}
	};

	const handleRemoveImage = (index: number) => {
		setFormData((prev) => ({
			...prev,
			imageUrls: prev.imageUrls.filter((_, i) => i !== index),
		}));
		toast.success("Image removed");
	};

	const handleRotateImage = async (index: number) => {
		const imageUrl = formData.imageUrls[index];
		setUploading(true);
		try {
			// Fetch the image
			const response = await fetch(imageUrl);
			const blob = await response.blob();

			// Create a canvas to rotate the image
			const img = new Image();
			img.crossOrigin = "anonymous";

			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = URL.createObjectURL(blob);
			});

			const canvas = document.createElement("canvas");
			canvas.width = img.height;
			canvas.height = img.width;
			const ctx = canvas.getContext("2d");

			if (ctx) {
				ctx.translate(canvas.width / 2, canvas.height / 2);
				ctx.rotate((90 * Math.PI) / 180);
				ctx.drawImage(img, -img.width / 2, -img.height / 2);

				// Convert canvas to blob and upload
				canvas.toBlob(
					async (rotatedBlob) => {
						if (rotatedBlob) {
							const formDataUpload = new FormData();
							formDataUpload.append("file", rotatedBlob, "rotated.jpg");
							formDataUpload.append("type", "product");

							const uploadResponse = await fetch("/api/upload", {
								method: "POST",
								body: formDataUpload,
							});

							if (uploadResponse.ok) {
								const { url } = await uploadResponse.json();
								setFormData((prev) => ({
									...prev,
									imageUrls: prev.imageUrls.map((u, i) => (i === index ? url : u)),
								}));
								toast.success("Image rotated");
							}
						}
						setUploading(false);
					},
					"image/jpeg",
					0.9,
				);
			}
		} catch (error) {
			toast.error("Failed to rotate image");
			setUploading(false);
		}
	};

	const handleReorderImages = (fromIndex: number, toIndex: number) => {
		setFormData((prev) => {
			const newUrls = [...prev.imageUrls];
			const [movedItem] = newUrls.splice(fromIndex, 1);
			newUrls.splice(toIndex, 0, movedItem);
			return {
				...prev,
				imageUrls: newUrls,
				image: newUrls[0] || prev.image,
			};
		});
	};

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", index.toString());
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
		e.preventDefault();
		const fromIndex = parseInt(e.dataTransfer.getData("text/html"));
		if (fromIndex !== toIndex) {
			handleReorderImages(fromIndex, toIndex);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const result = editingProduct
				? await updateProduct(editingProduct.id, formData)
				: await createProduct(formData);

			if (result.success) {
				toast.success(editingProduct ? "Product updated" : "Product created");
				handleCloseDialog();
				// Refresh products list
				window.location.reload();
			} else {
				toast.error(result.message || "Failed to save product");
			}
		} catch (error) {
			toast.error("An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!productToDelete) return;

		const result = await deleteProduct(productToDelete);
		if (result.success) {
			setProducts(products.filter((p) => p.id !== productToDelete));
			toast.success("Product deleted");
			setShowDeleteDialog(false);
			setProductToDelete(null);
		} else {
			toast.error(result.message || "Failed to delete product");
		}
	};

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<p className="text-muted-foreground text-sm">Total Products: {products.length}</p>
				</div>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className="mr-2 h-4 w-4" />
					Add Product
				</Button>
			</div>

			{/* Products Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{products.length === 0 ? (
					<Card className="col-span-full">
						<CardContent className="py-12 text-center">
							<Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<p className="text-muted-foreground">No products yet</p>
						</CardContent>
					</Card>
				) : (
					products.map((product) => (
						<Card key={product.id}>
							<CardHeader>
								<div className="bg-muted relative mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-lg">
									{product.imageUrls && product.imageUrls.length > 0 ? (
										<>
											<img
												src={product.imageUrls[0]}
												alt={product.name}
												className="h-full w-full object-cover"
											/>
											{product.imageUrls.length > 1 && (
												<div className="bg-background/80 absolute right-2 bottom-2 rounded-full px-2 py-1 text-xs backdrop-blur-sm">
													+{product.imageUrls.length - 1}
												</div>
											)}
										</>
									) : product.image ? (
										<img
											src={product.image}
											alt={product.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<Package className="text-muted-foreground h-16 w-16" />
									)}
								</div>
								<div className="flex items-start justify-between">
									<CardTitle className="text-lg">{product.name}</CardTitle>
									<Badge variant={product.isAvailable ? "default" : "secondary"}>
										{product.isAvailable ? "Available" : "Unavailable"}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>
								<div className="flex items-center justify-between text-sm">
									<span className="text-2xl font-bold">₱{product.price.toFixed(2)}</span>
									{product.stock !== null && (
										<span className="text-muted-foreground text-sm">Stock: {product.stock}</span>
									)}
								</div>
								<Badge variant="outline">{product.category}</Badge>
								<div className="flex gap-2 pt-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1"
										onClick={() => handleOpenDialog(product)}
									>
										<Edit2 className="mr-2 h-4 w-4" />
										Edit
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setProductToDelete(product.id);
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

			{/* Add/Edit Product Dialog */}
			<Dialog open={showDialog} onOpenChange={handleCloseDialog}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
						<DialogDescription>Fill in the product details below</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="name">Product Name *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
								placeholder="e.g., This bundle includes multiple sizes. Please specify your size preferences in the special instructions."
							/>
							<p className="text-muted-foreground mt-1 text-xs">
								If set, this warning appears above the Special Instructions field during checkout
							</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="price">Price *</Label>
								<Input
									id="price"
									type="number"
									step="0.01"
									min="0"
									value={formData.price}
									onChange={(e) =>
										setFormData({
											...formData,
											price: parseFloat(e.target.value),
										})
									}
									required
								/>
							</div>

							<div>
								<Label htmlFor="stock">Stock (optional)</Label>
								<Input
									id="stock"
									type="number"
									min="0"
									value={formData.stock ?? ""}
									onChange={(e) =>
										setFormData({
											...formData,
											stock: e.target.value ? parseInt(e.target.value) : null,
										})
									}
									placeholder="Leave empty to hide stock"
								/>
								<p className="text-muted-foreground mt-1 text-xs">
									Leave empty if you don't want to track stock
								</p>
							</div>
						</div>

						<div>
							<Label htmlFor="category">Category *</Label>
							<Select
								value={formData.category}
								onValueChange={(value) =>
									setFormData({
										...formData,
										category: value as "merch" | "arsari-sari" | "other",
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="merch">Merch</SelectItem>
									<SelectItem value="arsari-sari">Arsari-Sari</SelectItem>
									<SelectItem value="other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="image">Product Images</Label>
							<p className="text-muted-foreground mb-2 text-xs">
								Upload multiple images for a carousel. First image will be the main display.
							</p>
							<div className="mt-2 flex items-center gap-2">
								<Input
									id="image-file"
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageUpload}
									disabled={uploading}
									className="flex-1"
								/>
								{uploading && <p className="text-muted-foreground text-sm">Uploading...</p>}
							</div>
							{formData.imageUrls && formData.imageUrls.length > 0 && (
								<div className="mt-3">
									<p className="mb-2 text-sm font-medium">Uploaded Images:</p>
									<p className="text-muted-foreground mb-3 text-xs">
										Drag images to reorder. First image is the main display image.
									</p>
									<div className="flex flex-wrap gap-2">
										{formData.imageUrls.map((url, index) => (
											<div
												key={index}
												draggable
												onDragStart={(e) => handleDragStart(e, index)}
												onDragOver={handleDragOver}
												onDrop={(e) => handleDrop(e, index)}
												className="group relative cursor-move"
											>
												<img
													src={url}
													alt={`Product ${index + 1}`}
													className="border-border h-24 w-24 rounded border-2 object-cover"
												/>
												{/* Drag handle indicator */}
												<div className="bg-background/80 absolute top-1 left-1 rounded p-0.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
													<GripVertical className="h-3 w-3" />
												</div>
												{/* Rotate button */}
												<button
													type="button"
													onClick={() => handleRotateImage(index)}
													disabled={uploading}
													className="bg-background/80 hover:bg-background absolute top-1 right-1 rounded p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
													title="Rotate 90° clockwise"
												>
													<RotateCw className="h-3 w-3" />
												</button>
												{/* Remove button */}
												<button
													type="button"
													onClick={() => handleRemoveImage(index)}
													className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
													title="Remove image"
												>
													<X className="h-3 w-3" />
												</button>
												{/* Main image badge */}
												{index === 0 && (
													<div className="bg-primary/90 text-primary-foreground absolute right-0 bottom-0 left-0 py-0.5 text-center text-xs font-medium">
														Main
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Size Selection */}
						<div>
							<Label>Available Sizes (optional)</Label>
							<p className="text-muted-foreground mb-2 text-xs">
								Select sizes if this product requires size selection (e.g., T-shirts)
							</p>
							<div className="flex flex-wrap gap-2">
								{["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((size) => (
									<div key={size} className="flex items-center space-x-2">
										<input
											type="checkbox"
											id={`size-${size}`}
											checked={formData.availableSizes.includes(size)}
											onChange={(e) => {
												if (e.target.checked) {
													setFormData({
														...formData,
														availableSizes: [...formData.availableSizes, size],
													});
												} else {
													setFormData({
														...formData,
														availableSizes: formData.availableSizes.filter((s) => s !== size),
													});
												}
											}}
											className="h-4 w-4"
										/>
										<Label htmlFor={`size-${size}`} className="cursor-pointer">
											{size}
										</Label>
									</div>
								))}
							</div>
						</div>

						{/* Size-Specific Pricing */}
						{formData.availableSizes.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label>Size-Specific Pricing (Optional)</Label>
									<p className="text-muted-foreground text-xs">
										Leave empty to use base price for all sizes
									</p>
								</div>
								<div className="grid grid-cols-2 gap-2">
									{formData.availableSizes.map((size) => (
										<div key={size} className="flex items-center gap-2">
											<Label className="w-12 text-sm">{size}:</Label>
											<Input
												type="number"
												step="0.01"
												placeholder={`₱${formData.price}`}
												value={formData.sizePricing[size] || ""}
												onChange={(e) => {
													const value = e.target.value;
													const newPricing = { ...formData.sizePricing };
													if (value) {
														newPricing[size] = parseFloat(value);
													} else {
														delete newPricing[size];
													}
													setFormData({
														...formData,
														sizePricing: newPricing,
													});
												}}
											/>
										</div>
									))}
								</div>
								<p className="text-muted-foreground text-xs">
									Shop will show price range (e.g., "₱100 - ₱200") if sizes have different prices
								</p>
							</div>
						)}

						{/* Event Assignment */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label>Event Assignment (Optional)</Label>
								<div className="flex items-center space-x-2">
									<Switch
										id="isEventExclusive"
										checked={formData.isEventExclusive}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, isEventExclusive: checked })
										}
									/>
									<Label htmlFor="isEventExclusive" className="text-sm font-normal">
										Event Exclusive
									</Label>
								</div>
							</div>
							<p className="text-muted-foreground text-xs">
								{formData.isEventExclusive
									? "This product will ONLY appear under assigned event tabs"
									: "This product will appear in All/categories AND assigned event tabs"}
							</p>

							{availableEvents.length > 0 && (
								<div className="space-y-2">
									{availableEvents.map((event) => {
										const isAssigned =
											formData.assignedEvents?.some((e) => e.eventId === event.id) ?? false;
										const eventData = formData.assignedEvents?.find((e) => e.eventId === event.id);

										return (
											<Card key={event.id} className="p-3">
												<div className="flex items-start justify-between gap-3">
													<div className="flex flex-1 items-center space-x-2">
														<input
															type="checkbox"
															checked={isAssigned}
															onChange={(e) => {
																if (e.target.checked) {
																	setFormData({
																		...formData,
																		assignedEvents: [
																			...formData.assignedEvents,
																			{ eventId: event.id, eventPrice: null },
																		],
																	});
																} else {
																	setFormData({
																		...formData,
																		assignedEvents: formData.assignedEvents.filter(
																			(ev) => ev.eventId !== event.id,
																		),
																	});
																}
															}}
														/>
														<Label className="cursor-pointer font-medium">{event.name}</Label>
													</div>

													{isAssigned && (
														<div className="flex items-center gap-2">
															<Label className="text-xs whitespace-nowrap">Event Price:</Label>
															<Input
																type="number"
																step="0.01"
																placeholder={`₱${formData.price}`}
																className="w-24"
																value={eventData?.eventPrice || ""}
																onChange={(e) => {
																	const value = e.target.value;
																	setFormData({
																		...formData,
																		assignedEvents: formData.assignedEvents.map((ev) =>
																			ev.eventId === event.id
																				? { ...ev, eventPrice: value ? parseFloat(value) : null }
																				: ev,
																		),
																	});
																}}
															/>
														</div>
													)}
												</div>
											</Card>
										);
									})}
								</div>
							)}
						</div>

						{/* Pre-Order Mode */}
						<div className="flex items-center space-x-2">
							<Switch
								id="preOrder"
								checked={formData.isPreOrder}
								onCheckedChange={(checked) => setFormData({ ...formData, isPreOrder: checked })}
							/>
							<div>
								<Label htmlFor="preOrder">Pre-Order Mode</Label>
								<p className="text-muted-foreground text-xs">
									Stock count will reflect number of orders received
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-2">
							<Switch
								id="available"
								checked={formData.isAvailable}
								onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
							/>
							<Label htmlFor="available">Product is available for purchase</Label>
						</div>

						<div className="flex gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseDialog}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || uploading} className="flex-1">
								{loading ? "Saving..." : editingProduct ? "Update" : "Create"}
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
							This action cannot be undone. This will permanently delete the product.
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
