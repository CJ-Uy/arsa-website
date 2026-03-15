"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQItem } from "@/app/admin/landing/actions";

export function FAQPageClient({ faq }: { faq: FAQItem[] }) {
	return (
		<div className="bg-background min-h-screen">
			{/* Hero Banner */}
			<section className="relative overflow-hidden py-16">
				<div
					className="absolute inset-0 z-0"
					style={{
						background: "linear-gradient(135deg, #b91c3c 0%, #c2410c 50%, #9a3412 100%)",
					}}
				/>

				{/* Left decorative lines — sweeping curves */}
				<svg
					className="absolute top-0 left-0 z-[1] h-full w-auto opacity-20"
					viewBox="0 0 300 400"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="xMinYMid slice"
				>
					{Array.from({ length: 10 }).map((_, i) => (
						<path
							key={`curve-${i}`}
							d={`M${-20 + i * 12},400 Q${80 + i * 15},200 ${-10 + i * 8},0`}
							stroke="white"
							strokeWidth="1.2"
							fill="none"
						/>
					))}
					{/* Concentric arcs from bottom-left corner */}
					{Array.from({ length: 6 }).map((_, i) => (
						<circle
							key={`arc-l-${i}`}
							cx="0"
							cy="400"
							r={80 + i * 40}
							stroke="white"
							strokeWidth="0.8"
							fill="none"
							opacity={0.6 - i * 0.08}
						/>
					))}
				</svg>

				{/* Right decorative lines — mirrored curves + arcs */}
				<svg
					className="absolute top-0 right-0 z-[1] h-full w-auto opacity-20"
					viewBox="0 0 300 400"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					preserveAspectRatio="xMaxYMid slice"
				>
					{Array.from({ length: 10 }).map((_, i) => (
						<path
							key={`curve-r-${i}`}
							d={`M${320 - i * 12},400 Q${220 - i * 15},200 ${310 - i * 8},0`}
							stroke="white"
							strokeWidth="1.2"
							fill="none"
						/>
					))}
					{/* Concentric arcs from top-right corner */}
					{Array.from({ length: 6 }).map((_, i) => (
						<circle
							key={`arc-r-${i}`}
							cx="300"
							cy="0"
							r={80 + i * 40}
							stroke="white"
							strokeWidth="0.8"
							fill="none"
							opacity={0.6 - i * 0.08}
						/>
					))}
				</svg>

				<div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
					<h1 className="mb-4 text-4xl font-bold drop-shadow-lg">Frequently Asked Questions</h1>
					<p className="text-lg opacity-90 drop-shadow-md">
						Got questions? We&apos;ve got answers.
					</p>
				</div>
			</section>

			{/* FAQ Content */}
			<section className="relative py-16">
				<div className="absolute inset-0 -z-10 overflow-hidden">
					<div
						className="absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-[0.07]"
						style={{
							background: "radial-gradient(circle, #b91c3c, transparent 70%)",
						}}
					/>
					<div
						className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-[0.07]"
						style={{
							background: "radial-gradient(circle, #c2410c, transparent 70%)",
						}}
					/>
				</div>

				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					{faq.length === 0 ? (
						<p className="text-muted-foreground py-12 text-center">
							No FAQ items yet. Check back later!
						</p>
					) : (
						<Accordion type="single" collapsible className="w-full">
							{faq.map((item, i) => (
								<AccordionItem
									key={item.id}
									value={`faq-${i}`}
									className="bg-card mb-3 rounded-lg border px-6 shadow-sm last:mb-0 data-[state=open]:shadow-md"
								>
									<AccordionTrigger className="py-5 text-left hover:no-underline">
										<div className="flex items-center gap-4">
											<span className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
												{i + 1}
											</span>
											<span className="text-base font-medium">{item.question}</span>
										</div>
									</AccordionTrigger>
									<AccordionContent className="pb-5 pl-4 sm:pl-12">
										{item.answer.startsWith("<") ? (
											<div className="overflow-x-auto">
												<div
													className="prose prose-sm dark:prose-invert text-muted-foreground max-w-none leading-relaxed break-words [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td]:dark:border-gray-600 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:p-2 [&_th]:font-bold [&_th]:dark:border-gray-600 [&_th]:dark:bg-gray-800 [&_ul]:list-disc [&_ul]:pl-5"
													dangerouslySetInnerHTML={{ __html: item.answer }}
												/>
											</div>
										) : (
											<p className="text-muted-foreground leading-relaxed">{item.answer}</p>
										)}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					)}
				</div>
			</section>
		</div>
	);
}
