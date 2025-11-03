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
import { Package, Plus, Edit2, Trash2, Upload } from "lucide-react";
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
	category: string;
	image: string | null;
	stock: number;
	isAvailable: boolean;
};

type ProductsManagementProps = {
	initialProducts: Product[];
};

type ProductFormData = {
	name: string;
	description: string;
	price: number;
	category: string;
	image: string;
	stock: number;
	isAvailable: boolean;
};

export function ProductsManagement({ initialProducts }: ProductsManagementProps) {
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
		stock: 0,
		isAvailable: true,
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: 0,
			category: "merch",
			image: "",
			stock: 0,
			isAvailable: true,
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
				stock: product.stock,
				isAvailable: product.isAvailable,
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
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Please upload an image file");
			return;
		}

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("type", "product");

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			const { url } = await response.json();
			setFormData((prev) => ({ ...prev, image: url }));
			toast.success("Image uploaded");
		} catch (error) {
			toast.error("Failed to upload image");
		} finally {
			setUploading(false);
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
								<div className="bg-muted mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-lg">
									{product.image ? (
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
									<span>Stock: {product.stock}</span>
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
								<Label htmlFor="stock">Stock *</Label>
								<Input
									id="stock"
									type="number"
									min="0"
									value={formData.stock}
									onChange={(e) =>
										setFormData({
											...formData,
											stock: parseInt(e.target.value),
										})
									}
									required
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="category">Category *</Label>
							<Select
								value={formData.category}
								onValueChange={(value) => setFormData({ ...formData, category: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="merch">Merch</SelectItem>
									<SelectItem value="arsari-sari">Arsari-Sari</SelectItem>
									<SelectItem value="services">Services</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="image">Product Image</Label>
							<div className="mt-2 flex gap-2">
								<Input
									id="image-file"
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									disabled={uploading}
									className="flex-1"
								/>
								{uploading && <p className="text-muted-foreground text-sm">Uploading...</p>}
							</div>
							{formData.image && (
								<div className="mt-2">
									<img
										src={formData.image}
										alt="Preview"
										className="h-32 w-32 rounded object-cover"
									/>
								</div>
							)}
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
