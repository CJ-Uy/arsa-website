"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Move, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CropPosition = {
	x: number; // 0-100 percentage
	y: number; // 0-100 percentage
};

interface ImageCropEditorProps {
	imageUrl: string;
	currentPosition?: CropPosition;
	onSave: (position: CropPosition) => void;
	onCancel: () => void;
	open: boolean;
}

export function ImageCropEditor({
	imageUrl,
	currentPosition,
	onSave,
	onCancel,
	open,
}: ImageCropEditorProps) {
	const [position, setPosition] = useState<CropPosition>(currentPosition || { x: 50, y: 50 });
	const [isDragging, setIsDragging] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

	// Reset position when dialog opens with new image
	useEffect(() => {
		if (open) {
			setPosition(currentPosition || { x: 50, y: 50 });
			setImageLoaded(false);
		}
	}, [open, currentPosition, imageUrl]);

	const handleImageLoad = () => {
		if (imageRef.current) {
			setImageDimensions({
				width: imageRef.current.naturalWidth,
				height: imageRef.current.naturalHeight,
			});
			setImageLoaded(true);
		}
	};

	const calculatePosition = useCallback((clientX: number, clientY: number) => {
		if (!containerRef.current) return;

		const rect = containerRef.current.getBoundingClientRect();
		const x = ((clientX - rect.left) / rect.width) * 100;
		const y = ((clientY - rect.top) / rect.height) * 100;

		// Clamp between 0 and 100
		setPosition({
			x: Math.max(0, Math.min(100, x)),
			y: Math.max(0, Math.min(100, y)),
		});
	}, []);

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
		calculatePosition(e.clientX, e.clientY);
	};

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (isDragging) {
				calculatePosition(e.clientX, e.clientY);
			}
		},
		[isDragging, calculatePosition],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	const handleTouchStart = (e: React.TouchEvent) => {
		e.preventDefault();
		setIsDragging(true);
		const touch = e.touches[0];
		calculatePosition(touch.clientX, touch.clientY);
	};

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			if (isDragging) {
				const touch = e.touches[0];
				calculatePosition(touch.clientX, touch.clientY);
			}
		},
		[isDragging, calculatePosition],
	);

	const handleTouchEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
			window.addEventListener("touchmove", handleTouchMove, { passive: false });
			window.addEventListener("touchend", handleTouchEnd);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchend", handleTouchEnd);
		};
	}, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

	const handleReset = () => {
		setPosition({ x: 50, y: 50 });
	};

	const handleSave = () => {
		onSave(position);
	};

	// Calculate if image is wider or taller than square
	const isLandscape = imageDimensions.width > imageDimensions.height;
	const aspectRatio = imageDimensions.width / imageDimensions.height || 1;

	return (
		<Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Move className="h-5 w-5" />
						Adjust Image Crop Position
					</DialogTitle>
					<DialogDescription>
						Click or drag on the image to set the focus point. The preview shows how it will appear
						in square thumbnails.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{/* Main editor area */}
					<div className="space-y-3">
						<p className="text-muted-foreground text-sm font-medium">Click to set focus point</p>
						<div
							ref={containerRef}
							className={cn(
								"relative cursor-crosshair overflow-hidden rounded-lg border-2 border-dashed",
								isDragging ? "border-primary" : "border-border",
							)}
							onMouseDown={handleMouseDown}
							onTouchStart={handleTouchStart}
							style={{
								aspectRatio: aspectRatio > 0 ? aspectRatio : 1,
								maxHeight: "300px",
							}}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								ref={imageRef}
								src={imageUrl}
								alt="Crop editor"
								className="h-full w-full object-contain"
								onLoad={handleImageLoad}
								draggable={false}
							/>

							{/* Focus point indicator */}
							{imageLoaded && (
								<div
									className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
									style={{
										left: `${position.x}%`,
										top: `${position.y}%`,
									}}
								>
									{/* Crosshair */}
									<div className="relative">
										{/* Center dot */}
										<div className="bg-primary h-4 w-4 rounded-full border-2 border-white shadow-lg" />
										{/* Horizontal line */}
										<div className="bg-primary/80 absolute top-1/2 left-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2" />
										{/* Vertical line */}
										<div className="bg-primary/80 absolute top-1/2 left-1/2 h-12 w-0.5 -translate-x-1/2 -translate-y-1/2" />
									</div>
								</div>
							)}

							{/* Grid overlay */}
							{imageLoaded && (
								<div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
									{[...Array(9)].map((_, i) => (
										<div key={i} className="border border-white/20" />
									))}
								</div>
							)}
						</div>

						<p className="text-muted-foreground text-center text-xs">
							Position: {Math.round(position.x)}%, {Math.round(position.y)}%
						</p>
					</div>

					{/* Preview area */}
					<div className="space-y-3">
						<p className="text-muted-foreground text-sm font-medium">Square crop preview</p>
						<div className="bg-muted relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={imageUrl}
								alt="Preview"
								className="h-full w-full object-cover"
								style={{
									objectPosition: `${position.x}% ${position.y}%`,
								}}
								draggable={false}
							/>
						</div>
						<p className="text-muted-foreground text-center text-xs">
							This is how the image will appear in product cards and thumbnails
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-between gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						onClick={handleReset}
						className="flex items-center gap-2"
					>
						<RotateCcw className="h-4 w-4" />
						Reset to Center
					</Button>
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="button" onClick={handleSave} className="flex items-center gap-2">
							<Check className="h-4 w-4" />
							Save Position
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
