import { Calendar, Users, ArrowRight, BookOpen, FileText, Phone, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from "@/components/features/event-card";

// Mock data for upcoming events (will be replaced with Strapi CMS data)
const upcomingEvents = [
	{
		id: 1,
		title: "ARSA Welcome Night",
		date: "2024-12-15",
		time: "7:00 PM",
		location: "Common Room",
		description:
			"Join us for an evening of games, food, and getting to know your fellow ARSA residents!",
		attendees: 45,
		maxCapacity: 60,
		category: "Social",
		featured: true,
	},
	{
		id: 2,
		title: "Study Hall Sessions",
		date: "2024-12-16",
		time: "6:00 PM",
		location: "Study Hall",
		description: "Group study sessions with free coffee and snacks. Perfect for finals prep!",
		attendees: 28,
		maxCapacity: 40,
		category: "Academic",
	},
	{
		id: 3,
		title: "Movie Night: Holiday Classics",
		date: "2024-12-17",
		time: "8:00 PM",
		location: "Outdoor Area",
		description: "Bundle up and enjoy holiday movies under the stars with hot chocolate!",
		attendees: 35,
		maxCapacity: 50,
		category: "Entertainment",
	},
	{
		id: 4,
		title: "ARSA Council Meeting",
		date: "2024-12-18",
		time: "5:00 PM",
		location: "Conference Room",
		description: "Monthly council meeting. All residents welcome to attend and share ideas!",
		attendees: 15,
		maxCapacity: 30,
		category: "Community",
	},
];

// Mock data for quick stats
const communityStats = {
	totalResidents: 120,
	activeEvents: 8,
	thisMonth: 15,
	satisfactionRate: 94,
};

export default function HomePage() {
	const featuredEvent = upcomingEvents.find((event) => event.featured);
	const otherEvents = upcomingEvents.filter((event) => !event.featured).slice(0, 3);

	return (
		<div className="bg-background min-h-screen">
			{/* Hero Section with Featured Event */}
			<section className="relative overflow-hidden py-24">
				{/* Background Image */}
				<div className="absolute inset-0 z-0">
					<div
						className="h-full w-full bg-cover bg-center bg-no-repeat"
						style={{
							backgroundImage: "url('https://placehold.co/1920x1080')",
						}}
					/>
				</div>

				{/* Dark Overlay */}
				<div className="absolute inset-0 z-0 bg-black/60" />

				{/* Content Overlay */}
				<div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
						<div className="text-white">
							<h1 className="mb-6 text-5xl font-bold drop-shadow-lg">
								In ARSA, It&apos;s good to be home.
							</h1>
							<p className="mb-8 text-xl drop-shadow-md">
								Welcome to your dorm community where every day brings new opportunities to connect,
								learn, and grow together.
							</p>
							<div className="flex flex-col gap-4 sm:flex-row">
								<Button
									size="lg"
									className="bg-primary hover:bg-primary/90 text-primary-foreground"
									asChild
								>
									<a href="/about" className="flex items-center">
										<Users className="mr-2 h-5 w-5" />
										Learn More
									</a>
								</Button>
							</div>
						</div>

						{/* Featured Event Card */}
						{featuredEvent && <EventCard event={featuredEvent} variant="featured" />}
					</div>
				</div>
			</section>

			{/* Upcoming Events Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-foreground mb-4 text-3xl font-bold">Upcoming Events</h2>
							<p className="text-muted-foreground text-lg">
								Don&apos;t miss out on what&apos;s happening in ARSA
							</p>
						</div>
						<Button
							className="bg-primary hover:bg-primary/90 text-primary-foreground hidden sm:flex"
							asChild
						>
							<a href="#" className="flex items-center">
								View All Events
								<ArrowRight className="ml-2 h-4 w-4" />
							</a>
						</Button>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{otherEvents.map((event) => (
							<EventCard key={event.id} event={event} />
						))}
					</div>
				</div>
			</section>

			{/* Facebook Post Embeds Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Latest from Facebook</h2>
						<p className="text-muted-foreground text-lg">
							Stay updated with our latest posts and announcements
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Facebook Post Embed 1 */}
						<div className="bg-card border-border rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
							<div className="mb-4 flex items-center">
								<div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
									<span className="text-sm font-bold text-white">f</span>
								</div>
								<div>
									<p className="text-card-foreground font-semibold">ARSA Ateneo</p>
									<p className="text-muted-foreground text-sm">2 hours ago</p>
								</div>
							</div>

							<div className="bg-muted/50 mb-4 rounded-lg p-4 text-center">
								<div className="bg-muted flex h-32 w-full items-center justify-center rounded">
									<p className="text-muted-foreground text-sm">Facebook Post Embed</p>
								</div>
							</div>

							<p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
								Join us this weekend for the ARSA Welcome Night! Games, food, and new friendships
								await.
							</p>

							<Button size="sm" className="w-full" asChild>
								<a href="https://facebook.com/arsaateneo" target="_blank" rel="noopener noreferrer">
									View on Facebook
								</a>
							</Button>
						</div>

						{/* Facebook Post Embed 2 */}
						<div className="bg-card border-border rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
							<div className="mb-4 flex items-center">
								<div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
									<span className="text-sm font-bold text-white">f</span>
								</div>
								<div>
									<p className="text-card-foreground font-semibold">ARSA Ateneo</p>
									<p className="text-muted-foreground text-sm">1 day ago</p>
								</div>
							</div>

							<div className="bg-muted/50 mb-4 rounded-lg p-4 text-center">
								<div className="bg-muted flex h-32 w-full items-center justify-center rounded">
									<p className="text-muted-foreground text-sm">Facebook Post Embed</p>
								</div>
							</div>

							<p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
								Study Hall sessions are back! Free coffee and snacks every evening this week.
							</p>

							<Button size="sm" className="w-full" asChild>
								<a href="https://facebook.com/arsaateneo" target="_blank" rel="noopener noreferrer">
									View on Facebook
								</a>
							</Button>
						</div>

						{/* Facebook Post Embed 3 */}
						<div className="bg-card border-border rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
							<div className="mb-4 flex items-center">
								<div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
									<span className="text-sm font-bold text-white">f</span>
								</div>
								<div>
									<p className="text-card-foreground font-semibold">ARSA Ateneo</p>
									<p className="text-muted-foreground text-sm">3 days ago</p>
								</div>
							</div>

							<div className="bg-muted/50 mb-4 rounded-lg p-4 text-center">
								<div className="bg-muted flex h-32 w-full items-center justify-center rounded">
									<p className="text-muted-foreground text-sm">Facebook Post Embed</p>
								</div>
							</div>

							<p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
								Council meeting this Friday! All residents welcome to share ideas and concerns.
							</p>

							<Button size="sm" className="w-full" asChild>
								<a href="https://facebook.com/arsaateneo" target="_blank" rel="noopener noreferrer">
									View on Facebook
								</a>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Quick Actions Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Quick Actions</h2>
						<p className="text-muted-foreground text-lg">Everything you need, just a click away</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card className="flex cursor-pointer flex-col text-center transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<Calendar className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Book Venue</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col">
								<p className="text-muted-foreground mb-4 text-sm">
									Reserve spaces for your events and activities
								</p>
								<div className="mt-auto">
									<Button size="sm" className="w-full" asChild>
										<a href="/resources" className="flex items-center justify-center">
											Book Now
											<ArrowRight className="ml-2 h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card className="flex cursor-pointer flex-col text-center transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<BookOpen className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Report Issue</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col">
								<p className="text-muted-foreground mb-4 text-sm">
									Let us know about maintenance or other concerns
								</p>
								<div className="mt-auto">
									<Button size="sm" className="w-full" asChild>
										<a href="/contact" className="flex items-center justify-center">
											Report
											<ArrowRight className="ml-2 h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card className="flex cursor-pointer flex-col text-center transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<FileText className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Read Bridges</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col">
								<p className="text-muted-foreground mb-4 text-sm">
									Check out our latest publication
								</p>
								<div className="mt-auto">
									<Button size="sm" className="w-full" asChild>
										<a href="/publications" className="flex items-center justify-center">
											Read Now
											<ArrowRight className="ml-2 h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						<Card className="flex cursor-pointer flex-col text-center transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<Phone className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Get Help</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col">
								<p className="text-muted-foreground mb-4 text-sm">
									Contact us for immediate assistance
								</p>
								<div className="mt-auto">
									<Button size="sm" className="w-full" asChild>
										<a href="/contact" className="flex items-center justify-center">
											Contact
											<ArrowRight className="ml-2 h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Community Stats Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">ARSA Community</h2>
						<p className="text-muted-foreground text-lg">Building connections, one day at a time</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
								<Users className="text-primary h-10 w-10" />
							</div>
							<div className="text-foreground mb-2 text-3xl font-bold">
								{communityStats.totalResidents}
							</div>
							<p className="text-muted-foreground">Active Residents</p>
						</div>

						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
								<Calendar className="text-primary h-10 w-10" />
							</div>
							<div className="text-foreground mb-2 text-3xl font-bold">
								{communityStats.activeEvents}
							</div>
							<p className="text-muted-foreground">Events This Week</p>
						</div>

						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
								<Award className="text-primary h-10 w-10" />
							</div>
							<div className="text-foreground mb-2 text-3xl font-bold">
								{communityStats.thisMonth}
							</div>
							<p className="text-muted-foreground">Events This Month</p>
						</div>

						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
								<Star className="text-primary h-10 w-10" />
							</div>
							<div className="text-foreground mb-2 text-3xl font-bold">
								{communityStats.satisfactionRate}%
							</div>
							<p className="text-muted-foreground">Satisfaction Rate</p>
						</div>
					</div>
				</div>
			</section>

			{/* Relevant Publications & Materials Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">
							Latest Publications & Materials
						</h2>
						<p className="text-muted-foreground text-lg">
							Stay updated with ARSA&apos;s latest announcements and resources
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<Card className="transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<FileText className="text-primary h-8 w-8" />
								</div>
								<CardTitle className="text-center">Bridges Magazine</CardTitle>
							</CardHeader>
							<CardContent className="text-center">
								<p className="text-muted-foreground mb-4 text-sm">
									Latest issue of our official publication
								</p>
								<Button size="sm" className="w-full" asChild>
									<a href="/publications" className="flex items-center justify-center">
										Read Now
										<ArrowRight className="ml-2 h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>

						<Card className="transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<Calendar className="text-primary h-8 w-8" />
								</div>
								<CardTitle className="text-center">Event Posters</CardTitle>
							</CardHeader>
							<CardContent className="text-center">
								<p className="text-muted-foreground mb-4 text-sm">
									Download and share upcoming event materials
								</p>
								<Button size="sm" className="w-full" asChild>
									<a href="#" className="flex items-center justify-center">
										View Posters
										<ArrowRight className="ml-2 h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>

						<Card className="transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<BookOpen className="text-primary h-8 w-8" />
								</div>
								<CardTitle className="text-center">Resource Guides</CardTitle>
							</CardHeader>
							<CardContent className="text-center">
								<p className="text-muted-foreground mb-4 text-sm">
									Essential guides for ARSA residents
								</p>
								<Button size="sm" className="w-full" asChild>
									<a href="/resources" className="flex items-center justify-center">
										Access Guides
										<ArrowRight className="ml-2 h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Social Media Section */}
			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Follow ARSA</h2>
						<p className="text-muted-foreground text-lg">
							Connect with us across all social media platforms
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						{/* Instagram */}
						<Card className="text-center transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600">
									<span className="text-xl font-bold text-white">IG</span>
								</div>
								<CardTitle>Instagram</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4 text-sm">@arsaateneo</p>
								<Button size="sm" className="w-full" asChild>
									<a
										href="https://instagram.com/arsaateneo"
										target="_blank"
										rel="noopener noreferrer"
									>
										Follow
									</a>
								</Button>
							</CardContent>
						</Card>

						{/* TikTok */}
						<Card className="text-center transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black">
									<span className="text-xl font-bold text-white">T</span>
								</div>
								<CardTitle>TikTok</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4 text-sm">@arsaateneo</p>
								<Button size="sm" className="w-full" asChild>
									<a
										href="https://tiktok.com/@arsaateneo"
										target="_blank"
										rel="noopener noreferrer"
									>
										Follow
									</a>
								</Button>
							</CardContent>
						</Card>

						{/* Facebook */}
						<Card className="text-center transition-shadow hover:shadow-lg">
							<CardHeader>
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
									<span className="text-xl font-bold text-white">f</span>
								</div>
								<CardTitle>Facebook</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4 text-sm">@arsaateneo</p>
								<Button size="sm" className="w-full" asChild>
									<a
										href="https://facebook.com/arsaateneo"
										target="_blank"
										rel="noopener noreferrer"
									>
										Follow
									</a>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Call to Action Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
					<h2 className="text-foreground mb-4 text-3xl font-bold">Ready to Get Involved?</h2>
					<p className="text-muted-foreground mb-8 text-lg">
						Join our vibrant community and make the most of your ARSA experience. There&apos;s
						always something happening, and we&apos;d love for you to be part of it!
					</p>
					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<Button
							size="lg"
							className="bg-primary hover:bg-primary/90 text-primary-foreground"
							asChild
						>
							<a href="#" className="flex items-center">
								<Calendar className="mr-2 h-5 w-5" />
								Browse Events
							</a>
						</Button>
						<Button
							size="lg"
							className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
							asChild
						>
							<a href="/about" className="flex items-center">
								<Users className="mr-2 h-5 w-5" />
								Learn More
							</a>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
