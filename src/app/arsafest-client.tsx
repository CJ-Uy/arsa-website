"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
	Calendar,
	MapPin,
	Clock,
	ChevronDown,
	Music,
	Sparkles,
	PartyPopper,
	ShoppingBag,
	Palette,
	Users,
	Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

// ─── Image Paths ────────────────────────────────────────────────────
const IMAGES = {
	banner: "/images/arsafest/%5BAF26%5D%20Banner.webp",
	fbCover: "/images/arsafest/%5BARSAFEST%5D%20Performer%20FB%20Cover.webp",
	lineup: [
		{ src: "/images/arsafest/%5BARSAFEST%5D%20Lineup%20(Square)/16.webp", name: "Sugarcane" },
		{ src: "/images/arsafest/%5BARSAFEST%5D%20Lineup%20(Square)/17.webp", name: "Noah Alejandre" },
		{ src: "/images/arsafest/%5BARSAFEST%5D%20Lineup%20(Square)/18.webp", name: "Edsa Xxtra" },
		{ src: "/images/arsafest/%5BARSAFEST%5D%20Lineup%20(Square)/19.webp", name: "Dree Yap" },
		{ src: "/images/arsafest/%5BARSAFEST%5D%20Lineup%20(Square)/20.webp", name: "ARSA DT" },
		{ src: "/images/arsafest/%5BARSAFEST%5D%20Lineup%20(Square)/21.webp", name: "Arsaound" },
	],
	kulturarsa: [
		"/images/arsafest/KulturARSA%20pubmat/1.webp",
		"/images/arsafest/KulturARSA%20pubmat/2.webp",
		"/images/arsafest/KulturARSA%20pubmat/3.webp",
		"/images/arsafest/KulturARSA%20pubmat/4.webp",
	],
	events: {
		bao: "/images/arsafest/%5BARSAFEST%5D%20FM%26A%20Prog%20Pubmats/BAO%20(030126).webp",
		bingo:
			"/images/arsafest/%5BARSAFEST%5D%20FM%26A%20Prog%20Pubmats/BINGO%20NIGHT%20(030226).webp",
		fleaMarket:
			"/images/arsafest/%5BARSAFEST%5D%20FM%26A%20Prog%20Pubmats/FLEA%20MARKET%20(030326).webp",
		gimmicks: "/images/arsafest/%5BARSAFEST%5D%20FM%26A%20Prog%20Pubmats/GIMMICKS%20(030326).webp",
		henna: "/images/arsafest/%5BARSAFEST%5D%20FM%26A%20Prog%20Pubmats/HENNA%20(030426).webp",
		pancitCanton:
			"/images/arsafest/%5BARSAFEST%5D%20FM%26A%20Prog%20Pubmats/PANCIT%20CANTON%20(030126).webp",
	},
};

// ─── Schedule Data ──────────────────────────────────────────────────
const schedule = [
	{
		day: "Day 1",
		date: "March 4",
		label: "Opening Program",
		color: "from-orange-500 to-red-600",
		events: [
			{
				time: "5:00 PM",
				title: "Opening Program",
				description: "Kick-off ceremony for ARSAFest SIDLAK 2026",
				icon: PartyPopper,
			},
			{
				time: "5:30 PM",
				title: "Pancit Canton Eating Competition",
				description: "Semi-Finals - Put your appetite and speed to the test!",
				icon: Users,
			},
			{
				time: "All Day",
				title: "KulturARSA Booth Design",
				description: "Design period begins - Luzon, Visayas, Mindanao booth decorating",
				icon: Palette,
			},
		],
	},
	{
		day: "Day 2",
		date: "March 5",
		label: "Activities Day",
		color: "from-yellow-500 to-orange-500",
		events: [
			{
				time: "1:00 - 6:00 PM",
				title: "Henna Tattoos",
				description: "By Hara Henna - Add art to your ARSAFest experience!",
				icon: Sparkles,
			},
			{
				time: "5:00 PM",
				title: "KulturARSA Final Judging",
				description: "Regional booth design contest finals",
				icon: Palette,
			},
			{
				time: "5:30 - 6:00 PM",
				title: "Kadang-Kadang sa Bao",
				description: "Classic Filipino coconut shell race game at Cervini Driveway",
				icon: Users,
			},
			{
				time: "6:00 - 8:00 PM",
				title: "Bingo Night",
				description: "Suspense, cheers, and lucky numbers - No fees!",
				icon: PartyPopper,
			},
		],
	},
	{
		day: "Day 3",
		date: "March 6",
		label: "CulmiNight: Liyab",
		color: "from-red-600 to-purple-700",
		events: [
			{
				time: "All Day",
				title: "Flea Market / Ukay-Ukay",
				description: "Pre-loved pieces from Php 20 to Php 300!",
				icon: ShoppingBag,
			},
			{
				time: "All Day",
				title: "ARSAFest Gimmicks",
				description: "Friendship Bracelets, Marriage Booth, Karaoke & Dedications",
				icon: Sparkles,
			},
			{
				time: "6:00 PM",
				title: "Pancit Canton Finals",
				description: "The ultimate eating competition showdown!",
				icon: Users,
			},
			{
				time: "6:00 - 10:00 PM",
				title: "CulmiNight: Liyab",
				description: "Live performances at Cervini Field",
				icon: Music,
			},
		],
	},
];

// ─── Event Dates (PHT / UTC+8) ──────────────────────────────────────
const EVENT_START = new Date("2026-03-04T17:00:00+08:00"); // Opening Program
const EVENT_END = new Date("2026-03-06T22:00:00+08:00"); // CulmiNight ends

type EventPhase = "before" | "during" | "after";

function useEventCountdown() {
	const calculate = useCallback(() => {
		const now = new Date().getTime();
		const start = EVENT_START.getTime();
		const end = EVENT_END.getTime();

		if (now >= end) {
			return { days: 0, hours: 0, minutes: 0, seconds: 0, phase: "after" as EventPhase };
		}
		if (now >= start) {
			return { days: 0, hours: 0, minutes: 0, seconds: 0, phase: "during" as EventPhase };
		}
		const diff = start - now;
		return {
			days: Math.floor(diff / (1000 * 60 * 60 * 24)),
			hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((diff % (1000 * 60)) / 1000),
			phase: "before" as EventPhase,
		};
	}, []);

	const [time, setTime] = useState(calculate);

	useEffect(() => {
		const timer = setInterval(() => setTime(calculate()), 1000);
		return () => clearInterval(timer);
	}, [calculate]);

	return time;
}

// ─── Floating Confetti Animation ────────────────────────────────────
function FloatingElements() {
	const [particles, setParticles] = useState<
		Array<{
			id: number;
			left: number;
			delay: number;
			duration: number;
			color: string;
			size: number;
			type: string;
		}>
	>([]);

	useEffect(() => {
		const colors = ["#E8742C", "#F5C518", "#D4301A", "#4A7C3F", "#3B82F6", "#A855F7"];
		const types = ["triangle", "circle", "square"];
		setParticles(
			Array.from({ length: 20 }, (_, i) => ({
				id: i,
				left: Math.random() * 100,
				delay: Math.random() * 8,
				duration: 6 + Math.random() * 8,
				color: colors[Math.floor(Math.random() * colors.length)],
				size: 6 + Math.random() * 10,
				type: types[Math.floor(Math.random() * types.length)],
			})),
		);
	}, []);

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{particles.map((p) => (
				<div
					key={p.id}
					className="animate-float absolute opacity-40"
					style={{
						left: `${p.left}%`,
						bottom: "-20px",
						animationDelay: `${p.delay}s`,
						animationDuration: `${p.duration}s`,
						width: p.size,
						height: p.size,
						backgroundColor: p.color,
						borderRadius: p.type === "circle" ? "50%" : p.type === "triangle" ? "0" : "2px",
						clipPath: p.type === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
					}}
				/>
			))}
		</div>
	);
}

// ─── Countdown Digit Box ────────────────────────────────────────────
function CountdownBox({ value, label }: { value: number; label: string }) {
	return (
		<div className="flex flex-col items-center">
			<div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-3xl font-bold text-white shadow-lg backdrop-blur-sm sm:h-20 sm:w-20 sm:text-4xl md:h-24 md:w-24 md:text-5xl">
				<div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent" />
				<span className="relative">{String(value).padStart(2, "0")}</span>
			</div>
			<span className="mt-2 text-xs font-medium tracking-wider text-white/70 uppercase sm:text-sm">
				{label}
			</span>
		</div>
	);
}

// ─── Image Modal ────────────────────────────────────────────────────
function ImageModal({
	src,
	alt,
	open,
	onClose,
}: {
	src: string;
	alt: string;
	open: boolean;
	onClose: () => void;
}) {
	useEffect(() => {
		if (open) document.body.style.overflow = "hidden";
		else document.body.style.overflow = "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="animate-in fade-in zoom-in-95 relative max-h-[90vh] max-w-[90vw] duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-200"
				>
					&times;
				</button>
				<img
					src={src}
					alt={alt}
					className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
				/>
			</div>
		</div>
	);
}

// ─── Main Component ─────────────────────────────────────────────────
export default function ARSAFestClient() {
	const countdown = useEventCountdown();
	const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	return (
		<div className="min-h-screen bg-[#0f1729] text-white">
			{/* ─── Hero Section ───────────────────────────────────── */}
			<section className="relative flex flex-col overflow-hidden">
				{/* Banner Image — fit to full width, not cropped */}
				<div className="relative w-full">
					<Image
						src={IMAGES.banner}
						alt="ARSAFest SIDLAK 2026 Banner"
						width={1920}
						height={960}
						className="h-auto w-full object-contain"
						priority
					/>
					{/* Gradient fade at bottom of banner into content area */}
					<div className="absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-[#0f1729] to-transparent sm:h-32" />
				</div>

				<FloatingElements />

				{/* Hero Content — sits below the banner */}
				<div
					className={`relative z-10 -mt-8 flex flex-col items-center px-4 pb-16 text-center transition-all duration-1000 sm:-mt-12 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
				>
					<Badge className="mb-4 border-orange-400/30 bg-orange-500/20 px-4 py-1.5 text-orange-200 sm:mb-6">
						Ateneo Resident Students Association
					</Badge>

					<div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/80 sm:mb-8 sm:gap-6 sm:text-base">
						<span className="flex items-center gap-1.5">
							<Calendar className="h-4 w-4 text-orange-400" />
							March 4 &ndash; 6, 2026
						</span>
						<span className="flex items-center gap-1.5">
							<MapPin className="h-4 w-4 text-orange-400" />
							Cervini &amp; IRH Fields
						</span>
					</div>

					{/* Countdown / Status */}
					{countdown.phase === "before" && (
						<div className="mb-8">
							<p className="mb-3 text-xs font-semibold tracking-widest text-white/60 uppercase sm:text-sm">
								Event starts in
							</p>
							<div className="flex gap-3 sm:gap-4 md:gap-6">
								<CountdownBox value={countdown.days} label="Days" />
								<CountdownBox value={countdown.hours} label="Hours" />
								<CountdownBox value={countdown.minutes} label="Mins" />
								<CountdownBox value={countdown.seconds} label="Secs" />
							</div>
						</div>
					)}
					{countdown.phase === "during" && (
						<div className="mb-8 animate-pulse rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-xl font-bold shadow-lg shadow-orange-500/30 sm:text-2xl">
							Happening Now!
						</div>
					)}
					{countdown.phase === "after" && (
						<div className="mb-8 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg text-white/70 sm:text-xl">
							Thanks for celebrating SIDLAK 2026 with us!
						</div>
					)}

					{/* CTA Buttons */}
					<div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
						<Button
							size="lg"
							className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-700 sm:w-auto sm:text-lg"
							asChild
						>
							<a href="/AF26-CULMINIGHT-TICKETS">
								<Ticket className="mr-2 h-5 w-5" />
								Buy CulmiNight Tickets
							</a>
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="w-full rounded-full border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10 sm:w-auto sm:text-lg"
							onClick={() => {
								document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" });
							}}
						>
							View Schedule
							<ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
						</Button>
					</div>
				</div>
			</section>

			{/* ─── About Section ──────────────────────────────────── */}
			<section className="relative py-16 sm:py-24">
				<div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
					<Badge className="mb-4 border-yellow-400/30 bg-yellow-500/20 text-yellow-200">
						What is SIDLAK?
					</Badge>
					<h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
						Three Days of{" "}
						<span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
							Radiance
						</span>
					</h2>
					<p className="mx-auto max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
						ARSAFest SIDLAK 2026 is the Ateneo Resident Students Association&apos;s biggest annual
						celebration &mdash; three days of games, food, culture, music, and community. From the
						Opening Program to the blazing CulmiNight &ldquo;Liyab,&rdquo; every moment is a chance
						to connect, compete, and celebrate what it means to call ARSA home.
					</p>

					{/* Quick Stats */}
					<div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
						{[
							{ value: "3", label: "Days", icon: Calendar },
							{ value: "10+", label: "Activities", icon: Sparkles },
							{ value: "6", label: "Performers", icon: Music },
							{ value: "3", label: "Regions", icon: Palette },
						].map((stat) => (
							<div
								key={stat.label}
								className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:p-6"
							>
								<stat.icon className="mx-auto mb-2 h-6 w-6 text-orange-400" />
								<div className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
								<div className="text-xs text-white/50 sm:text-sm">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── Schedule Section ───────────────────────────────── */}
			<section id="schedule" className="relative scroll-mt-16 py-16 sm:py-24">
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-950/10 to-transparent" />
				<div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
					<div className="mb-10 text-center sm:mb-14">
						<Badge className="mb-4 border-orange-400/30 bg-orange-500/20 text-orange-200">
							Event Schedule
						</Badge>
						<h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
							Three Days, Endless{" "}
							<span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
								Memories
							</span>
						</h2>
					</div>

					<Tabs defaultValue="day1" className="w-full">
						<TabsList className="mx-auto mb-8 grid w-full max-w-lg grid-cols-3 bg-white/5">
							{schedule.map((day, i) => (
								<TabsTrigger
									key={day.day}
									value={`day${i + 1}`}
									className="text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
								>
									<span className="hidden sm:inline">{day.date}</span>
									<span className="sm:hidden">{day.day}</span>
								</TabsTrigger>
							))}
						</TabsList>

						{schedule.map((day, i) => (
							<TabsContent
								key={day.day}
								value={`day${i + 1}`}
								className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
							>
								<div className="mb-6 text-center">
									<h3
										className={`inline-block bg-gradient-to-r ${day.color} bg-clip-text text-xl font-bold text-transparent sm:text-2xl`}
									>
										{day.date} &mdash; {day.label}
									</h3>
								</div>

								<div className="space-y-4">
									{day.events.map((event, j) => (
										<Card
											key={j}
											className="border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/30 hover:bg-white/10"
										>
											<CardContent className="flex items-start gap-4 p-4 sm:p-6">
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${day.color} sm:h-12 sm:w-12`}
												>
													<event.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
												</div>
												<div className="min-w-0 flex-1">
													<div className="mb-1 flex flex-wrap items-center gap-2">
														<h4 className="font-semibold text-white sm:text-lg">{event.title}</h4>
													</div>
													<p className="mb-1 text-sm text-white/50">{event.description}</p>
													<div className="flex items-center gap-1 text-xs text-orange-400 sm:text-sm">
														<Clock className="h-3.5 w-3.5" />
														{event.time}
													</div>
												</div>
											</CardContent>
										</Card>
									))}

									{/* Buy Tickets CTA for Day 3 */}
									{i === 2 && (
										<div className="mt-6 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-5 text-center backdrop-blur-sm sm:p-6">
											<p className="mb-3 text-sm font-medium text-white/70 sm:text-base">
												Don&apos;t miss CulmiNight &mdash; get your tickets now!
											</p>
											<Button
												size="lg"
												className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-8 font-semibold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-700"
												asChild
											>
												<a href="/AF26-CULMINIGHT-TICKETS">
													<Ticket className="mr-2 h-5 w-5" />
													Buy CulmiNight Tickets
												</a>
											</Button>
										</div>
									)}
								</div>
							</TabsContent>
						))}
					</Tabs>
				</div>
			</section>

			{/* ─── Performer Lineup Section ───────────────────────── */}
			<section className="relative overflow-hidden py-16 sm:py-24">
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />
				<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="mb-10 text-center sm:mb-14">
						<Badge className="mb-4 border-purple-400/30 bg-purple-500/20 text-purple-200">
							CulmiNight: Liyab
						</Badge>
						<h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
							Performer{" "}
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Lineup
							</span>
						</h2>
						<p className="mt-3 text-white/50">
							March 6 &middot; 6:00 &ndash; 10:00 PM &middot; Cervini Field
						</p>
					</div>

					{/* Performer FB Cover */}
					<div className="mb-10 overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:mb-14">
						<Image
							src={IMAGES.fbCover}
							alt="ARSAFest SIDLAK 2026 Performer Lineup"
							width={1200}
							height={400}
							className="w-full object-cover"
							loading="lazy"
						/>
					</div>

					{/* Performer Carousel */}
					<Carousel
						opts={{
							align: "start",
							loop: true,
						}}
						plugins={[Autoplay({ delay: 2500, stopOnInteraction: true })]}
						className="mx-auto w-full max-w-5xl"
					>
						<CarouselContent className="-ml-3 sm:-ml-4">
							{IMAGES.lineup.map((performer) => (
								<CarouselItem
									key={performer.name}
									className="basis-1/2 pl-3 sm:basis-1/3 sm:pl-4 lg:basis-1/3"
								>
									<div
										className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10"
										onClick={() => setModalImage({ src: performer.src, alt: performer.name })}
									>
										<div className="relative aspect-square overflow-hidden">
											<Image
												src={performer.src}
												alt={performer.name}
												fill
												className="object-cover transition-transform duration-500 group-hover:scale-105"
												loading="lazy"
											/>
										</div>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="hidden border-white/20 bg-white/10 text-white hover:bg-white/20 sm:-left-14 sm:flex" />
						<CarouselNext className="hidden border-white/20 bg-white/10 text-white hover:bg-white/20 sm:-right-14 sm:flex" />
					</Carousel>
				</div>
			</section>

			{/* ─── Activities Gallery ─────────────────────────────── */}
			<section className="relative py-16 sm:py-24">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="mb-10 text-center sm:mb-14">
						<Badge className="mb-4 border-green-400/30 bg-green-500/20 text-green-200">
							Activities & Events
						</Badge>
						<h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
							Something for{" "}
							<span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
								Everyone
							</span>
						</h2>
					</div>

					<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-6">
						{[
							{
								src: IMAGES.events.pancitCanton,
								alt: "Pancit Canton Eating Competition",
								label: "Pancit Canton Challenge",
							},
							{
								src: IMAGES.events.bao,
								alt: "Kadang-Kadang sa Bao Challenge",
								label: "Kadang-Kadang sa Bao",
							},
							{ src: IMAGES.events.bingo, alt: "Bingo Night", label: "Bingo Night" },
							{
								src: IMAGES.events.henna,
								alt: "Henna Tattoos by Hara Henna",
								label: "Henna Tattoos",
							},
							{
								src: IMAGES.events.fleaMarket,
								alt: "Flea Market / Ukay-Ukay",
								label: "Flea Market",
							},
							{ src: IMAGES.events.gimmicks, alt: "ARSAFest Gimmicks", label: "ARSAFest Gimmicks" },
						].map((item) => (
							<div
								key={item.label}
								className="group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10"
								onClick={() => setModalImage({ src: item.src, alt: item.alt })}
							>
								<div className="relative aspect-[4/5] overflow-hidden">
									<Image
										src={item.src}
										alt={item.alt}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-105"
										loading="lazy"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
									<div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0 sm:p-4">
										<p className="text-sm font-semibold text-white drop-shadow-lg sm:text-base">
											{item.label}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ─── KulturARSA Section ─────────────────────────────── */}
			<section className="relative overflow-hidden py-16 sm:py-24">
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/10 to-transparent" />
				<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="mb-10 text-center sm:mb-14">
						<Badge className="mb-4 border-red-400/30 bg-red-500/20 text-red-200">
							Booth Design Contest
						</Badge>
						<h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
							<span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
								KulturARSA
							</span>
						</h2>
						<p className="mx-auto mt-3 max-w-xl text-white/50">
							Show off your region&apos;s style! Luzon, Visayas, and Mindanao go head-to-head in a
							booth design contest celebrating Filipino culture.
						</p>
					</div>

					<Carousel
						opts={{
							align: "start",
							loop: true,
						}}
						plugins={[Autoplay({ delay: 3500, stopOnInteraction: true })]}
						className="mx-auto w-full max-w-4xl"
					>
						<CarouselContent className="-ml-3 sm:-ml-4">
							{IMAGES.kulturarsa.map((src, i) => (
								<CarouselItem key={i} className="basis-[80%] pl-3 sm:basis-1/2 sm:pl-4">
									<div
										className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:border-red-500/30"
										onClick={() => setModalImage({ src, alt: `KulturARSA ${i + 1}` })}
									>
										<div className="relative aspect-[4/5] overflow-hidden">
											<Image
												src={src}
												alt={`KulturARSA Booth Design Contest ${i + 1}`}
												fill
												className="object-cover"
												loading="lazy"
											/>
										</div>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="hidden border-white/20 bg-white/10 text-white hover:bg-white/20 sm:-left-14 sm:flex" />
						<CarouselNext className="hidden border-white/20 bg-white/10 text-white hover:bg-white/20 sm:-right-14 sm:flex" />
					</Carousel>
				</div>
			</section>

			{/* ─── Venue & CTA Section ────────────────────────────── */}
			<section className="relative py-16 sm:py-24">
				<div className="absolute inset-0 bg-gradient-to-t from-orange-950/20 to-transparent" />
				<div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
					<h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
						See You at{" "}
						<span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
							SIDLAK
						</span>
					</h2>
					<p className="mb-8 text-base text-white/60 sm:text-lg">
						Cervini &amp; IRH Fields &middot; March 4&ndash;6, 2026
					</p>

					<div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button
							size="lg"
							className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-8 font-semibold text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-700 sm:w-auto"
							asChild
						>
							<a href="/AF26-CULMINIGHT-TICKETS">
								<Ticket className="mr-2 h-5 w-5" />
								Buy CulmiNight Tickets
							</a>
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="w-full rounded-full border-white/20 bg-white/5 px-8 text-white hover:bg-white/10 sm:w-auto"
							asChild
						>
							<a href="/about">
								<Users className="mr-2 h-5 w-5" />
								About ARSA
							</a>
						</Button>
					</div>

					{/* Social Links */}
					<div className="flex items-center justify-center gap-4">
						<a
							href="https://facebook.com/arsaateneo"
							target="_blank"
							rel="noopener noreferrer"
							className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-blue-600 hover:text-white"
						>
							<span className="text-sm font-bold">f</span>
						</a>
						<a
							href="https://instagram.com/arsaateneo"
							target="_blank"
							rel="noopener noreferrer"
							className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white"
						>
							<span className="text-sm font-bold">IG</span>
						</a>
						<a
							href="https://tiktok.com/@arsaateneo"
							target="_blank"
							rel="noopener noreferrer"
							className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-black hover:text-white"
						>
							<span className="text-sm font-bold">T</span>
						</a>
					</div>
				</div>
			</section>

			{/* ─── Minimal Footer ─────────────────────────────────── */}
			<footer className="border-t border-white/5 py-6">
				<div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 text-center text-xs text-white/30">
					<p>&copy; 2026 Ateneo Resident Students Association</p>
					<a href="/admin" className="transition-colors hover:text-white/60">
						Admin
					</a>
				</div>
			</footer>

			{/* ─── Image Modal ────────────────────────────────────── */}
			{modalImage && (
				<ImageModal
					src={modalImage.src}
					alt={modalImage.alt}
					open={!!modalImage}
					onClose={() => setModalImage(null)}
				/>
			)}
		</div>
	);
}
