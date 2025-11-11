"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImageCarouselProps {
	images: string[];
	productName: string;
	className?: string;
	aspectRatio?: "square" | "portrait" | "landscape";
	showThumbnails?: boolean;
}

export function ProductImageCarousel({
	images,
	productName,
	className,
	aspectRatio = "square",
	showThumbnails = true,
}: ProductImageCarouselProps) {
	const [currentIndex, setCurrentIndex] = useState(0);

	// If no images, show placeholder
	if (!images || images.length === 0) {
		return (
			<div
				className={cn(
					"bg-muted relative flex w-full items-center justify-center overflow-hidden rounded-lg",
					aspectRatio === "square" && "aspect-square",
					aspectRatio === "portrait" && "aspect-[3/4]",
					aspectRatio === "landscape" && "aspect-video",
					className,
				)}
			>
				<p className="text-muted-foreground text-sm">No image available</p>
			</div>
		);
	}

	// Single image - no carousel needed
	if (images.length === 1) {
		return (
			<div
				className={cn(
					"relative w-full overflow-hidden rounded-lg",
					aspectRatio === "square" && "aspect-square",
					aspectRatio === "portrait" && "aspect-[3/4]",
					aspectRatio === "landscape" && "aspect-video",
					className,
				)}
			>
				<Image
					src={images[0]}
					alt={productName}
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				/>
			</div>
		);
	}

	const goToPrevious = () => {
		setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
	};

	const goToNext = () => {
		setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
	};

	const goToIndex = (index: number) => {
		setCurrentIndex(index);
	};

	return (
		<div className={cn("space-y-2", className)}>
			{/* Main Image with Navigation */}
			<div
				className={cn(
					"group relative w-full overflow-hidden rounded-lg",
					aspectRatio === "square" && "aspect-square",
					aspectRatio === "portrait" && "aspect-[3/4]",
					aspectRatio === "landscape" && "aspect-video",
				)}
			>
				<Image
					src={images[currentIndex]}
					alt={`${productName} - Image ${currentIndex + 1}`}
					fill
					className="object-cover transition-opacity duration-300"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					priority={currentIndex === 0}
				/>

				{/* Navigation Buttons - Hidden on mobile, visible on hover on desktop */}
				<div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:p-4">
					<Button
						variant="secondary"
						size="icon"
						className="bg-background/80 hover:bg-background/90 h-8 w-8 rounded-full backdrop-blur-sm sm:h-10 sm:w-10"
						onClick={goToPrevious}
					>
						<ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
						<span className="sr-only">Previous image</span>
					</Button>
					<Button
						variant="secondary"
						size="icon"
						className="bg-background/80 hover:bg-background/90 h-8 w-8 rounded-full backdrop-blur-sm sm:h-10 sm:w-10"
						onClick={goToNext}
					>
						<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
						<span className="sr-only">Next image</span>
					</Button>
				</div>

				{/* Image Counter */}
				<div className="bg-background/80 absolute right-2 bottom-2 rounded-full px-2 py-1 text-xs backdrop-blur-sm sm:right-4 sm:bottom-4 sm:px-3 sm:py-1.5 sm:text-sm">
					{currentIndex + 1} / {images.length}
				</div>
			</div>

			{/* Thumbnail Navigation */}
			{showThumbnails && images.length > 1 && (
				<div className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent flex gap-2 overflow-x-auto pb-2">
					{images.map((image, index) => (
						<button
							key={index}
							onClick={() => goToIndex(index)}
							className={cn(
								"relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all duration-200 sm:h-20 sm:w-20",
								currentIndex === index
									? "border-primary ring-primary ring-offset-background ring-2 ring-offset-2"
									: "hover:border-muted-foreground/50 border-transparent",
							)}
						>
							<Image
								src={image}
								alt={`${productName} thumbnail ${index + 1}`}
								fill
								className="object-cover"
								sizes="80px"
							/>
						</button>
					))}
				</div>
			)}

			{/* Touch Indicator for Mobile */}
			{images.length > 1 && (
				<div className="flex justify-center gap-1.5 sm:hidden">
					{images.map((_, index) => (
						<button
							key={index}
							onClick={() => goToIndex(index)}
							className={cn(
								"h-1.5 rounded-full transition-all duration-200",
								currentIndex === index ? "bg-primary w-6" : "bg-muted-foreground/30 w-1.5",
							)}
							aria-label={`Go to image ${index + 1}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}
