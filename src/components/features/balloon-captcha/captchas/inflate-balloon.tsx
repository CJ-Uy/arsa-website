"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BalloonSvg } from "../balloon-svg";

interface Props {
	onSuccess: () => void;
	onFail: () => void;
}

export function InflateBalloon({ onSuccess, onFail }: Props) {
	const { targetMin, targetMax } = useMemo(() => {
		const min = 30 + Math.floor(Math.random() * 30); // 30–59%
		return { targetMin: min, targetMax: min + 20 };
	}, []);

	const [inflation, setInflation] = useState(0);
	const [phase, setPhase] = useState<"pumping" | "popped" | "done">("pumping");

	const inZone = inflation >= targetMin && inflation <= targetMax;

	// Balloon SVG size scales from ~20px wide to ~90px wide
	const balloonSize = Math.round(20 + inflation * 0.7);
	const balloonColor = inZone ? "#22C55E" : "#4488FF";

	const pump = () => {
		if (phase !== "pumping") return;
		const add = 8 + Math.floor(Math.random() * 8); // 8–15% per pump
		const next = Math.min(100, inflation + add);
		if (next >= 96) {
			setInflation(100);
			setPhase("popped");
			setTimeout(onFail, 600);
			return;
		}
		setInflation(next);
	};

	const release = () => {
		if (phase !== "pumping") return;
		setPhase("done");
		if (inZone) onSuccess();
		else onFail();
	};

	return (
		<div className="space-y-4">
			<p className="text-center text-sm font-medium text-stone-600">
				Pump to the <span className="font-bold text-green-600">green zone</span>, then release!
			</p>

			{/* Gauge */}
			<div className="relative mx-auto h-5 w-full overflow-hidden rounded-full bg-stone-200">
				<div
					className="absolute h-full rounded-full bg-green-300"
					style={{ left: `${targetMin}%`, width: `${targetMax - targetMin}%` }}
				/>
				<div
					className="absolute h-full rounded-full bg-blue-500 transition-all duration-150"
					style={{ width: `${inflation}%` }}
				/>
				<div
					className="absolute top-0 h-full border-l-2 border-green-600"
					style={{ left: `${targetMin}%` }}
				/>
				<div
					className="absolute top-0 h-full border-l-2 border-green-600"
					style={{ left: `${targetMax}%` }}
				/>
			</div>
			<p className="text-center text-xs text-stone-400">
				{inflation}% — target: {targetMin}–{targetMax}%
			</p>

			{/* Balloon visual */}
			<div className="flex items-end justify-center" style={{ height: 140 }}>
				{phase === "popped" ? (
					<p className="mb-4 text-2xl font-bold text-red-500">💥 POP!</p>
				) : phase === "done" ? (
					<p className="mb-4 text-lg font-medium text-stone-500">Released!</p>
				) : (
					<div className="flex items-end justify-center transition-all duration-150">
						<BalloonSvg
							color={balloonColor}
							size={balloonSize}
							style={
								inZone
									? { filter: "drop-shadow(0 0 6px rgba(34,197,94,0.6))" }
									: undefined
							}
						/>
					</div>
				)}
			</div>

			<div className="flex gap-2">
				<Button
					onClick={pump}
					disabled={phase !== "pumping"}
					variant="outline"
					className="flex-1"
				>
					Pump! 💨
				</Button>
				<Button
					onClick={release}
					disabled={phase !== "pumping"}
					className={`flex-1 text-white transition-colors ${
						inZone
							? "bg-green-500 hover:bg-green-600"
							: "bg-stone-400 hover:bg-stone-500"
					}`}
				>
					Release!
				</Button>
			</div>
		</div>
	);
}
