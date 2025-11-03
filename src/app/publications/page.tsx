import {
	BookOpen,
	Newspaper,
	Download,
	Eye,
	Calendar,
	Users,
	FileText,
	ArrowRight,
	Star,
	Award,
	Globe,
	Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BridgesPage() {
	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="relative py-24">
				<div className="absolute inset-0">
					<img
						src="https://placehold.co/1920x1080"
						alt="BRIDGES Publication Hero Background"
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/60" />
				</div>
				<div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
					<h1 className="mb-6 text-5xl font-bold text-white drop-shadow-lg">BRIDGES</h1>
					<p className="mx-auto max-w-3xl text-xl font-medium text-white drop-shadow-md">
						ARSA&apos;s official publication - connecting dorm residents through stories, insights,
						and community voices.
					</p>
				</div>
			</section>

			{/* BRIDGES Overview Section */}
			<section className="py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="mb-4 text-3xl font-bold">What is BRIDGES?</h2>
						<p className="text-muted-foreground mx-auto max-w-3xl text-lg">
							BRIDGES is ARSA&apos;s flagship publication that serves as a bridge between dorm
							residents, sharing stories, news, and insights that strengthen our community bonds.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						<Card>
							<CardContent className="p-6 text-center">
								<BookOpen className="text-primary mx-auto mb-4 h-12 w-12" />
								<h3 className="mb-2 text-xl font-semibold">Community Stories</h3>
								<p className="text-muted-foreground">
									Personal narratives, dorm life experiences, and resident spotlights that showcase
									our diverse community.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6 text-center">
								<Newspaper className="text-primary mx-auto mb-4 h-12 w-12" />
								<h3 className="mb-2 text-xl font-semibold">Dorm News</h3>
								<p className="text-muted-foreground">
									Updates on ARSA events, policy changes, and important announcements affecting dorm
									residents.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6 text-center">
								<Users className="text-primary mx-auto mb-4 h-12 w-12" />
								<h3 className="mb-2 text-xl font-semibold">Student Voices</h3>
								<p className="text-muted-foreground">
									Opinion pieces, creative writing, and student perspectives on campus life and
									current issues.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Digital Transition Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
						<div>
							<h2 className="mb-6 text-3xl font-bold">From Paper to Digital</h2>
							<div className="text-muted-foreground space-y-4">
								<p>
									BRIDGES has evolved from its traditional paper format to embrace the digital age,
									making our publication more accessible and environmentally friendly.
								</p>
								<p>
									While we maintain the quality and depth of our content, the digital format allows
									us to reach more residents, publish more frequently, and include multimedia
									elements.
								</p>
								<p>
									Our transition reflects ARSA&apos;s commitment to innovation and sustainability,
									ensuring BRIDGES remains relevant in today&apos;s digital world.
								</p>
							</div>
						</div>
						<div className="bg-background rounded-lg border p-8 shadow-sm">
							<div className="grid grid-cols-2 gap-6">
								<div className="text-center">
									<Globe className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">Digital First</h3>
									<p className="text-muted-foreground text-sm">Online Publication</p>
								</div>
								<div className="text-center">
									<Smartphone className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">Mobile Ready</h3>
									<p className="text-muted-foreground text-sm">Read Anywhere</p>
								</div>
								<div className="text-center">
									<Calendar className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">Monthly Issues</h3>
									<p className="text-muted-foreground text-sm">Regular Updates</p>
								</div>
								<div className="text-center">
									<Users className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">Open to All</h3>
									<p className="text-muted-foreground text-sm">Resident Contributions</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Call to Action Section */}
			<section className="py-16">
				<div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
					<h2 className="mb-4 text-3xl font-bold">Get Involved with BRIDGES</h2>
					<p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg">
						Whether you want to contribute content, share your story, or simply stay updated,
						BRIDGES welcomes your participation in building our community narrative.
					</p>
					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<Button size="lg" className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Submit Your Story
							<ArrowRight className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="lg" className="flex items-center gap-2">
							<Eye className="h-5 w-5" />
							Read Latest Issue
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</section>

			{/* Publication Archive Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="mb-4 text-3xl font-bold">BRIDGES Archive</h2>
						<p className="text-muted-foreground text-lg">
							Explore our collection of past issues and discover the stories that have shaped our
							dorm community.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Recent Issues */}
						<Card>
							<CardContent className="p-6">
								<div className="mb-4 flex items-center justify-between">
									<Badge variant="secondary">Latest</Badge>
									<Calendar className="text-muted-foreground h-4 w-4" />
								</div>
								<h3 className="mb-2 text-lg font-semibold">December 2024</h3>
								<p className="text-muted-foreground mb-4 text-sm">
									Holiday edition featuring winter activities, year-end reflections, and community
									highlights.
								</p>
								<Button variant="outline" size="sm" className="w-full">
									<Download className="mr-2 h-4 w-4" />
									Download Issue
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="mb-4 flex items-center justify-between">
									<Badge>November 2024</Badge>
									<Calendar className="text-muted-foreground h-4 w-4" />
								</div>
								<h3 className="mb-2 text-lg font-semibold">Fall Semester Special</h3>
								<p className="text-muted-foreground mb-4 text-sm">
									Mid-semester updates, academic resources, and student success stories.
								</p>
								<Button variant="outline" size="sm" className="w-full">
									<Download className="mr-2 h-4 w-4" />
									Download Issue
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="mb-4 flex items-center justify-between">
									<Badge>October 2024</Badge>
									<Calendar className="text-muted-foreground h-4 w-4" />
								</div>
								<h3 className="mb-2 text-lg font-semibold">Welcome Issue</h3>
								<p className="text-muted-foreground mb-4 text-sm">
									New resident orientation, ARSA introduction, and getting started guide.
								</p>
								<Button variant="outline" size="sm" className="w-full">
									<Download className="mr-2 h-4 w-4" />
									Download Issue
								</Button>
							</CardContent>
						</Card>
					</div>

					<div className="mt-8 text-center">
						<Button variant="outline">
							<Eye className="mr-2 h-4 w-4" />
							View Full Archive
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
