"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
	ShoppingCart,
	Package,
	ShoppingBag,
	Store,
	Plus,
	Minus,
	Loader2,
	Search,
	ArrowUpDown,
	Gift,
	Sparkles,
	Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { addToCart, getCart, updateCartItemQuantity } from "./actions";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import type { Session } from "@/lib/auth";
import { ProductImageCarousel } from "@/components/features/product-image-carousel";
import { PackageSelectionModal } from "@/components/features/package-selection-modal";
import { cn } from "@/lib/utils";

// Import event-specific styles and animations
import "./events/2026/flower-fest-2026/styles.css";
import { InitialPetalsBurst } from "./events/2026/flower-fest-2026/animations";

// Helper component to format product descriptions with lists
function ProductDescription({ description }: { description: string }) {
	const lines = description.split("\n");
	const elements: React.ReactNode[] = [];
	let currentText: string[] = [];
	let currentList: string[] = [];

	const flushText = () => {
		if (currentText.length > 0) {
			elements.push(
				<p key={`text-${elements.length}`} className="text-muted-foreground text-sm">
					{currentText.join("\n")}
				</p>,
			);
			currentText = [];
		}
	};

	const flushList = () => {
		if (currentList.length > 0) {
			elements.push(
				<ul
					key={`list-${elements.length}`}
					className="text-muted-foreground mt-2 space-y-1 text-sm"
				>
					{currentList.map((item, idx) => (
						<li key={idx} className="flex items-start gap-2">
							<span className="text-primary mt-0.5 text-xs">•</span>
							<span>{item}</span>
						</li>
					))}
				</ul>,
			);
			currentList = [];
		}
	};

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		if (trimmedLine.match(/^[-•*]\s+/)) {
			flushText();
			currentList.push(trimmedLine.replace(/^[-•*]\s+/, ""));
		} else if (trimmedLine) {
			flushList();
			currentText.push(trimmedLine);
		}
	});

	flushText();
	flushList();

	return <div className="space-y-1">{elements}</div>;
}

type CropPosition = {
	x: number;
	y: number;
};

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	image: string | null;
	imageUrls: string[];
	imageCropPositions: Record<string, CropPosition> | null;
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	isEventExclusive: boolean;
	availableSizes: string[];
	sizePricing: Record<string, number> | null;
	eventProducts?: Array<{
		id: string;
		eventId: string;
		eventPrice: number | null;
		event: {
			id: string;
			name: string;
			slug: string;
		};
	}>;
};

type PackageItem = {
	id: string;
	productId: string;
	quantity: number;
	product: Product;
};

type PackagePoolOption = {
	id: string;
	productId: string;
	product: Product;
};

type PackagePool = {
	id: string;
	name: string;
	selectCount: number;
	options: PackagePoolOption[];
};

type PackageType = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
	imageCropPositions: Record<string, CropPosition> | null;
	isAvailable: boolean;
	specialNote: string | null;
	items: PackageItem[];
	pools: PackagePool[];
};

type EventCategory = {
	id: string;
	name: string;
	displayOrder: number;
	color: string | null;
};

type EventProduct = {
	id: string;
	productId: string | null;
	packageId: string | null;
	sortOrder: number;
	eventPrice: number | null;
	categoryId: string | null;
	product: Product | null;
	package: PackageType | null;
};

type ThemeConfig = {
	primaryColor?: string;
	secondaryColor?: string;
	animation?: string;
	backgroundPattern?: string;
	tabGlow?: boolean;
	headerText?: string;
};

type ShopEvent = {
	id: string;
	name: string;
	slug: string;
	description: string;
	heroImage: string | null;
	heroImageUrls: string[];
	isActive: boolean;
	isPriority: boolean;
	tabOrder: number;
	tabLabel: string | null;
	startDate: string;
	endDate: string;
	componentPath: string | null;
	themeConfig: ThemeConfig | null;
	products: EventProduct[];
	categories: EventCategory[];
};

type CartItem = {
	id: string;
	productId: string | null;
	packageId: string | null;
	quantity: number;
	size: string | null;
};

type ShopClientProps = {
	initialProducts: Product[];
	initialPackages: PackageType[];
	initialEvents: ShopEvent[];
	session: Session | null;
};

export function ShopClient({
	initialProducts,
	initialPackages,
	initialEvents,
	session,
}: ShopClientProps) {
	const [products] = useState<Product[]>(initialProducts);
	const [packages] = useState<PackageType[]>(initialPackages);
	const [events] = useState<ShopEvent[]>(initialEvents);

	// Determine default tab - priority event or "all"
	const priorityEvent = events.find((e) => e.isPriority);
	const defaultTab = priorityEvent ? `event-${priorityEvent.slug}` : "all";

	const [selectedCategory, setSelectedCategory] = useState<string>(defaultTab);
	const [selectedEventCategory, setSelectedEventCategory] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [sortBy, setSortBy] = useState<
		"default" | "name-asc" | "name-desc" | "price-asc" | "price-desc"
	>("default");
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});
	const [loadingCartItems, setLoadingCartItems] = useState<Record<string, boolean>>({});
	const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
	const [signingIn, setSigningIn] = useState(false);
	const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
	const [showPackageModal, setShowPackageModal] = useState(false);
	// Key for petal animation - changes when switching to flower fest tab to trigger animation
	const [petalAnimationKey, setPetalAnimationKey] = useState(() => Date.now());

	// Track page view for analytics
	useEffect(() => {
		fetch("/api/shop/track", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				path: `/shop?tab=${selectedCategory}`,
				eventId: selectedCategory.startsWith("event-")
					? events.find((e) => `event-${e.slug}` === selectedCategory)?.id
					: null,
			}),
		}).catch(() => {});
	}, [selectedCategory, events]);

	// Check if we're viewing an event tab
	const activeEvent = useMemo(() => {
		if (selectedCategory.startsWith("event-")) {
			const slug = selectedCategory.replace("event-", "");
			return events.find((e) => e.slug === slug) || null;
		}
		return null;
	}, [selectedCategory, events]);

	// Price display helper - handles size-specific pricing and event pricing
	const getProductPriceDisplay = useCallback(
		(product: Product) => {
			// Check if product has size-specific pricing
			if (product.sizePricing && Object.keys(product.sizePricing).length > 0) {
				const prices = Object.values(product.sizePricing);
				const minPrice = Math.min(...prices);
				const maxPrice = Math.max(...prices);

				if (minPrice === maxPrice) {
					return `₱${minPrice.toFixed(2)}`;
				}
				return `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
			}

			// Check if product has event-specific pricing
			if (activeEvent && product.eventProducts) {
				const eventProduct = product.eventProducts.find((ep) => ep.eventId === activeEvent.id);
				if (eventProduct?.eventPrice) {
					return `₱${eventProduct.eventPrice.toFixed(2)}`;
				}
			}

			return `₱${product.price.toFixed(2)}`;
		},
		[activeEvent],
	);

	// Memoize filtered, searched, and sorted products
	const filteredProducts = useMemo(() => {
		let filtered: Product[] = [];

		// If viewing an event, show event products
		if (activeEvent) {
			// Get event products with their category info
			const eventProductsWithCategory = activeEvent.products
				.filter((ep) => ep.product)
				.map((ep) => ({
					product: ep.product!,
					categoryId: ep.categoryId,
					sortOrder: ep.sortOrder,
					// Get event price for sorting
					eventPrice: ep.eventPrice,
				}));

			// Filter by selected event category
			let filteredEventProducts = eventProductsWithCategory;
			if (selectedEventCategory !== "all") {
				filteredEventProducts = eventProductsWithCategory.filter(
					(ep) => ep.categoryId === selectedEventCategory,
				);
			}

			// Apply sorting based on user selection
			if (sortBy === "default") {
				// Default: categorized products first (by category displayOrder), then uncategorized
				filteredEventProducts = filteredEventProducts.sort((a, b) => {
					const aCatOrder = a.categoryId
						? (activeEvent.categories.find((c) => c.id === a.categoryId)?.displayOrder ?? 999)
						: 1000;
					const bCatOrder = b.categoryId
						? (activeEvent.categories.find((c) => c.id === b.categoryId)?.displayOrder ?? 999)
						: 1000;

					if (aCatOrder !== bCatOrder) return aCatOrder - bCatOrder;
					return a.sortOrder - b.sortOrder;
				});
			} else {
				// User-selected sorting (price or name)
				filteredEventProducts = [...filteredEventProducts].sort((a, b) => {
					// Use event price if available, otherwise base price
					const aPrice = a.eventPrice ?? a.product.price;
					const bPrice = b.eventPrice ?? b.product.price;

					switch (sortBy) {
						case "name-asc":
							return a.product.name.localeCompare(b.product.name);
						case "name-desc":
							return b.product.name.localeCompare(a.product.name);
						case "price-asc":
							return aPrice - bPrice;
						case "price-desc":
							return bPrice - aPrice;
						default:
							return 0;
					}
				});
			}

			filtered = filteredEventProducts.map((ep) => ep.product);
		} else {
			// Regular category tabs (All, Arsari-Sari, Other)
			// Filter out event-exclusive products
			filtered = products.filter((p) => !p.isEventExclusive);

			// Apply category filter
			if (selectedCategory !== "all") {
				filtered = filtered.filter((p) => p.category === selectedCategory);
			}
		}

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
			);
		}

		// Apply sorting for non-event tabs (or when user has selected a sort for events, handled above)
		if (!activeEvent) {
			filtered = [...filtered].sort((a, b) => {
				switch (sortBy) {
					case "name-asc":
						return a.name.localeCompare(b.name);
					case "name-desc":
						return b.name.localeCompare(a.name);
					case "price-asc":
						return a.price - b.price;
					case "price-desc":
						return b.price - a.price;
					case "default":
					default:
						return 0; // Keep original order
				}
			});
		}

		return filtered;
	}, [selectedCategory, selectedEventCategory, products, searchQuery, sortBy, activeEvent]);

	// Filtered packages - show in events or in "all" tab
	const filteredPackages = useMemo(() => {
		if (activeEvent) {
			let eventPackages = activeEvent.products.filter((ep) => ep.package);

			// Filter by selected event category
			if (selectedEventCategory !== "all") {
				eventPackages = eventPackages.filter((ep) => ep.categoryId === selectedEventCategory);
			}

			// Apply sorting based on user selection
			if (sortBy === "default") {
				// Default: Sort by category displayOrder, then sortOrder
				eventPackages = eventPackages.sort((a, b) => {
					const aCatOrder = a.categoryId
						? (activeEvent.categories.find((c) => c.id === a.categoryId)?.displayOrder ?? 999)
						: 1000;
					const bCatOrder = b.categoryId
						? (activeEvent.categories.find((c) => c.id === b.categoryId)?.displayOrder ?? 999)
						: 1000;

					if (aCatOrder !== bCatOrder) return aCatOrder - bCatOrder;
					return a.sortOrder - b.sortOrder;
				});
			} else {
				// User-selected sorting
				eventPackages = [...eventPackages].sort((a, b) => {
					const aPrice = a.eventPrice ?? a.package!.price;
					const bPrice = b.eventPrice ?? b.package!.price;

					switch (sortBy) {
						case "name-asc":
							return a.package!.name.localeCompare(b.package!.name);
						case "name-desc":
							return b.package!.name.localeCompare(a.package!.name);
						case "price-asc":
							return aPrice - bPrice;
						case "price-desc":
							return bPrice - aPrice;
						default:
							return 0;
					}
				});
			}

			return eventPackages.map((ep) => ep.package!).filter(Boolean);
		}

		// Show all packages in the "all" category tab
		if (selectedCategory === "all") {
			let filtered = [...packages];

			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				filtered = filtered.filter(
					(p) =>
						p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
				);
			}

			// Apply sorting for non-event packages
			filtered.sort((a, b) => {
				switch (sortBy) {
					case "name-asc":
						return a.name.localeCompare(b.name);
					case "name-desc":
						return b.name.localeCompare(a.name);
					case "price-asc":
						return a.price - b.price;
					case "price-desc":
						return b.price - a.price;
					case "default":
					default:
						return 0;
				}
			});

			return filtered;
		}

		return [];
	}, [selectedCategory, selectedEventCategory, packages, searchQuery, activeEvent, sortBy]);

	// Show packages section when we have packages to show
	const showPackagesSection = filteredPackages.length > 0;

	// Memoize fetchCartItems
	const fetchCartItems = useCallback(async () => {
		const result = await getCart();
		if (result.success && result.cart) {
			setCartItems(
				result.cart.map((item) => ({
					id: item.id,
					productId: item.productId,
					packageId: item.packageId,
					quantity: item.quantity,
					size: item.size,
				})),
			);
		}
	}, []);

	// Fetch cart items on mount
	useEffect(() => {
		if (session?.user) {
			fetchCartItems();
		}
	}, [session, fetchCartItems]);

	// Listen for cart updates
	useEffect(() => {
		const handleCartUpdate = () => {
			fetchCartItems();
		};
		window.addEventListener("cartUpdated", handleCartUpdate);
		return () => window.removeEventListener("cartUpdated", handleCartUpdate);
	}, [fetchCartItems]);

	const getCartItem = useCallback(
		(productId: string, size?: string | null) => {
			return cartItems.find(
				(item) => item.productId === productId && (size === undefined || item.size === size),
			);
		},
		[cartItems],
	);

	const handleSignIn = useCallback(async () => {
		setSigningIn(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/shop",
			});
		} catch (error) {
			setSigningIn(false);
		}
	}, []);

	const handleAddToCart = useCallback(
		async (productId: string, size?: string) => {
			if (!session?.user) {
				toast.error("Please sign in to add items to cart", {
					action: {
						label: "Sign In",
						onClick: handleSignIn,
					},
				});
				return;
			}

			setLoadingProducts((prev) => ({ ...prev, [productId]: true }));
			try {
				const result = await addToCart(productId, 1, size);
				if (result.success) {
					await fetchCartItems();
					toast.success(result.message);
					window.dispatchEvent(new Event("cartUpdated"));
				} else {
					toast.error(result.message);
				}
			} finally {
				setLoadingProducts((prev) => ({ ...prev, [productId]: false }));
			}
		},
		[session?.user, handleSignIn, fetchCartItems],
	);

	const handleUpdateQuantity = useCallback(
		async (cartItemId: string, newQuantity: number) => {
			setLoadingCartItems((prev) => ({ ...prev, [cartItemId]: true }));
			try {
				const result = await updateCartItemQuantity(cartItemId, newQuantity);
				if (result.success) {
					await fetchCartItems();
					window.dispatchEvent(new Event("cartUpdated"));
				} else {
					toast.error(result.message || "Failed to update quantity");
				}
			} finally {
				setLoadingCartItems((prev) => ({ ...prev, [cartItemId]: false }));
			}
		},
		[fetchCartItems],
	);

	const handleOpenPackageModal = (pkg: PackageType) => {
		if (!session?.user) {
			toast.error("Please sign in to add items to cart", {
				action: {
					label: "Sign In",
					onClick: handleSignIn,
				},
			});
			return;
		}
		setSelectedPackage(pkg);
		setShowPackageModal(true);
	};

	const getCategoryIcon = useCallback((category: string) => {
		switch (category) {
			case "merch":
				return <ShoppingBag className="h-4 w-4" />;
			case "arsari-sari":
				return <Store className="h-4 w-4" />;
			case "other":
				return <Package className="h-4 w-4" />;
			default:
				return <ShoppingCart className="h-4 w-4" />;
		}
	}, []);

	// Calculate original price for a package
	const calculateOriginalPrice = (pkg: PackageType) => {
		let total = 0;
		for (const item of pkg.items) {
			total += item.product.price * item.quantity;
		}
		return total;
	};

	// Get event theme styles
	const getEventStyles = (event: ShopEvent | null) => {
		if (!event?.themeConfig) return {};
		const theme = event.themeConfig;
		return {
			"--event-primary": theme.primaryColor || "#ec4899",
			"--event-secondary": theme.secondaryColor || "#f472b6",
		} as React.CSSProperties;
	};

	// Get background class based on event theme
	const getEventBackgroundClass = (event: ShopEvent | null) => {
		if (!event?.themeConfig?.backgroundPattern) return "";
		// Support for different background patterns
		switch (event.themeConfig.backgroundPattern) {
			case "burgundy-grain":
			case "flower-fest":
				return "flower-fest-container";
			default:
				return "";
		}
	};

	// Build unified tabs list - Events first (emphasized), then category tabs
	const tabs = useMemo(() => {
		// Event tabs - sorted by priority first, then by tabOrder
		const eventTabs = events
			.sort((a, b) => {
				if (a.isPriority && !b.isPriority) return -1;
				if (!a.isPriority && b.isPriority) return 1;
				return a.tabOrder - b.tabOrder;
			})
			.map((event) => ({
				value: `event-${event.slug}`,
				label: event.tabLabel || event.name,
				isEvent: true,
				isPriority: event.isPriority,
				themeConfig: event.themeConfig,
			}));

		// Category tabs
		const categoryTabs = [
			{ value: "all", label: "All", isEvent: false, isPriority: false, themeConfig: null },
			{
				value: "arsari-sari",
				label: "Arsari-Sari",
				isEvent: false,
				isPriority: false,
				themeConfig: null,
			},
			{ value: "other", label: "Other", isEvent: false, isPriority: false, themeConfig: null },
		];

		// Events come first, then categories
		return [...eventTabs, ...categoryTabs];
	}, [events]);

	const eventBackgroundClass = getEventBackgroundClass(activeEvent);

	// Reset petal animation key when switching to flower fest tab (or on reload)
	useEffect(() => {
		if (eventBackgroundClass) {
			setPetalAnimationKey(Date.now());
		}
	}, [eventBackgroundClass]);

	// Trigger animation on initial mount if priority event has animation
	useEffect(() => {
		// Only run once on mount
		if (priorityEvent && priorityEvent.themeConfig?.animation) {
			setPetalAnimationKey(Date.now());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty deps - only run on mount

	// Check if we should show petal animation (either from active event or priority event on mount)
	const shouldShowPetals =
		activeEvent?.themeConfig?.animation === "petals" ||
		(!activeEvent && priorityEvent?.themeConfig?.animation === "petals");

	return (
		<div className={cn(eventBackgroundClass)} style={getEventStyles(activeEvent)}>
			{/* Initial Petals Animation - plays on load/tab switch for Flower Fest */}
			{shouldShowPetals && <InitialPetalsBurst key={petalAnimationKey} isActive={true} />}

			{/* Event Header */}
			{activeEvent && activeEvent.themeConfig?.headerText && (
				<div
					className="mb-6 rounded-lg p-4 text-center text-white"
					style={{
						background: `linear-gradient(135deg, ${activeEvent.themeConfig.primaryColor || "#ec4899"}, ${activeEvent.themeConfig.secondaryColor || "#f472b6"})`,
					}}
				>
					<h2 className="text-2xl font-bold">{activeEvent.themeConfig.headerText}</h2>
					{activeEvent.description && <p className="mt-1 opacity-90">{activeEvent.description}</p>}
				</div>
			)}

			{/* Shop Navigation */}
			<div className="mb-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Tabs
						value={selectedCategory}
						onValueChange={(value) => {
							setSelectedCategory(value);
							setSelectedEventCategory("all"); // Reset event category when switching tabs
						}}
						className="w-full sm:w-auto"
					>
						<TabsList className="flex h-auto flex-wrap">
							{tabs.map((tab) => {
								const isEvent = tab.isEvent;
								const themeColor = tab.themeConfig?.primaryColor || null;
								return (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className={cn(
											"flex items-center gap-1",
											isEvent && "font-semibold",
											tab.isPriority && "ring-1 ring-yellow-400/50",
										)}
										style={
											isEvent && themeColor
												? ({
														"--tab-color": themeColor,
													} as React.CSSProperties)
												: undefined
										}
									>
										{isEvent && (
											<Sparkles
												className={cn("h-3 w-3", tab.themeConfig?.tabGlow && "animate-pulse")}
												style={themeColor ? { color: themeColor } : undefined}
											/>
										)}
										<span className="text-xs sm:text-sm">{tab.label}</span>
										{tab.isPriority && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
									</TabsTrigger>
								);
							})}
						</TabsList>
					</Tabs>

					{session?.user && (
						<Link href="/shop/cart" className="hidden w-full md:block md:w-auto">
							<Button variant="outline" className="w-full sm:ml-4 sm:w-auto">
								<ShoppingCart className="mr-2 h-4 w-4" />
								Cart
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* Search and Sort Controls */}
			<div className="mb-6 flex flex-row items-center gap-3">
				<div className="relative w-2/3 sm:flex-1">
					<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						type="search"
						placeholder="Search products..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				<Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
					<SelectTrigger className="w-1/3 sm:w-[200px]">
						<ArrowUpDown className="mr-2 h-4 w-4" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="default">Default</SelectItem>
						<SelectItem value="name-asc">Name (A-Z)</SelectItem>
						<SelectItem value="name-desc">Name (Z-A)</SelectItem>
						<SelectItem value="price-asc">Price (Low-High)</SelectItem>
						<SelectItem value="price-desc">Price (High-Low)</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{!session?.user && (
				<Card className="border-primary mb-6">
					<CardContent className="px-6 py-8">
						<div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
							<div className="flex-1 space-y-2">
								<h3 className="text-lg font-semibold">Sign in to shop</h3>
								<p className="text-muted-foreground text-sm leading-relaxed">
									Sign in with Google to shop. If you have trouble, try refreshing or using a
									different browser/device. Still need help? Contact the{" "}
									<a
										className="text-[#165B95] underline"
										target="_blank"
										href="https://www.facebook.com/ARSAFlowerFest"
									>
										Flower Fest Help Desk
									</a>{" "}
									or email{" "}
									<a
										className="text-[#165B95] underline"
										target="_blank"
										href="mailto:arsa.resgen@gmail.com?subject='ARSA Shop Sign-in Issue'"
									>
										arsa.resgen@gmail.com
									</a>
								</p>
							</div>
							<Button
								onClick={handleSignIn}
								className="w-full shrink-0 sm:w-auto"
								disabled={signingIn}
								size="lg"
							>
								{signingIn ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing In...
									</>
								) : (
									"Sign In with Google"
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Event Category Tabs */}
			{activeEvent && activeEvent.categories && activeEvent.categories.length > 0 && (
				<div className="mb-6">
					<div className="flex flex-wrap gap-2">
						<Button
							variant={selectedEventCategory === "all" ? "default" : "outline"}
							size="sm"
							onClick={() => setSelectedEventCategory("all")}
						>
							All
						</Button>
						{activeEvent.categories.map((category) => (
							<Button
								key={category.id}
								variant={selectedEventCategory === category.id ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedEventCategory(category.id)}
								style={
									category.color && selectedEventCategory === category.id
										? { backgroundColor: category.color, borderColor: category.color }
										: category.color
											? { borderColor: category.color, color: category.color }
											: undefined
								}
								className={cn(
									selectedEventCategory === category.id && category.color && "text-white",
								)}
							>
								{category.color && selectedEventCategory !== category.id && (
									<span
										className="mr-2 h-2 w-2 rounded-full"
										style={{ backgroundColor: category.color }}
									/>
								)}
								{category.name}
							</Button>
						))}
					</div>
				</div>
			)}

			{/* Packages Section */}
			{showPackagesSection && (
				<>
					{selectedCategory === "all" && (
						<h2
							className={cn(
								"mb-4 flex items-center gap-2 text-xl font-bold",
								eventBackgroundClass && "flower-fest-section-title",
							)}
						>
							<Gift className="h-5 w-5" />
							Packages
						</h2>
					)}
					{activeEvent && filteredPackages.length > 0 && (
						<h2
							className={cn(
								"mb-4 flex items-center gap-2 text-xl font-bold",
								eventBackgroundClass && "flower-fest-section-title",
							)}
						>
							<Gift className="h-5 w-5" />
							{activeEvent.name} Packages
						</h2>
					)}
					<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredPackages.map((pkg) => {
							const originalPrice = calculateOriginalPrice(pkg);
							const savings = originalPrice - pkg.price;

							return (
								<Card
									key={pkg.id}
									className={cn(
										"flex flex-col overflow-hidden",
										eventBackgroundClass ? "flower-fest-card" : "border-primary/30 border-2",
									)}
								>
									<CardHeader className="pb-3">
										<div className="relative">
											<ProductImageCarousel
												images={
													pkg.imageUrls.length > 0 ? pkg.imageUrls : pkg.image ? [pkg.image] : []
												}
												productName={pkg.name}
												aspectRatio="square"
												showThumbnails={false}
												className="mb-4"
												imageCropPositions={pkg.imageCropPositions}
											/>
											<Badge className="bg-primary absolute top-2 left-2">
												<Gift className="mr-1 h-3 w-3" />
												Package
											</Badge>
											{savings > 0 && (
												<Badge className="absolute top-2 right-2 bg-green-500">
													Save ₱{savings.toFixed(2)}
												</Badge>
											)}
										</div>
										<CardTitle className="text-lg">{pkg.name}</CardTitle>
										<ProductDescription description={pkg.description} />
									</CardHeader>
									<CardContent className="flex-1 space-y-3">
										{/* Package Contents */}
										<div className="bg-muted/50 rounded-lg p-3">
											<p className="mb-2 text-sm font-medium">Includes:</p>
											<ul className="space-y-1 text-sm">
												{pkg.items.map((item) => (
													<li key={item.id} className="text-muted-foreground">
														• {item.quantity}x {item.product.name}
													</li>
												))}
												{pkg.pools.map((pool) => (
													<li key={pool.id} className="text-primary">
														• Choose {pool.selectCount} from {pool.name}
													</li>
												))}
											</ul>
										</div>

										<div className="flex items-center justify-between">
											<div>
												<span className="text-2xl font-bold">₱{pkg.price.toFixed(2)}</span>
												{originalPrice > pkg.price && (
													<span className="text-muted-foreground ml-2 text-sm line-through">
														₱{originalPrice.toFixed(2)}
													</span>
												)}
											</div>
										</div>
									</CardContent>
									<CardFooter>
										<Button
											className="w-full"
											onClick={() => handleOpenPackageModal(pkg)}
											disabled={!pkg.isAvailable}
										>
											<Gift className="mr-2 h-4 w-4" />
											{pkg.isAvailable ? "Select Options" : "Unavailable"}
										</Button>
									</CardFooter>
								</Card>
							);
						})}
					</div>

					{selectedCategory === "all" && filteredProducts.length > 0 && (
						<h2
							className={cn(
								"mb-4 text-xl font-bold",
								eventBackgroundClass && "flower-fest-section-title",
							)}
						>
							Products
						</h2>
					)}
					{activeEvent && filteredProducts.length > 0 && !showPackagesSection && (
						<h2
							className={cn(
								"mb-4 text-xl font-bold",
								eventBackgroundClass && "flower-fest-section-title",
							)}
						>
							{activeEvent.name} Products
						</h2>
					)}
					{activeEvent && filteredProducts.length > 0 && showPackagesSection && (
						<h2
							className={cn(
								"mb-4 text-xl font-bold",
								eventBackgroundClass && "flower-fest-section-title",
							)}
						>
							Products
						</h2>
					)}
				</>
			)}

			{/* Products Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{filteredProducts.length === 0 && filteredPackages.length === 0 ? (
					<div className="col-span-full py-12 text-center">
						<Package className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
						<h3 className="mb-2 text-lg font-semibold">No products found</h3>
						<p className="text-muted-foreground">Check back later for new items!</p>
					</div>
				) : (
					filteredProducts.map((product) => {
						const selectedSize = selectedSizes[product.id];
						const cartItem = getCartItem(product.id, selectedSize);
						const isProductLoading = loadingProducts[product.id] ?? false;
						const isCartItemLoading = cartItem ? (loadingCartItems[cartItem.id] ?? false) : false;
						const requiresSize = product.availableSizes.length > 0;

						return (
							<Card
								key={product.id}
								className={cn(
									"flex min-w-0 flex-col overflow-hidden",
									eventBackgroundClass && "flower-fest-card",
								)}
							>
								<CardHeader className="min-w-0 overflow-hidden pb-3">
									<div className="mb-4 w-full max-w-full min-w-0 overflow-hidden">
										<ProductImageCarousel
											images={
												product.imageUrls.length > 0
													? product.imageUrls
													: product.image
														? [product.image]
														: []
											}
											productName={product.name}
											aspectRatio="square"
											showThumbnails={true}
											imageCropPositions={product.imageCropPositions}
										/>
									</div>
									<div className="flex items-start justify-between">
										<CardTitle className="text-lg">{product.name}</CardTitle>
										<div className="ml-2 flex gap-1">
											{product.isPreOrder && (
												<Badge variant="outline" className="text-xs">
													Pre-Order
												</Badge>
											)}
											<Badge variant="secondary">{getCategoryIcon(product.category)}</Badge>
										</div>
									</div>
									<ProductDescription description={product.description} />
								</CardHeader>
								<CardContent className="flex-1 space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-2xl font-bold">{getProductPriceDisplay(product)}</span>
									</div>

									{/* Size Selection */}
									{requiresSize && (
										<div>
											<Label htmlFor={`size-${product.id}`} className="text-xs">
												Select Size
											</Label>
											<Select
												value={selectedSize}
												onValueChange={(value) =>
													setSelectedSizes((prev) => ({ ...prev, [product.id]: value }))
												}
											>
												<SelectTrigger id={`size-${product.id}`} className="mt-1">
													<SelectValue placeholder="Choose size" />
												</SelectTrigger>
												<SelectContent>
													{product.availableSizes.map((size) => (
														<SelectItem key={size} value={size}>
															{size}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
								</CardContent>
								<CardFooter>
									{cartItem ? (
										<div className="flex w-full items-center justify-between gap-2">
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
												disabled={isCartItemLoading}
											>
												<Minus className="h-4 w-4" />
											</Button>
											{isCartItemLoading ? (
												<Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
											) : (
												<span className="text-lg font-semibold">{cartItem.quantity}</span>
											)}
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
												disabled={
													(!product.isPreOrder &&
														product.stock !== null &&
														cartItem.quantity >= product.stock) ||
													isCartItemLoading
												}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
									) : (
										<Button
											className="w-full"
											onClick={() => handleAddToCart(product.id, selectedSize)}
											disabled={
												(!product.isPreOrder && product.stock !== null && product.stock === 0) ||
												!product.isAvailable ||
												isProductLoading ||
												(requiresSize && !selectedSize)
											}
										>
											{isProductLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<ShoppingCart className="mr-2 h-4 w-4" />
											)}
											{isProductLoading
												? "Adding..."
												: !product.isPreOrder && product.stock !== null && product.stock === 0
													? "Out of Stock"
													: requiresSize && !selectedSize
														? "Select Size"
														: product.isPreOrder
															? "Pre-Order Now"
															: "Add to Cart"}
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})
				)}
			</div>

			{/* Package Selection Modal */}
			{selectedPackage && (
				<PackageSelectionModal
					package={selectedPackage}
					open={showPackageModal}
					onClose={() => {
						setShowPackageModal(false);
						setSelectedPackage(null);
					}}
					onSuccess={() => {
						fetchCartItems();
						window.dispatchEvent(new Event("cartUpdated"));
					}}
				/>
			)}
		</div>
	);
}
