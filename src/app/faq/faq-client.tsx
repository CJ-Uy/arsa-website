"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import type { FAQItem } from "@/app/admin/landing/actions";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FAQ page — uses ARSA brand tokens from globals.css (--brand-*).
 * Dark mode is handled globally via the .dark class on <html>; this page
 * inherits the swap automatically. No inline hex colors.
 */

function highlight(text: string, query: string) {
	if (!query.trim()) return text;
	const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const parts = text.split(new RegExp(`(${safe})`, "ig"));
	return parts.map((p, i) =>
		p.toLowerCase() === query.toLowerCase() ? (
			<mark
				key={i}
				className="rounded-[2px] bg-[var(--brand-mark-bg)] px-[3px] py-0 text-[var(--brand-mark-fg)]"
			>
				{p}
			</mark>
		) : (
			<span key={i}>{p}</span>
		),
	);
}

function stripHtml(html: string) {
	return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function FAQPageClient({ faqJson }: { faqJson: string }) {
	const faq: FAQItem[] = useMemo(() => JSON.parse(faqJson), [faqJson]);

	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
				e.preventDefault();
				inputRef.current?.focus();
			}
			if (e.key === "Escape" && document.activeElement === inputRef.current) {
				setQuery("");
				inputRef.current?.blur();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return faq.map((item, idx) => ({ item, idx }));
		return faq
			.map((item, idx) => ({ item, idx }))
			.filter(
				({ item }) =>
					item.question.toLowerCase().includes(q) ||
					stripHtml(item.answer).toLowerCase().includes(q),
			);
	}, [faq, query]);

	return (
		<div className="bg-brand-page text-brand-ink relative min-h-screen overflow-hidden">
			{/* Accent serif for motto-style flourishes only (DESIGN.md §4) */}
			<link
				rel="stylesheet"
				href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..900,0..100,0..1&display=swap"
			/>

			{/* Paper grain texture (DESIGN.md §6) */}
			<div
				aria-hidden
				className="faq-grain pointer-events-none absolute inset-0 z-0"
			/>

			{/* Signature gradient strip (DESIGN.md §3) */}
			<div
				aria-hidden
				className="relative z-10 h-1.5 w-full"
				style={{ background: "var(--brand-gradient)" }}
			/>

			{/* MASTHEAD */}
			<header className="border-brand-maroon/20 relative z-10 border-b">
				<div className="mx-auto max-w-6xl px-6 pt-14 pb-14 sm:px-10 sm:pt-20 sm:pb-20">
					<div className="text-brand-maroon mb-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.3em] uppercase">
						<span className="bg-brand-maroon inline-block h-[6px] w-[6px] rounded-full" />
						An open ledger of questions
					</div>

					<h1 className="text-brand-ink text-[clamp(2.75rem,8.5vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.025em]">
						Frequently
						<br />
						<span
							className="text-brand-maroon italic"
							style={{
								fontFamily: "'Fraunces', Georgia, serif",
								fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
								fontWeight: 500,
							}}
						>
							asked,
						</span>{" "}
						<span className="relative inline-block">
							carefully
							<svg
								aria-hidden
								className="absolute -bottom-2 left-0 w-full"
								height="14"
								viewBox="0 0 400 14"
								preserveAspectRatio="none"
							>
								<defs>
									<linearGradient id="underline-grad" x1="0" y1="0" x2="1" y2="0">
										<stop offset="0%" stopColor="#9f1d51" />
										<stop offset="50%" stopColor="#a2250f" />
										<stop offset="100%" stopColor="#bc3700" />
									</linearGradient>
								</defs>
								<path
									d="M2 8 Q 100 2 200 7 T 398 6"
									stroke="url(#underline-grad)"
									strokeWidth="3"
									fill="none"
									strokeLinecap="round"
								/>
							</svg>
						</span>{" "}
						<br />
						<span
							className="text-brand-maroon italic"
							style={{
								fontFamily: "'Fraunces', Georgia, serif",
								fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
								fontWeight: 500,
							}}
						>
							answered.
						</span>
					</h1>

					<p className="text-brand-ink/70 mt-10 max-w-xl text-lg leading-relaxed">
						Got questions?{" "}
						<em
							className="text-brand-maroon not-italic"
							style={{
								fontFamily: "'Fraunces', Georgia, serif",
								fontStyle: "italic",
								fontWeight: 400,
							}}
						>
							We've got answers.
						</em>
					</p>
				</div>
			</header>

			{/* SEARCH BAR — sticky */}
			<div className="border-brand-maroon/20 bg-brand-page/90 sticky top-0 z-30 border-b backdrop-blur-md">
				<div className="mx-auto max-w-6xl px-6 sm:px-10">
					<div className="flex items-center gap-4 py-3">
						<Search className="text-brand-maroon size-5 shrink-0" />
						<Input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search the archive…"
							className="text-brand-ink placeholder:text-brand-ink/40 h-auto flex-1 border-0 bg-transparent px-0 py-3 text-base shadow-none focus-visible:ring-0 sm:text-lg"
						/>
						<div className="flex items-center gap-2">
							{query && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setQuery("")}
									className="text-brand-crimson hover:text-brand-maroon h-auto px-2 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase hover:bg-transparent"
								>
									Clear
								</Button>
							)}
							<kbd className="border-brand-ink/20 text-brand-ink/60 hidden rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider sm:inline-block">
								/
							</kbd>
						</div>
					</div>
					<div className="border-brand-ink/10 text-brand-ink/60 flex items-center justify-between border-t py-2 text-[10px] font-medium tracking-[0.25em] uppercase">
						<span>
							{filtered.length} of {faq.length}{" "}
							{filtered.length === 1 ? "entry" : "entries"}
						</span>
						<span className="hidden sm:inline">
							{query
								? `Filtering: "${query}"`
								: "Press / to search · Esc to clear"}
						</span>
					</div>
				</div>
			</div>

			{/* ENTRIES */}
			<main className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
				{faq.length === 0 ? (
					<EmptyState
						headline="The archive is bare."
						sub="No questions have been filed yet. Return when the shelves are restocked."
					/>
				) : filtered.length === 0 ? (
					<EmptyState
						headline="Nothing on file."
						sub={`No entries match "${query}". Try a different word, or browse the full archive.`}
						action={
							<Button
								variant="link"
								onClick={() => setQuery("")}
								className="text-brand-maroon hover:text-brand-crimson mt-6 h-auto gap-2 px-0 text-xs font-semibold tracking-[0.25em] uppercase hover:no-underline"
							>
								← Show everything
							</Button>
						}
					/>
				) : (
					<Accordion type="single" collapsible className="w-full">
						{filtered.map(({ item, idx }) => (
							<AccordionItem
								key={item.id}
								value={item.id}
								className="border-brand-maroon/20 group border-t border-b-0 last:border-b"
							>
								<AccordionTrigger
									hideChevron
									className="hover:bg-brand-maroon/5 grid w-full grid-cols-[3rem_1fr_auto] items-start gap-4 rounded-none px-0 py-7 hover:no-underline sm:grid-cols-[5rem_1fr_auto] sm:gap-8 sm:py-10 [&[data-state=open]>span:last-child]:rotate-45 [&[data-state=open]>span:last-child]:!bg-[var(--brand-maroon)] [&[data-state=open]>span:last-child]:!text-[var(--brand-cream)] [&[data-state=open]_.faq-num]:!text-[var(--brand-maroon)] [&[data-state=open]_.faq-num]:!opacity-100 [&[data-state=open]_.faq-q]:!text-[var(--brand-maroon)]"
								>
									{/* Marginal numeral */}
									<span className="faq-num text-brand-ink/60 pt-1 text-xs font-semibold tracking-[0.15em] tabular-nums transition-opacity group-hover:opacity-100 sm:text-sm">
										№ {(idx + 1).toString().padStart(2, "0")}
									</span>

									{/* Question */}
									<span className="faq-q text-brand-ink text-2xl leading-[1.2] font-semibold tracking-[-0.015em] transition-colors sm:text-[2rem] md:text-[2.25rem]">
										{highlight(item.question, query)}
									</span>

									{/* Plus indicator (rotates to × via [data-state=open] above) */}
									<span
										className={cn(
											"border-brand-ink/30 text-brand-ink mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:size-10",
										)}
									>
										<Plus className="size-3.5" strokeWidth={2} />
									</span>
								</AccordionTrigger>

								<AccordionContent className="px-0 pb-10 sm:pb-14">
									<div className="grid grid-cols-[3rem_1fr] gap-4 sm:grid-cols-[5rem_1fr] sm:gap-8">
										<div className="hidden sm:block">
											<div className="from-brand-maroon via-brand-orange h-full w-[2px] rounded-full bg-gradient-to-b to-transparent via-60%" />
										</div>
										<div className="max-w-3xl">
											{item.answer.startsWith("<") ? (
												<RichAnswer html={item.answer} />
											) : (
												<p className="text-brand-ink text-base leading-[1.75] sm:text-lg">
													{highlight(item.answer, query)}
												</p>
											)}
											<div className="text-brand-ink/60 mt-10 flex items-center gap-3 text-[10px] font-semibold tracking-[0.3em] uppercase">
												<span className="bg-brand-maroon inline-block h-px w-8" />
												Entry {(idx + 1).toString().padStart(2, "0")} · End of
												record
											</div>
										</div>
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				)}
			</main>

			{/* COLOPHON */}
			<footer className="border-brand-maroon/20 relative z-10 border-t">
				<div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 text-[11px] font-medium tracking-[0.25em] uppercase sm:flex-row sm:items-center sm:px-10">
					<span className="text-brand-ink/70">
						Still wondering? Write to us at the contact desk.
					</span>
					<a
						href="/contact"
						className="text-brand-crimson border-brand-crimson hover:gap-3 inline-flex items-center gap-2 border-b pb-1 font-semibold transition-all"
					>
						File an inquiry →
					</a>
				</div>
				<div
					aria-hidden
					className="h-1.5 w-full"
					style={{ background: "var(--brand-gradient)" }}
				/>
			</footer>
		</div>
	);
}

/**
 * RichAnswer — branded rich-text renderer for FAQ answers.
 * Styles live in globals.css under .faq-rich (uses --brand-* tokens).
 */
function RichAnswer({ html }: { html: string }) {
	return (
		<div
			className="faq-rich text-brand-ink text-base leading-[1.75] sm:text-lg"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

function EmptyState({
	headline,
	sub,
	action,
}: {
	headline: string;
	sub: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="grid grid-cols-[3rem_1fr] gap-4 py-20 sm:grid-cols-[5rem_1fr] sm:gap-8">
			<span className="text-brand-ink/50 pt-2 text-xs font-semibold tracking-[0.15em] uppercase">
				№ 00
			</span>
			<div>
				<h2 className="text-brand-ink text-3xl leading-tight font-bold tracking-[-0.015em] sm:text-5xl">
					{headline}
				</h2>
				<p className="text-brand-ink/70 mt-4 max-w-md text-base sm:text-lg">
					{sub}
				</p>
				{action}
			</div>
		</div>
	);
}
