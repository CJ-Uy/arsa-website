"use client";

import { useState, useEffect, useRef } from "react";
import {
	Trash2,
	Plus,
	Minus,
	ShoppingBag,
	Loader2,
	Gift,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateCartItemQuantity, removeFromCart } from "../actions";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductImageCarousel } from "@/components/features/product-image-carousel";
import type { PackageSelections } from "../actions";

// Helper component to format product descriptions with lists
function ProductDescription({
	description,
	compact = false,
}: {
	description: string;
	compact?: boolean;
}) {
	const lines = description.split("\n");
	const elements: React.ReactNode[] = [];
	let currentText: string[] = [];
	let currentList: string[] = [];

	const flushText = () => {
		if (currentText.length > 0) {
			elements.push(
				<p
					key={`text-${elements.length}`}
					className={`text-muted-foreground text-sm ${compact ? "line-clamp-1" : ""}`}
				>
					{currentText.join(" ")}
				</p>,
			);
			currentText = [];
		}
	};

	const flushList = () => {
		if (currentList.length > 0) {
			elements.push(
				<ul
					key={`list-${elements.length}`}
					className={`text-muted-foreground space-y-0.5 text-xs ${compact ? "line-clamp-2" : "mt-1"}`}
				>
					{currentList.map((item, idx) => (
						<li key={idx} className="flex items-start gap-1.5">
							<span className="text-primary mt-0.5 text-xs">•</span>
							<span className="leading-tight">{item}</span>
						</li>
					))}
				</ul>,
			);
			currentList = [];
		}
	};

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		if (trimmedLine.match(/^[-•*]\s+/)) {
			flushText();
			currentList.push(trimmedLine.replace(/^[-•*]\s+/, ""));
		} else if (trimmedLine) {
			flushList();
			currentText.push(trimmedLine);
		}
	});

	flushText();
	flushList();

	return <div className={compact ? "space-y-0.5" : "space-y-1"}>{elements}</div>;
}

type CropPosition = {
	x: number;
	y: number;
};

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
	imageCropPositions: Record<string, CropPosition> | null;
	stock: number | null;
	sizePricing: Record<string, number> | null;
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

type Package = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
	imageCropPositions: Record<string, CropPosition> | null;
	items: PackageItem[];
	pools: PackagePool[];
};

type CartItem = {
	id: string;
	quantity: number;
	size: string | null;
	productId: string | null;
	packageId: string | null;
	packageSelections: PackageSelections | null;
	product: Product | null;
	package: Package | null;
};

type CartClientProps = {
	initialCart: CartItem[];
	removedItems?: string[];
};

export function CartClient({ initialCart, removedItems }: CartClientProps) {
	const router = useRouter();
	const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
	const [loading, setLoading] = useState<string | null>(null);
	const [checkoutLoading, setCheckoutLoading] = useState(false);
	const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
	const hasShownToast = useRef(false);

	// Show toast for removed sold-out items (only once)
	useEffect(() => {
		if (removedItems && removedItems.length > 0 && !hasShownToast.current) {
			hasShownToast.current = true;
			toast.warning(
				`The following items were removed from your cart because they are no longer available: ${removedItems.join(", ")}`,
				{ duration: 8000 },
			);
			// Trigger cart counter update
			window.dispatchEvent(new Event("cartUpdated"));
		}
	}, [removedItems]);

	// Helper to get correct product price based on size
	const getProductPrice = (item: CartItem) => {
		if (!item.product) return 0;

		// Check for size-specific pricing
		if (item.size && item.product.sizePricing) {
			const sizePrice = item.product.sizePricing[item.size];
			if (sizePrice) {
				return sizePrice;
			}
		}

		// Fall back to base price
		return item.product.price;
	};

	const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
		setLoading(cartItemId);
		const result = await updateCartItemQuantity(cartItemId, newQuantity);
		setLoading(null);

		if (result.success) {
			if (newQuantity === 0) {
				setCartItems(cartItems.filter((item) => item.id !== cartItemId));
			} else {
				setCartItems(
					cartItems.map((item) =>
						item.id === cartItemId ? { ...item, quantity: newQuantity } : item,
					),
				);
			}
			window.dispatchEvent(new Event("cartUpdated"));
		} else {
			toast.error(result.message || "Failed to update cart");
		}
	};

	const handleRemove = async (cartItemId: string) => {
		setLoading(cartItemId);
		const result = await removeFromCart(cartItemId);
		setLoading(null);

		if (result.success) {
			setCartItems(cartItems.filter((item) => item.id !== cartItemId));
			toast.success("Item removed from cart");
			window.dispatchEvent(new Event("cartUpdated"));
		} else {
			toast.error(result.message || "Failed to remove item");
		}
	};

	const togglePackageExpanded = (itemId: string) => {
		setExpandedPackages((prev) => ({
			...prev,
			[itemId]: !prev[itemId],
		}));
	};

	// Calculate total including both products and packages
	const total = cartItems.reduce((sum, item) => {
		if (item.product) {
			return sum + getProductPrice(item) * item.quantity;
		} else if (item.package) {
			return sum + item.package.price * item.quantity;
		}
		return sum;
	}, 0);

	const handleCheckout = () => {
		setCheckoutLoading(true);
		router.push("/shop/checkout");
	};

	if (cartItems.length === 0) {
		return (
			<div className="py-12 text-center">
				<ShoppingBag className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
				<h2 className="mb-2 text-2xl font-semibold">Your cart is empty</h2>
				<p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
				<Link href="/shop">
					<Button>Continue Shopping</Button>
				</Link>
			</div>
		);
	}

	// Get product name by ID from package selections
	const getProductFromPackage = (pkg: Package, productId: string): Product | null => {
		// Check fixed items
		const fixedItem = pkg.items.find((item) => item.productId === productId);
		if (fixedItem) return fixedItem.product;

		// Check pool options
		for (const pool of pkg.pools) {
			const option = pool.options.find((opt) => opt.productId === productId);
			if (option) return option.product;
		}

		return null;
	};

	return (
		<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<div className="space-y-4 lg:col-span-2">
				{cartItems.map((item) => {
					// Package item
					if (item.package) {
						const isExpanded = expandedPackages[item.id] ?? false;
						const selections = item.packageSelections as PackageSelections | null;

						return (
							<Card key={item.id} className="border-primary/20 border-2">
								<CardContent className="p-4 sm:p-6">
									<div className="flex flex-col gap-4 sm:flex-row">
										<div className="w-32 flex-shrink-0 sm:w-40">
											<div className="relative">
												<ProductImageCarousel
													images={
														item.package.imageUrls.length > 0
															? item.package.imageUrls
															: item.package.image
																? [item.package.image]
																: []
													}
													productName={item.package.name}
													aspectRatio="square"
													showThumbnails={false}
													imageCropPositions={item.package.imageCropPositions}
												/>
												<Badge className="bg-primary absolute top-2 left-2">
													<Gift className="mr-1 h-3 w-3" />
													Package
												</Badge>
											</div>
										</div>

										<div className="min-w-0 flex-1">
											<h3 className="mb-1 text-lg font-semibold">{item.package.name}</h3>
											<div className="mb-2">
												<ProductDescription description={item.package.description} compact={true} />
											</div>

											{/* Package selections summary */}
											<button
												className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 text-sm"
												onClick={() => togglePackageExpanded(item.id)}
											>
												{isExpanded ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												)}
												{isExpanded ? "Hide details" : "Show details"}
											</button>

											{isExpanded && selections && (
												<div className="bg-muted/50 mb-3 rounded-lg p-3">
													<p className="mb-2 text-sm font-medium">Your selections:</p>
													<ul className="space-y-1 text-sm">
														{selections.fixedItems.map((sel, idx) => {
															const product = getProductFromPackage(item.package!, sel.productId);
															return (
																<li key={idx} className="text-muted-foreground">
																	• {product?.name || "Unknown product"}
																	{sel.size && (
																		<span className="text-foreground ml-1">({sel.size})</span>
																	)}
																</li>
															);
														})}
														{selections.poolSelections.map((pool) =>
															pool.selections.map((sel, idx) => {
																const product = getProductFromPackage(item.package!, sel.productId);
																return (
																	<li key={`${pool.poolId}-${idx}`} className="text-primary">
																		• {product?.name || "Unknown product"}
																		{sel.size && (
																			<span className="text-foreground ml-1">({sel.size})</span>
																		)}
																	</li>
																);
															}),
														)}
													</ul>
												</div>
											)}

											<p className="text-lg font-bold">₱{item.package.price.toFixed(2)}</p>
										</div>

										<div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleRemove(item.id)}
												disabled={loading === item.id}
											>
												{loading === item.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>

											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
													disabled={loading === item.id || item.quantity <= 1}
												>
													{loading === item.id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Minus className="h-4 w-4" />
													)}
												</Button>
												<span className="w-12 text-center font-semibold">{item.quantity}</span>
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
													disabled={loading === item.id}
												>
													{loading === item.id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Plus className="h-4 w-4" />
													)}
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					}

					// Regular product item
					if (item.product) {
						return (
							<Card key={item.id}>
								<CardContent className="p-4 sm:p-6">
									<div className="flex flex-col gap-4 sm:flex-row">
										<div className="w-32 flex-shrink-0 sm:w-40">
											<ProductImageCarousel
												images={
													item.product.imageUrls.length > 0
														? item.product.imageUrls
														: item.product.image
															? [item.product.image]
															: []
												}
												productName={item.product.name}
												aspectRatio="square"
												showThumbnails={false}
												imageCropPositions={item.product.imageCropPositions}
											/>
										</div>

										<div className="min-w-0 flex-1">
											<h3 className="mb-1 text-lg font-semibold">{item.product.name}</h3>
											{item.size && (
												<p className="text-muted-foreground mb-1 text-sm">
													Size: <span className="text-foreground font-medium">{item.size}</span>
												</p>
											)}
											<div className="mb-2">
												<ProductDescription description={item.product.description} compact={true} />
											</div>
											<p className="text-lg font-bold">₱{getProductPrice(item).toFixed(2)}</p>
										</div>

										<div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleRemove(item.id)}
												disabled={loading === item.id}
											>
												{loading === item.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>

											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
													disabled={loading === item.id || item.quantity <= 1}
												>
													{loading === item.id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Minus className="h-4 w-4" />
													)}
												</Button>
												<span className="w-12 text-center font-semibold">{item.quantity}</span>
												<Button
													variant="outline"
													size="icon"
													onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
													disabled={
														loading === item.id ||
														(item.product.stock !== null && item.quantity >= item.product.stock)
													}
												>
													{loading === item.id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														<Plus className="h-4 w-4" />
													)}
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					}

					return null;
				})}
			</div>

			<div className="lg:col-span-1">
				<Card className="sticky top-4">
					<CardContent className="p-6">
						<h2 className="mb-4 text-xl font-bold">Order Summary</h2>

						<div className="mb-4 space-y-2">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Subtotal ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
								</span>
								<span>₱{total.toFixed(2)}</span>
							</div>
						</div>

						<div className="mb-6 border-t pt-4">
							<div className="flex justify-between text-lg font-bold">
								<span>Total</span>
								<span>₱{total.toFixed(2)}</span>
							</div>
						</div>

						<Button
							className="w-full"
							size="lg"
							onClick={handleCheckout}
							disabled={checkoutLoading}
						>
							{checkoutLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Proceeding to Checkout...
								</>
							) : (
								"Proceed to Checkout"
							)}
						</Button>

						<Link href="/shop">
							<Button variant="outline" className="mt-2 w-full">
								Continue Shopping
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
