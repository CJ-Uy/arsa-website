"use client";

import { useState, useMemo } from "react";
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

export function PopTheColor({ onSuccess, onFail }: Props) {
	const { balloons, targetColor } = useMemo(() => {
		const [target, other] = shuffle([...COLORS]).slice(0, 2) as [Color, Color];
		const targetCount = Math.floor(Math.random() * 3) + 3; // 3–5
		const otherCount = 9 - targetCount;
		const colors = shuffle([
			...Array<Color>(targetCount).fill(target),
			...Array<Color>(otherCount).fill(other),
		]);
		return { balloons: colors, targetColor: target };
	}, []);

	const [popped, setPopped] = useState<boolean[]>(() => Array(9).fill(false));

	const remaining = balloons.filter((c, i) => c === targetColor && !popped[i]).length;

	const handleClick = (i: number) => {
		if (balloons[i] === targetColor) {
			const next = popped.map((v, idx) => (idx === i ? true : v));
			setPopped(next);
			if (next.every((v, idx) => balloons[idx] !== targetColor || v)) {
				onSuccess();
			}
		} else {
			onFail();
		}
	};

	return (
		<div className="space-y-4">
			<p className="text-center text-sm font-medium text-stone-600">
				Pop all the{" "}
				<span style={{ color: COLOR_HEX[targetColor] }} className="font-bold capitalize">
					{targetColor}
				</span>{" "}
				balloons!{" "}
				<span className="text-xs text-stone-400">({remaining} left)</span>
			</p>
			<div className="grid grid-cols-3 gap-1 px-2">
				{balloons.map((color, i) => (
					<div key={i} className="flex justify-center">
						<button
							onClick={() => handleClick(i)}
							disabled={popped[i]}
							className="transition-all duration-200 hover:scale-110 active:scale-95"
							style={{
								opacity: popped[i] ? 0 : 1,
								transform: popped[i] ? "scale(0)" : undefined,
								transition: "opacity 0.2s, transform 0.2s",
							}}
						>
							<BalloonSvg color={COLOR_HEX[color]} size={38} />
						</button>
					</div>
				))}
			</div>
			<p className="text-center text-xs text-stone-400">Wrong color = fail!</p>
		</div>
	);
}
