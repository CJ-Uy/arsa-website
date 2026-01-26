"use client";

import { useEffect, useState } from "react";
import type { EventComponentProps } from "../../types";
import { FlowerPetalsAnimation } from "./animations";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Gift, Heart, Loader2 } from "lucide-react";
import { ProductImageCarousel } from "@/components/features/product-image-carousel";
import "./styles.css";

export default function FlowerFestEvent({
	event,
	products,
	packages,
	onAddToCart,
	onOpenPackageModal,
	session,
}: EventComponentProps) {
	const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
	const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});
	const [showAnimation, setShowAnimation] = useState(true);

	// Check for reduced motion preference
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (mediaQuery.matches) {
			setShowAnimation(false);
		}

		const handler = (e: MediaQueryListEvent) => setShowAnimation(!e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	const handleAddToCart = async (productId: string) => {
		const size = selectedSizes[productId];
		setLoadingProducts((prev) => ({ ...prev, [productId]: true }));
		try {
			await onAddToCart(productId, size);
		} finally {
			setLoadingProducts((prev) => ({ ...prev, [productId]: false }));
		}
	};

	const themeConfig = event.themeConfig || {
		primaryColor: "#ec4899",
		secondaryColor: "#f472b6",
	};

	return (
		<div className="flower-fest-container relative">
			{/* Floating Petals Animation */}
			{showAnimation && event.themeConfig?.animation === "petals" && (
				<FlowerPetalsAnimation config={themeConfig} isActive={true} />
			)}

			{/* Hero Section */}
			{event.heroImageUrls?.[0] && (
				<div className="relative mb-8 overflow-hidden rounded-xl">
					<img src={event.heroImageUrls[0]} alt={event.name} className="h-64 w-full object-cover" />
					<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
					<div className="absolute right-0 bottom-0 left-0 p-6 text-white">
						<h2 className="flex items-center gap-2 text-3xl font-bold">
							<Heart className="h-8 w-8 text-pink-400" />
							{event.name}
						</h2>
						<p className="mt-2 text-lg opacity-90">{event.description}</p>
					</div>
				</div>
			)}

			{/* Custom Header if no hero image */}
			{!event.heroImageUrls?.[0] && (
				<div
					className="flower-fest-header mb-8 rounded-xl p-8 text-center text-white"
					style={{
						background: `linear-gradient(135deg, ${themeConfig.primaryColor}, ${themeConfig.secondaryColor})`,
					}}
				>
					<Heart className="mx-auto mb-4 h-12 w-12" />
					<h2 className="text-3xl font-bold">{event.name}</h2>
					<p className="mt-2 text-lg opacity-90">{event.description}</p>
				</div>
			)}

			{/* Packages Section */}
			{packages.length > 0 && (
				<div className="mb-8">
					<h3 className="flower-fest-section-title mb-4 flex items-center gap-2 text-xl font-bold">
						<Gift className="h-5 w-5 text-pink-500" />
						Flower Bundles
					</h3>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{packages.map((pkg) => (
							<Card key={pkg.id} className="flower-fest-card border-pink-200 dark:border-pink-800">
								<CardHeader className="pb-3">
									<div className="relative">
										<ProductImageCarousel
											images={
												pkg.imageUrls.length > 0 ? pkg.imageUrls : pkg.image ? [pkg.image] : []
											}
											productName={pkg.name}
											aspectRatio="square"
											showThumbnails={false}
											className="mb-4"
										/>
										<Badge className="absolute top-2 left-2 bg-pink-500">
											<Gift className="mr-1 h-3 w-3" />
											Bundle
										</Badge>
									</div>
									<CardTitle className="text-lg">{pkg.name}</CardTitle>
									<p className="text-muted-foreground line-clamp-2 text-sm">{pkg.description}</p>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
										₱{pkg.price.toFixed(2)}
									</div>
								</CardContent>
								<CardFooter>
									<Button
										className="w-full bg-pink-500 hover:bg-pink-600"
										onClick={() => onOpenPackageModal(pkg)}
										disabled={!pkg.isAvailable}
									>
										<Heart className="mr-2 h-4 w-4" />
										{pkg.isAvailable ? "Select Options" : "Sold Out"}
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* Products Section */}
			{products.length > 0 && (
				<div>
					<h3 className="flower-fest-section-title mb-4 flex items-center gap-2 text-xl font-bold">
						<Heart className="h-5 w-5 text-pink-500" />
						Individual Flowers
					</h3>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{products.map((product) => {
							const selectedSize = selectedSizes[product.id];
							const requiresSize = product.availableSizes.length > 0;
							const isLoading = loadingProducts[product.id] ?? false;

							return (
								<Card
									key={product.id}
									className="flower-fest-card border-pink-200 dark:border-pink-800"
								>
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
											showThumbnails={false}
											className="mb-4"
										/>
										<CardTitle className="text-lg">{product.name}</CardTitle>
										<p className="text-muted-foreground line-clamp-2 text-sm">
											{product.description}
										</p>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
											₱{product.price.toFixed(2)}
										</div>

										{requiresSize && (
											<div>
												<Label className="text-xs">Select Option</Label>
												<Select
													value={selectedSize}
													onValueChange={(value) =>
														setSelectedSizes((prev) => ({
															...prev,
															[product.id]: value,
														}))
													}
												>
													<SelectTrigger className="mt-1">
														<SelectValue placeholder="Choose option" />
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
										<Button
											className="w-full bg-pink-500 hover:bg-pink-600"
											onClick={() => handleAddToCart(product.id)}
											disabled={
												!product.isAvailable || isLoading || (requiresSize && !selectedSize)
											}
										>
											{isLoading ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Adding...
												</>
											) : (
												<>
													<ShoppingCart className="mr-2 h-4 w-4" />
													{!product.isAvailable
														? "Sold Out"
														: requiresSize && !selectedSize
															? "Select Option"
															: "Add to Cart"}
												</>
											)}
										</Button>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
