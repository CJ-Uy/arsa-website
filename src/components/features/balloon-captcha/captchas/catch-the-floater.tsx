"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BalloonSvg } from "../balloon-svg";

interface Props {
	onSuccess: () => void;
	onFail: () => void;
}

export function CatchTheFloater({ onSuccess, onFail }: Props) {
	const [phase, setPhase] = useState<"floating" | "caught" | "escaped">("floating");
	const [pos, setPos] = useState({ x: 50, y: 80 });
	const animRef = useRef<number>();
	const startRef = useRef(Date.now());
	const onFailRef = useRef(onFail);
	const onSuccessRef = useRef(onSuccess);
	const mountedRef = useRef(true);

	useEffect(() => {
		onFailRef.current = onFail;
	}, [onFail]);
	useEffect(() => {
		onSuccessRef.current = onSuccess;
	}, [onSuccess]);
	useEffect(() => {
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		const DURATION = 3500;
		startRef.current = Date.now();

		const frame = () => {
			const t = (Date.now() - startRef.current) / DURATION;
			if (t >= 1) {
				if (mountedRef.current) setPhase("escaped");
				onFailRef.current();
				return;
			}
			setPos({
				x: 50 + Math.sin(t * Math.PI * 7) * 20,
				y: 80 - t * 95,
			});
			animRef.current = requestAnimationFrame(frame);
		};

		animRef.current = requestAnimationFrame(frame);
		return () => {
			if (animRef.current) cancelAnimationFrame(animRef.current);
		};
	}, []);

	const handleClick = useCallback(() => {
		if (animRef.current) cancelAnimationFrame(animRef.current);
		if (mountedRef.current) setPhase("caught");
		onSuccessRef.current();
	}, []);

	return (
		<div className="space-y-3">
			<p className="text-center text-sm font-medium text-stone-600">
				Click the balloon before it flies away! 🎈
			</p>
			<div className="relative h-52 overflow-hidden rounded-lg bg-gradient-to-b from-sky-100 to-white">
				{phase === "floating" && (
					<button
						onClick={handleClick}
						className="absolute hover:scale-110 active:scale-95 transition-transform"
						style={{
							left: `${pos.x}%`,
							top: `${pos.y}%`,
							transform: "translate(-50%, -50%)",
						}}
					>
						<BalloonSvg color="#FF4444" size={52} />
					</button>
				)}
				{phase === "escaped" && (
					<div className="flex h-full items-center justify-center text-sm text-red-500 font-medium">
						It got away! 😭
					</div>
				)}
				{phase === "caught" && (
					<div className="flex h-full items-center justify-center text-sm text-green-600 font-bold">
						Got it! 🎉
					</div>
				)}
			</div>
		</div>
	);
}
