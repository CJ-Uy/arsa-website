"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const BALLOON_COLORS = ["#6399A0", "#966C95", "#EACA5B", "#ACAA7E", "#D1733F", "#CE886E"];

type Balloon = {
	id: number;
	x: number; // percentage (0-100)
	y: number; // pixels from top of container
	size: number;
	color: string;
	wobbleOffset: number;
	wobbleSpeed: number;
	wobbleAmount: number;
	speed: number; // px per frame
	opacity: number;
	rotation: number;
};

let balloonIdCounter = 0;

function createBalloon(containerHeight: number, startFromBottom: boolean): Balloon {
	const size = 30 + Math.random() * 35;
	return {
		id: balloonIdCounter++,
		x: 2 + Math.random() * 96,
		y: startFromBottom
			? containerHeight + size + Math.random() * 200
			: Math.random() * containerHeight,
		size,
		color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
		wobbleOffset: Math.random() * Math.PI * 2,
		wobbleSpeed: 0.008 + Math.random() * 0.015,
		wobbleAmount: 15 + Math.random() * 25,
		speed: 0.4 + Math.random() * 0.6,
		opacity: 0.15 + Math.random() * 0.2,
		rotation: -10 + Math.random() * 20,
	};
}

function BalloonElement({ balloon }: { balloon: Balloon }) {
	const wobbleX = Math.sin(balloon.wobbleOffset) * balloon.wobbleAmount;

	return (
		<div
			className="absolute"
			style={{
				left: `${balloon.x}%`,
				top: balloon.y,
				opacity: balloon.opacity,
				transform: `translateX(${wobbleX}px) rotate(${balloon.rotation}deg)`,
				transition: "none",
				willChange: "transform, top",
			}}
		>
			{/* Balloon body */}
			<svg
				width={balloon.size}
				height={balloon.size * 1.25 + 30}
				viewBox="0 0 40 80"
				fill="none"
			>
				{/* Balloon shape */}
				<ellipse cx="20" cy="22" rx="17" ry="22" fill={balloon.color} />
				{/* Shine highlight */}
				<ellipse
					cx="13"
					cy="15"
					rx="4"
					ry="6"
					fill="white"
					opacity="0.35"
					transform="rotate(-15 13 15)"
				/>
				{/* Knot */}
				<polygon points="18,44 22,44 20,47" fill={balloon.color} />
				{/* String */}
				<path
					d="M20 47 Q22 58 19 68 Q17 75 20 80"
					stroke={balloon.color}
					strokeWidth="0.8"
					fill="none"
					opacity="0.5"
				/>
			</svg>
		</div>
	);
}

export function SSOBalloonsAnimation({ isActive }: { isActive: boolean }) {
	const [balloons, setBalloons] = useState<Balloon[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const animFrameRef = useRef<number>(0);
	const balloonsRef = useRef<Balloon[]>([]);
	const initialBurstDone = useRef<boolean>(false);

	// Sync ref with state
	useEffect(() => {
		balloonsRef.current = balloons;
	}, [balloons]);

	const animate = useCallback(() => {
		const container = containerRef.current;
		if (!container) {
			animFrameRef.current = requestAnimationFrame(animate);
			return;
		}

		const updated = balloonsRef.current
			.map((b) => ({
				...b,
				y: b.y - b.speed,
				wobbleOffset: b.wobbleOffset + b.wobbleSpeed,
			}))
			.filter((b) => b.y > -100); // Remove balloons that floated off top

		balloonsRef.current = updated;
		setBalloons([...updated]);
		animFrameRef.current = requestAnimationFrame(animate);
	}, []);

	useEffect(() => {
		if (!isActive) return;

		// Check reduced motion
		const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (prefersReduced) return;

		const container = containerRef.current;
		if (!container) return;

		// Initial burst: spawn many balloons spread across the page
		if (!initialBurstDone.current) {
			initialBurstDone.current = true;
			const containerHeight = container.scrollHeight || 3000;
			const initialBalloons: Balloon[] = [];

			// Spread ~25 balloons across the full page height
			for (let i = 0; i < 25; i++) {
				const b = createBalloon(containerHeight, false);
				// Distribute evenly across the page
				b.y = (containerHeight * i) / 25 + Math.random() * (containerHeight / 25);
				initialBalloons.push(b);
			}

			balloonsRef.current = initialBalloons;
			setBalloons(initialBalloons);
		}

		// Start animation loop
		animFrameRef.current = requestAnimationFrame(animate);

		// Passive spawning: add a new balloon every 2-4 seconds
		// Spawns near current scroll position so they appear throughout the whole page
		const spawnInterval = setInterval(() => {
			const containerHeight = container.scrollHeight || 3000;
			const scrollY = window.scrollY || 0;
			const viewportHeight = window.innerHeight;

			// Spawn balloon somewhere within/around the current viewport
			// Randomly pick between: just below viewport (rises into view)
			// or at a random position across the full page
			const spawnNearViewport = Math.random() > 0.3;
			const newBalloon = createBalloon(containerHeight, false);

			if (spawnNearViewport) {
				// Spawn just below the current viewport so it rises into view
				newBalloon.y = scrollY + viewportHeight + 50 + Math.random() * 150;
			} else {
				// Spawn at a random position across the full page height
				newBalloon.y = Math.random() * containerHeight;
			}

			newBalloon.opacity = 0.12 + Math.random() * 0.18;
			balloonsRef.current = [...balloonsRef.current, newBalloon];
			setBalloons([...balloonsRef.current]);
		}, 2000 + Math.random() * 2000);

		return () => {
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
			clearInterval(spawnInterval);
		};
	}, [isActive, animate]);

	if (!isActive) return null;

	return (
		<div ref={containerRef} className="sso-balloons-layer" aria-hidden="true">
			{balloons.map((b) => (
				<BalloonElement key={b.id} balloon={b} />
			))}
		</div>
	);
}
