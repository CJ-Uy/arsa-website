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
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/features/event-card";
import { EventCalendar } from "@/components/features/event-calendar";
import { cn } from "@/lib/utils";
import type {
	HeroContent,
	EventItem,
	QuickAction,
	SocialLink,
} from "./admin/landing/actions";

const iconLookup: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
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

/** Brand background classes for known social platforms */
function getSocialBg(platform: string) {
	const name = platform.toLowerCase();
	if (name === "instagram")
		return "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]";
	if (name === "tiktok") return "bg-black";
	if (name === "facebook") return "bg-[#1877F2]";
	if (name === "twitter" || name === "x") return "bg-black";
	if (name === "youtube") return "bg-[#FF0000]";
	return "bg-brand-maroon";
}

function SocialIcon({ platform }: { platform: string }) {
	const name = platform.toLowerCase();
	const common = "h-10 w-10 text-white";
	if (name === "instagram") {
		return (
			<svg className={common} viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
			</svg>
		);
	}
	if (name === "tiktok") {
		return (
			<svg className={common} viewBox="0 0 24 24" fill="currentColor">
				<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.16v-3.44a4.85 4.85 0 01-3.77-1.26V6.69h3.77z" />
			</svg>
		);
	}
	if (name === "facebook") {
		return (
			<svg className={common} viewBox="0 0 24 24" fill="currentColor">
				<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
			</svg>
		);
	}
	return (
		<span className="text-2xl font-bold text-white">
			{platform.charAt(0).toUpperCase()}
		</span>
	);
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
			<div className="text-brand-ink/60 border-brand-maroon/15 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
				<CalendarIcon className="text-brand-maroon/60 size-8" />
				<p className="text-base">No upcoming events at the moment.</p>
				<p className="text-brand-ink/50 text-sm">
					Check back soon — the dorm calendar is never quiet for long.
				</p>
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
						className="border-brand-maroon/30 text-brand-maroon hover:bg-brand-maroon/10 hover:text-brand-maroon h-8 w-8"
						onClick={() => setPage((p) => Math.max(0, p - 1))}
						disabled={page === 0}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-brand-ink/70 text-sm font-medium tabular-nums">
						{page + 1} / {totalPages}
					</span>
					<Button
						variant="outline"
						size="icon"
						className="border-brand-maroon/30 text-brand-maroon hover:bg-brand-maroon/10 hover:text-brand-maroon h-8 w-8"
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

/** Small reusable section eyebrow — maroon dot + uppercase tracked label (DESIGN.md §4 H4) */
function Eyebrow({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-brand-maroon mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] uppercase">
			<span className="bg-brand-maroon inline-block h-[6px] w-[6px] rounded-full" />
			{children}
		</div>
	);
}

export function HomePageClient({ content }: HomePageClientProps) {
	const { hero, events, quickActions, socials } = content;
	const featuredEvent = events.find((e) => e.featured);

	return (
		<div className="bg-brand-page text-brand-ink min-h-screen">
			{/* Accent serif for motto-style flourishes (DESIGN.md §4) */}
			<link
				rel="stylesheet"
				href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..900,0..100,0..1&display=swap"
			/>

			{/* HERO */}
			<section className="relative overflow-hidden">
				{/* Background image (ARSA social banner asset) — or fallback gradient */}
				{hero.backgroundImage ? (
					<div className="absolute inset-0 z-0">
						<div
							className="h-full w-full bg-cover bg-center bg-no-repeat"
							style={{ backgroundImage: `url('${hero.backgroundImage}')` }}
						/>
					</div>
				) : (
					<div
						className="absolute inset-0 z-0"
						style={{ background: "var(--brand-gradient)" }}
					/>
				)}

				{/* Brand gradient tint — soft-light preserves the image's brightness, only shifts hue warm */}
				<div
					aria-hidden
					className="absolute inset-0 z-[1]"
					style={{
						background:
							"linear-gradient(135deg, rgba(159,29,81,0.75) 0%, rgba(162,37,15,0.70) 50%, rgba(188,55,0,0.75) 100%)",
						mixBlendMode: "soft-light",
					}}
				/>
				{/* Very light left-side darkening — just enough for text legibility */}
				<div
					aria-hidden
					className="absolute inset-0 z-[1]"
					style={{
						background:
							"linear-gradient(90deg, rgba(20,8,4,0.28) 0%, rgba(20,8,4,0.08) 40%, rgba(20,8,4,0) 70%)",
					}}
				/>

				{/* Decorative spiral lines on fallback (no image) only */}
				{!hero.backgroundImage && (
					<svg
						aria-hidden
						className="absolute top-0 left-0 z-[2] h-full w-auto opacity-20"
						viewBox="0 0 300 400"
						fill="none"
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
				)}

				<div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8 lg:py-32">
					<div
						className={cn(
							"grid grid-cols-1 items-center gap-10",
							featuredEvent ? "lg:grid-cols-[1.1fr_1fr]" : "",
						)}
					>
						<div className="text-white">
							{/* Motto kicker (DESIGN.md §1) */}
							<p
								className="mb-4 text-base text-white/85 sm:text-lg"
								style={{
									fontFamily: "'Fraunces', Georgia, serif",
									fontStyle: "italic",
									fontWeight: 400,
								}}
							>
								in ARSA, it's good to be home.
							</p>

							<h1 className="mb-5 text-4xl leading-[1.05] font-extrabold tracking-[-0.02em] drop-shadow-lg md:text-5xl lg:text-6xl">
								{hero.title}
							</h1>
							<p className="mb-8 max-w-xl text-lg text-white/90 drop-shadow-md md:text-xl">
								{hero.subtitle}
							</p>

							{hero.ctaButtons.length > 0 && (
								<div className="flex flex-col gap-3 sm:flex-row">
									{hero.ctaButtons.map((btn, i) => (
										<Button
											key={i}
											size="lg"
											className={cn(
												"h-12 px-7 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl",
												btn.variant === "primary"
													? "bg-brand-cream text-brand-maroon hover:bg-white"
													: "border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20",
											)}
											asChild
										>
											<a href={btn.href} className="flex items-center">
												{btn.variant === "primary" && (
													<Users className="mr-2 h-5 w-5" />
												)}
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

				{/* Bottom gradient strip — signature mark */}
				<div
					aria-hidden
					className="absolute right-0 bottom-0 left-0 z-10 h-1.5"
					style={{ background: "var(--brand-gradient)" }}
				/>
			</section>

			{/* EVENTS + CALENDAR — warm cream surface */}
			<section className="bg-brand-page relative py-20 md:py-24">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
						<div>
							<Eyebrow>On the Calendar</Eyebrow>
							<h2 className="text-brand-ink text-3xl leading-tight font-extrabold tracking-[-0.015em] md:text-4xl lg:text-5xl">
								Upcoming{" "}
								<span
									className="text-brand-maroon italic"
									style={{
										fontFamily: "'Fraunces', Georgia, serif",
										fontWeight: 500,
									}}
								>
									happenings.
								</span>
							</h2>
							<p className="text-brand-ink/70 mt-3 max-w-xl text-base md:text-lg">
								Council meetings, dorm rituals, deadlines, and the occasional
								merienda — everything on the floor this season.
							</p>
						</div>
						<Button
							variant="outline"
							className="border-brand-maroon/40 text-brand-maroon hover:bg-brand-maroon hover:text-brand-cream hidden md:inline-flex"
							asChild
						>
							<a href="/calendar" className="flex items-center">
								Full calendar
								<ArrowRight className="ml-2 h-4 w-4" />
							</a>
						</Button>
					</div>

					<div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
						<PaginatedEventList events={events} />

						<Card className="border-brand-maroon/15 bg-brand-card overflow-hidden p-0 shadow-sm">
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

			{/* QUICK ACTIONS — white surface for contrast against cream sections */}
			{quickActions.length > 0 && (
				<section className="bg-brand-card relative py-20 md:py-24">
					{/* Top gradient hairline */}
					<div
						aria-hidden
						className="absolute top-0 right-0 left-0 h-px"
						style={{ background: "var(--brand-gradient)" }}
					/>
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<div className="mb-12 max-w-2xl">
							<Eyebrow>When You Need It</Eyebrow>
							<h2 className="text-brand-ink text-3xl leading-tight font-extrabold tracking-[-0.015em] md:text-4xl lg:text-5xl">
								Everything,{" "}
								<span
									className="text-brand-maroon italic"
									style={{
										fontFamily: "'Fraunces', Georgia, serif",
										fontWeight: 500,
									}}
								>
									within reach.
								</span>
							</h2>
							<p className="text-brand-ink/70 mt-3 text-base md:text-lg">
								The shortcuts dormers reach for most — bookmarked, organised, one
								tap away.
							</p>
						</div>

						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
							{quickActions.map((action, idx) => {
								const Icon = getIcon(action.iconKey);
								// Rotate accent colors across the row for palette breadth (DESIGN.md §2)
								const accents = [
									"text-brand-maroon bg-brand-maroon/10",
									"text-brand-crimson bg-brand-crimson/10",
									"text-brand-violet bg-brand-violet/10",
									"text-brand-orange bg-brand-orange/10",
								];
								const accent = accents[idx % accents.length];
								return (
									<Card
										key={action.id}
										className="group border-brand-maroon/10 hover:border-brand-maroon/30 hover:bg-brand-page/40 flex flex-col gap-0 overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg"
									>
										<a
											href={action.href}
											className="flex flex-1 flex-col p-6 text-left"
										>
											<div
												className={cn(
													"mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
													accent,
												)}
											>
												<Icon className="h-6 w-6" />
											</div>
											<h3 className="text-brand-ink mb-2 text-lg font-bold">
												{action.title}
											</h3>
											<p className="text-brand-ink/65 mb-5 flex-1 text-sm leading-relaxed">
												{action.description}
											</p>
											<div className="text-brand-maroon group-hover:text-brand-crimson mt-auto flex items-center text-sm font-semibold transition-colors">
												{action.buttonLabel}
												<ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
											</div>
										</a>
									</Card>
								);
							})}
						</div>

						{/* Mobile-only "Full calendar" link to mirror desktop placement above */}
						<div className="mt-10 flex justify-center md:hidden">
							<Button
								variant="outline"
								className="border-brand-maroon/40 text-brand-maroon"
								asChild
							>
								<a href="/calendar" className="flex items-center">
									Full calendar
									<ArrowRight className="ml-2 h-4 w-4" />
								</a>
							</Button>
						</div>
					</div>
				</section>
			)}

			{/* SOCIALS — brand-tile treatment per platform, larger and more prominent */}
			{socials.length > 0 && (
				<section className="bg-brand-page relative py-20 md:py-24">
					<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
						<div className="mb-12 max-w-2xl">
							<Eyebrow>Off the Page</Eyebrow>
							<h2 className="text-brand-ink text-3xl leading-tight font-extrabold tracking-[-0.015em] md:text-4xl lg:text-5xl">
								Find us{" "}
								<span
									className="text-brand-maroon italic"
									style={{
										fontFamily: "'Fraunces', Georgia, serif",
										fontWeight: 500,
									}}
								>
									elsewhere.
								</span>
							</h2>
							<p className="text-brand-ink/70 mt-3 text-base md:text-lg">
								Daily updates, behind-the-scenes, and dorm chismis live across our
								socials.
							</p>
						</div>

						<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{socials.map((social) => (
								<a
									key={social.id}
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									className="group border-brand-maroon/15 bg-brand-card hover:border-brand-maroon/30 relative flex items-center gap-5 overflow-hidden rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
								>
									<div
										className={cn(
											"flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl",
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
									<div className="min-w-0 flex-1">
										<div className="text-brand-ink/50 mb-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase">
											{social.platform}
										</div>
										<div className="text-brand-ink truncate text-base font-bold">
											{social.handle}
										</div>
										<div className="text-brand-maroon group-hover:text-brand-crimson mt-1 flex items-center text-xs font-semibold transition-colors">
											Follow
											<ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
										</div>
									</div>
								</a>
							))}
						</div>
					</div>
				</section>
			)}

			{/* FINAL CTA — signature gradient block (DESIGN.md §3) */}
			<section
				className="relative overflow-hidden py-24 md:py-32"
				style={{ background: "var(--brand-gradient)" }}
			>
				{/* Subtle diagonal lines for texture */}
				<svg
					aria-hidden
					className="absolute inset-0 h-full w-full opacity-10"
					preserveAspectRatio="none"
					viewBox="0 0 100 100"
				>
					{Array.from({ length: 20 }).map((_, i) => (
						<line
							key={i}
							x1={-20 + i * 10}
							y1="0"
							x2={20 + i * 10}
							y2="100"
							stroke="white"
							strokeWidth="0.3"
						/>
					))}
				</svg>

				<div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
					<p
						className="mb-5 text-lg text-white/85 md:text-xl"
						style={{
							fontFamily: "'Fraunces', Georgia, serif",
							fontStyle: "italic",
							fontWeight: 400,
						}}
					>
						in ARSA,
					</p>
					<h2 className="mb-6 text-4xl leading-[1.05] font-extrabold tracking-[-0.02em] text-white md:text-6xl lg:text-7xl">
						It's good to be{" "}
						<span
							className="italic"
							style={{
								fontFamily: "'Fraunces', Georgia, serif",
								fontWeight: 500,
								color: "var(--brand-saffron)",
							}}
						>
							home.
						</span>
					</h2>
					<p className="mx-auto mb-10 max-w-2xl text-base text-white/85 md:text-lg">
						Whether you're a freshie figuring out the laundry schedule or a
						graduating senior packing up — there's a corner of ARSA waiting for
						you.
					</p>
					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<Button
							size="lg"
							className="bg-brand-cream text-brand-maroon h-12 px-7 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl"
							asChild
						>
							<a href="/about" className="flex items-center">
								<Users className="mr-2 h-5 w-5" />
								Meet the council
							</a>
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="h-12 border-white/40 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
							asChild
						>
							<a href="/shop" className="flex items-center">
								<ShoppingCart className="mr-2 h-5 w-5" />
								Visit the shop
							</a>
						</Button>
					</div>
				</div>

				{/* Bottom gradient strip mirrors hero */}
				<div
					aria-hidden
					className="absolute right-0 bottom-0 left-0 h-1.5 bg-white/20"
				/>
			</section>
		</div>
	);
}
