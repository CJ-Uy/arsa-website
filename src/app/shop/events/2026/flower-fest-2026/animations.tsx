"use client";

import { useEffect, useState } from "react";
import type { EventAnimationProps } from "../../types";
import confetti from "canvas-confetti";
import "./styles.css"; // Ensure CSS is loaded

// Initial falling petals burst animation (plays once on load)
export function InitialPetalsBurst({ isActive }: { isActive: boolean }) {
	// Check for reduced motion preference on mount
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mediaQuery.matches);
	}, []);

	useEffect(() => {
		if (!isActive || prefersReducedMotion) return;

		// Petal colors from the color palette
		const petalColors = ["#E8B4B4", "#AA1A1A", "#FF6B6B", "#FFB6C1", "#FF8FA3"];

		// Heart shape
		const heartShape = confetti.shapeFromPath({
			path: "M0,-6 C-2,-8 -5,-8 -7,-6 C-9,-4 -9,-1 -7,2 L0,10 L7,2 C9,-1 9,-4 7,-6 C5,-8 2,-8 0,-6 Z",
		});

		// Sampaguita flower (5 rounded petals meeting at center)
		const sampaguitaFlower = confetti.shapeFromPath({
			// Center circle
			path:
				"M0,-2 A2,2 0 1,0 0,2 A2,2 0 1,0 0,-2 Z " +
				// Top petal (12 o'clock) - rounded tip
				"M-1.5,-2 Q-2.5,-5 -1,-8 Q0,-9 1,-8 Q2.5,-5 1.5,-2 Z " +
				// Top-right petal (2 o'clock) - rounded tip
				"M1.5,-1 Q4,-3 6,-4 Q7,-4 7,-3 Q6,0 3,1 Z " +
				// Bottom-right petal (5 o'clock) - rounded tip
				"M2,1.5 Q5,3 6,6 Q6,7 5,7 Q2,5 1,2 Z " +
				// Bottom-left petal (7 o'clock) - rounded tip
				"M-1,2 Q-2,5 -5,7 Q-6,7 -6,6 Q-5,3 -2,1.5 Z " +
				// Top-left petal (10 o'clock) - rounded tip
				"M-3,1 Q-6,0 -7,-3 Q-7,-4 -6,-4 Q-4,-3 -1.5,-1 Z",
		});

		// Delay animation start by 0.5 seconds
		const startDelay = setTimeout(() => {
			// Create falling petals effect
			const duration = 5000; // 5 seconds
			const animationEnd = Date.now() + duration;

			function randomInRange(min: number, max: number) {
				return Math.random() * (max - min) + min;
			}

			const interval = setInterval(() => {
				const timeLeft = animationEnd - Date.now();
				if (timeLeft <= 0) {
					clearInterval(interval);
					return;
				}

				const particleCount = 4; // A few more particles per frame

				// Launch petals from random positions across the top
				confetti({
					particleCount,
					startVelocity: 25, // Faster fall
					spread: 60,
					angle: randomInRange(55, 125), // Vary the angle
					origin: {
						x: randomInRange(0.1, 0.9), // Spread across the width
						y: -0.1, // Start above the viewport
					},
					colors: petalColors,
					gravity: 0.8, // Stronger gravity for faster fall
					scalar: randomInRange(1.2, 2.0), // Larger petals
					drift: randomInRange(-1, 1), // More horizontal drift
					ticks: 250, // How long particles last
					shapes: ["circle", heartShape, heartShape, heartShape, sampaguitaFlower], // More hearts (60%), circles (20%), flowers (20%)
					flat: false, // 3D appearance with rotation
					zIndex: 9999,
				});
			}, 80); // Fire every 80ms for smoother effect

			// Cleanup interval on unmount
			return () => clearInterval(interval);
		}, 500); // 0.5 second delay

		return () => clearTimeout(startDelay);
	}, [isActive, prefersReducedMotion]);

	return null;
}

// Flower Petals Animation using CSS (continuous)
export function FlowerPetalsAnimation({ config, isActive }: EventAnimationProps) {
	if (!isActive) return null;

	const petals = Array.from({ length: 20 }, (_, i) => ({
		id: i,
		left: `${Math.random() * 100}%`,
		delay: `${Math.random() * 5}s`,
		duration: `${5 + Math.random() * 5}s`,
		size: `${10 + Math.random() * 15}px`,
		opacity: 0.4 + Math.random() * 0.4,
	}));

	return (
		<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
			{petals.map((petal) => (
				<div
					key={petal.id}
					className="petal animate-fall absolute"
					style={{
						left: petal.left,
						animationDelay: petal.delay,
						animationDuration: petal.duration,
						width: petal.size,
						height: petal.size,
						opacity: petal.opacity,
						backgroundColor: config.primaryColor || "#ec4899",
					}}
				/>
			))}
		</div>
	);
}

// Hearts Animation (for Valentine's themed events)
export function HeartsAnimation({ config, isActive }: EventAnimationProps) {
	if (!isActive) return null;

	const hearts = Array.from({ length: 15 }, (_, i) => ({
		id: i,
		left: `${Math.random() * 100}%`,
		delay: `${Math.random() * 8}s`,
		duration: `${8 + Math.random() * 4}s`,
		size: `${15 + Math.random() * 20}px`,
		opacity: 0.3 + Math.random() * 0.3,
	}));

	return (
		<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
			{hearts.map((heart) => (
				<div
					key={heart.id}
					className="animate-float-up absolute"
					style={{
						left: heart.left,
						bottom: "-50px",
						animationDelay: heart.delay,
						animationDuration: heart.duration,
						opacity: heart.opacity,
					}}
				>
					<svg
						width={heart.size}
						height={heart.size}
						viewBox="0 0 24 24"
						fill={config.primaryColor || "#ec4899"}
					>
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
					</svg>
				</div>
			))}
		</div>
	);
}

// Sparkles Animation
export function SparklesAnimation({ config, isActive }: EventAnimationProps) {
	if (!isActive) return null;

	const sparkles = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		left: `${Math.random() * 100}%`,
		top: `${Math.random() * 100}%`,
		delay: `${Math.random() * 3}s`,
		duration: `${1 + Math.random() * 2}s`,
		size: `${4 + Math.random() * 8}px`,
	}));

	return (
		<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
			{sparkles.map((sparkle) => (
				<div
					key={sparkle.id}
					className="animate-sparkle absolute rounded-full"
					style={{
						left: sparkle.left,
						top: sparkle.top,
						animationDelay: sparkle.delay,
						animationDuration: sparkle.duration,
						width: sparkle.size,
						height: sparkle.size,
						backgroundColor: config.primaryColor || "#fbbf24",
						boxShadow: `0 0 ${sparkle.size} ${config.primaryColor || "#fbbf24"}`,
					}}
				/>
			))}
		</div>
	);
}

// Confetti Animation (uses canvas for better performance)
export function ConfettiAnimation({ config, isActive }: EventAnimationProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!isActive || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const colors = [
			config.primaryColor || "#ec4899",
			config.secondaryColor || "#f472b6",
			"#fbbf24",
			"#34d399",
			"#60a5fa",
		];

		const confetti: Array<{
			x: number;
			y: number;
			w: number;
			h: number;
			color: string;
			speed: number;
			angle: number;
			spin: number;
		}> = [];

		for (let i = 0; i < 50; i++) {
			confetti.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height - canvas.height,
				w: 8 + Math.random() * 8,
				h: 4 + Math.random() * 4,
				color: colors[Math.floor(Math.random() * colors.length)],
				speed: 1 + Math.random() * 2,
				angle: Math.random() * Math.PI * 2,
				spin: (Math.random() - 0.5) * 0.2,
			});
		}

		let animationId: number;

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			confetti.forEach((c) => {
				ctx.save();
				ctx.translate(c.x, c.y);
				ctx.rotate(c.angle);
				ctx.fillStyle = c.color;
				ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
				ctx.restore();

				c.y += c.speed;
				c.x += Math.sin(c.y / 30) * 0.5;
				c.angle += c.spin;

				if (c.y > canvas.height + 20) {
					c.y = -20;
					c.x = Math.random() * canvas.width;
				}
			});

			animationId = requestAnimationFrame(animate);
		};

		animate();

		const handleResize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		window.addEventListener("resize", handleResize);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener("resize", handleResize);
		};
	}, [isActive, config]);

	if (!isActive) return null;

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none fixed inset-0 z-0"
			style={{ opacity: 0.7 }}
		/>
	);
}
