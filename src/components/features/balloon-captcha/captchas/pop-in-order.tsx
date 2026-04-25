"use client";

import { useState, useMemo } from "react";
import { BalloonSvg } from "../balloon-svg";

const BALLOON_COLORS = ["#FF4444", "#4488FF", "#EAB308", "#22C55E", "#A855F7"];

function shuffle<T>(arr: T[]): T[] {
	return [...arr].sort(() => Math.random() - 0.5);
}

interface Props {
	onSuccess: () => void;
	onFail: () => void;
}

export function PopInOrder({ onSuccess, onFail }: Props) {
	const balloons = useMemo(() => {
		const slots = shuffle([
			{ x: 12, y: 8 },
			{ x: 40, y: 8 },
			{ x: 68, y: 8 },
			{ x: 12, y: 50 },
			{ x: 40, y: 50 },
			{ x: 68, y: 50 },
		])
			.slice(0, 5)
			.map((s) => ({
				x: s.x + (Math.random() * 6 - 3),
				y: s.y + (Math.random() * 6 - 3),
			}));

		return shuffle([1, 2, 3, 4, 5]).map((number, i) => ({
			number,
			color: BALLOON_COLORS[number - 1],
			x: slots[i].x,
			y: slots[i].y,
		}));
	}, []);

	const [next, setNext] = useState(1);
	const [popped, setPopped] = useState<Set<number>>(new Set());

	const handleClick = (num: number) => {
		if (num === next) {
			const newPopped = new Set(popped).add(num);
			setPopped(newPopped);
			if (num === 5) onSuccess();
			else setNext(num + 1);
		} else {
			onFail();
		}
	};

	return (
		<div className="space-y-3">
			<p className="text-center text-sm font-medium text-stone-600">
				Pop balloons <strong>1 → 2 → 3 → 4 → 5</strong> in order!
			</p>
			<div className="relative h-56 overflow-hidden rounded-lg bg-gradient-to-b from-sky-50 to-white">
				{balloons.map(
					(b) =>
						!popped.has(b.number) && (
							<button
								key={b.number}
								onClick={() => handleClick(b.number)}
								className="absolute transition-transform hover:scale-110 active:scale-95"
								style={{ left: `${b.x}%`, top: `${b.y}%` }}
							>
								<BalloonSvg color={b.color} size={42} label={String(b.number)} />
							</button>
						),
				)}
			</div>
			<p className="text-center text-xs text-stone-400">Next up: {next}</p>
		</div>
	);
}
