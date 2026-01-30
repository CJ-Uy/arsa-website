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

	// Default to official FlowerFest color palette
	const themeConfig = event.themeConfig || {
		primaryColor: "#AA1A1A", // Red accent
		secondaryColor: "#D3B3AD", // Pastel Gray Red
	};

	return (
		<div className="flower-fest-container relative">
			{/* Floating Petals Animation */}
			{showAnimation && event.themeConfig?.animation === "petals" && (
				<FlowerPetalsAnimation config={themeConfig} isActive={true} />
			)}

			{/* Hero Section */}
			{event.heroImageUrls?.[0] && (
				<div className="flower-fest-hero relative mb-8 overflow-hidden rounded-xl">
					<img
						src={event.heroImageUrls[0]}
						alt={event.name}
						className="h-64 w-full object-cover sm:h-72 md:h-80"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-[#400C12]/90 via-[#400C12]/40 to-transparent" />
					<div className="absolute right-0 bottom-0 left-0 p-4 text-white sm:p-6">
						<h2 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
							<Heart className="h-6 w-6 text-[#D3B3AD] sm:h-8 sm:w-8" />
							{event.name}
						</h2>
						<p className="mt-2 text-base opacity-90 sm:text-lg">{event.description}</p>
					</div>
				</div>
			)}

			{/* Custom Header if no hero image */}
			{!event.heroImageUrls?.[0] && (
				<div
					className="flower-fest-header mb-8 rounded-xl p-6 text-center text-white sm:p-8"
					style={{
						background: `linear-gradient(135deg, #AA1A1A 0%, #6a1010 50%, #400C12 100%)`,
						boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4), 0 4px 15px rgba(64, 12, 18, 0.25)",
					}}
				>
					<Heart className="mx-auto mb-4 h-10 w-10 text-[#D3B3AD] sm:h-12 sm:w-12" />
					<h2 className="text-2xl font-bold sm:text-3xl">{event.name}</h2>
					<p className="mt-2 text-base opacity-90 sm:text-lg">{event.description}</p>
				</div>
			)}

			{/* Packages Section */}
			{packages.length > 0 && (
				<div className="mb-8">
					<h3 className="flower-fest-section-title mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
						<Gift className="h-5 w-5" />
						Flower Bundles
					</h3>
					<div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
						{packages.map((pkg) => (
							<Card key={pkg.id} className="flower-fest-card">
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
										<Badge
											className="absolute top-2 left-2"
											style={{ background: "linear-gradient(135deg, #AA1A1A, #8a1515)" }}
										>
											<Gift className="mr-1 h-3 w-3" />
											Bundle
										</Badge>
									</div>
									<CardTitle className="text-lg">{pkg.name}</CardTitle>
									<p className="text-muted-foreground line-clamp-2 text-sm">{pkg.description}</p>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-[#AA1A1A] dark:text-[#D3B3AD]">
										₱{pkg.price.toFixed(2)}
									</div>
								</CardContent>
								<CardFooter>
									<Button
										className="w-full text-white"
										style={{ background: "linear-gradient(135deg, #AA1A1A 0%, #8a1515 100%)" }}
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
					<h3 className="flower-fest-section-title mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
						<Heart className="h-5 w-5" />
						Individual Flowers
					</h3>
					<div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
						{products.map((product) => {
							const selectedSize = selectedSizes[product.id];
							const requiresSize = product.availableSizes.length > 0;
							const isLoading = loadingProducts[product.id] ?? false;

							return (
								<Card key={product.id} className="flower-fest-card">
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
										<div className="text-2xl font-bold text-[#AA1A1A] dark:text-[#D3B3AD]">
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
											className="w-full text-white hover:opacity-90"
											style={{ background: "linear-gradient(135deg, #AA1A1A 0%, #8a1515 100%)" }}
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
