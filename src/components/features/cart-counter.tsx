"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCart } from "@/app/shop/actions";

export function CartCounter() {
	const [itemCount, setItemCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	const fetchCartCount = async () => {
		try {
			const result = await getCart();
			if (result.success && result.cart) {
				const total = result.cart.reduce((sum, item) => sum + item.quantity, 0);
				setItemCount(total);
			} else {
				setItemCount(0);
			}
		} catch (error) {
			console.error("Failed to fetch cart count:", error);
			setItemCount(0);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCartCount();

		// Refresh cart count every 5 seconds to keep it in sync
		const interval = setInterval(fetchCartCount, 5000);

		return () => clearInterval(interval);
	}, []);

	// Listen for custom cart update events
	useEffect(() => {
		const handleCartUpdate = () => {
			fetchCartCount();
		};

		window.addEventListener("cartUpdated", handleCartUpdate);
		return () => window.removeEventListener("cartUpdated", handleCartUpdate);
	}, []);

	return (
		<Link href="/shop/cart">
			<Button variant="ghost" size="icon" className="relative">
				<ShoppingCart className="h-5 w-5" />
				{!isLoading && itemCount > 0 && (
					<Badge
						variant="destructive"
						className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
					>
						{itemCount > 99 ? "99+" : itemCount}
					</Badge>
				)}
			</Button>
		</Link>
	);
}
