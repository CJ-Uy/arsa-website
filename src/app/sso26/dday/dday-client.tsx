"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { submitDdayVotes } from "../actions";

const SSO_LOGO = "/images/major event landing/2026/sso/Long_Logo_White-removebg-preview.webp";

interface Props {
	questions: string[];
	seniors: string[];
}

function ScrapbookCard({ children, rotate = 0 }: { children: React.ReactNode; rotate?: number }) {
	return (
		<div
			className="relative bg-white p-6 shadow-md"
			style={{ transform: `rotate(${rotate}deg)` }}
		>
			<div className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-2deg] bg-amber-100/80" />
			{children}
		</div>
	);
}

function SeniorCombobox({
	value,
	onChange,
	seniors,
}: {
	value: string;
	onChange: (v: string) => void;
	seniors: string[];
}) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between border-[#C89D58]/40 bg-white font-[family-name:var(--font-farm-to-market)] text-base hover:border-[#845942] hover:bg-amber-50"
				>
					<span className={value ? "text-[#374752]" : "text-stone-400"}>
						{value || "Search for a senior..."}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-stone-400" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
				<Command>
					<CommandInput
						placeholder="Type a name..."
						className="font-[family-name:var(--font-farm-to-market)]"
					/>
					<CommandList>
						<CommandEmpty className="py-4 text-center text-sm text-stone-500">
							No senior found.
						</CommandEmpty>
						<CommandGroup>
							{seniors.map((senior) => (
								<CommandItem
									key={senior}
									value={senior}
									onSelect={() => {
										onChange(senior);
										setOpen(false);
									}}
									className="font-[family-name:var(--font-farm-to-market)]"
								>
									<Check
										className={`mr-2 h-4 w-4 ${value === senior ? "opacity-100" : "opacity-0"}`}
									/>
									{senior}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export function SSO26DdayClient({ questions, seniors }: Props) {
	const [votes, setVotes] = useState<Record<string, string>>(() =>
		Object.fromEntries(questions.map((q) => [q, ""])),
	);
	const [voteCount, setVoteCount] = useState(0);
	const [isPending, startTransition] = useTransition();

	const setVote = useCallback((question: string, nominee: string) => {
		setVotes((prev) => ({ ...prev, [question]: nominee }));
	}, []);

	const handleSubmit = () => {
		const payload = Object.entries(votes)
			.filter(([, nominee]) => nominee)
			.map(([question, nominee]) => ({ question, nominee }));

		if (payload.length === 0) {
			toast.error("Pick at least one category before voting!");
			return;
		}

		startTransition(async () => {
			const result = await submitDdayVotes(payload);
			if (result.success) {
				toast.success("Votes submitted! Vote again anytime 🎉");
				setVoteCount((c) => c + 1);
				// Reset for next round
				setVotes(Object.fromEntries(questions.map((q) => [q, ""])));
			} else {
				toast.error(result.message);
			}
		});
	};

	const answeredCount = Object.values(votes).filter(Boolean).length;

	return (
		<div
			className="min-h-screen"
			style={{ background: "linear-gradient(180deg, #ECDEBC 0%, #E7E2CE 60%, #ECDEBC 100%)" }}
		>
			{/* Washi tape top border */}
			<div className="h-4 bg-[repeating-linear-gradient(90deg,#DD7142_0px,#DD7142_20px,transparent_20px,transparent_24px,#C89D58_24px,#C89D58_44px,transparent_44px,transparent_48px,#859893_48px,#859893_68px,transparent_68px,transparent_72px)] opacity-60" />

			{/* Hero */}
			<div
				className="relative flex flex-col items-center justify-center py-16 text-center"
				style={{
					background:
						"linear-gradient(180deg, #2d3a44 0%, #4e6a70 50%, #ECDEBC 100%)",
				}}
			>
				<div className="mb-6 w-64 sm:w-80">
					<Image
						src={SSO_LOGO}
						alt="SSO 2026"
						width={500}
						height={160}
						className="h-full w-full object-contain drop-shadow-2xl"
						priority
					/>
				</div>
				<h1 className="mb-2 font-[family-name:var(--font-gentlemens-script)] text-5xl text-white drop-shadow-lg sm:text-6xl">
					D-Day Voting
				</h1>
				<p className="mb-4 font-[family-name:var(--font-farm-to-market)] text-lg text-white/80">
					Vote for the superlatives finals — spam away! 🎉
				</p>
				{voteCount > 0 && (
					<div className="rounded-full bg-[#C89D58]/30 px-6 py-2 backdrop-blur-sm">
						<p className="font-[family-name:var(--font-farm-to-market)] font-bold text-white">
							You&apos;ve voted {voteCount} time{voteCount !== 1 ? "s" : ""}!
						</p>
					</div>
				)}
				<div className="mt-3 rounded-full bg-white/15 px-6 py-2 backdrop-blur-sm">
					<p className="font-[family-name:var(--font-farm-to-market)] text-sm text-white">
						{answeredCount} of {questions.length} categories selected
					</p>
				</div>
			</div>

			{/* Form */}
			<div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
				<div className="space-y-6">
					{questions.map((question, i) => {
						const rotations = [-0.5, 0.5, -0.3, 0.4, -0.6, 0.3];
						return (
							<ScrapbookCard key={question} rotate={rotations[i % rotations.length]}>
								<div className="space-y-3">
									<Label className="font-[family-name:var(--font-farm-to-market)] text-base font-semibold text-[#374752]">
										{question}
									</Label>
									<SeniorCombobox
										value={votes[question] ?? ""}
										onChange={(v) => setVote(question, v)}
										seniors={seniors}
									/>
								</div>
							</ScrapbookCard>
						);
					})}

					<div className="pt-4">
						<Button
							onClick={handleSubmit}
							disabled={isPending}
							size="lg"
							className="w-full bg-[#845942] font-[family-name:var(--font-farm-to-market)] text-lg tracking-wide text-white hover:bg-[#6e4a37]"
						>
							{isPending ? (
								<>
									<RefreshCw className="mr-2 h-5 w-5 animate-spin" />
									Submitting...
								</>
							) : (
								<>
									<Sparkles className="mr-2 h-5 w-5" />
									{voteCount > 0 ? "Vote Again!" : "Submit Votes"}
								</>
							)}
						</Button>
						<p className="mt-3 text-center font-[family-name:var(--font-farm-to-market)] text-sm text-stone-400">
							You can vote as many times as you want while D-Day is open!
						</p>
					</div>
				</div>
			</div>

			{/* Bottom washi tape */}
			<div className="h-4 bg-[repeating-linear-gradient(90deg,#859893_0px,#859893_20px,transparent_20px,transparent_24px,#DD7142_24px,#DD7142_44px,transparent_44px,transparent_48px,#C89D58_48px,#C89D58_68px,transparent_68px,transparent_72px)] opacity-60" />
		</div>
	);
}
