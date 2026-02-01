"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CropPosition = {
	x: number; // 0-100 percentage
	y: number; // 0-100 percentage
};

interface ProductImageCarouselProps {
	images: string[];
	productName: string;
	className?: string;
	aspectRatio?: "square" | "portrait" | "landscape";
	showThumbnails?: boolean;
	imageCropPositions?: Record<string, CropPosition> | null;
}

export function ProductImageCarousel({
	images,
	productName,
	className,
	aspectRatio = "square",
	showThumbnails = true,
	imageCropPositions,
}: ProductImageCarouselProps) {
	// Helper to get crop position for an image
	const getCropPosition = (imageUrl: string): string => {
		if (imageCropPositions && imageCropPositions[imageUrl]) {
			return `${imageCropPositions[imageUrl].x}% ${imageCropPositions[imageUrl].y}%`;
		}
		return "center";
	};
	const [currentIndex, setCurrentIndex] = useState(0);
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchEnd, setTouchEnd] = useState<number | null>(null);
	const [isZoomedOut, setIsZoomedOut] = useState(false);

	// Minimum swipe distance (in px) to trigger navigation
	const minSwipeDistance = 50;

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
					"bg-muted relative w-full cursor-pointer overflow-hidden rounded-lg",
					aspectRatio === "square" && "aspect-square",
					aspectRatio === "portrait" && "aspect-[3/4]",
					aspectRatio === "landscape" && "aspect-video",
					className,
				)}
				onClick={() => setIsZoomedOut(!isZoomedOut)}
			>
				<Image
					src={images[0]}
					alt={productName}
					fill
					className={cn(
						"transition-all duration-300 select-none",
						isZoomedOut ? "object-contain" : "object-cover",
					)}
					style={{
						objectPosition: isZoomedOut ? "center" : getCropPosition(images[0]),
					}}
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					draggable={false}
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

	// Touch handlers for swipe gestures
	const onTouchStart = (e: React.TouchEvent) => {
		setTouchEnd(null);
		setTouchStart(e.targetTouches[0].clientX);
	};

	const onTouchMove = (e: React.TouchEvent) => {
		setTouchEnd(e.targetTouches[0].clientX);
	};

	const onTouchEnd = () => {
		if (!touchStart || !touchEnd) return;

		const distance = touchStart - touchEnd;
		const isLeftSwipe = distance > minSwipeDistance;
		const isRightSwipe = distance < -minSwipeDistance;

		if (isLeftSwipe) {
			goToNext();
		} else if (isRightSwipe) {
			goToPrevious();
		}
	};

	return (
		<div className={cn("w-full", className)}>
			{/* Main Image with Navigation */}
			<div
				className={cn(
					"bg-muted group relative w-full cursor-pointer touch-pan-y overflow-hidden rounded-lg",
					aspectRatio === "square" && "aspect-square",
					aspectRatio === "portrait" && "aspect-[3/4]",
					aspectRatio === "landscape" && "aspect-video",
				)}
				onTouchStart={onTouchStart}
				onTouchMove={onTouchMove}
				onTouchEnd={onTouchEnd}
				onClick={() => setIsZoomedOut(!isZoomedOut)}
			>
				<Image
					src={images[currentIndex]}
					alt={`${productName} - Image ${currentIndex + 1}`}
					fill
					className={cn(
						"transition-all duration-300 select-none",
						isZoomedOut ? "object-contain" : "object-cover",
					)}
					style={{
						objectPosition: isZoomedOut ? "center" : getCropPosition(images[currentIndex]),
					}}
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					priority={currentIndex === 0}
					draggable={false}
				/>

				{/* Navigation Buttons - Hidden on mobile, visible on hover on desktop */}
				<div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:p-4">
					<Button
						variant="secondary"
						size="icon"
						className="bg-background/95 hover:bg-background border-border/50 h-8 w-8 rounded-full border shadow-lg backdrop-blur-sm sm:h-10 sm:w-10"
						onClick={(e) => {
							e.stopPropagation();
							goToPrevious();
						}}
					>
						<ChevronLeft className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
						<span className="sr-only">Previous image</span>
					</Button>
					<Button
						variant="secondary"
						size="icon"
						className="bg-background/95 hover:bg-background border-border/50 h-8 w-8 rounded-full border shadow-lg backdrop-blur-sm sm:h-10 sm:w-10"
						onClick={(e) => {
							e.stopPropagation();
							goToNext();
						}}
					>
						<ChevronRight className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
						<span className="sr-only">Next image</span>
					</Button>
				</div>

				{/* Image Counter */}
				<div className="bg-background/80 absolute right-2 bottom-2 rounded-full px-2 py-1 text-xs backdrop-blur-sm sm:right-4 sm:bottom-4 sm:px-3 sm:py-1.5 sm:text-sm">
					{currentIndex + 1} / {images.length}
				</div>
			</div>

			{/* Thumbnail Navigation - Desktop */}
			{showThumbnails && images.length > 1 && (
				<div className="relative mt-3 hidden sm:block">
					<div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-2">
						{images.map((image, index) => (
							<button
								key={index}
								onClick={() => goToIndex(index)}
								className={cn(
									"relative h-16 w-16 flex-shrink-0 snap-start overflow-hidden rounded-md border-2 transition-all duration-200",
									currentIndex === index
										? "border-primary ring-primary ring-offset-background scale-105 ring-2 ring-offset-2"
										: "border-border hover:border-muted-foreground/50 hover:scale-105",
								)}
							>
								<Image
									src={image}
									alt={`${productName} thumbnail ${index + 1}`}
									fill
									className="object-cover"
									style={{
										objectPosition: getCropPosition(image),
									}}
									sizes="64px"
								/>
							</button>
						))}
					</div>
				</div>
			)}

			{/* Touch Indicator for Mobile */}
			{images.length > 1 && (
				<div className="mt-3 flex justify-center gap-1.5 sm:hidden">
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
