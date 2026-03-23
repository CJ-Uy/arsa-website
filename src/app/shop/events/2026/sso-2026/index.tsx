"use client";

import { useEffect, useState } from "react";
import type { EventComponentProps } from "../../types";
import { SSOBalloonsAnimation } from "./animations";
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
import { ShoppingCart, Gift, Loader2, Compass } from "lucide-react";
import { ProductImageCarousel } from "@/components/features/product-image-carousel";
import "./styles.css";

export default function SSOEvent({
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

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (mediaQuery.matches) setShowAnimation(false);

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

	return (
		<div className="sso-container relative">
			{/* Floating Balloons */}
			{showAnimation && <SSOBalloonsAnimation isActive={true} />}

			{/* Hero Section */}
			{event.heroImageUrls?.[0] && (
				<div className="sso-hero relative mb-8 overflow-hidden rounded-xl">
					<img
						src={event.heroImageUrls[0]}
						alt={event.name}
						className="h-64 w-full object-cover sm:h-72 md:h-80"
					/>
					<div
						className="absolute inset-0"
						style={{
							background:
								"linear-gradient(to top, rgba(55,71,82,0.9) 0%, rgba(55,71,82,0.4) 40%, transparent 100%)",
						}}
					/>
					<div className="absolute right-0 bottom-0 left-0 p-4 text-white sm:p-6">
						<h2 className="flex items-center gap-2 font-[family-name:var(--font-farm-to-market)] text-2xl font-bold sm:text-3xl">
							<Compass className="h-6 w-6 text-[#EACA5B] sm:h-8 sm:w-8" />
							{event.name}
						</h2>
						<p className="mt-2 text-base opacity-90 sm:text-lg">{event.description}</p>
					</div>
				</div>
			)}

			{/* Fallback header if no hero image */}
			{!event.heroImageUrls?.[0] && (
				<div
					className="mb-8 rounded-xl p-6 text-center text-white sm:p-8"
					style={{
						background: "linear-gradient(135deg, #374752 0%, #60797E 50%, #859893 100%)",
						boxShadow: "0 8px 30px rgba(55, 71, 82, 0.3)",
					}}
				>
					<Compass className="mx-auto mb-4 h-10 w-10 text-[#EACA5B] sm:h-12 sm:w-12" />
					<h2 className="font-[family-name:var(--font-farm-to-market)] text-2xl font-bold sm:text-3xl">
						{event.name}
					</h2>
					<p className="mt-2 text-base opacity-90 sm:text-lg">{event.description}</p>
				</div>
			)}

			{/* Washi tape divider */}
			<div className="sso-washi mb-8 rounded-full" />

			{/* Packages Section */}
			{packages.length > 0 && (
				<div className="mb-8">
					<h3 className="sso-section-title mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
						<Gift className="h-5 w-5 text-[#C89D58]" />
						Bundles
					</h3>
					<div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
						{packages.map((pkg) => (
							<Card key={pkg.id} className="sso-card">
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
											imageCropPositions={pkg.imageCropPositions}
										/>
										<Badge
											className="absolute top-2 left-2 text-white"
											style={{ background: "linear-gradient(135deg, #845942, #6e4a37)" }}
										>
											<Gift className="mr-1 h-3 w-3" />
											Bundle
										</Badge>
									</div>
									<CardTitle className="text-lg">{pkg.name}</CardTitle>
									<p className="text-muted-foreground line-clamp-2 text-sm">{pkg.description}</p>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-[#845942]">₱{pkg.price.toFixed(2)}</div>
								</CardContent>
								<CardFooter>
									<Button
										className="w-full text-white"
										style={{ background: "linear-gradient(135deg, #845942 0%, #6e4a37 100%)" }}
										onClick={() => onOpenPackageModal(pkg)}
										disabled={!pkg.isAvailable}
									>
										<Compass className="mr-2 h-4 w-4" />
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
					<h3 className="sso-section-title mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
						<Compass className="h-5 w-5 text-[#DD7142]" />
						Products
					</h3>
					<div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
						{products.map((product) => {
							const selectedSize = selectedSizes[product.id];
							const requiresSize = product.availableSizes.length > 0;
							const isLoading = loadingProducts[product.id] ?? false;

							return (
								<Card key={product.id} className="sso-card">
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
											imageCropPositions={product.imageCropPositions}
										/>
										<CardTitle className="text-lg">{product.name}</CardTitle>
										<p className="text-muted-foreground line-clamp-2 text-sm">
											{product.description}
										</p>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="text-2xl font-bold text-[#845942]">
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
											style={{ background: "linear-gradient(135deg, #845942 0%, #6e4a37 100%)" }}
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
