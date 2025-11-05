import Link from "next/link";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";

export function Footer() {
	return (
		<footer className="bg-background border-t">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
					{/* Brand Section */}
					<div className="space-y-4">
						<div className="flex items-center">
							<img src="/images/logo.png" alt="ARSA Logo" className="h-10 w-10 object-contain" />
						</div>
						<p className="text-muted-foreground text-sm">In ARSA, It&apos;s good to be home.</p>
					</div>

					{/* Quick Links */}
					<div className="space-y-4">
						<h3 className="font-semibold">Quick Links</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="/about"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									About Us
								</Link>
							</li>
							<li>
								<Link
									href="/calendar"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Events Calendar
								</Link>
							</li>
							<li>
								<Link
									href="/resources"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Resources
								</Link>
							</li>
							<li>
								<Link
									href="/contact"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Contact Us
								</Link>
							</li>
						</ul>
					</div>

					{/* Resources */}
					<div className="space-y-4">
						<h3 className="font-semibold">Resources</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="/publications"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									BRIDGES
								</Link>
							</li>
							<li>
								<Link
									href="/merch"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Merchandise
								</Link>
							</li>
							<li>
								<Link
									href="/resources"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Venue Booking
								</Link>
							</li>
							<li>
								<Link
									href="/resources"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Inventory
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact & Social */}
					<div className="space-y-4">
						<h3 className="font-semibold">Connect With Us</h3>
						<div className="space-y-3">
							<div className="text-muted-foreground flex items-center space-x-2 text-sm">
								<Mail className="h-4 w-4" />
								<span>arsa.college.org@student.ateneo.edu</span>
							</div>
							<div className="text-muted-foreground flex items-center space-x-2 text-sm">
								<Phone className="h-4 w-4" />
								<span>+1 (555) 123-4567</span>
							</div>
						</div>

						{/* Social Media */}
						<div className="flex items-center space-x-4 pt-2">
							<Link
								href="https://www.facebook.com/ARSAAteneo"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-primary transition-colors"
								aria-label="Follow ARSA on Facebook"
							>
								<Facebook className="h-5 w-5" />
							</Link>
							<Link
								href="https://www.instagram.com/arsaateneo/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-primary transition-colors"
								aria-label="Follow ARSA on Instagram"
							>
								<Instagram className="h-5 w-5" />
							</Link>
							<Link
								href="https://www.tiktok.com/@arsaateneo"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground hover:text-primary flex items-center transition-colors"
								aria-label="Follow ARSA on TikTok"
							>
								<span className="text-sm font-medium">@arsaateneo</span>
							</Link>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-8 border-t pt-6">
					<div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
						<p className="text-muted-foreground text-sm">
							© 2025 Ateneo Resident Students Association. All rights reserved.
						</p>
						<div className="flex space-x-6 text-sm">
							<Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
								Privacy Policy
							</Link>
							<Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
								Terms of Service
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
