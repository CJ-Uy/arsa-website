import {
	Calendar,
	Package,
	BookOpen,
	Users,
	Search,
	Clock,
	MapPin,
	FileText,
	Phone,
	Mail,
	ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResourcesPage() {
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
						<h1 className="mb-6 text-5xl font-bold text-white drop-shadow-lg">Resources</h1>
						<p className="mx-auto max-w-3xl text-xl font-medium text-white drop-shadow-md">
							Access ARSA&apos;s facilities, equipment, and resources to enhance your dorm
							experience
						</p>
					</div>
				</div>
			</section>

			{/* Venue Booking Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Venue Booking</h2>
						<p className="text-muted-foreground text-lg">
							Reserve ARSA venues and spaces for your events and activities
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{/* Common Room */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<Users className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Common Room</CardTitle>
								<CardDescription>Multi-purpose space for meetings and small events</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Capacity:</span> 30 people
										<br />
										<span className="font-medium">Equipment:</span> Projector, Sound System
									</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/venue-booking-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Book Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Study Hall */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<BookOpen className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Study Hall</CardTitle>
								<CardDescription>Quiet space for group study sessions</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Capacity:</span> 20 people
										<br />
										<span className="font-medium">Features:</span> Whiteboards, Study Tables
									</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/venue-booking-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Book Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Outdoor Area */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<MapPin className="text-primary h-8 w-8" />
								</div>
								<CardTitle>Outdoor Area</CardTitle>
								<CardDescription>Open space for outdoor activities and events</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Capacity:</span> 50+ people
										<br />
										<span className="font-medium">Features:</span> BBQ Grills, Seating
									</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/venue-booking-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Book Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Inventory & Equipment Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Inventory & Equipment</h2>
						<p className="text-muted-foreground text-lg">
							Browse and borrow equipment for your events and activities
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						{/* Audio Equipment */}
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
									<Package className="text-primary h-6 w-6" />
								</div>
								<CardTitle className="text-lg">Audio Equipment</CardTitle>
							</CardHeader>
							<CardContent className="text-center">
								<ul className="text-muted-foreground space-y-1 text-sm">
									<li>• Microphones</li>
									<li>• Speakers</li>
									<li>• Mixers</li>
									<li>• Cables</li>
								</ul>
							</CardContent>
						</Card>

						{/* Sports Equipment */}
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
									<Package className="text-primary h-6 w-6" />
								</div>
								<CardTitle className="text-lg">Sports Equipment</CardTitle>
							</CardHeader>
							<CardContent className="text-center">
								<ul className="text-muted-foreground space-y-1 text-sm">
									<li>• Basketballs</li>
									<li>• Volleyballs</li>
									<li>• Badminton Sets</li>
									<li>• Fitness Equipment</li>
								</ul>
							</CardContent>
						</Card>

						{/* Event Supplies */}
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
									<Package className="text-primary h-6 w-6" />
								</div>
								<CardTitle className="text-lg">Event Supplies</CardTitle>
							</CardHeader>
							<CardContent className="text-center">
								<ul className="text-muted-foreground space-y-1 text-sm">
									<li>• Tables & Chairs</li>
									<li>• Decorations</li>
									<li>• Games</li>
									<li>• Party Supplies</li>
								</ul>
							</CardContent>
						</Card>

						{/* Tech Equipment */}
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
									<Package className="text-primary h-6 w-6" />
								</div>
								<CardTitle className="text-lg">Tech Equipment</CardTitle>
							</CardHeader>
							<CardContent className="text-center">
								<ul className="text-muted-foreground space-y-1 text-sm">
									<li>• Projectors</li>
									<li>• Laptops</li>
									<li>• Cameras</li>
									<li>• Tripods</li>
								</ul>
							</CardContent>
						</Card>
					</div>

					<div className="mt-8 text-center">
						<Button asChild>
							<a
								href="https://forms.google.com/inventory-request-form"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center space-x-2"
							>
								<span>Request Equipment</span>
								<ExternalLink className="h-4 w-4" />
							</a>
						</Button>
					</div>
				</div>
			</section>

			{/* Public Resources Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Public Resources</h2>
						<p className="text-muted-foreground text-lg">
							Access helpful information and resources for dorm life
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						{/* Dorm Guidelines */}
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
										<FileText className="text-primary h-6 w-6" />
									</div>
									<div>
										<CardTitle>Dorm Guidelines</CardTitle>
										<CardDescription>Rules and policies for dorm residents</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Access the complete dorm guidelines, policies, and rules to ensure a harmonious
									living environment for all residents.
								</p>
								<Button asChild>
									<a
										href="/documents/dorm-guidelines.pdf"
										target="_blank"
										rel="noopener noreferrer"
									>
										View Guidelines
									</a>
								</Button>
							</CardContent>
						</Card>

						{/* Campus Map */}
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
										<MapPin className="text-primary h-6 w-6" />
									</div>
									<div>
										<CardTitle>Campus Map</CardTitle>
										<CardDescription>Navigate the campus and find facilities</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Interactive campus map showing dorm locations, dining halls, study spaces, and
									other important facilities.
								</p>
								<Button asChild>
									<a href="/documents/campus-map.pdf" target="_blank" rel="noopener noreferrer">
										View Map
									</a>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Rental & Borrowing Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Rent & Borrow</h2>
						<p className="text-muted-foreground text-lg">
							Borrow equipment and supplies for your personal or group activities
						</p>
					</div>

					<div className="bg-background rounded-lg border p-8 shadow-sm">
						<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
							<div>
								<h3 className="text-foreground mb-4 text-xl font-semibold">How It Works</h3>
								<div className="space-y-4">
									<div className="flex items-start space-x-3">
										<div className="bg-primary/10 mt-1 flex h-6 w-6 items-center justify-center rounded-full">
											<span className="text-primary text-xs font-medium">1</span>
										</div>
										<div>
											<p className="text-foreground font-medium">Submit Request</p>
											<p className="text-muted-foreground text-sm">
												Fill out the equipment request form
											</p>
										</div>
									</div>
									<div className="flex items-start space-x-3">
										<div className="bg-primary/10 mt-1 flex h-6 w-6 items-center justify-center rounded-full">
											<span className="text-primary text-xs font-medium">2</span>
										</div>
										<div>
											<p className="text-foreground font-medium">Get Approval</p>
											<p className="text-muted-foreground text-sm">
												Wait for confirmation from ARSA team
											</p>
										</div>
									</div>
									<div className="flex items-start space-x-3">
										<div className="bg-primary/10 mt-1 flex h-6 w-6 items-center justify-center rounded-full">
											<span className="text-primary text-xs font-medium">3</span>
										</div>
										<div>
											<p className="text-foreground font-medium">Pick Up & Return</p>
											<p className="text-muted-foreground text-sm">
												Collect and return equipment on time
											</p>
										</div>
									</div>
								</div>
							</div>

							<div>
								<h3 className="text-foreground mb-4 text-xl font-semibold">Important Notes</h3>
								<div className="text-muted-foreground space-y-3 text-sm">
									<p>• Equipment must be returned in the same condition</p>
									<p>• Late returns may result in borrowing restrictions</p>
									<p>• Some items require a deposit or ID</p>
									<p>• Maximum borrowing period: 7 days</p>
									<p>• Available during office hours only</p>
								</div>
								<div className="mt-6">
									<Button asChild className="w-full">
										<a
											href="https://forms.google.com/equipment-request-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Request Equipment</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Lost and Found Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Lost & Found</h2>
						<p className="text-muted-foreground text-lg">
							Report lost items or check if your lost belongings have been found
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						{/* Report Lost Item */}
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
										<Search className="text-primary h-6 w-6" />
									</div>
									<div>
										<CardTitle>Report Lost Item</CardTitle>
										<CardDescription>Submit a report for your lost item</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Report a lost item with detailed description, location, and contact information to
									help us locate it.
								</p>
								<Button asChild className="w-full">
									<a
										href="https://forms.google.com/lost-item-form"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-center space-x-2"
									>
										<span>Report Lost Item</span>
										<ExternalLink className="h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>

						{/* Check Found Items */}
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
										<Package className="text-primary h-6 w-6" />
									</div>
									<div>
										<CardTitle>Check Found Items</CardTitle>
										<CardDescription>Browse items that have been found</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Check our database of found items to see if your lost belongings have been turned
									in.
								</p>
								<Button asChild className="w-full">
									<a
										href="https://forms.google.com/found-items-database"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-center space-x-2"
									>
										<span>Browse Found Items</span>
										<ExternalLink className="h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>
					</div>

					{/* Contact Information */}
					<div className="bg-muted/50 mt-12 rounded-lg p-8 text-center">
						<h3 className="text-foreground mb-4 text-xl font-semibold">Need Help?</h3>
						<p className="text-muted-foreground mb-4">
							For immediate assistance with lost and found items, contact our office:
						</p>
						<div className="flex items-center justify-center space-x-6 text-sm">
							<div className="flex items-center space-x-2">
								<Phone className="text-muted-foreground h-4 w-4" />
								<span className="text-muted-foreground">+1 (555) 123-4567</span>
							</div>
							<div className="flex items-center space-x-2">
								<Mail className="text-muted-foreground h-4 w-4" />
								<span className="text-muted-foreground">arsa.college.org@student.ateneo.edu</span>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
