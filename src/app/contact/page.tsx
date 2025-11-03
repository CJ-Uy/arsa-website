import { Mail, Phone, MapPin, FileText, MessageSquare, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
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
						<h1 className="mb-6 text-5xl font-bold text-white drop-shadow-lg">Contact Us</h1>
						<p className="mx-auto max-w-3xl text-xl font-medium text-white drop-shadow-md">
							Get in touch with ARSA. We're here to help with any questions, concerns, or feedback
							about dorm life.
						</p>
					</div>
				</div>
			</section>

			{/* Contact Methods Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">How to Reach Us</h2>
						<p className="text-muted-foreground text-lg">
							Choose the best way to get in touch with our team
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						{/* Email Contact */}
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<Mail className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Email Us</CardTitle>
								<CardDescription>Send us a message for general inquiries</CardDescription>
							</CardHeader>
							<CardContent className="text-center">
								<a
									href="mailto:arsa.college.org@student.ateneo.edu"
									className="text-primary font-medium hover:underline"
								>
									arsa.college.org@student.ateneo.edu
								</a>
								<p className="text-muted-foreground mt-2 text-sm">We'll respond within 24 hours</p>
							</CardContent>
						</Card>

						{/* Phone Contact */}
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<Phone className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Call Us</CardTitle>
								<CardDescription>Speak directly with our team</CardDescription>
							</CardHeader>
							<CardContent className="text-center">
								<p className="text-foreground font-medium">+1 (555) 123-4567</p>
								<p className="text-muted-foreground mt-2 text-sm">Mon-Fri: 9:00 AM - 5:00 PM</p>
							</CardContent>
						</Card>

						{/* Office Location */}
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<MapPin className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Visit Us</CardTitle>
								<CardDescription>Drop by our office</CardDescription>
							</CardHeader>
							<CardContent className="text-center">
								<p className="text-foreground font-medium">Dorm Building A, Room 101</p>
								<p className="text-muted-foreground mt-2 text-sm">Office hours: Mon-Fri 9AM-5PM</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Grievance Forms Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Grievance Forms</h2>
						<p className="text-muted-foreground text-lg">
							Report issues, submit complaints, or request assistance
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						{/* General Grievance Form */}
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
										<FileText className="text-primary h-6 w-6" />
									</div>
									<div>
										<CardTitle>General Grievance</CardTitle>
										<CardDescription>Report general issues or concerns</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Use this form for general complaints, suggestions, or issues related to dorm life,
									facilities, or services.
								</p>
								<Button className="w-full" asChild>
									<a
										href="https://forms.google.com/your-grievance-form-link"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-center space-x-2"
									>
										<span>Submit Grievance</span>
										<ExternalLink className="h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>

						{/* Maintenance Request Form */}
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
										<MessageSquare className="text-primary h-6 w-6" />
									</div>
									<div>
										<CardTitle>Maintenance Request</CardTitle>
										<CardDescription>Report facility or equipment issues</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Report broken facilities, equipment malfunctions, or maintenance issues in your
									dorm or common areas.
								</p>
								<Button className="w-full" asChild>
									<a
										href="https://forms.google.com/your-maintenance-form-link"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-center space-x-2"
									>
										<span>Submit Request</span>
										<ExternalLink className="h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Quick Contact Section */}
			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Need Immediate Help?</h2>
						<p className="text-muted-foreground text-lg">
							For urgent matters or emergency situations
						</p>
					</div>

					<div className="bg-primary/5 border-primary/20 rounded-lg border p-8">
						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
								<Clock className="text-primary h-8 w-8" />
							</div>
							<h3 className="text-foreground mb-2 text-xl font-semibold">Emergency Contact</h3>
							<p className="text-muted-foreground mb-4">For urgent matters outside office hours</p>
							<div className="space-y-2">
								<p className="text-foreground font-medium">Emergency Hotline: +1 (555) 999-8888</p>
								<p className="text-muted-foreground text-sm">
									Available 24/7 for urgent dorm-related emergencies
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
