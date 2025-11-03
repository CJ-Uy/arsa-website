"use client";

import { useState } from "react";
import { Gift, Star, Package, Zap, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Demo gacha items with different rarities
const gachaItems = [
	// 5★ Rare items (2% chance)
	{ id: 1, name: "Limited Edition ARSA Hoodie", rarity: 5, icon: "👕", color: "text-yellow-600" },
	{ id: 2, name: "Vintage ARSA Jacket", rarity: 5, icon: "🧥", color: "text-yellow-600" },

	// 4★ Epic items (8% chance)
	{ id: 3, name: "Retro ARSA T-Shirt", rarity: 4, icon: "👚", color: "text-purple-600" },
	{ id: 4, name: "Classic ARSA Cap", rarity: 4, icon: "🧢", color: "text-purple-600" },
	{ id: 5, name: "Limited ARSA Mug", rarity: 4, icon: "☕", color: "text-purple-600" },
	{ id: 6, name: "Vintage ARSA Sticker Pack", rarity: 4, icon: "🏷️", color: "text-purple-600" },

	// 3★ Common items (90% chance)
	{ id: 7, name: "ARSA Tote Bag", rarity: 3, icon: "👜", color: "text-blue-600" },
	{ id: 8, name: "ARSA Keychain", rarity: 3, icon: "🔑", color: "text-blue-600" },
	{ id: 9, name: "ARSA Pen", rarity: 3, icon: "✏️", color: "text-blue-600" },
	{ id: 10, name: "ARSA Notebook", rarity: 3, icon: "📓", color: "text-blue-600" },
	{ id: 11, name: "ARSA Water Bottle", rarity: 3, icon: "💧", color: "text-blue-600" },
	{ id: 12, name: "ARSA Lanyard", rarity: 3, icon: "🪖", color: "text-blue-600" },
];

export function GachaBanner() {
	const [isPulling, setIsPulling] = useState(false);
	const [pulledItems, setPulledItems] = useState<typeof gachaItems>([]);
	const [showModal, setShowModal] = useState(false);
	const [modalType, setModalType] = useState<"pulling" | "results">("pulling");
	const [revealedItems, setRevealedItems] = useState(0);

	const getRandomItem = () => {
		const rand = Math.random() * 100;

		if (rand < 2) {
			// 2% chance for 5★
			const rareItems = gachaItems.filter((item) => item.rarity === 5);
			return rareItems[Math.floor(Math.random() * rareItems.length)];
		} else if (rand < 10) {
			// 8% chance for 4★
			const epicItems = gachaItems.filter((item) => item.rarity === 4);
			return epicItems[Math.floor(Math.random() * epicItems.length)];
		} else {
			// 90% chance for 3★
			const commonItems = gachaItems.filter((item) => item.rarity === 3);
			return commonItems[Math.floor(Math.random() * commonItems.length)];
		}
	};

	const performPull = (count: number) => {
		setIsPulling(true);
		setModalType("pulling");
		setShowModal(true);
		setRevealedItems(0);

		// Simulate gacha animation delay
		setTimeout(() => {
			const newItems = [];
			for (let i = 0; i < count; i++) {
				newItems.push(getRandomItem());
			}

			setPulledItems(newItems);
			setModalType("results");
			setIsPulling(false);

			// Start revealing items one by one
			revealItemsSequentially(newItems.length);
		}, 2000);
	};

	const revealItemsSequentially = (totalItems: number) => {
		let currentIndex = 0;

		const revealNext = () => {
			if (currentIndex < totalItems) {
				setRevealedItems(currentIndex + 1);
				currentIndex++;

				// Reveal next item after a delay (faster now!)
				setTimeout(revealNext, 150);
			}
		};

		// Start revealing
		setTimeout(revealNext, 500);
	};

	const getRarityColor = (rarity: number) => {
		switch (rarity) {
			case 5:
				return "text-yellow-600";
			case 4:
				return "text-purple-600";
			case 3:
				return "text-blue-600";
			default:
				return "text-gray-600";
		}
	};

	const getRarityStars = (rarity: number) => {
		return "★".repeat(rarity);
	};

	const closeModal = () => {
		setShowModal(false);
		setPulledItems([]);
	};

	const pullAgain = () => {
		// Reset all states completely
		setShowModal(false);
		setPulledItems([]);
		setIsPulling(false);
		setModalType("pulling");
	};

	return (
		<>
			<section className="bg-muted/30 py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="mb-12 text-center">
						<h2 className="text-foreground mb-4 text-3xl font-bold">Gacha Banner</h2>
						<p className="text-muted-foreground text-lg">
							Try your luck with our limited-time gacha banner featuring rare and old merch items!
						</p>
						<div className="mt-4">
							<Badge variant="secondary" className="text-sm">
								<Zap className="mr-1 h-3 w-3" />
								Limited Time Event
							</Badge>
						</div>
					</div>

					{/* Gacha Banner Card */}
					<div className="mx-auto max-w-4xl">
						<Card>
							<CardHeader className="text-center">
								<div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
									<Gift className="text-primary h-10 w-10" />
								</div>
								<CardTitle className="text-2xl">
									&ldquo;Legacy Collection&rdquo; Gacha Banner
								</CardTitle>
								<CardDescription className="text-lg">
									Unlock rare ARSA merch from previous collections
								</CardDescription>
							</CardHeader>
							<CardContent className="text-center">
								<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
									{/* Pull Rates */}
									<div className="text-center">
										<div className="bg-primary/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
											<Star className="text-primary h-8 w-8" />
										</div>
										<h4 className="text-foreground mb-1 font-semibold">5★ Legendary</h4>
										<p className="text-muted-foreground text-sm">2% chance</p>
									</div>
									<div className="text-center">
										<div className="bg-primary/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
											<Star className="text-primary h-8 w-8" />
										</div>
										<h4 className="text-foreground mb-1 font-semibold">4★ Epic</h4>
										<p className="text-muted-foreground text-sm">8% chance</p>
									</div>
									<div className="text-center">
										<div className="bg-primary/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
											<Star className="text-primary h-8 w-8" />
										</div>
										<h4 className="text-foreground mb-1 font-semibold">3★ Rare</h4>
										<p className="text-muted-foreground text-sm">90% chance</p>
									</div>
								</div>

								{/* Gacha Pull Buttons */}
								<div className="space-y-4">
									<div className="flex flex-col justify-center gap-4 sm:flex-row">
										<Button
											size="lg"
											onClick={() => performPull(1)}
											disabled={isPulling}
											className="min-w-[160px]"
										>
											<Gift className="mr-2 h-5 w-5" />
											Single Pull (1x)
										</Button>
										<Button
											size="lg"
											variant="outline"
											onClick={() => performPull(10)}
											disabled={isPulling}
											className="min-w-[160px]"
										>
											<Package className="mr-2 h-5 w-5" />
											Multi Pull (10x)
										</Button>
									</div>
									<p className="text-muted-foreground text-sm">
										Each pull costs 1 ARSA Point. Earn points by participating in events!
									</p>
								</div>

								{/* Current Banner Items Preview */}
								<div className="border-border mt-8 border-t pt-6">
									<h4 className="text-foreground mb-4 font-semibold">
										Featured Items in This Banner:
									</h4>
									<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
										<div className="text-center">
											<div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg">
												<Package className="text-primary h-6 w-6" />
											</div>
											<p className="text-muted-foreground text-xs">Limited Hoodie</p>
										</div>
										<div className="text-center">
											<div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg">
												<Package className="text-primary h-6 w-6" />
											</div>
											<p className="text-muted-foreground text-xs">Vintage Shirt</p>
										</div>
										<div className="text-center">
											<div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg">
												<Package className="text-primary h-6 w-6" />
											</div>
											<p className="text-muted-foreground text-xs">Retro Cap</p>
										</div>
										<div className="text-center">
											<div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg">
												<Package className="text-primary h-6 w-6" />
											</div>
											<p className="text-muted-foreground text-xs">Classic Mug</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Gacha Modal */}
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent className="max-h-[90vh] max-w-[90vw] overflow-y-auto sm:max-w-xl md:max-w-3xl lg:max-w-4xl">
					<DialogHeader>
						<DialogTitle className="text-center">
							{modalType === "pulling" ? "🎲 Pulling..." : "🎉 Pull Results!"}
						</DialogTitle>
					</DialogHeader>

					{modalType === "pulling" && (
						<div className="py-12 text-center">
							<div className="bg-primary/10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full">
								<div className="border-primary h-20 w-20 animate-spin rounded-full border-b-4"></div>
							</div>
							<h3 className="text-foreground mb-4 text-2xl font-bold">Summoning ARSA Merch...</h3>
							<p className="text-muted-foreground">The gacha gods are deciding your fate...</p>
							<div className="mt-8 space-y-2">
								<div className="flex justify-center space-x-2">
									<div
										className="bg-primary h-3 w-3 animate-bounce rounded-full"
										style={{ animationDelay: "0ms" }}
									></div>
									<div
										className="bg-primary h-3 w-3 animate-bounce rounded-full"
										style={{ animationDelay: "150ms" }}
									></div>
									<div
										className="bg-primary h-3 w-3 animate-bounce rounded-full"
										style={{ animationDelay: "300ms" }}
									></div>
								</div>
							</div>
						</div>
					)}

					{modalType === "results" && (
						<div className="py-6">
							<div className="mb-8 text-center">
								<h3 className="text-foreground mb-2 text-2xl font-bold">🎊 Congratulations!</h3>
								<p className="text-muted-foreground">
									You pulled {pulledItems.length} item{pulledItems.length > 1 ? "s" : ""}!
								</p>
							</div>

							{/* Mobile-friendly grid layout - single column on mobile for better visibility */}
							<div
								className={`mb-6 grid gap-2 ${
									pulledItems.length === 1
										? "mx-auto max-w-md grid-cols-1"
										: pulledItems.length <= 4
											? "grid-cols-1 sm:grid-cols-2"
											: pulledItems.length <= 6
												? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
												: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
								}`}
							>
								{pulledItems.map((item, index) => (
									<div
										key={`${item.id}-${index}`}
										className={`bg-muted/50 hover:bg-muted/70 rounded-lg border p-3 text-center transition-all duration-500 ${
											index < revealedItems ? "scale-100 opacity-100" : "scale-95 opacity-0"
										}`}
										style={{
											transform: index < revealedItems ? "translateY(0)" : "translateY(20px)",
										}}
									>
										<div className="flex items-center justify-center space-x-2">
											<div className="text-2xl">{item.icon}</div>
											<div className="flex-1 text-left">
												<p className="text-foreground text-sm leading-tight font-medium">
													{item.name}
												</p>
											</div>
											<div className={`text-sm font-semibold ${item.color}`}>
												{getRarityStars(item.rarity)}
											</div>
										</div>
									</div>
								))}
							</div>

							<div className="space-y-4 text-center">
								<div className="flex justify-center">
									<Button onClick={closeModal} variant="outline">
										Close
									</Button>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
