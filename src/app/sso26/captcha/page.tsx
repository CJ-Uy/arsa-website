// TEMP TEST PAGE — delete before launch
"use client";

import { useState, type ComponentType } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PopTheColor } from "@/components/features/balloon-captcha/captchas/pop-the-color";
import { CatchTheFloater } from "@/components/features/balloon-captcha/captchas/catch-the-floater";
import { MemoryCount } from "@/components/features/balloon-captcha/captchas/memory-count";
import { PopInOrder } from "@/components/features/balloon-captcha/captchas/pop-in-order";
import { InflateBalloon } from "@/components/features/balloon-captcha/captchas/inflate-balloon";

type CaptchaEntry = {
	name: string;
	component: ComponentType<{ onSuccess: () => void; onFail: () => void }>;
};

const CAPTCHAS: CaptchaEntry[] = [
	{ name: "1. Pop the Color", component: PopTheColor },
	{ name: "2. Catch the Floater", component: CatchTheFloater },
	{ name: "3. Memory Count", component: MemoryCount },
	{ name: "4. Pop in Order", component: PopInOrder },
	{ name: "5. Inflate Balloon", component: InflateBalloon },
];

export default function CaptchaTestPage() {
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<number | null>(null);
	const [result, setResult] = useState<"success" | "fail" | null>(null);
	// key forces remount so retrying the same captcha resets it
	const [key, setKey] = useState(0);

	const openCaptcha = (i: number) => {
		setSelected(i);
		setResult(null);
		setKey((k) => k + 1);
		setOpen(true);
	};

	const retry = () => {
		setResult(null);
		setKey((k) => k + 1);
	};

	const CurrentCaptcha = selected !== null ? CAPTCHAS[selected].component : null;

	return (
		<div className="min-h-screen bg-stone-100 p-8">
			<div className="mx-auto max-w-sm space-y-4">
				<div>
					<h1 className="text-2xl font-bold text-stone-800">Captcha Test Page</h1>
					<p className="text-sm text-red-500">⚠️ Delete before launch — /sso26/captcha</p>
				</div>

				<div className="flex flex-col gap-2">
					{CAPTCHAS.map((c, i) => (
						<Button
							key={i}
							onClick={() => openCaptcha(i)}
							variant="outline"
							className="justify-start"
						>
							{c.name}
						</Button>
					))}
				</div>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="font-serif italic text-[#374752]">
							🎈 {selected !== null ? CAPTCHAS[selected].name : ""}
						</DialogTitle>
					</DialogHeader>

					{result ? (
						<div className="flex flex-col items-center gap-4 py-6">
							<Badge
								className={`text-base px-4 py-1 ${
									result === "success"
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-700"
								}`}
							>
								{result === "success" ? "✅ Success!" : "❌ Failed!"}
							</Badge>
							<Button onClick={retry} variant="outline" size="sm">
								Try again
							</Button>
						</div>
					) : (
						CurrentCaptcha && (
							<CurrentCaptcha
								key={key}
								onSuccess={() => setResult("success")}
								onFail={() => setResult("fail")}
							/>
						)
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
