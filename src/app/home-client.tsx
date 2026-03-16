"use client";

import { useState } from "react";
import {
	Calendar as CalendarIcon,
	Users,
	ArrowRight,
	BookOpen,
	FileText,
	Phone,
	Award,
	Star,
	ShoppingCart,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { EventCard } from "@/components/features/event-card";
import { EventCalendar } from "@/components/features/event-calendar";
import { cn } from "@/lib/utils";
import type { HeroContent, EventItem, QuickAction, SocialLink } from "./admin/landing/actions";

const iconLookup: Record<string, React.ComponentType<{ className?: string }>> = {
	calendar: CalendarIcon,
	users: Users,
	book: BookOpen,
	file: FileText,
	phone: Phone,
	award: Award,
	star: Star,
	shopping: ShoppingCart,
};

function getIcon(key: string) {
	return iconLookup[key] || Star;
}

const socialBgColors: Record<string, string> = {
	instagram: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
	tiktok: "bg-black",
	facebook: "bg-[#1877F2]",
};

function getSocialBg(platform: string) {
	return socialBgColors[platform.toLowerCase()] || "bg-muted";
}

/** SVG icons for social platforms */
function SocialIcon({ platform }: { platform: string }) {
	const name = platform.toLowerCase();
	if (name === "instagram") {
		return (
			<svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
			</svg>
		);
	}
	if (name === "tiktok") {
		return (
			<svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
				<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.16v-3.44a4.85 4.85 0 01-3.77-1.26V6.69h3.77z" />
			</svg>
		);
	}
	if (name === "facebook") {
		return (
			<svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
				<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
			</svg>
		);
	}
	// Fallback: first letter
	return <span className="text-xl font-bold text-white">{platform.charAt(0).toUpperCase()}</span>;
}

type HomePageClientProps = {
	content: {
		hero: HeroContent;
		events: EventItem[];
		quickActions: QuickAction[];
		socials: SocialLink[];
	};
};

const EVENTS_PER_PAGE = 5;

function PaginatedEventList({ events }: { events: EventItem[] }) {
	const [page, setPage] = useState(0);
	const totalPages = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE));
	const start = page * EVENTS_PER_PAGE;
	const visible = events.slice(start, start + EVENTS_PER_PAGE);

	if (events.length === 0) {
		return (
			<div className="text-muted-foreground flex items-center justify-center py-12 text-center">
				No upcoming events at the moment.
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex flex-1 flex-col gap-3">
				{visible.map((event) => (
					<EventCard key={event.id} event={event} />
				))}
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-center gap-3 pt-2">
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPage((p) => Math.max(0, p - 1))}
						disabled={page === 0}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-muted-foreground text-sm">
						{page + 1} / {totalPages}
					</span>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
						disabled={page === totalPages - 1}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
}

export function HomePageClient({ content }: HomePageClientProps) {
	const { hero, events, quickActions, socials } = content;
	const featuredEvent = events.find((e) => e.featured);

	return (
		<div className="bg-background min-h-screen">
			{/* Hero Section */}
			<section className="relative overflow-hidden py-16 md:py-20">
				{/* Background: custom image OR ARSA gradient with spiral lines */}
				{hero.backgroundImage ? (
					<>
						<div className="absolute inset-0 z-0">
							<div
								className="h-full w-full bg-cover bg-center bg-no-repeat"
								style={{ backgroundImage: `url('${hero.backgroundImage}')` }}
							/>
						</div>
						<div className="absolute inset-0 z-0 bg-black/60" />
					</>
				) : (
					<>
						<div
							className="absolute inset-0 z-0"
							style={{
								background: "linear-gradient(135deg, #b91c3c 0%, #c2410c 50%, #9a3412 100%)",
							}}
						/>
						{/* Decorative spiral lines */}
						<svg
							className="absolute top-0 left-0 z-[1] h-full w-auto opacity-20"
							viewBox="0 0 300 400"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							preserveAspectRatio="xMinYMid slice"
						>
							{Array.from({ length: 12 }).map((_, i) => (
								<path
									key={i}
									d={`M${30 + i * 8},400 Q${60 + i * 12},200 ${20 + i * 6},0`}
									stroke="white"
									strokeWidth="1.5"
									fill="none"
								/>
							))}
						</svg>
					</>
				)}

				<div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div
						className={cn(
							"grid grid-cols-1 items-center gap-8",
							featuredEvent ? "lg:grid-cols-2" : "",
						)}
					>
						<div className="text-white">
							<h1 className="mb-4 text-4xl font-bold drop-shadow-lg md:text-5xl">{hero.title}</h1>
							<p className="mb-6 text-lg drop-shadow-md md:text-xl">{hero.subtitle}</p>
							{hero.ctaButtons.length > 0 && (
								<div className="flex flex-col gap-4 sm:flex-row">
									{hero.ctaButtons.map((btn, i) => (
										<Button
											key={i}
											size="lg"
											className={
												btn.variant === "primary"
													? "bg-primary hover:bg-primary/90 text-primary-foreground"
													: "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
											}
											asChild
										>
											<a href={btn.href} className="flex items-center">
												{btn.variant === "primary" && <Users className="mr-2 h-5 w-5" />}
												{btn.label}
											</a>
										</Button>
									))}
								</div>
							)}
						</div>
						{featuredEvent && <EventCard event={featuredEvent} variant="featured" />}
					</div>
				</div>
			</section>

			{/* Events & Calendar */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-8">
						<h2 className="text-foreground mb-2 text-3xl font-bold">Upcoming Events</h2>
						<p className="text-muted-foreground text-lg">
							Don&apos;t miss out on what&apos;s happening in ARSA
						</p>
					</div>

					<div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
						{/* Events List with Pagination */}
						<PaginatedEventList events={events} />

						{/* Calendar */}
						<Card>
							<CardContent className="p-3 md:p-4">
								<EventCalendar
									events={events.map((e) => ({
										id: e.id,
										title: e.title,
										date: e.date,
										endDate: e.endDate,
										category: e.category,
									}))}
								/>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Quick Actions */}
			{quickActions.length > 0 && (
				<section className="bg-muted/30 py-16">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="mb-12 text-center">
							<h2 className="text-foreground mb-4 text-3xl font-bold">Quick Actions</h2>
							<p className="text-muted-foreground text-lg">
								Everything you need, just a click away
							</p>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
							{quickActions.map((action) => {
								const Icon = getIcon(action.iconKey);
								return (
									<Card
										key={action.id}
										className="flex cursor-pointer flex-col text-center transition-shadow hover:shadow-lg"
									>
										<CardHeader>
											<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
												<Icon className="text-primary h-8 w-8" />
											</div>
											<CardTitle>{action.title}</CardTitle>
										</CardHeader>
										<CardContent className="flex flex-1 flex-col">
											<p className="text-muted-foreground mb-4 text-sm">{action.description}</p>
											<div className="mt-auto">
												<Button size="sm" className="w-full" asChild>
													<a href={action.href} className="flex items-center justify-center">
														{action.buttonLabel}
														<ArrowRight className="ml-2 h-4 w-4" />
													</a>
												</Button>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</div>
				</section>
			)}

			{/* Social Media */}
			{socials.length > 0 && (
				<section className="bg-muted/30 py-16">
					<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
						<div className="mb-12 text-center">
							<h2 className="text-foreground mb-4 text-3xl font-bold">Follow ARSA</h2>
							<p className="text-muted-foreground text-lg">
								Connect with us across all social media platforms
							</p>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
							{socials.map((social) => (
								<Card key={social.id} className="text-center transition-shadow hover:shadow-lg">
									<CardHeader>
										<div
											className={cn(
												"mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full",
												social.logoUrl ? "bg-muted" : getSocialBg(social.platform),
											)}
										>
											{social.logoUrl ? (
												<img
													src={social.logoUrl}
													alt={social.platform}
													className="h-full w-full object-cover"
												/>
											) : (
												<SocialIcon platform={social.platform} />
											)}
										</div>
										<CardTitle>{social.platform}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground mb-4 text-sm">{social.handle}</p>
										<Button size="sm" className="w-full" asChild>
											<a href={social.url} target="_blank" rel="noopener noreferrer">
												Follow
											</a>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Call to Action */}
			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
					<h2 className="text-foreground mb-4 text-3xl font-bold">Ready to Get Involved?</h2>
					<p className="text-muted-foreground mb-8 text-lg">
						Join our vibrant community and make the most of your ARSA experience. There&apos;s
						always something happening, and we&apos;d love for you to be part of it!
					</p>
					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<Button
							size="lg"
							className="bg-primary hover:bg-primary/90 text-primary-foreground"
							asChild
						>
							<a href="/shop" className="flex items-center">
								<ShoppingCart className="mr-2 h-5 w-5" />
								Visit Shop
							</a>
						</Button>
						<Button
							size="lg"
							className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
							asChild
						>
							<a href="/about" className="flex items-center">
								<Users className="mr-2 h-5 w-5" />
								Learn More
							</a>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
