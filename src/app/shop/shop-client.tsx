"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Package, ShoppingBag, Store, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { Session } from "@/lib/auth";

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	image: string | null;
	stock: number;
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
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});
	const [loadingCartItems, setLoadingCartItems] = useState<Record<string, boolean>>({});
	const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
	const [signingIn, setSigningIn] = useState(false);

	const filteredProducts =
		selectedCategory === "all" ? products : products.filter((p) => p.category === selectedCategory);

	// Fetch cart items on mount
	useEffect(() => {
		if (session?.user) {
			fetchCartItems();
		}
	}, [session]);

	// Listen for cart updates
	useEffect(() => {
		const handleCartUpdate = () => {
			fetchCartItems();
		};
		window.addEventListener("cartUpdated", handleCartUpdate);
		return () => window.removeEventListener("cartUpdated", handleCartUpdate);
	}, []);

	const fetchCartItems = async () => {
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
	};

	const getCartItem = (productId: string, size?: string | null) => {
		return cartItems.find(
			(item) => item.productId === productId && (size === undefined || item.size === size),
		);
	};

	const handleSignIn = async () => {
		setSigningIn(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/shop",
			});
		} catch (error) {
			setSigningIn(false);
		}
	};

	const handleAddToCart = async (productId: string, size?: string) => {
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
			} else {
				toast.error(result.message);
			}
		} finally {
			setLoadingProducts((prev) => ({ ...prev, [productId]: false }));
		}
	};

	const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
		setLoadingCartItems((prev) => ({ ...prev, [cartItemId]: true }));
		try {
			const result = await updateCartItemQuantity(cartItemId, newQuantity);
			if (result.success) {
				// Immediately update cart items for instant UI feedback
				await fetchCartItems();
			} else {
				toast.error(result.message || "Failed to update quantity");
			}
		} finally {
			setLoadingCartItems((prev) => ({ ...prev, [cartItemId]: false }));
		}
	};

	const getCategoryIcon = (category: string) => {
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
	};

	return (
		<div>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
							<Card key={product.id} className="flex flex-col">
								<CardHeader>
									<div className="bg-muted relative mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-lg">
										{product.image ? (
											<img
												src={product.image}
												alt={product.name}
												className="h-full w-full rounded-lg object-cover"
												loading="lazy"
											/>
										) : (
											<Package className="text-muted-foreground h-16 w-16" />
										)}
									</div>
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
									<CardDescription className="line-clamp-2">{product.description}</CardDescription>
								</CardHeader>
								<CardContent className="flex-1 space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-2xl font-bold">₱{product.price.toFixed(2)}</span>
										<span className="text-muted-foreground text-sm">
											{product.isPreOrder ? `${product.stock} ordered` : `Stock: ${product.stock}`}
										</span>
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
													(!product.isPreOrder && cartItem.quantity >= product.stock) ||
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
												(!product.isPreOrder && product.stock === 0) ||
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
												: !product.isPreOrder && product.stock === 0
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
