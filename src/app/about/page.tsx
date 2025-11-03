import { Mail, Users, Award, Calendar } from "lucide-react";

export default function AboutPage() {
	return (
		<div className="bg-background min-h-screen">
			{/* Hero Section */}
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
					<div className="text-center">
						<h1 className="mb-6 text-5xl font-bold text-white drop-shadow-lg">About ARSA</h1>
						<p className="mx-auto max-w-3xl text-xl font-medium text-white drop-shadow-md">
							The Ateneo Resident Students Association - your home away from home, building
							community and fostering connections among dorm residents.
						</p>
					</div>
				</div>
			</section>

			{/* What is ARSA Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
						<div>
							<h2 className="text-foreground mb-6 text-3xl font-bold">What is ARSA?</h2>
							<div className="text-muted-foreground space-y-4">
								<p>
									ARSA (Ateneo Resident Students Association) is the official student organization
									representing all residents of the Ateneo dormitories. We serve as the voice of
									dorm residents and work to enhance the living experience on campus.
								</p>
								<p>
									Our mission is to create a supportive, inclusive community where every resident
									feels at home. We organize events, provide resources, and ensure that dorm life is
									enriching and enjoyable for all students.
								</p>
								<p>
									Through various programs and initiatives, we help residents connect with each
									other, develop leadership skills, and make the most of their university
									experience.
								</p>
							</div>
						</div>
						<div className="bg-muted/50 rounded-lg p-8">
							<div className="grid grid-cols-2 gap-6">
								<div className="text-center">
									<Users className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">500+</h3>
									<p className="text-muted-foreground text-sm">Active Residents</p>
								</div>
								<div className="text-center">
									<Calendar className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">50+</h3>
									<p className="text-muted-foreground text-sm">Events Yearly</p>
								</div>
								<div className="text-center">
									<Award className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">25+</h3>
									<p className="text-muted-foreground text-sm">Years of Service</p>
								</div>
								<div className="text-center">
									<Mail className="text-primary mx-auto mb-3 h-12 w-12" />
									<h3 className="text-foreground font-semibold">24/7</h3>
									<p className="text-muted-foreground text-sm">Support Available</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Council & Directory Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Council & Directory</h2>
						<p className="text-muted-foreground text-lg">
							Meet the dedicated students who lead ARSA and serve our dorm community
						</p>
					</div>

					{/* Council Members Grid */}
					<div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* President */}
						<div className="bg-background rounded-lg border p-6 shadow-sm">
							<div className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
									<Users className="text-primary h-10 w-10" />
								</div>
								<h3 className="text-foreground mb-1 font-semibold">President</h3>
								<p className="text-muted-foreground mb-3 text-sm">John Doe</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-center space-x-2">
										<Mail className="text-muted-foreground h-4 w-4" />
										<span className="text-muted-foreground">president@arsa.edu</span>
									</div>
								</div>
							</div>
						</div>

						{/* Vice President */}
						<div className="bg-background rounded-lg border p-6 shadow-sm">
							<div className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
									<Users className="text-primary h-10 w-10" />
								</div>
								<h3 className="text-foreground mb-1 font-semibold">Vice President</h3>
								<p className="text-muted-foreground mb-3 text-sm">Jane Smith</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-center space-x-2">
										<Mail className="text-muted-foreground h-4 w-4" />
										<span className="text-muted-foreground">vp@arsa.edu</span>
									</div>
								</div>
							</div>
						</div>

						{/* Secretary */}
						<div className="bg-background rounded-lg border p-6 shadow-sm">
							<div className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
									<Users className="text-primary h-10 w-10" />
								</div>
								<h3 className="text-foreground mb-1 font-semibold">Secretary</h3>
								<p className="text-muted-foreground mb-3 text-sm">Mike Johnson</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-center space-x-2">
										<Mail className="text-muted-foreground h-4 w-4" />
										<span className="text-muted-foreground">secretary@arsa.edu</span>
									</div>
								</div>
							</div>
						</div>

						{/* Treasurer */}
						<div className="bg-background rounded-lg border p-6 shadow-sm">
							<div className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
									<Users className="text-primary h-10 w-10" />
								</div>
								<h3 className="text-foreground mb-1 font-semibold">Treasurer</h3>
								<p className="text-muted-foreground mb-3 text-sm">Sarah Wilson</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-center space-x-2">
										<Mail className="text-muted-foreground h-4 w-4" />
										<span className="text-muted-foreground">treasurer@arsa.edu</span>
									</div>
								</div>
							</div>
						</div>

						{/* Events Coordinator */}
						<div className="bg-background rounded-lg border p-6 shadow-sm">
							<div className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
									<Users className="text-primary h-10 w-10" />
								</div>
								<h3 className="text-foreground mb-1 font-semibold">Events Coordinator</h3>
								<p className="text-muted-foreground mb-3 text-sm">Alex Brown</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-center space-x-2">
										<Mail className="text-muted-foreground h-4 w-4" />
										<span className="text-muted-foreground">events@arsa.edu</span>
									</div>
								</div>
							</div>
						</div>

						{/* Communications Officer */}
						<div className="bg-background rounded-lg border p-6 shadow-sm">
							<div className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
									<Users className="text-primary h-10 w-10" />
								</div>
								<h3 className="text-foreground mb-1 font-semibold">Communications</h3>
								<p className="text-muted-foreground mb-3 text-sm">Taylor Davis</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-center space-x-2">
										<Mail className="text-muted-foreground h-4 w-4" />
										<span className="text-muted-foreground">comms@arsa.edu</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Quick Contact Section */}
			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Get in Touch</h2>
						<p className="text-muted-foreground mb-6 text-lg">
							Have questions about ARSA or need to reach our team?
						</p>
						<div className="bg-muted/50 rounded-lg p-8">
							<div className="space-y-4">
								<p className="text-muted-foreground">
									For general inquiries, grievance forms, maintenance requests, or any other
									concerns, we&apos;re here to help you with all aspects of dorm life.
								</p>
								<div className="text-muted-foreground flex items-center justify-center space-x-2 text-sm">
									<Mail className="h-4 w-4" />
									<span>arsa.college.org@student.ateneo.edu</span>
								</div>
								<p className="text-muted-foreground text-sm">
									Visit our Contact page for detailed contact information, grievance forms, and more
									ways to reach us.
								</p>
								<div className="pt-4">
									<a
										href="/contact"
										className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-medium transition-colors"
									>
										Contact Us
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
