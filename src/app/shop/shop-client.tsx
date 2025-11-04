"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Package, ShoppingBag, Store, Plus, Minus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
};

type CartItem = {
	id: string;
	productId: string;
	quantity: number;
};

type ShopClientProps = {
	initialProducts: Product[];
	session: Session | null;
};

export function ShopClient({ initialProducts, session }: ShopClientProps) {
	const [products] = useState<Product[]>(initialProducts);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [cartItems, setCartItems] = useState<CartItem[]>([]);

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
				})),
			);
		}
	};

	const getCartItem = (productId: string) => {
		return cartItems.find((item) => item.productId === productId);
	};

	const handleAddToCart = async (productId: string) => {
		if (!session?.user) {
			toast.error("Please sign in to add items to cart", {
				action: {
					label: "Sign In",
					onClick: () =>
						signIn.social({
							provider: "google",
							callbackURL: "/shop",
						}),
				},
			});
			return;
		}

		const result = await addToCart(productId, 1);
		if (result.success) {
			toast.success(result.message);
			// Dispatch custom event to update cart counter
			window.dispatchEvent(new Event("cartUpdated"));
		} else {
			toast.error(result.message);
		}
	};

	const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
		const result = await updateCartItemQuantity(cartItemId, newQuantity);
		if (result.success) {
			window.dispatchEvent(new Event("cartUpdated"));
		} else {
			toast.error(result.message || "Failed to update quantity");
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "merch":
				return <ShoppingBag className="h-4 w-4" />;
			case "arsari-sari":
				return <Store className="h-4 w-4" />;
			case "services":
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
					<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="merch">Merch</TabsTrigger>
						<TabsTrigger value="arsari-sari">Arsari-Sari</TabsTrigger>
						<TabsTrigger value="services">Services</TabsTrigger>
					</TabsList>
				</Tabs>

				{session?.user && (
					<Link href="/shop/cart" className="w-full sm:w-auto">
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
									Sign in with your{" "}
									<span className="text-foreground font-semibold">@student.ateneo.edu</span> email
									to start shopping
								</p>
							</div>
							<Button
								onClick={() =>
									signIn.social({
										provider: "google",
										callbackURL: "/shop",
									})
								}
								className="w-full sm:w-auto"
							>
								Sign In with Google
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
						const cartItem = getCartItem(product.id);
						return (
							<Card key={product.id} className="flex flex-col">
								<CardHeader>
									<div className="bg-muted mb-4 flex aspect-square items-center justify-center rounded-lg">
										{product.image ? (
											<img
												src={product.image}
												alt={product.name}
												className="h-full w-full rounded-lg object-cover"
											/>
										) : (
											<Package className="text-muted-foreground h-16 w-16" />
										)}
									</div>
									<div className="flex items-start justify-between">
										<CardTitle className="text-lg">{product.name}</CardTitle>
										<Badge variant="secondary" className="ml-2">
											{getCategoryIcon(product.category)}
										</Badge>
									</div>
									<CardDescription className="line-clamp-2">{product.description}</CardDescription>
								</CardHeader>
								<CardContent className="flex-1">
									<div className="flex items-center justify-between">
										<span className="text-2xl font-bold">₱{product.price.toFixed(2)}</span>
										<span className="text-muted-foreground text-sm">Stock: {product.stock}</span>
									</div>
								</CardContent>
								<CardFooter>
									{cartItem ? (
										<div className="flex w-full items-center justify-between gap-2">
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
											>
												<Minus className="h-4 w-4" />
											</Button>
											<span className="text-lg font-semibold">{cartItem.quantity}</span>
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
												disabled={cartItem.quantity >= product.stock}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
									) : (
										<Button
											className="w-full"
											onClick={() => handleAddToCart(product.id)}
											disabled={product.stock === 0 || !product.isAvailable}
										>
											<ShoppingCart className="mr-2 h-4 w-4" />
											{product.stock === 0 ? "Out of Stock" : "Add to Cart"}
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
