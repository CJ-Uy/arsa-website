import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sites = [
	{
		title: "ARSAFest SIDLAK 2026",
		description:
			"Landing page for ARSAFest SIDLAK 2026 — a 3-day celebration featuring live performances, cultural activities, and community events.",
		href: "/archive/sites/arsafest",
		image: "/images/major%20event%20landing/2026/arsafest/%5BAF26%5D%20Banner.webp",
		date: "March 4–6, 2026",
		tags: ["Event", "Landing Page"],
	},
];

export default function ArchiveSitesPage() {
	return (
		<div className="bg-background min-h-screen">
			{/* Header */}
			<section className="border-b py-16">
				<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
					<h1 className="text-foreground mb-3 text-4xl font-bold">Site Archive</h1>
					<p className="text-muted-foreground text-lg">
						A collection of sites and landing pages we&apos;ve built for ARSA events and
						initiatives.
					</p>
				</div>
			</section>

			{/* Sites Grid */}
			<section className="py-12">
				<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{sites.map((site) => (
							<Link key={site.href} href={site.href}>
								<Card className="group overflow-hidden transition-shadow hover:shadow-lg">
									<div className="relative aspect-video overflow-hidden">
										<Image
											src={site.image}
											alt={site.title}
											fill
											className="object-cover transition-transform duration-300 group-hover:scale-105"
										/>
									</div>
									<CardContent className="p-4">
										<div className="mb-2 flex flex-wrap gap-1.5">
											{site.tags.map((tag) => (
												<Badge key={tag} variant="secondary" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
										<h2 className="text-foreground mb-1 text-lg font-semibold group-hover:underline">
											{site.title}
										</h2>
										<p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
											{site.description}
										</p>
										<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
											<Calendar className="h-3.5 w-3.5" />
											<span>{site.date}</span>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
