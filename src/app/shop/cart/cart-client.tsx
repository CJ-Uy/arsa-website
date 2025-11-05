"use client";

import { useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateCartItemQuantity, removeFromCart } from "../actions";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CartItem = {
	id: string;
	quantity: number;
	size: string | null;
	product: {
		id: string;
		name: string;
		description: string;
		price: number;
		image: string | null;
		stock: number;
	};
};

type CartClientProps = {
	initialCart: CartItem[];
};

export function CartClient({ initialCart }: CartClientProps) {
	const router = useRouter();
	const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
	const [loading, setLoading] = useState<string | null>(null);
	const [checkoutLoading, setCheckoutLoading] = useState(false);

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
			// Dispatch custom event to update cart counter
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
			// Dispatch custom event to update cart counter
			window.dispatchEvent(new Event("cartUpdated"));
		} else {
			toast.error(result.message || "Failed to remove item");
		}
	};

	const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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

	return (
		<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<div className="space-y-4 lg:col-span-2">
				{cartItems.map((item) => (
					<Card key={item.id}>
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col gap-4 sm:flex-row">
								<div className="bg-muted flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg">
									{item.product.image ? (
										<img
											src={item.product.image}
											alt={item.product.name}
											className="h-full w-full rounded-lg object-cover"
										/>
									) : (
										<ShoppingBag className="text-muted-foreground h-8 w-8" />
									)}
								</div>

								<div className="min-w-0 flex-1">
									<h3 className="mb-1 text-lg font-semibold">{item.product.name}</h3>
									{item.size && (
										<p className="text-muted-foreground mb-1 text-sm">
											Size: <span className="text-foreground font-medium">{item.size}</span>
										</p>
									)}
									<p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
										{item.product.description}
									</p>
									<p className="text-lg font-bold">₱{item.product.price.toFixed(2)}</p>
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
											disabled={loading === item.id || item.quantity >= item.product.stock}
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
				))}
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
