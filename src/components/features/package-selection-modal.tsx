"use client";

import { useState, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { addPackageToCart, type PackageSelections } from "@/app/shop/actions";
import { toast } from "sonner";
import { Gift, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";

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

type PackageSelectionModalProps = {
	package: PackageType;
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
};

type FixedItemSelection = {
	productId: string;
	itemIndex: number;
	size: string | null;
};

type PoolSelection = {
	poolId: string;
	selections: Array<{
		productId: string;
		size: string | null;
	}>;
};

export function PackageSelectionModal({
	package: pkg,
	open,
	onClose,
	onSuccess,
}: PackageSelectionModalProps) {
	const [loading, setLoading] = useState(false);
	const [useSameSize, setUseSameSize] = useState(true);
	const [globalSize, setGlobalSize] = useState<string>("");
	const [fixedItemSizes, setFixedItemSizes] = useState<Record<string, string>>({});
	const [poolSelections, setPoolSelections] = useState<Record<string, string[]>>({});
	const [poolItemSizes, setPoolItemSizes] = useState<Record<string, Record<string, string>>>({});
	const [expandedPools, setExpandedPools] = useState<Record<string, boolean>>(
		pkg.pools.reduce((acc, pool) => ({ ...acc, [pool.id]: true }), {}),
	);

	// Get all unique sizes from all products in the package
	const allSizes = useMemo(() => {
		const sizes = new Set<string>();

		pkg.items.forEach((item) => {
			item.product.availableSizes.forEach((size) => sizes.add(size));
		});

		pkg.pools.forEach((pool) => {
			pool.options.forEach((option) => {
				option.product.availableSizes.forEach((size) => sizes.add(size));
			});
		});

		// Sort sizes in a logical order
		const sizeOrder = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
		return Array.from(sizes).sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
	}, [pkg]);

	// Check if any product requires size
	const hasAnyProductWithSize = useMemo(() => {
		const hasFixedWithSize = pkg.items.some((item) => item.product.availableSizes.length > 0);
		const hasPoolWithSize = pkg.pools.some((pool) =>
			pool.options.some((option) => option.product.availableSizes.length > 0),
		);
		return hasFixedWithSize || hasPoolWithSize;
	}, [pkg]);

	// Toggle pool product selection
	const togglePoolProduct = (poolId: string, productId: string) => {
		setPoolSelections((prev) => {
			const current = prev[poolId] || [];
			const pool = pkg.pools.find((p) => p.id === poolId);
			if (!pool) return prev;

			if (current.includes(productId)) {
				return { ...prev, [poolId]: current.filter((id) => id !== productId) };
			} else {
				// Check if we've reached the selection limit
				if (current.length >= pool.selectCount) {
					toast.error(`You can only select ${pool.selectCount} items from this pool`);
					return prev;
				}
				return { ...prev, [poolId]: [...current, productId] };
			}
		});
	};

	// Set size for a pool item
	const setPoolItemSize = (poolId: string, productId: string, size: string) => {
		setPoolItemSizes((prev) => ({
			...prev,
			[poolId]: {
				...(prev[poolId] || {}),
				[productId]: size,
			},
		}));
	};

	// Validate selections
	const validateSelections = (): { valid: boolean; message?: string } => {
		// Validate fixed items have sizes if required
		for (const item of pkg.items) {
			if (item.product.availableSizes.length > 0) {
				for (let i = 0; i < item.quantity; i++) {
					const key = `${item.productId}-${i}`;
					const size = useSameSize ? globalSize : fixedItemSizes[key];
					if (!size) {
						return {
							valid: false,
							message: `Please select a size for ${item.product.name}${item.quantity > 1 ? ` (item ${i + 1})` : ""}`,
						};
					}
				}
			}
		}

		// Validate pool selections
		for (const pool of pkg.pools) {
			const selected = poolSelections[pool.id] || [];
			if (selected.length !== pool.selectCount) {
				return {
					valid: false,
					message: `Please select ${pool.selectCount} item${pool.selectCount > 1 ? "s" : ""} from "${pool.name}"`,
				};
			}

			// Validate sizes for selected pool items
			for (const productId of selected) {
				const option = pool.options.find((o) => o.productId === productId);
				if (option?.product.availableSizes.length) {
					const size = useSameSize ? globalSize : poolItemSizes[pool.id]?.[productId];
					if (!size) {
						return {
							valid: false,
							message: `Please select a size for ${option.product.name}`,
						};
					}
				}
			}
		}

		return { valid: true };
	};

	const handleSubmit = async () => {
		const validation = validateSelections();
		if (!validation.valid) {
			toast.error(validation.message);
			return;
		}

		setLoading(true);

		try {
			// Build selections object
			const fixedItems: FixedItemSelection[] = [];
			for (const item of pkg.items) {
				for (let i = 0; i < item.quantity; i++) {
					const key = `${item.productId}-${i}`;
					fixedItems.push({
						productId: item.productId,
						itemIndex: i,
						size:
							item.product.availableSizes.length > 0
								? useSameSize
									? globalSize
									: fixedItemSizes[key]
								: null,
					});
				}
			}

			const poolSelectionsData: PoolSelection[] = pkg.pools.map((pool) => ({
				poolId: pool.id,
				selections: (poolSelections[pool.id] || []).map((productId) => {
					const option = pool.options.find((o) => o.productId === productId);
					return {
						productId,
						size: option?.product.availableSizes.length
							? useSameSize
								? globalSize
								: poolItemSizes[pool.id]?.[productId] || null
							: null,
					};
				}),
			}));

			const selections: PackageSelections = {
				fixedItems,
				poolSelections: poolSelectionsData,
			};

			const result = await addPackageToCart(pkg.id, 1, selections);

			if (result.success) {
				toast.success(result.message);
				onSuccess();
				onClose();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error("Failed to add package to cart");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Gift className="h-5 w-5" />
						{pkg.name}
					</DialogTitle>
					<DialogDescription>Configure your package selections below</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[60vh] pr-4">
					<div className="space-y-6">
						{/* Same Size Toggle */}
						{hasAnyProductWithSize && (
							<div className="bg-muted/50 rounded-lg p-4">
								<div className="flex items-center justify-between">
									<div>
										<Label className="font-medium">Use same size for all items</Label>
										<p className="text-muted-foreground text-sm">
											Apply the same size to all products in this package
										</p>
									</div>
									<Switch checked={useSameSize} onCheckedChange={setUseSameSize} />
								</div>

								{useSameSize && (
									<div className="mt-4">
										<Label>Select Size</Label>
										<Select value={globalSize} onValueChange={setGlobalSize}>
											<SelectTrigger className="mt-1">
												<SelectValue placeholder="Choose size for all items" />
											</SelectTrigger>
											<SelectContent>
												{allSizes.map((size) => (
													<SelectItem key={size} value={size}>
														{size}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}
							</div>
						)}

						{/* Fixed Items */}
						{pkg.items.length > 0 && (
							<div>
								<h3 className="mb-3 font-semibold">Included Items</h3>
								<div className="space-y-3">
									{pkg.items.map((item) => (
										<div key={item.id}>
											{Array.from({ length: item.quantity }).map((_, index) => {
												const key = `${item.productId}-${index}`;
												const hasSize = item.product.availableSizes.length > 0;

												return (
													<Card key={key} className="mb-2">
														<CardContent className="flex items-center gap-4 py-3">
															{item.product.imageUrls[0] && (
																<img
																	src={item.product.imageUrls[0]}
																	alt={item.product.name}
																	className="h-16 w-16 rounded object-cover"
																/>
															)}
															<div className="flex-1">
																<p className="font-medium">
																	{item.product.name}
																	{item.quantity > 1 && (
																		<span className="text-muted-foreground ml-1 text-sm">
																			({index + 1} of {item.quantity})
																		</span>
																	)}
																</p>
																<p className="text-muted-foreground text-sm">
																	₱{item.product.price.toFixed(2)}
																</p>
															</div>

															{hasSize && !useSameSize && (
																<Select
																	value={fixedItemSizes[key] || ""}
																	onValueChange={(value) =>
																		setFixedItemSizes((prev) => ({
																			...prev,
																			[key]: value,
																		}))
																	}
																>
																	<SelectTrigger className="w-24">
																		<SelectValue placeholder="Size" />
																	</SelectTrigger>
																	<SelectContent>
																		{item.product.availableSizes.map((size) => (
																			<SelectItem key={size} value={size}>
																				{size}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															)}

															{hasSize && useSameSize && globalSize && (
																<Badge variant="secondary">{globalSize}</Badge>
															)}
														</CardContent>
													</Card>
												);
											})}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Selection Pools */}
						{pkg.pools.map((pool) => {
							const selected = poolSelections[pool.id] || [];
							const isExpanded = expandedPools[pool.id];

							return (
								<div key={pool.id}>
									<Separator className="my-4" />
									<div
										className="flex cursor-pointer items-center justify-between"
										onClick={() =>
											setExpandedPools((prev) => ({
												...prev,
												[pool.id]: !prev[pool.id],
											}))
										}
									>
										<div>
											<h3 className="font-semibold">{pool.name}</h3>
											<p className="text-muted-foreground text-sm">
												Select {pool.selectCount} item{pool.selectCount > 1 ? "s" : ""} (
												{selected.length}/{pool.selectCount} selected)
											</p>
										</div>
										{isExpanded ? (
											<ChevronUp className="h-5 w-5" />
										) : (
											<ChevronDown className="h-5 w-5" />
										)}
									</div>

									{isExpanded && (
										<div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
											{pool.options.map((option) => {
												const isSelected = selected.includes(option.productId);
												const hasSize = option.product.availableSizes.length > 0;

												return (
													<Card
														key={option.id}
														className={`cursor-pointer transition-colors ${
															isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
														}`}
														onClick={() => togglePoolProduct(pool.id, option.productId)}
													>
														<CardContent className="flex items-center gap-3 py-3">
															<Checkbox
																checked={isSelected}
																onCheckedChange={() => togglePoolProduct(pool.id, option.productId)}
															/>
															{option.product.imageUrls[0] && (
																<img
																	src={option.product.imageUrls[0]}
																	alt={option.product.name}
																	className="h-12 w-12 rounded object-cover"
																/>
															)}
															<div className="min-w-0 flex-1">
																<p className="truncate text-sm font-medium">
																	{option.product.name}
																</p>
																<p className="text-muted-foreground text-xs">
																	₱{option.product.price.toFixed(2)}
																</p>
															</div>

															{isSelected && hasSize && !useSameSize && (
																<Select
																	value={poolItemSizes[pool.id]?.[option.productId] || ""}
																	onValueChange={(value) =>
																		setPoolItemSize(pool.id, option.productId, value)
																	}
																>
																	<SelectTrigger
																		className="w-20"
																		onClick={(e) => e.stopPropagation()}
																	>
																		<SelectValue placeholder="Size" />
																	</SelectTrigger>
																	<SelectContent>
																		{option.product.availableSizes.map((size) => (
																			<SelectItem key={size} value={size}>
																				{size}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															)}

															{isSelected && hasSize && useSameSize && globalSize && (
																<Badge variant="secondary" className="text-xs">
																	{globalSize}
																</Badge>
															)}

															{isSelected && <Check className="text-primary h-5 w-5" />}
														</CardContent>
													</Card>
												);
											})}
										</div>
									)}
								</div>
							);
						})}

						{/* Special Note */}
						{pkg.specialNote && (
							<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
								<p className="text-sm text-yellow-800 dark:text-yellow-200">{pkg.specialNote}</p>
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Footer */}
				<div className="flex items-center justify-between border-t pt-4">
					<div>
						<p className="text-lg font-bold">₱{pkg.price.toFixed(2)}</p>
						<p className="text-muted-foreground text-sm">Package total</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} disabled={loading}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={loading}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding...
								</>
							) : (
								<>
									<Gift className="mr-2 h-4 w-4" />
									Add to Cart
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
