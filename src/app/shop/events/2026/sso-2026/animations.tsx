"use client";

import { useEffect, useRef } from "react";

// Floating balloons background animation for the SSO shop page
// Uses canvas for performance — balloons rise continuously
const BALLOON_COLORS = ["#6399A0", "#966C95", "#EACA5B", "#ACAA7E", "#D1733F", "#CE886E"];

type Balloon = {
	x: number;
	y: number;
	radius: number;
	color: string;
	speed: number;
	wobbleOffset: number;
	wobbleSpeed: number;
	opacity: number;
};

export function SSOBalloonsAnimation({ isActive }: { isActive: boolean }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!isActive) return;

		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener("resize", resize);

		const balloons: Balloon[] = Array.from({ length: 12 }, () =>
			makeBalloon(canvas.width, canvas.height, true),
		);

		let animId: number;

		function makeBalloon(w: number, h: number, randomY: boolean): Balloon {
			return {
				x: Math.random() * w,
				y: randomY ? Math.random() * h : h + 30 + Math.random() * 60,
				radius: 14 + Math.random() * 10,
				color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
				speed: 0.3 + Math.random() * 0.4,
				wobbleOffset: Math.random() * Math.PI * 2,
				wobbleSpeed: 0.005 + Math.random() * 0.008,
				opacity: 0.25 + Math.random() * 0.2,
			};
		}

		function draw() {
			if (!canvas || !ctx) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			for (const b of balloons) {
				b.y -= b.speed;
				b.wobbleOffset += b.wobbleSpeed;
				const wx = Math.sin(b.wobbleOffset) * 20;

				if (b.y + b.radius < -40) {
					Object.assign(b, makeBalloon(canvas.width, canvas.height, false));
				}

				ctx.save();
				ctx.globalAlpha = b.opacity;

				// Balloon body
				ctx.beginPath();
				ctx.ellipse(b.x + wx, b.y, b.radius, b.radius * 1.25, 0, 0, Math.PI * 2);
				ctx.fillStyle = b.color;
				ctx.fill();

				// Shine
				ctx.beginPath();
				ctx.ellipse(
					b.x + wx - b.radius * 0.3,
					b.y - b.radius * 0.35,
					b.radius * 0.18,
					b.radius * 0.28,
					-0.4,
					0,
					Math.PI * 2,
				);
				ctx.fillStyle = "rgba(255,255,255,0.4)";
				ctx.fill();

				// String
				ctx.beginPath();
				ctx.moveTo(b.x + wx, b.y + b.radius * 1.25);
				ctx.lineTo(b.x + wx + Math.sin(b.wobbleOffset * 0.7) * 5, b.y + b.radius * 1.25 + 25);
				ctx.strokeStyle = `rgba(0,0,0,${b.opacity * 0.5})`;
				ctx.lineWidth = 0.8;
				ctx.stroke();

				ctx.restore();
			}

			animId = requestAnimationFrame(draw);
		}

		draw();

		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener("resize", resize);
		};
	}, [isActive]);

	if (!isActive) return null;

	return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
}
