"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PopTheColor } from "./captchas/pop-the-color";
import { CatchTheFloater } from "./captchas/catch-the-floater";
import { MemoryCount } from "./captchas/memory-count";
import { PopInOrder } from "./captchas/pop-in-order";
import { InflateBalloon } from "./captchas/inflate-balloon";

const CAPTCHA_TYPES = [
	"pop-color",
	"catch-floater",
	"memory-count",
	"pop-order",
	"inflate",
] as const;
type CaptchaType = (typeof CAPTCHA_TYPES)[number];

const CAPTCHA_TITLES: Record<CaptchaType, string> = {
	"pop-color": "Pop the right balloons!",
	"catch-floater": "Catch it!",
	"memory-count": "Memory test!",
	"pop-order": "Pop in order!",
	inflate: "Inflate to target!",
};

const CAPTCHA_COMPONENTS: Record<
	CaptchaType,
	ComponentType<{ onSuccess: () => void; onFail: () => void }>
> = {
	"pop-color": PopTheColor,
	"catch-floater": CatchTheFloater,
	"memory-count": MemoryCount,
	"pop-order": PopInOrder,
	inflate: InflateBalloon,
};

function pickRandom<T>(arr: T[], exclude: T[] = []): T {
	const pool = arr.filter((x) => !exclude.includes(x));
	const source = pool.length > 0 ? pool : arr;
	return source[Math.floor(Math.random() * source.length)];
}

interface Props {
	open: boolean;
	onSuccess: () => void;
	onClose: () => void;
}

export function BalloonCaptchaModal({ open, onSuccess, onClose }: Props) {
	const [current, setCurrent] = useState<CaptchaType>(() =>
		pickRandom([...CAPTCHA_TYPES]),
	);
	const [used, setUsed] = useState<CaptchaType[]>([]);
	// key forces remount of captcha component on each switch
	const [key, setKey] = useState(0);
	const [phase, setPhase] = useState<"challenge" | "fail-transition">("challenge");

	// Reset when modal opens
	useEffect(() => {
		if (open) {
			const fresh = pickRandom([...CAPTCHA_TYPES]);
			setCurrent(fresh);
			setUsed([]);
			setKey((k) => k + 1);
			setPhase("challenge");
		}
	}, [open]);

	const handleFail = useCallback(() => {
		setPhase("fail-transition");
		setTimeout(() => {
			setUsed((prev) => {
				const nextUsed = [...prev, current];
				const next = pickRandom([...CAPTCHA_TYPES], nextUsed);
				setCurrent(next);
				setKey((k) => k + 1);
				return nextUsed;
			});
			setPhase("challenge");
		}, 900);
	}, [current]);

	const handleSuccess = useCallback(() => {
		onSuccess();
	}, [onSuccess]);

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) onClose();
	};

	const CaptchaComponent = CAPTCHA_COMPONENTS[current];

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-center font-serif italic text-[#374752]">
						🎈 {CAPTCHA_TITLES[current]}
					</DialogTitle>
				</DialogHeader>

				{phase === "fail-transition" ? (
					<div className="flex h-40 flex-col items-center justify-center gap-2">
						<p className="text-2xl">😬</p>
						<p className="text-sm font-medium text-stone-500">
							Not quite! Try a different challenge...
						</p>
					</div>
				) : (
					<CaptchaComponent
						key={key}
						onSuccess={handleSuccess}
						onFail={handleFail}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
