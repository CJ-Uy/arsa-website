"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
	ShoppingCart,
	Package,
	ShoppingBag,
	Store,
	Plus,
	Minus,
	Loader2,
	Search,
	ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { addToCart, getCart, updateCartItemQuantity } from "./actions";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "@/lib/auth";
import { ProductImageCarousel } from "@/components/features/product-image-carousel";

// Helper component to format product descriptions with lists
function ProductDescription({ description }: { description: string }) {
	// Split by newlines and identify list items (lines starting with - or •)
	const lines = description.split("\n");
	const elements: React.ReactNode[] = [];
	let currentText: string[] = [];
	let currentList: string[] = [];

	const flushText = () => {
		if (currentText.length > 0) {
			elements.push(
				<p key={`text-${elements.length}`} className="text-muted-foreground text-sm">
					{currentText.join("\n")}
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
					className="text-muted-foreground mt-2 space-y-1 text-sm"
				>
					{currentList.map((item, idx) => (
						<li key={idx} className="flex items-start gap-2">
							<span className="text-primary mt-0.5 text-xs">•</span>
							<span>{item}</span>
						</li>
					))}
				</ul>,
			);
			currentList = [];
		}
	};

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		// Check if line is a list item (starts with -, •, or *)
		if (trimmedLine.match(/^[-•*]\s+/)) {
			flushText();
			// Remove the bullet point and add to list
			currentList.push(trimmedLine.replace(/^[-•*]\s+/, ""));
		} else if (trimmedLine) {
			flushList();
			currentText.push(trimmedLine);
		}
	});

	// Flush any remaining content
	flushText();
	flushList();

	return <div className="space-y-1">{elements}</div>;
}

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	image: string | null;
	imageUrls: string[];
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	availableSizes: string[];
};

type CartItem = {
	id: string;
	productId: string;
	quantity: number;
	size: string | null;
};

type ShopClientProps = {
	initialProducts: Product[];
	session: Session | null;
};

export function ShopClient({ initialProducts, session }: ShopClientProps) {
	const [products] = useState<Product[]>(initialProducts);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc">(
		"name-asc",
	);
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});
	const [loadingCartItems, setLoadingCartItems] = useState<Record<string, boolean>>({});
	const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
	const [signingIn, setSigningIn] = useState(false);

	// Debug: Log session state
	useEffect(() => {
		console.log("ShopClient session:", session);
		console.log("Has user?", !!session?.user);
		console.log("Should show sign in?", !session?.user);
	}, [session]);

	// Memoize filtered, searched, and sorted products
	const filteredProducts = useMemo(() => {
		let filtered =
			selectedCategory === "all"
				? products
				: products.filter((p) => p.category === selectedCategory);

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
			);
		}

		// Apply sorting
		filtered = [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "name-asc":
					return a.name.localeCompare(b.name);
				case "name-desc":
					return b.name.localeCompare(a.name);
				case "price-asc":
					return a.price - b.price;
				case "price-desc":
					return b.price - a.price;
				default:
					return 0;
			}
		});

		return filtered;
	}, [selectedCategory, products, searchQuery, sortBy]);

	// Memoize fetchCartItems to avoid recreating on every render
	const fetchCartItems = useCallback(async () => {
		const result = await getCart();
		if (result.success && result.cart) {
			setCartItems(
				result.cart.map((item) => ({
					id: item.id,
					productId: item.productId,
					quantity: item.quantity,
					size: item.size,
				})),
			);
		}
	}, []);

	// Fetch cart items on mount
	useEffect(() => {
		if (session?.user) {
			fetchCartItems();
		}
	}, [session, fetchCartItems]);

	// Listen for cart updates
	useEffect(() => {
		const handleCartUpdate = () => {
			fetchCartItems();
		};
		window.addEventListener("cartUpdated", handleCartUpdate);
		return () => window.removeEventListener("cartUpdated", handleCartUpdate);
	}, [fetchCartItems]);

	// Memoize getCartItem to avoid recreating on every render
	const getCartItem = useCallback(
		(productId: string, size?: string | null) => {
			return cartItems.find(
				(item) => item.productId === productId && (size === undefined || item.size === size),
			);
		},
		[cartItems],
	);

	// Memoize handleSignIn to avoid recreating on every render
	const handleSignIn = useCallback(async () => {
		setSigningIn(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/shop",
			});
		} catch (error) {
			setSigningIn(false);
		}
	}, []);

	// Memoize handleAddToCart to avoid recreating on every render
	const handleAddToCart = useCallback(
		async (productId: string, size?: string) => {
			if (!session?.user) {
				toast.error("Please sign in to add items to cart", {
					action: {
						label: "Sign In",
						onClick: handleSignIn,
					},
				});
				return;
			}

			setLoadingProducts((prev) => ({ ...prev, [productId]: true }));
			try {
				const result = await addToCart(productId, 1, size);
				if (result.success) {
					// Immediately update cart items for instant UI feedback
					await fetchCartItems();
					toast.success(result.message);
					// Dispatch cart updated event for CartCounter
					window.dispatchEvent(new Event("cartUpdated"));
				} else {
					toast.error(result.message);
				}
			} finally {
				setLoadingProducts((prev) => ({ ...prev, [productId]: false }));
			}
		},
		[session?.user, handleSignIn, fetchCartItems],
	);

	// Memoize handleUpdateQuantity to avoid recreating on every render
	const handleUpdateQuantity = useCallback(
		async (cartItemId: string, newQuantity: number) => {
			setLoadingCartItems((prev) => ({ ...prev, [cartItemId]: true }));
			try {
				const result = await updateCartItemQuantity(cartItemId, newQuantity);
				if (result.success) {
					// Immediately update cart items for instant UI feedback
					await fetchCartItems();
					// Dispatch cart updated event for CartCounter
					window.dispatchEvent(new Event("cartUpdated"));
				} else {
					toast.error(result.message || "Failed to update quantity");
				}
			} finally {
				setLoadingCartItems((prev) => ({ ...prev, [cartItemId]: false }));
			}
		},
		[fetchCartItems],
	);

	// Memoize getCategoryIcon to avoid recreating on every render
	const getCategoryIcon = useCallback((category: string) => {
		switch (category) {
			case "merch":
				return <ShoppingBag className="h-4 w-4" />;
			case "arsari-sari":
				return <Store className="h-4 w-4" />;
			case "other":
				return <Package className="h-4 w-4" />;
			default:
				return <ShoppingCart className="h-4 w-4" />;
		}
	}, []);

	return (
		<div>
			{/* Category Tabs and Cart Button */}
			<div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Tabs
					value={selectedCategory}
					onValueChange={setSelectedCategory}
					className="w-full sm:w-auto"
				>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="merch">Merch</TabsTrigger>
						<TabsTrigger value="arsari-sari" className="text-xs sm:text-sm">
							Arsari-Sari
						</TabsTrigger>
						<TabsTrigger value="other">Other</TabsTrigger>
					</TabsList>
				</Tabs>

				{session?.user && (
					<Link href="/shop/cart" className="hidden w-full md:block md:w-auto">
						<Button variant="outline" className="w-full sm:ml-4 sm:w-auto">
							<ShoppingCart className="mr-2 h-4 w-4" />
							Cart
						</Button>
					</Link>
				)}
			</div>

			{/* Search and Sort Controls */}
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
				{/* Search Bar */}
				<div className="relative flex-1">
					<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						type="search"
						placeholder="Search products..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Sort Dropdown */}
				<Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
					<SelectTrigger className="w-full sm:w-[200px]">
						<ArrowUpDown className="mr-2 h-4 w-4" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="name-asc">Name (A-Z)</SelectItem>
						<SelectItem value="name-desc">Name (Z-A)</SelectItem>
						<SelectItem value="price-asc">Price (Low-High)</SelectItem>
						<SelectItem value="price-desc">Price (High-Low)</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{!session?.user && (
				<Card className="border-primary mb-6">
					<CardContent className="pt-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h3 className="mb-1 font-semibold">Sign in to shop</h3>
								<p className="text-muted-foreground text-sm">
									Sign in with your <span className="text-foreground font-semibold">email</span> to
									start shopping
								</p>
							</div>
							<Button onClick={handleSignIn} className="w-full sm:w-auto" disabled={signingIn}>
								{signingIn ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing In...
									</>
								) : (
									"Sign In with Google"
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{filteredProducts.length === 0 ? (
					<div className="col-span-full py-12 text-center">
						<Package className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
						<h3 className="mb-2 text-lg font-semibold">No products found</h3>
						<p className="text-muted-foreground">Check back later for new items!</p>
					</div>
				) : (
					filteredProducts.map((product) => {
						const selectedSize = selectedSizes[product.id];
						const cartItem = getCartItem(product.id, selectedSize);
						const isProductLoading = loadingProducts[product.id] ?? false;
						const isCartItemLoading = cartItem ? (loadingCartItems[cartItem.id] ?? false) : false;
						const requiresSize = product.availableSizes.length > 0;

						return (
							<Card key={product.id} className="flex flex-col overflow-hidden">
								<CardHeader className="pb-3">
									<ProductImageCarousel
										images={
											product.imageUrls.length > 0
												? product.imageUrls
												: product.image
													? [product.image]
													: []
										}
										productName={product.name}
										aspectRatio="square"
										showThumbnails={true}
										className="mb-4"
									/>
									<div className="flex items-start justify-between">
										<CardTitle className="text-lg">{product.name}</CardTitle>
										<div className="ml-2 flex gap-1">
											{product.isPreOrder && (
												<Badge variant="outline" className="text-xs">
													Pre-Order
												</Badge>
											)}
											<Badge variant="secondary">{getCategoryIcon(product.category)}</Badge>
										</div>
									</div>
									<ProductDescription description={product.description} />
								</CardHeader>
								<CardContent className="flex-1 space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-2xl font-bold">₱{product.price.toFixed(2)}</span>
									</div>

									{/* Size Selection */}
									{requiresSize && (
										<div>
											<Label htmlFor={`size-${product.id}`} className="text-xs">
												Select Size
											</Label>
											<Select
												value={selectedSize}
												onValueChange={(value) =>
													setSelectedSizes((prev) => ({ ...prev, [product.id]: value }))
												}
											>
												<SelectTrigger id={`size-${product.id}`} className="mt-1">
													<SelectValue placeholder="Choose size" />
												</SelectTrigger>
												<SelectContent>
													{product.availableSizes.map((size) => (
														<SelectItem key={size} value={size}>
															{size}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
								</CardContent>
								<CardFooter>
									{cartItem ? (
										<div className="flex w-full items-center justify-between gap-2">
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
												disabled={isCartItemLoading}
											>
												<Minus className="h-4 w-4" />
											</Button>
											{isCartItemLoading ? (
												<Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
											) : (
												<span className="text-lg font-semibold">{cartItem.quantity}</span>
											)}
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
												disabled={
													(!product.isPreOrder &&
														product.stock !== null &&
														cartItem.quantity >= product.stock) ||
													isCartItemLoading
												}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
									) : (
										<Button
											className="w-full"
											onClick={() => handleAddToCart(product.id, selectedSize)}
											disabled={
												(!product.isPreOrder && product.stock !== null && product.stock === 0) ||
												!product.isAvailable ||
												isProductLoading ||
												(requiresSize && !selectedSize)
											}
										>
											{isProductLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<ShoppingCart className="mr-2 h-4 w-4" />
											)}
											{isProductLoading
												? "Adding..."
												: !product.isPreOrder && product.stock !== null && product.stock === 0
													? "Out of Stock"
													: requiresSize && !selectedSize
														? "Select Size"
														: product.isPreOrder
															? "Pre-Order Now"
															: "Add to Cart"}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})
				)}
			</div>
		</div>
	);
}
