"use client";

import { useEffect, useRef } from "react";

const BALLOON_COLORS = [
	"#6399A0", // teal
	"#966C95", // plum
	"#EACA5B", // golden yellow
	"#ACAA7E", // olive sage
	"#D1733F", // burnt orange
	"#CE886E", // terracotta pink
];

type Balloon = {
	x: number;
	y: number;
	size: number;
	color: string;
	speed: number;
	wobbleSpeed: number;
	wobbleAmount: number;
	wobbleOffset: number;
	opacity: number;
	stringLength: number;
};

export function BalloonAnimation({ className }: { className?: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const balloonsRef = useRef<Balloon[]>([]);
	const animFrameRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		function resize() {
			if (!canvas) return;
			canvas.width = canvas.offsetWidth * window.devicePixelRatio;
			canvas.height = canvas.offsetHeight * window.devicePixelRatio;
			ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
		}
		resize();
		window.addEventListener("resize", resize);

		function createBalloon(startFromBottom = true): Balloon {
			const w = canvas!.offsetWidth;
			const h = canvas!.offsetHeight;
			const size = 18 + Math.random() * 22;
			return {
				x: Math.random() * w,
				y: startFromBottom ? h + size + Math.random() * 200 : Math.random() * h,
				size,
				color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
				speed: 0.3 + Math.random() * 0.7,
				wobbleSpeed: 0.005 + Math.random() * 0.01,
				wobbleAmount: 15 + Math.random() * 25,
				wobbleOffset: Math.random() * Math.PI * 2,
				opacity: 0.5 + Math.random() * 0.4,
				stringLength: 20 + Math.random() * 30,
			};
		}

		// Seed initial balloons across the screen
		const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 18000);
		balloonsRef.current = Array.from({ length: count }, () => createBalloon(false));

		let time = 0;
		function draw() {
			if (!canvas || !ctx) return;
			const w = canvas.offsetWidth;
			const h = canvas.offsetHeight;
			ctx.clearRect(0, 0, w, h);

			time++;

			for (const b of balloonsRef.current) {
				b.y -= b.speed;
				const wobbleX = Math.sin(time * b.wobbleSpeed + b.wobbleOffset) * b.wobbleAmount;
				const drawX = b.x + wobbleX;
				const drawY = b.y;

				ctx.globalAlpha = b.opacity;

				// String
				ctx.beginPath();
				ctx.moveTo(drawX, drawY + b.size);
				ctx.quadraticCurveTo(
					drawX + Math.sin(time * b.wobbleSpeed * 2 + b.wobbleOffset) * 5,
					drawY + b.size + b.stringLength * 0.5,
					drawX + Math.sin(time * b.wobbleSpeed * 0.5 + b.wobbleOffset) * 3,
					drawY + b.size + b.stringLength,
				);
				ctx.strokeStyle = "rgba(120,100,80,0.4)";
				ctx.lineWidth = 1;
				ctx.stroke();

				// Balloon body (oval)
				ctx.beginPath();
				ctx.ellipse(drawX, drawY, b.size * 0.75, b.size, 0, 0, Math.PI * 2);
				ctx.fillStyle = b.color;
				ctx.fill();

				// Shine highlight
				ctx.beginPath();
				ctx.ellipse(
					drawX - b.size * 0.2,
					drawY - b.size * 0.3,
					b.size * 0.15,
					b.size * 0.25,
					-0.4,
					0,
					Math.PI * 2,
				);
				ctx.fillStyle = "rgba(255,255,255,0.4)";
				ctx.fill();

				// Knot
				ctx.beginPath();
				ctx.moveTo(drawX - 3, drawY + b.size);
				ctx.lineTo(drawX, drawY + b.size + 5);
				ctx.lineTo(drawX + 3, drawY + b.size);
				ctx.fillStyle = b.color;
				ctx.fill();
			}

			ctx.globalAlpha = 1;

			// Remove balloons that are off screen and add new ones
			balloonsRef.current = balloonsRef.current.filter((b) => b.y + b.size + b.stringLength > -50);
			while (balloonsRef.current.length < count) {
				balloonsRef.current.push(createBalloon(true));
			}

			animFrameRef.current = requestAnimationFrame(draw);
		}

		animFrameRef.current = requestAnimationFrame(draw);

		return () => {
			window.removeEventListener("resize", resize);
			cancelAnimationFrame(animFrameRef.current);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", pointerEvents: "none" }}
		/>
	);
}
