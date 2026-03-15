"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, MapPin, Clock, ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
	event: {
		id: number | string;
		title: string;
		date: string;
		time: string;
		location: string;
		description: string;
		category: string;
		featured?: boolean;
		googleFormUrl?: string;
		images?: string[];
		imageCropPositions?: Record<string, { x: number; y: number }>;
	};
	variant?: "default" | "featured";
}

function EventImageCarousel({
	images,
	alt,
	cropPositions,
}: {
	images: string[];
	alt: string;
	cropPositions?: Record<string, { x: number; y: number }>;
}) {
	const [current, setCurrent] = useState(0);

	const getStyle = (url: string) => {
		const pos = cropPositions?.[url];
		return pos ? { objectPosition: `${pos.x}% ${pos.y}%` } : undefined;
	};

	if (images.length === 0) return null;

	if (images.length === 1) {
		return (
			<div className="relative aspect-video w-full overflow-hidden rounded-md">
				<Image
					src={images[0]}
					alt={alt}
					fill
					className="object-cover"
					style={getStyle(images[0])}
					sizes="(max-width: 768px) 100vw, 400px"
				/>
			</div>
		);
	}

	return (
		<div className="relative aspect-video w-full overflow-hidden rounded-md">
			<Image
				src={images[current]}
				alt={`${alt} ${current + 1}`}
				fill
				className="object-cover"
				style={getStyle(images[current])}
				sizes="(max-width: 768px) 100vw, 400px"
			/>
			<button
				onClick={(e) => {
					e.preventDefault();
					setCurrent((current - 1 + images.length) % images.length);
				}}
				className="absolute top-1/2 left-1 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>
			<button
				onClick={(e) => {
					e.preventDefault();
					setCurrent((current + 1) % images.length);
				}}
				className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
			>
				<ChevronRight className="h-4 w-4" />
			</button>
			<div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
				{images.map((_, i) => (
					<span
						key={i}
						className={`h-1.5 w-1.5 rounded-full ${i === current ? "bg-white" : "bg-white/50"}`}
					/>
				))}
			</div>
		</div>
	);
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			weekday: "short",
		});
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "Social":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "Academic":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "Entertainment":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "Community":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			case "Food":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "Meeting":
				return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
		}
	};

	const images = event.images?.filter(Boolean) ?? [];

	if (variant === "featured") {
		return (
			<div className="bg-card/95 border-border rounded-lg border p-6 shadow-xl backdrop-blur-sm">
				{images.length > 0 && (
					<div className="mb-4">
						<EventImageCarousel
							images={images}
							alt={event.title}
							cropPositions={event.imageCropPositions}
						/>
					</div>
				)}
				<div className="mb-4 flex items-center justify-between">
					<Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
					<Badge variant="secondary">
						<Star className="mr-1 h-3 w-3" />
						Featured
					</Badge>
				</div>
				<h3 className="text-card-foreground mb-2 text-xl font-bold">{event.title}</h3>
				<p className="text-muted-foreground mb-4">{event.description}</p>
				<div className="mb-4 space-y-2">
					<div className="text-muted-foreground flex items-center text-sm">
						<Calendar className="mr-2 h-4 w-4" />
						{formatDate(event.date)} at {event.time}
					</div>
					<div className="text-muted-foreground flex items-center text-sm">
						<MapPin className="mr-2 h-4 w-4" />
						{event.location}
					</div>
				</div>
				{event.googleFormUrl && (
					<Button className="w-full" asChild>
						<a
							href={event.googleFormUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center"
						>
							<span>Join Event</span>
							<ArrowRight className="ml-2 h-4 w-4" />
						</a>
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="bg-card border-border flex gap-3 rounded-lg border p-3 transition-shadow hover:shadow-md">
			{images.length > 0 && (
				<div className="w-24 shrink-0">
					<div className="relative aspect-square w-full overflow-hidden rounded-md">
						<Image
							src={images[0]}
							alt={event.title}
							fill
							className="object-cover"
							style={
								event.imageCropPositions?.[images[0]]
									? {
											objectPosition: `${event.imageCropPositions[images[0]].x}% ${event.imageCropPositions[images[0]].y}%`,
										}
									: undefined
							}
							sizes="96px"
						/>
					</div>
				</div>
			)}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="mb-1 flex items-center gap-2">
					<Badge className={`${getCategoryColor(event.category)} px-1.5 py-0 text-[10px]`}>
						{event.category}
					</Badge>
					<span className="text-muted-foreground text-xs">{formatDate(event.date)}</span>
				</div>
				<h3 className="text-card-foreground text-sm leading-tight font-semibold">{event.title}</h3>
				<p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{event.description}</p>
				<div className="mt-auto flex items-center gap-3 pt-1.5">
					<span className="text-muted-foreground flex items-center text-xs">
						<Clock className="mr-1 h-3 w-3" />
						{event.time}
					</span>
					<span className="text-muted-foreground flex items-center text-xs">
						<MapPin className="mr-1 h-3 w-3" />
						<span className="truncate">{event.location}</span>
					</span>
				</div>
				{event.googleFormUrl && (
					<Button size="sm" className="mt-2 h-7 w-full text-xs" asChild>
						<a
							href={event.googleFormUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center justify-center"
						>
							Join Event
							<ArrowRight className="ml-1 h-3 w-3" />
						</a>
					</Button>
				)}
			</div>
		</div>
	);
}
