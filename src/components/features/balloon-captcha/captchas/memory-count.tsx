"use client";

import { useEffect, useState, useMemo } from "react";
import { BalloonSvg } from "../balloon-svg";

const COLORS = ["red", "blue", "yellow", "green", "purple", "pink"] as const;
type Color = (typeof COLORS)[number];

const COLOR_HEX: Record<Color, string> = {
	red: "#FF4444",
	blue: "#4488FF",
	yellow: "#EAB308",
	green: "#22C55E",
	purple: "#A855F7",
	pink: "#EC4899",
};

function shuffle<T>(arr: T[]): T[] {
	return [...arr].sort(() => Math.random() - 0.5);
}

interface Props {
	onSuccess: () => void;
	onFail: () => void;
}

export function MemoryCount({ onSuccess, onFail }: Props) {
	const { balloons, targetColor, correctCount, options } = useMemo(() => {
		const pickedColors = shuffle([...COLORS]).slice(0, 3) as Color[];
		const total = Math.floor(Math.random() * 5) + 6; // 6–10 balloons
		const colorArr = Array.from(
			{ length: total },
			() => pickedColors[Math.floor(Math.random() * 3)],
		);
		const target = pickedColors[Math.floor(Math.random() * 3)];
		const correct = colorArr.filter((c) => c === target).length;

		const wrongs = new Set<number>();
		let attempts = 0;
		while (wrongs.size < 3 && attempts < 200) {
			const delta = Math.floor(Math.random() * 4) + 1;
			const w = correct + (Math.random() > 0.5 ? delta : -delta);
			if (w >= 0 && w !== correct) wrongs.add(w);
			attempts++;
		}
		let n = correct + 1;
		while (wrongs.size < 3) {
			if (n !== correct) wrongs.add(n);
			n++;
		}

		return {
			balloons: colorArr.map((color, i) => ({
				color,
				// Stagger positions in a loose grid so balloons don't all overlap
				x: 6 + (i % 5) * 18 + Math.random() * 8,
				y: 5 + Math.floor(i / 5) * 44 + Math.random() * 10,
				id: i,
			})),
			targetColor: target,
			correctCount: correct,
			options: shuffle([correct, ...Array.from(wrongs)]),
		};
	}, []);

	const [phase, setPhase] = useState<"showing" | "question" | "done">("showing");
	const [timeLeft, setTimeLeft] = useState(2);

	useEffect(() => {
		if (phase !== "showing") return;
		const id = setInterval(() => {
			setTimeLeft((t) => {
				if (t <= 1) {
					clearInterval(id);
					setPhase("question");
					return 0;
				}
				return t - 1;
			});
		}, 1000);
		return () => clearInterval(id);
	}, [phase]);

	const handleAnswer = (opt: number) => {
		setPhase("done");
		if (opt === correctCount) onSuccess();
		else onFail();
	};

	return (
		<div className="space-y-3">
			{phase === "showing" && (
				<>
					<p className="text-center text-sm font-medium text-stone-600">
						Remember the{" "}
						<span
							style={{ color: COLOR_HEX[targetColor] }}
							className="font-bold capitalize"
						>
							{targetColor}
						</span>{" "}
						balloons! ({timeLeft}s)
					</p>
					<div className="relative h-56 overflow-hidden rounded-lg bg-gradient-to-b from-sky-50 to-white">
						{balloons.map((b) => (
							<div
								key={b.id}
								className="absolute"
								style={{
									left: `${b.x}%`,
									top: `${b.y}%`,
								}}
							>
								<BalloonSvg color={COLOR_HEX[b.color]} size={26} />
							</div>
						))}
					</div>
				</>
			)}
			{phase === "question" && (
				<>
					<p className="text-center text-sm font-medium text-stone-600">
						How many{" "}
						<span
							style={{ color: COLOR_HEX[targetColor] }}
							className="font-bold capitalize"
						>
							{targetColor}
						</span>{" "}
						balloons were there?
					</p>
					<div className="grid grid-cols-2 gap-2">
						{options.map((opt) => (
							<button
								key={opt}
								onClick={() => handleAnswer(opt)}
								className="rounded-lg border-2 border-stone-200 px-4 py-3 text-xl font-bold text-stone-700 transition-colors hover:border-amber-400 hover:bg-amber-50"
							>
								{opt}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
