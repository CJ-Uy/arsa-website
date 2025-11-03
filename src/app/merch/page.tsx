import { ShoppingBag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GachaBanner } from "@/components/features/gacha-banner";

export default function MerchPage() {
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
						<h1 className="mb-6 text-5xl font-bold text-white drop-shadow-lg">ARSA Merch</h1>
						<p className="mx-auto max-w-3xl text-xl font-medium text-white drop-shadow-md">
							Show your ARSA pride with official merchandise and discover rare items through our
							gacha system
						</p>
					</div>
				</div>
			</section>

			<GachaBanner />

			{/* Regular Merch Section */}
			<section className="py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Regular Merchandise</h2>
						<p className="text-muted-foreground text-lg">
							Order your favorite ARSA merchandise directly
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{/* Hoodies */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<ShoppingBag className="text-primary h-8 w-8" />
								</div>
								<CardTitle>ARSA Hoodies</CardTitle>
								<CardDescription>
									Comfortable and stylish hoodies with ARSA branding
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Available Sizes:</span> XS, S, M, L, XL
										<br />
										<span className="font-medium">Colors:</span> Black, Navy, Gray
									</p>
									<p className="text-foreground text-lg font-semibold">₱1,200</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/merch-order-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Order Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* T-Shirts */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<ShoppingBag className="text-primary h-8 w-8" />
								</div>
								<CardTitle>ARSA T-Shirts</CardTitle>
								<CardDescription>Classic t-shirts perfect for everyday wear</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Available Sizes:</span> XS, S, M, L, XL
										<br />
										<span className="font-medium">Colors:</span> White, Black, Blue
									</p>
									<p className="text-foreground text-lg font-semibold">₱800</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/merch-order-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Order Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Caps */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<ShoppingBag className="text-primary h-8 w-8" />
								</div>
								<CardTitle>ARSA Caps</CardTitle>
								<CardDescription>Adjustable caps with embroidered ARSA logo</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Style:</span> Baseball Cap
										<br />
										<span className="font-medium">Colors:</span> Black, White, Navy
									</p>
									<p className="text-foreground text-lg font-semibold">₱500</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/merch-order-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Order Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Mugs */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<ShoppingBag className="text-primary h-8 w-8" />
								</div>
								<CardTitle>ARSA Mugs</CardTitle>
								<CardDescription>Ceramic mugs perfect for your morning coffee</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Capacity:</span> 12 oz
										<br />
										<span className="font-medium">Material:</span> Ceramic
									</p>
									<p className="text-foreground text-lg font-semibold">₱300</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/merch-order-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Order Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Stickers */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<ShoppingBag className="text-primary h-8 w-8" />
								</div>
								<CardTitle>ARSA Stickers</CardTitle>
								<CardDescription>
									High-quality vinyl stickers for laptops and water bottles
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Pack:</span> 5 stickers
										<br />
										<span className="font-medium">Size:</span> 3&quot; x 3&quot;
									</p>
									<p className="text-foreground text-lg font-semibold">₱150</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/merch-order-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Order Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Tote Bags */}
						<Card className="flex flex-col">
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
									<ShoppingBag className="text-primary h-8 w-8" />
								</div>
								<CardTitle>ARSA Tote Bags</CardTitle>
								<CardDescription>
									Eco-friendly canvas tote bags for shopping and daily use
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col text-center">
								<div className="mb-4 flex-1 space-y-3">
									<p className="text-muted-foreground text-sm">
										<span className="font-medium">Material:</span> Canvas
										<br />
										<span className="font-medium">Colors:</span> Natural, Black
									</p>
									<p className="text-foreground text-lg font-semibold">₱400</p>
								</div>
								<div className="mt-auto">
									<Button className="w-full" asChild>
										<a
											href="https://forms.google.com/merch-order-form"
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center space-x-2"
										>
											<span>Order Now</span>
											<ExternalLink className="h-4 w-4" />
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* How to Order Section */}
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">How to Order</h2>
						<p className="text-muted-foreground text-lg">
							Simple steps to get your ARSA merchandise
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
								<span className="text-primary text-2xl font-bold">1</span>
							</div>
							<h3 className="text-foreground mb-2 text-xl font-semibold">Fill Out Form</h3>
							<p className="text-muted-foreground">
								Complete the order form with your details and merchandise selection
							</p>
						</div>
						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
								<span className="text-primary text-2xl font-bold">2</span>
							</div>
							<h3 className="text-foreground mb-2 text-xl font-semibold">Wait for Confirmation</h3>
							<p className="text-muted-foreground">
								We&apos;ll confirm your order and provide pickup/delivery details
							</p>
						</div>
						<div className="text-center">
							<div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
								<span className="text-primary text-2xl font-bold">3</span>
							</div>
							<h3 className="text-foreground mb-2 text-xl font-semibold">Collect Your Merch</h3>
							<p className="text-muted-foreground">
								Pick up your merchandise from our office or arrange delivery
							</p>
						</div>
					</div>

					<div className="mt-12 text-center">
						<Button size="lg" asChild>
							<a
								href="https://forms.google.com/merch-order-form"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center space-x-2"
							>
								<span>Start Your Order</span>
								<ExternalLink className="h-4 w-4" />
							</a>
						</Button>
					</div>
				</div>
			</section>

			{/* Contact & Support */}
			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Questions About Merch?</h2>
						<p className="text-muted-foreground mb-6 text-lg">
							Need help with sizing, availability, or have other questions?
						</p>
						<div className="bg-muted/50 rounded-lg p-8">
							<div className="space-y-4">
								<p className="text-muted-foreground">
									Contact our merch team for assistance with orders, sizing questions, or to learn
									more about our gacha system and how to earn ARSA Points.
								</p>
								<div className="text-muted-foreground flex items-center justify-center space-x-2 text-sm">
									<ShoppingBag className="h-4 w-4" />
									<span>merch@arsa.edu</span>
								</div>
								<p className="text-muted-foreground text-sm">
									Visit our Contact page for more ways to reach us.
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
