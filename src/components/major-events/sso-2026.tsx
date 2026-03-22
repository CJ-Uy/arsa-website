"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BalloonAnimation } from "./balloon-animation";
import { ChevronDown, MapPin, Calendar, ShoppingBag, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const STICKER_BASE = "/images/major event landing/2026/sso/merch/STICKERS";

const SSO_IMAGES = {
	logo: "/images/major event landing/2026/sso/Main_Logo_White-removebg-preview.png",
	logoLong: "/images/major event landing/2026/sso/Long_Logo_White-removebg-preview.png",
	shirtBlue: "/images/major event landing/2026/sso/merch/TSHIRT MOCKUP/FRONT BLUE.png",
	shirtBlueback: "/images/major event landing/2026/sso/merch/TSHIRT MOCKUP/BACK BLUE.png",
	shirtWhite: "/images/major event landing/2026/sso/merch/TSHIRT MOCKUP/FRONT WHITE.png",
	shirtWhiteback: "/images/major event landing/2026/sso/merch/TSHIRT MOCKUP/BACK WHITE.png",
	bottleCap: "/images/major event landing/2026/sso/Bottle_Cap_Custom-removebg-preview.png",
	keyFob: "/images/major event landing/2026/sso/Key_Fob-removebg-preview.png",
	reveal1: "/images/major event landing/2026/sso/merch/REVEAL/1.png",
	reveal2: "/images/major event landing/2026/sso/merch/REVEAL/2.png",
	reveal3: "/images/major event landing/2026/sso/merch/REVEAL/3.png",
	reveal4: "/images/major event landing/2026/sso/merch/REVEAL/4.png",
	reveal5: "/images/major event landing/2026/sso/merch/REVEAL/5.png",
};

const DORMER_STICKERS = [
	{ src: `${STICKER_BASE}/DORMER EXPERIENCE.png`, label: "Finally Did My Laundry!" },
	{ src: `${STICKER_BASE}/DORMER EXPERIENCE (2).png`, label: "Packed My Last Balikbayan Box!" },
	{ src: `${STICKER_BASE}/DORMER EXPERIENCE (3).png`, label: "Cat Attacked My Group Order!" },
	{ src: `${STICKER_BASE}/DORMER EXPERIENCE (4).png`, label: "More Coffee Buns!" },
	{ src: `${STICKER_BASE}/DORMER EXPERIENCE (5).png`, label: "Made It Before Curfew!" },
	{ src: `${STICKER_BASE}/DORMER EXPERIENCE (6).png`, label: "Dorm Speakers Woke Me Up!" },
];

const GRAD_STICKERS = [
	{ src: `${STICKER_BASE}/AFTER GRADUATION.png`, label: "CV Sent!" },
	{ src: `${STICKER_BASE}/AFTER GRADUATION (2).png`, label: "First Paycheck!" },
	{ src: `${STICKER_BASE}/AFTER GRADUATION (3).png`, label: "First Bill!" },
	{ src: `${STICKER_BASE}/AFTER GRADUATION (4).png`, label: "No More Canvas Deadlines!" },
	{ src: `${STICKER_BASE}/AFTER GRADUATION (5).png`, label: "Considering My Masters!" },
	{ src: `${STICKER_BASE}/AFTER GRADUATION (6).png`, label: "Moved Out!" },
];

function CountdownTimer({ targetDate }: { targetDate: Date }) {
	const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

	useEffect(() => {
		function update() {
			const now = new Date().getTime();
			const distance = targetDate.getTime() - now;
			if (distance < 0) {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
				return;
			}
			setTimeLeft({
				days: Math.floor(distance / (1000 * 60 * 60 * 24)),
				hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((distance % (1000 * 60)) / 1000),
			});
		}
		update();
		const interval = setInterval(update, 1000);
		return () => clearInterval(interval);
	}, [targetDate]);

	const units = [
		{ label: "Days", value: timeLeft.days },
		{ label: "Hours", value: timeLeft.hours },
		{ label: "Mins", value: timeLeft.minutes },
		{ label: "Secs", value: timeLeft.seconds },
	];

	return (
		<div className="flex items-center justify-center gap-4 sm:gap-5">
			{units.map((unit) => (
				<div key={unit.label} className="flex flex-col items-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#845942]/40 font-[family-name:var(--font-farm-to-market)] text-3xl font-bold text-white backdrop-blur-sm sm:h-20 sm:w-20 sm:text-4xl">
						{String(unit.value).padStart(2, "0")}
					</div>
					<span className="mt-1.5 text-sm tracking-wider text-white/80 uppercase">
						{unit.label}
					</span>
				</div>
			))}
		</div>
	);
}

function ScrapbookFrame({ children, className = "", rotate = 0 }: { children: React.ReactNode; className?: string; rotate?: number }) {
	return (
		<div
			className={`relative bg-white p-3 shadow-lg ${className}`}
			style={{ transform: `rotate(${rotate}deg)` }}
		>
			{/* Tape strips */}
			<div className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-[-2deg] bg-amber-100/80" />
			{children}
		</div>
	);
}

function MerchCard({
	frontImg,
	backImg,
	label,
	rotate,
}: {
	frontImg: string;
	backImg: string;
	label: string;
	rotate: number;
}) {
	const [flipped, setFlipped] = useState(false);
	return (
		<ScrapbookFrame rotate={rotate} className="w-72 cursor-pointer sm:w-[22rem]">
			<div
				className="relative w-full"
				onClick={() => setFlipped(!flipped)}
				style={{ perspective: "1000px" }}
			>
				<div
					className="relative aspect-[3/4] w-full transition-transform duration-700"
					style={{
						transformStyle: "preserve-3d",
						transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
					}}
				>
					{/* Front */}
					<div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
						<Image
							src={frontImg}
							alt={`${label} - Front`}
							fill
							className="object-contain"
							sizes="(max-width: 768px) 80vw, 380px"
						/>
					</div>
					{/* Back */}
					<div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
						<Image
							src={backImg}
							alt={`${label} - Back`}
							fill
							className="object-contain"
							sizes="(max-width: 768px) 80vw, 380px"
						/>
					</div>
				</div>
			</div>
			<p className="mt-3 text-center font-[family-name:var(--font-farm-to-market)] text-lg text-stone-700">
				{label}
			</p>
			<p className="text-center font-[family-name:var(--font-farm-to-market)] text-sm text-[#845942]">
				{flipped ? "↩ Tap to see front" : "👆 Tap to see back"}
			</p>
		</ScrapbookFrame>
	);
}

export function SSO2026Landing({ onScrollEnd }: { onScrollEnd?: () => void }) {
	const sectionRef = useRef<HTMLDivElement>(null);
	const [showArrow, setShowArrow] = useState(true);

	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) {
					onScrollEnd?.();
				}
			},
			{ threshold: 0 },
		);

		observer.observe(section);
		return () => observer.disconnect();
	}, [onScrollEnd]);

	useEffect(() => {
		const handleScroll = () => {
			setShowArrow(window.scrollY < 100);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const eventDate = new Date("2026-04-26T00:00:00");

	return (
		<div ref={sectionRef} className="relative">
			{/* ===== HERO SECTION — clean, no scattered assets ===== */}
			<section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
				{/* Sky gradient background */}
				<div
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(180deg, #374752 0%, #60797E 25%, #859893 50%, #C2A785 75%, #ECDEBC 100%)",
					}}
				/>

				{/* Scrapbook paper texture overlay */}
				<div
					className="absolute inset-0 opacity-[0.08]"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
					}}
				/>

				{/* Balloons */}
				<div className="absolute inset-0 z-0">
					<BalloonAnimation className="h-full w-full" />
				</div>

				{/* Cloud decorations */}
				<div className="absolute bottom-0 left-0 right-0 z-[1]">
					<svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
						<path
							d="M0 200V120C120 100 180 60 300 80C400 95 420 40 540 50C640 58 700 90 800 70C900 50 960 80 1080 60C1200 40 1300 80 1440 100V200H0Z"
							fill="#E7E2CE"
							fillOpacity="0.6"
						/>
						<path
							d="M0 200V150C100 130 200 100 350 120C480 137 500 90 650 100C780 108 820 130 950 115C1080 100 1200 130 1440 120V200H0Z"
							fill="#ECDEBC"
							fillOpacity="0.8"
						/>
					</svg>
				</div>

				{/* Content */}
				<div className="relative z-10 flex flex-col items-center px-4 text-center">
					{/* Logo */}
					<div className="mb-8 h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80">
						<Image
							src={SSO_IMAGES.logo}
							alt="SSO 2026 - Adventure Is Out There!"
							width={400}
							height={400}
							className="h-full w-full object-contain drop-shadow-2xl"
							priority
						/>
					</div>

					<h1 className="mb-3 font-[family-name:var(--font-gentlemens-script)] text-5xl text-white drop-shadow-lg sm:text-6xl md:text-7xl">
						Seniors&apos; Send-Off 2026
					</h1>
					<p className="mb-8 font-[family-name:var(--font-farm-to-market)] text-xl tracking-widest text-white/90 uppercase drop-shadow-md sm:text-2xl">
						Adventure Is Out There!
					</p>

					{/* Date & Venue — much bigger */}
					<div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
						<span className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 backdrop-blur-sm">
							<Calendar className="h-5 w-5 text-white" />
							<span className="font-[family-name:var(--font-farm-to-market)] text-lg font-bold tracking-wide text-white sm:text-xl">
								April 26, 2026
							</span>
						</span>
						<span className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 backdrop-blur-sm">
							<MapPin className="h-5 w-5 text-white" />
							<span className="font-[family-name:var(--font-farm-to-market)] text-lg font-bold tracking-wide text-white sm:text-xl">
								MVP Roofdeck + Zen Garden
							</span>
						</span>
					</div>

					{/* Countdown */}
					<CountdownTimer targetDate={eventDate} />
				</div>

				{/* Scroll indicator */}
				<div
					className={`absolute bottom-8 z-10 transition-opacity duration-700 ${showArrow ? "opacity-100" : "opacity-0"}`}
				>
					<ChevronDown className="h-8 w-8 animate-bounce text-white/70" />
				</div>
			</section>

			{/* ===== WHAT'S IN STORE ===== */}
			<section
				className="relative overflow-hidden py-24"
				style={{ background: "linear-gradient(180deg, #ECDEBC 0%, #E7E2CE 100%)" }}
			>
				{/* Washi tape top border */}
				<div className="absolute top-0 left-0 right-0 h-4 bg-[repeating-linear-gradient(90deg,#C89D58_0px,#C89D58_20px,transparent_20px,transparent_24px,#859893_24px,#859893_44px,transparent_44px,transparent_48px,#DD7142_48px,#DD7142_68px,transparent_68px,transparent_72px)] opacity-60" />

				{/* Scrapbook decorations reaching in from edges */}
				<div className="pointer-events-none absolute inset-0">
					{/* Left side — reaching inward */}
					<div className="absolute left-[2%] top-[8%] opacity-40 rotate-[-12deg]">
						<Image src={DORMER_STICKERS[1].src} alt="" width={85} height={85} />
					</div>
					<div className="absolute left-[6%] top-[45%] opacity-35 rotate-[18deg]">
						<Image src={SSO_IMAGES.bottleCap} alt="" width={75} height={75} />
					</div>
					<div className="absolute left-[3%] bottom-[10%] opacity-30 rotate-[-8deg]">
						<Image src={GRAD_STICKERS[2].src} alt="" width={80} height={80} />
					</div>
					<div className="absolute left-[8%] top-[70%] opacity-25 rotate-[22deg]">
						<Image src={SSO_IMAGES.keyFob} alt="" width={65} height={65} />
					</div>

					{/* Right side — reaching inward */}
					<div className="absolute right-[2%] top-[12%] opacity-40 rotate-[15deg]">
						<Image src={GRAD_STICKERS[0].src} alt="" width={85} height={85} />
					</div>
					<div className="absolute right-[7%] top-[50%] opacity-30 rotate-[-20deg]">
						<Image src={DORMER_STICKERS[4].src} alt="" width={75} height={75} />
					</div>
					<div className="absolute right-[3%] bottom-[8%] opacity-35 rotate-[10deg]">
						<Image src={SSO_IMAGES.bottleCap} alt="" width={70} height={70} />
					</div>
					<div className="absolute right-[9%] top-[25%] opacity-25 rotate-[-6deg]">
						<Image src={GRAD_STICKERS[4].src} alt="" width={65} height={65} />
					</div>

					{/* Washi tape reaching in diagonally */}
					<div className="absolute left-[0%] top-[20%] h-5 w-32 rotate-[-20deg] bg-[#C89D58]/30" />
					<div className="absolute right-[0%] top-[35%] h-5 w-28 rotate-[22deg] bg-[#859893]/25" />
					<div className="absolute left-[0%] bottom-[20%] h-5 w-36 rotate-[15deg] bg-[#DD7142]/20" />
					<div className="absolute right-[0%] bottom-[25%] h-5 w-30 rotate-[-18deg] bg-[#C89D58]/25" />
				</div>

				<div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<h2 className="mb-4 text-center font-[family-name:var(--font-gentlemens-script)] text-5xl text-[#374752] sm:text-6xl">
						What&apos;s In Store
					</h2>
					<p className="mx-auto mb-16 max-w-2xl text-center font-[family-name:var(--font-farm-to-market)] text-lg text-stone-500">
						One last adventure before the journey continues
					</p>

					<div className="grid grid-cols-1 gap-12 md:grid-cols-3">
						<FeatureCard
							icon={<ShoppingBag className="h-7 w-7" />}
							title="SSO Merch"
							description="Get your limited edition SSO 2026 shirts and sticker sets &mdash; available now in the ARSA Shop!"
							cta={{ label: "Browse Shop", href: "/shop" }}
							accentColor="#DD7142"
						/>
						<FeatureCard
							icon={<BookOpen className="h-7 w-7" />}
							title="Senior Study Room"
							description="An exclusive study space just for seniors during finals season. Opening with a pizza party!"
							badge="Opening Soon"
							accentColor="#859893"
						/>
						<FeatureCard
							icon={<Users className="h-7 w-7" />}
							title="Vols Sign Ups"
							description="Want to help make SSO 2026 the best send-off ever? Volunteer sign-ups are opening soon!"
							badge="Coming Soon"
							accentColor="#C89D58"
						/>
					</div>
				</div>
			</section>

			{/* ===== MERCH SHOWCASE — scrapbook-heavy with tons of sticker decorations ===== */}
			<section
				className="relative overflow-hidden py-24"
				style={{ background: "linear-gradient(180deg, #E7E2CE 0%, #ECDEBC 100%)" }}
			>
				{/* Scrapbook decorations — reaching in from edges, barely touching content */}
				<div className="pointer-events-none absolute inset-0">
					{/* ========== LEFT SIDE — reaching inward ========== */}
					<div className="absolute left-[1%] top-[2%] opacity-45 rotate-[-18deg]">
						<Image src={SSO_IMAGES.bottleCap} alt="" width={85} height={85} />
					</div>
					<div className="absolute left-[6%] top-[1%] opacity-35 rotate-[12deg]">
						<Image src={DORMER_STICKERS[0].src} alt="" width={75} height={75} />
					</div>
					<div className="absolute left-[0%] top-[10%] opacity-30 rotate-[15deg]">
						<Image src={GRAD_STICKERS[4].src} alt="" width={90} height={90} />
					</div>
					<div className="absolute left-[3%] top-[20%] opacity-40 rotate-[-10deg]">
						<Image src={DORMER_STICKERS[2].src} alt="" width={85} height={85} />
					</div>
					<div className="absolute left-[0%] top-[30%] opacity-35 rotate-[20deg]">
						<Image src={SSO_IMAGES.keyFob} alt="" width={75} height={75} />
					</div>
					<div className="absolute left-[5%] top-[40%] opacity-30 rotate-[-14deg]">
						<Image src={GRAD_STICKERS[5].src} alt="" width={80} height={80} />
					</div>
					<div className="absolute left-[1%] top-[50%] opacity-40 rotate-[8deg]">
						<Image src={DORMER_STICKERS[4].src} alt="" width={85} height={85} />
					</div>
					<div className="absolute left-[0%] top-[60%] opacity-35 rotate-[-22deg]">
						<Image src={SSO_IMAGES.bottleCap} alt="" width={70} height={70} />
					</div>
					<div className="absolute left-[4%] top-[70%] opacity-30 rotate-[16deg]">
						<Image src={GRAD_STICKERS[1].src} alt="" width={80} height={80} />
					</div>
					<div className="absolute left-[1%] top-[80%] opacity-35 rotate-[-6deg]">
						<Image src={DORMER_STICKERS[5].src} alt="" width={75} height={75} />
					</div>
					<div className="absolute left-[6%] top-[90%] opacity-30 rotate-[12deg]">
						<Image src={SSO_IMAGES.keyFob} alt="" width={65} height={65} />
					</div>

					{/* ========== RIGHT SIDE — reaching inward ========== */}
					<div className="absolute right-[2%] top-[1%] opacity-40 rotate-[22deg]">
						<Image src={GRAD_STICKERS[1].src} alt="" width={80} height={80} />
					</div>
					<div className="absolute right-[6%] top-[4%] opacity-30 rotate-[-8deg]">
						<Image src={SSO_IMAGES.keyFob} alt="" width={70} height={70} />
					</div>
					<div className="absolute right-[1%] top-[12%] opacity-35 rotate-[-15deg]">
						<Image src={DORMER_STICKERS[3].src} alt="" width={85} height={85} />
					</div>
					<div className="absolute right-[0%] top-[22%] opacity-30 rotate-[10deg]">
						<Image src={GRAD_STICKERS[2].src} alt="" width={80} height={80} />
					</div>
					<div className="absolute right-[4%] top-[32%] opacity-40 rotate-[-18deg]">
						<Image src={DORMER_STICKERS[1].src} alt="" width={85} height={85} />
					</div>
					<div className="absolute right-[0%] top-[42%] opacity-35 rotate-[14deg]">
						<Image src={SSO_IMAGES.bottleCap} alt="" width={75} height={75} />
					</div>
					<div className="absolute right-[5%] top-[52%] opacity-30 rotate-[-8deg]">
						<Image src={GRAD_STICKERS[0].src} alt="" width={80} height={80} />
					</div>
					<div className="absolute right-[1%] top-[62%] opacity-40 rotate-[20deg]">
						<Image src={DORMER_STICKERS[0].src} alt="" width={75} height={75} />
					</div>
					<div className="absolute right-[0%] top-[72%] opacity-30 rotate-[-12deg]">
						<Image src={SSO_IMAGES.keyFob} alt="" width={70} height={70} />
					</div>
					<div className="absolute right-[3%] top-[82%] opacity-35 rotate-[6deg]">
						<Image src={GRAD_STICKERS[3].src} alt="" width={80} height={80} />
					</div>
					<div className="absolute right-[6%] top-[92%] opacity-25 rotate-[-15deg]">
						<Image src={DORMER_STICKERS[5].src} alt="" width={70} height={70} />
					</div>

					{/* ========== WASHI TAPE — long, diagonal, reaching inward ========== */}
					<div className="absolute left-[0%] top-[6%] h-5 w-36 rotate-[-20deg] bg-[#C89D58]/35" />
					<div className="absolute left-[0%] top-[28%] h-5 w-32 rotate-[12deg] bg-[#DD7142]/25" />
					<div className="absolute left-[0%] top-[55%] h-5 w-40 rotate-[-8deg] bg-[#859893]/30" />
					<div className="absolute left-[0%] top-[78%] h-5 w-28 rotate-[18deg] bg-[#C89D58]/25" />
					<div className="absolute right-[0%] top-[8%] h-5 w-32 rotate-[18deg] bg-[#859893]/30" />
					<div className="absolute right-[0%] top-[38%] h-5 w-36 rotate-[-12deg] bg-[#C89D58]/25" />
					<div className="absolute right-[0%] top-[65%] h-5 w-40 rotate-[10deg] bg-[#DD7142]/20" />
					<div className="absolute right-[0%] top-[88%] h-5 w-28 rotate-[-20deg] bg-[#859893]/25" />
				</div>

				<div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<h2 className="mb-3 text-center font-[family-name:var(--font-gentlemens-script)] text-5xl text-[#374752] sm:text-6xl">
						Merch Collection
					</h2>
					<p className="mx-auto mb-16 max-w-lg text-center font-[family-name:var(--font-farm-to-market)] text-lg text-stone-500">
						Check out the full SSO 2026 merch lineup!
					</p>

					{/* Reveal Posters — hero center + 4 scattered around */}
					<div className="relative mb-24 mx-auto max-w-4xl flex items-center justify-center" style={{ minHeight: "420px", height: "clamp(420px, 80vw, 550px)" }}>
						{/* Center hero poster — big, absolutely centered */}
						<div className="absolute left-1/2 top-1/2 z-[2] w-64 -translate-x-1/2 -translate-y-1/2 sm:w-80 md:w-96">
							<ScrapbookFrame rotate={-1} className="transition-transform duration-300 hover:scale-105">
								<div className="relative aspect-square w-full overflow-hidden">
									<Image
										src={SSO_IMAGES.reveal1}
										alt="SSO 2026 Merch Reveal"
										fill
										className="object-cover"
										sizes="(max-width: 640px) 70vw, 384px"
									/>
								</div>
							</ScrapbookFrame>
						</div>

						{/* Top-left */}
						<div className="absolute left-0 top-0 z-[1] w-32 sm:w-44 md:w-52">
							<ScrapbookFrame rotate={-5} className="transition-transform duration-300 hover:scale-110 hover:z-10">
								<div className="relative aspect-square w-full overflow-hidden">
									<Image src={SSO_IMAGES.reveal2} alt="SSO Shirt Blue" fill className="object-cover" sizes="(max-width: 640px) 30vw, 208px" />
								</div>
							</ScrapbookFrame>
						</div>

						{/* Top-right */}
						<div className="absolute right-0 top-0 z-[1] w-32 sm:w-44 md:w-52">
							<ScrapbookFrame rotate={4} className="transition-transform duration-300 hover:scale-110 hover:z-10">
								<div className="relative aspect-square w-full overflow-hidden">
									<Image src={SSO_IMAGES.reveal3} alt="SSO Shirt White" fill className="object-cover" sizes="(max-width: 640px) 30vw, 208px" />
								</div>
							</ScrapbookFrame>
						</div>

						{/* Bottom-left */}
						<div className="absolute bottom-0 left-[3%] z-[3] w-32 sm:w-44 md:w-52">
							<ScrapbookFrame rotate={3} className="transition-transform duration-300 hover:scale-110 hover:z-10">
								<div className="relative aspect-square w-full overflow-hidden">
									<Image src={SSO_IMAGES.reveal4} alt="SSO Stickers" fill className="object-cover" sizes="(max-width: 640px) 30vw, 208px" />
								</div>
							</ScrapbookFrame>
						</div>

						{/* Bottom-right */}
						<div className="absolute bottom-0 right-[3%] z-[3] w-32 sm:w-44 md:w-52">
							<ScrapbookFrame rotate={-3} className="transition-transform duration-300 hover:scale-110 hover:z-10">
								<div className="relative aspect-square w-full overflow-hidden">
									<Image src={SSO_IMAGES.reveal5} alt="SSO Stickers" fill className="object-cover" sizes="(max-width: 640px) 35vw, 208px" />
								</div>
							</ScrapbookFrame>
						</div>
					</div>

					{/* Shirts row — BIG with tap to flip */}
					<h3 className="mb-2 text-center font-[family-name:var(--font-gentlemens-script)] text-4xl text-[#374752]">
						SSO Shirts
					</h3>
					<p className="mx-auto mb-10 max-w-lg text-center font-[family-name:var(--font-farm-to-market)] text-base text-stone-500">
						Tap the shirts to see the back design!
					</p>
					<div className="mb-20 flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-16">
						<MerchCard
							frontImg={SSO_IMAGES.shirtBlue}
							backImg={SSO_IMAGES.shirtBlueback}
							label="SSO Shirt — Blue"
							rotate={-2}
						/>
						<MerchCard
							frontImg={SSO_IMAGES.shirtWhite}
							backImg={SSO_IMAGES.shirtWhiteback}
							label="SSO Shirt — White"
							rotate={2}
						/>
					</div>

					{/* Sticker Collections */}
					<div className="mb-10">
						<h3 className="mb-4 text-center font-[family-name:var(--font-gentlemens-script)] text-4xl text-[#374752]">
							Sticker Sets
						</h3>
						<p className="mx-auto mb-12 max-w-md text-center font-[family-name:var(--font-farm-to-market)] text-base text-stone-400">
							Two collectible sets of scout-style badges — relive the dormer life & celebrate what&apos;s next!
						</p>
					</div>

					{/* Dormer Experience Collection */}
					<div className="mb-14">
						<div className="mb-8 flex items-center justify-center gap-3">
							<div className="h-px flex-1 max-w-20 bg-[#845942]/30" />
							<h4 className="font-[family-name:var(--font-farm-to-market)] text-xl tracking-wide text-[#845942]">
								Dormer Experience
							</h4>
							<div className="h-px flex-1 max-w-20 bg-[#845942]/30" />
						</div>
						<div className="grid grid-cols-3 gap-5 sm:grid-cols-6 sm:gap-8">
							{DORMER_STICKERS.map((sticker, i) => {
								const rotations = [-3, 2, -1, 3, -2, 1];
								return (
									<div key={sticker.src} className="group flex flex-col items-center">
										<div
											className="relative aspect-square w-full overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110"
											style={{ transform: `rotate(${rotations[i]}deg)` }}
										>
											<Image
												src={sticker.src}
												alt={sticker.label}
												fill
												className="object-contain"
												sizes="(max-width: 640px) 30vw, 140px"
											/>
										</div>
										<p className="mt-2 text-center font-[family-name:var(--font-farm-to-market)] text-xs text-stone-500 opacity-0 transition-opacity group-hover:opacity-100 sm:text-sm">
											{sticker.label}
										</p>
									</div>
								);
							})}
						</div>
					</div>

					{/* After Graduation Collection */}
					<div className="mb-14">
						<div className="mb-8 flex items-center justify-center gap-3">
							<div className="h-px flex-1 max-w-20 bg-[#845942]/30" />
							<h4 className="font-[family-name:var(--font-farm-to-market)] text-xl tracking-wide text-[#845942]">
								After Graduation
							</h4>
							<div className="h-px flex-1 max-w-20 bg-[#845942]/30" />
						</div>
						<div className="grid grid-cols-3 gap-5 sm:grid-cols-6 sm:gap-8">
							{GRAD_STICKERS.map((sticker, i) => {
								const rotations = [2, -2, 3, -1, 2, -3];
								return (
									<div key={sticker.src} className="group flex flex-col items-center">
										<div
											className="relative aspect-square w-full overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110"
											style={{ transform: `rotate(${rotations[i]}deg)` }}
										>
											<Image
												src={sticker.src}
												alt={sticker.label}
												fill
												className="object-contain"
												sizes="(max-width: 640px) 30vw, 140px"
											/>
										</div>
										<p className="mt-2 text-center font-[family-name:var(--font-farm-to-market)] text-xs text-stone-500 opacity-0 transition-opacity group-hover:opacity-100 sm:text-sm">
											{sticker.label}
										</p>
									</div>
								);
							})}
						</div>
					</div>

					<div className="mt-14 text-center">
						<Button
							size="lg"
							className="bg-[#845942] px-8 py-6 font-[family-name:var(--font-farm-to-market)] text-lg tracking-wide text-white hover:bg-[#6e4a37]"
							asChild
						>
							<a href="/shop">
								<ShoppingBag className="mr-2 h-5 w-5" />
								Shop All Merch
							</a>
						</Button>
					</div>
				</div>
			</section>

			{/* ===== BOTTOM CTA ===== */}
			<section className="relative overflow-hidden py-24">
				<div
					className="absolute inset-0"
					style={{
						background: "linear-gradient(180deg, #ECDEBC 0%, #C2A785 30%, #60797E 70%, #374752 100%)",
					}}
				/>

				{/* Balloons layer */}
				<div className="absolute inset-0 z-0">
					<BalloonAnimation className="h-full w-full" />
				</div>

				{/* Cloud top */}
				<div className="absolute top-0 left-0 right-0 z-[1] rotate-180">
					<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
						<path
							d="M0 120V60C200 40 350 80 500 60C650 40 750 70 900 55C1050 40 1200 70 1440 50V120H0Z"
							fill="#ECDEBC"
						/>
					</svg>
				</div>

				<div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
					<Image
						src={SSO_IMAGES.logoLong}
						alt="SSO 2026"
						width={500}
						height={120}
						className="mx-auto mb-10 drop-shadow-lg"
					/>
					<p className="mb-10 font-[family-name:var(--font-farm-to-market)] text-xl text-white/90 drop-shadow-md sm:text-2xl">
						One last chapter. One great adventure. See you on the roofdeck.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button
							size="lg"
							className="bg-white/90 px-8 py-6 font-[family-name:var(--font-farm-to-market)] text-lg tracking-wide text-[#374752] hover:bg-white"
							asChild
						>
							<a href="/shop">
								<ShoppingBag className="mr-2 h-5 w-5" />
								Visit the Shop
							</a>
						</Button>
					</div>

					{/* Scroll down hint */}
					<div className="mt-20 flex flex-col items-center gap-2">
						<p className="font-[family-name:var(--font-farm-to-market)] text-base text-white/60">
							Scroll down to continue to ARSA home
						</p>
						<ChevronDown className="h-7 w-7 animate-bounce text-white/50" />
					</div>
				</div>
			</section>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
	cta,
	badge,
	accentColor,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	cta?: { label: string; href: string };
	badge?: string;
	accentColor: string;
}) {
	return (
		<div className="group relative">
			<div className="relative rounded-sm bg-white p-6 shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
				{/* Tape decoration */}
				<div
					className="absolute -top-2 left-6 h-5 w-12 rotate-[-3deg] opacity-70"
					style={{ backgroundColor: accentColor }}
				/>

				<div
					className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
					style={{ backgroundColor: `${accentColor}40` }}
				>
					<div style={{ color: accentColor }}>{icon}</div>
				</div>

				<h3 className="mb-3 font-[family-name:var(--font-farm-to-market)] text-2xl text-[#374752]">
					{title}
				</h3>
				<p
					className="mb-4 text-base leading-relaxed text-stone-500"
					dangerouslySetInnerHTML={{ __html: description }}
				/>

				{cta && (
					<Button
						variant="outline"
						size="sm"
						className="font-[family-name:var(--font-farm-to-market)] text-base tracking-wide"
						asChild
					>
						<a href={cta.href}>{cta.label}</a>
					</Button>
				)}

				{badge && (
					<span
						className="inline-block rounded-full px-4 py-1.5 font-[family-name:var(--font-farm-to-market)] text-sm tracking-wider text-white"
						style={{ backgroundColor: accentColor }}
					>
						{badge}
					</span>
				)}
			</div>
		</div>
	);
}
