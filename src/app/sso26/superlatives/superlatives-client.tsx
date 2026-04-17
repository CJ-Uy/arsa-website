"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { submitNominations } from "../actions";

const SSO_LOGO = "/images/major event landing/2026/sso/Long_Logo_White-removebg-preview.webp";

interface NominationState {
	nominee: string;
	otherText: string;
}

interface Props {
	questions: string[];
	seniors: string[];
	initialNominations: Record<string, { nominee: string; otherText: string | null }>;
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
	question,
	value,
	onChange,
	seniors,
}: {
	question: string;
	value: string;
	onChange: (v: string) => void;
	seniors: string[];
}) {
	const [open, setOpen] = useState(false);

	const displayLabel =
		value === "OTHER"
			? "Other – not listed"
			: value || "Search for a senior...";

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between border-[#C89D58]/40 bg-white font-[family-name:var(--font-farm-to-market)] text-base hover:border-[#845942] hover:bg-amber-50"
				>
					<span className={value ? "text-[#374752]" : "text-stone-400"}>{displayLabel}</span>
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
							No senior found. Try &quot;Other&quot; below.
						</CommandEmpty>
						<CommandGroup>
							<CommandItem
								value="OTHER"
								onSelect={() => {
									onChange("OTHER");
									setOpen(false);
								}}
								className="font-[family-name:var(--font-farm-to-market)] text-[#845942]"
							>
								<Check
									className={`mr-2 h-4 w-4 ${value === "OTHER" ? "opacity-100" : "opacity-0"}`}
								/>
								Other – my senior is not listed
							</CommandItem>
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

export function SSO26SuperlativesClient({ questions, seniors, initialNominations }: Props) {
	const [nominations, setNominations] = useState<Record<string, NominationState>>(() => {
		const init: Record<string, NominationState> = {};
		for (const q of questions) {
			init[q] = {
				nominee: initialNominations[q]?.nominee ?? "",
				otherText: initialNominations[q]?.otherText ?? "",
			};
		}
		return init;
	});

	const [submitted, setSubmitted] = useState(false);
	const [isPending, startTransition] = useTransition();

	const setNominee = useCallback((question: string, nominee: string) => {
		setNominations((prev) => ({
			...prev,
			[question]: { ...prev[question], nominee },
		}));
	}, []);

	const setOtherText = useCallback((question: string, text: string) => {
		setNominations((prev) => ({
			...prev,
			[question]: { ...prev[question], otherText: text },
		}));
	}, []);

	const handleSubmit = () => {
		const payload = Object.entries(nominations)
			.filter(([, v]) => v.nominee)
			.map(([question, v]) => ({
				question,
				nominee: v.nominee,
				otherText: v.nominee === "OTHER" ? v.otherText : undefined,
			}));

		if (payload.length === 0) {
			toast.error("Please nominate at least one category.");
			return;
		}

		startTransition(async () => {
			const result = await submitNominations(payload);
			if (result.success) {
				toast.success(result.message);
				setSubmitted(true);
			} else {
				toast.error(result.message);
			}
		});
	};

	const answeredCount = Object.values(nominations).filter((v) => v.nominee).length;

	return (
		<div
			className="min-h-screen"
			style={{ background: "linear-gradient(180deg, #ECDEBC 0%, #E7E2CE 60%, #ECDEBC 100%)" }}
		>
			{/* Washi tape top border */}
			<div className="h-4 bg-[repeating-linear-gradient(90deg,#C89D58_0px,#C89D58_20px,transparent_20px,transparent_24px,#859893_24px,#859893_44px,transparent_44px,transparent_48px,#DD7142_48px,#DD7142_68px,transparent_68px,transparent_72px)] opacity-60" />

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
					Superlatives
				</h1>
				<p className="font-[family-name:var(--font-farm-to-market)] text-lg text-white/80">
					Nominate your batch mates for each category!
				</p>
				<div className="mt-4 rounded-full bg-white/15 px-6 py-2 backdrop-blur-sm">
					<p className="font-[family-name:var(--font-farm-to-market)] text-sm text-white">
						{answeredCount} of {questions.length} categories answered
					</p>
				</div>
			</div>

			{/* Form */}
			<div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
				{submitted ? (
					<ScrapbookCard>
						<div className="flex flex-col items-center py-8 text-center">
							<CheckCircle2 className="mb-4 h-16 w-16 text-[#845942]" />
							<h2 className="mb-2 font-[family-name:var(--font-gentlemens-script)] text-4xl text-[#374752]">
								Nominations Saved!
							</h2>
							<p className="mb-6 font-[family-name:var(--font-farm-to-market)] text-stone-500">
								You can come back anytime to update your picks.
							</p>
							<Button
								onClick={() => setSubmitted(false)}
								className="bg-[#845942] font-[family-name:var(--font-farm-to-market)] text-base text-white hover:bg-[#6e4a37]"
							>
								Edit Nominations
							</Button>
						</div>
					</ScrapbookCard>
				) : (
					<div className="space-y-6">
						{questions.map((question, i) => {
							const state = nominations[question] ?? { nominee: "", otherText: "" };
							const rotations = [-0.5, 0.5, -0.3, 0.4, -0.6, 0.3];
							return (
								<ScrapbookCard key={question} rotate={rotations[i % rotations.length]}>
									<div className="space-y-3">
										<Label className="font-[family-name:var(--font-farm-to-market)] text-base font-semibold text-[#374752]">
											{question}
										</Label>
										<SeniorCombobox
											question={question}
											value={state.nominee}
											onChange={(v) => setNominee(question, v)}
											seniors={seniors}
										/>
										{state.nominee === "OTHER" && (
											<Input
												value={state.otherText}
												onChange={(e) => setOtherText(question, e.target.value)}
												placeholder="Type the senior's name..."
												className="border-[#C89D58]/40 font-[family-name:var(--font-farm-to-market)] focus:border-[#845942]"
											/>
										)}
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
								<Send className="mr-2 h-5 w-5" />
								{isPending
									? "Saving..."
									: Object.values(initialNominations).length > 0
										? "Update Nominations"
										: "Submit Nominations"}
							</Button>
							<p className="mt-3 text-center font-[family-name:var(--font-farm-to-market)] text-sm text-stone-400">
								You can update your nominations anytime while the form is open.
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Bottom washi tape */}
			<div className="h-4 bg-[repeating-linear-gradient(90deg,#DD7142_0px,#DD7142_20px,transparent_20px,transparent_24px,#C89D58_24px,#C89D58_44px,transparent_44px,transparent_48px,#859893_48px,#859893_68px,transparent_68px,transparent_72px)] opacity-60" />
		</div>
	);
}
