"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	createEvent,
	updateEvent,
	deleteEvent,
	searchUsers,
	addEventAdmin,
	removeEventAdmin,
	type EventFormData,
	type CheckoutField,
	type CheckoutConfig,
	type ThemeConfig,
} from "./actions";
import { toast } from "sonner";
import {
	CalendarHeart,
	Plus,
	Edit2,
	Trash2,
	X,
	ChevronDown,
	ChevronUp,
	Calendar,
	Clock,
	Star,
	ShoppingBag,
	Package,
	Sparkles,
	Users,
	UserPlus,
	Search,
	Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
};

type PackageType = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
};

type EventProduct = {
	id: string;
	productId: string | null;
	packageId: string | null;
	sortOrder: number;
	eventPrice: number | null;
	product: Product | null;
	package: PackageType | null;
};

type EventAdminUser = {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
};

type EventAdmin = {
	id: string;
	user: EventAdminUser;
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
	startDate: Date;
	endDate: Date;
	componentPath: string | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	themeConfig: ThemeConfig | any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	checkoutConfig: CheckoutConfig | any;
	products: EventProduct[];
	admins: EventAdmin[];
	_count: {
		orders: number;
	};
};

type EventsManagementProps = {
	initialEvents: ShopEvent[];
	availableProducts: Product[];
	availablePackages: PackageType[];
	isShopAdmin?: boolean;
};

type FormEventProduct = {
	productId?: string;
	packageId?: string;
	sortOrder: number;
	eventPrice?: number;
};

type FormCheckoutField = {
	id: string;
	label: string;
	type: "text" | "textarea" | "select" | "checkbox" | "date";
	required: boolean;
	placeholder: string;
	options: string[];
	maxLength?: number;
};

type FormData = {
	name: string;
	slug: string;
	description: string;
	heroImage: string;
	heroImageUrls: string[];
	isActive: boolean;
	isPriority: boolean;
	tabOrder: number;
	tabLabel: string;
	startDate: string;
	endDate: string;
	componentPath: string;
	themeConfig: ThemeConfig;
	checkoutFields: FormCheckoutField[];
	checkoutHeaderMessage: string;
	checkoutTermsMessage: string;
	checkoutConfirmationMessage: string;
	eventProducts: FormEventProduct[];
};

const defaultThemeConfig: ThemeConfig = {
	primaryColor: "#ec4899",
	secondaryColor: "#f472b6",
	animation: "none",
	backgroundPattern: "",
	tabGlow: false,
	headerText: "",
};

const animationOptions = [
	{ value: "none", label: "None" },
	{ value: "confetti", label: "Confetti" },
	{ value: "hearts", label: "Hearts" },
	{ value: "snow", label: "Snow" },
	{ value: "sparkles", label: "Sparkles" },
	{ value: "petals", label: "Flower Petals" },
];

export function EventsManagement({
	initialEvents,
	availableProducts,
	availablePackages,
	isShopAdmin = false,
}: EventsManagementProps) {
	const [events, setEvents] = useState<ShopEvent[]>(initialEvents);
	const [showDialog, setShowDialog] = useState(false);
	const [editingEvent, setEditingEvent] = useState<ShopEvent | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("basic");

	// Admin management state
	const [showAdminDialog, setShowAdminDialog] = useState(false);
	const [adminEventId, setAdminEventId] = useState<string | null>(null);
	const [userSearchQuery, setUserSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<EventAdminUser[]>([]);
	const [searchingUsers, setSearchingUsers] = useState(false);
	const [addingAdmin, setAddingAdmin] = useState(false);

	const [formData, setFormData] = useState<FormData>({
		name: "",
		slug: "",
		description: "",
		heroImage: "",
		heroImageUrls: [],
		isActive: true,
		isPriority: false,
		tabOrder: 0,
		tabLabel: "",
		startDate: "",
		endDate: "",
		componentPath: "",
		themeConfig: { ...defaultThemeConfig },
		checkoutFields: [],
		checkoutHeaderMessage: "",
		checkoutTermsMessage: "",
		checkoutConfirmationMessage: "",
		eventProducts: [],
	});

	const resetForm = () => {
		setFormData({
			name: "",
			slug: "",
			description: "",
			heroImage: "",
			heroImageUrls: [],
			isActive: true,
			isPriority: false,
			tabOrder: 0,
			tabLabel: "",
			startDate: "",
			endDate: "",
			componentPath: "",
			themeConfig: { ...defaultThemeConfig },
			checkoutFields: [],
			checkoutHeaderMessage: "",
			checkoutTermsMessage: "",
			checkoutConfirmationMessage: "",
			eventProducts: [],
		});
		setEditingEvent(null);
		setActiveTab("basic");
	};

	const handleOpenDialog = (event?: ShopEvent) => {
		if (event) {
			setEditingEvent(event);
			const checkoutConfig = event.checkoutConfig as CheckoutConfig | null;
			setFormData({
				name: event.name,
				slug: event.slug,
				description: event.description,
				heroImage: event.heroImage || "",
				heroImageUrls: event.heroImageUrls || [],
				isActive: event.isActive,
				isPriority: event.isPriority,
				tabOrder: event.tabOrder,
				tabLabel: event.tabLabel || "",
				startDate: new Date(event.startDate).toISOString().slice(0, 16),
				endDate: new Date(event.endDate).toISOString().slice(0, 16),
				componentPath: event.componentPath || "",
				themeConfig: (event.themeConfig as ThemeConfig) || { ...defaultThemeConfig },
				checkoutFields:
					checkoutConfig?.additionalFields?.map((f) => ({
						...f,
						placeholder: f.placeholder || "",
						options: f.options || [],
					})) || [],
				checkoutHeaderMessage: checkoutConfig?.headerMessage || "",
				checkoutTermsMessage: checkoutConfig?.termsMessage || "",
				checkoutConfirmationMessage: checkoutConfig?.confirmationMessage || "",
				eventProducts: event.products.map((p) => ({
					productId: p.productId || undefined,
					packageId: p.packageId || undefined,
					sortOrder: p.sortOrder,
					eventPrice: p.eventPrice || undefined,
				})),
			});
		} else {
			resetForm();
		}
		setShowDialog(true);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
		resetForm();
	};

	const generateSlug = (name: string) => {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
	};

	const handleNameChange = (name: string) => {
		setFormData((prev) => ({
			...prev,
			name,
			slug: !editingEvent ? generateSlug(name) : prev.slug,
		}));
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
		if (validFiles.length === 0) {
			toast.error("Please upload image files only");
			return;
		}

		setUploading(true);
		try {
			const uploadPromises = validFiles.map(async (file) => {
				const formDataUpload = new FormData();
				formDataUpload.append("file", file);
				formDataUpload.append("type", "event");

				const response = await fetch("/api/upload", {
					method: "POST",
					body: formDataUpload,
				});

				if (!response.ok) {
					throw new Error(`Upload failed for ${file.name}`);
				}

				const { url } = await response.json();
				return url;
			});

			const urls = await Promise.all(uploadPromises);

			setFormData((prev) => ({
				...prev,
				heroImageUrls: [...prev.heroImageUrls, ...urls],
				heroImage: prev.heroImage || urls[0],
			}));

			toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
		} catch (error) {
			toast.error("Failed to upload images");
		} finally {
			setUploading(false);
			e.target.value = "";
		}
	};

	const handleRemoveImage = (index: number) => {
		setFormData((prev) => ({
			...prev,
			heroImageUrls: prev.heroImageUrls.filter((_, i) => i !== index),
		}));
	};

	// Checkout Fields Management
	const addCheckoutField = () => {
		setFormData((prev) => ({
			...prev,
			checkoutFields: [
				...prev.checkoutFields,
				{
					id: `field-${Date.now()}`,
					label: "",
					type: "text",
					required: false,
					placeholder: "",
					options: [],
				},
			],
		}));
	};

	const updateCheckoutField = (index: number, field: Partial<FormCheckoutField>) => {
		setFormData((prev) => ({
			...prev,
			checkoutFields: prev.checkoutFields.map((f, i) => (i === index ? { ...f, ...field } : f)),
		}));
	};

	const removeCheckoutField = (index: number) => {
		setFormData((prev) => ({
			...prev,
			checkoutFields: prev.checkoutFields.filter((_, i) => i !== index),
		}));
	};

	// Event Products Management
	const addEventProduct = (type: "product" | "package") => {
		setFormData((prev) => ({
			...prev,
			eventProducts: [
				...prev.eventProducts,
				{
					productId: type === "product" ? "" : undefined,
					packageId: type === "package" ? "" : undefined,
					sortOrder: prev.eventProducts.length,
				},
			],
		}));
	};

	const updateEventProduct = (
		index: number,
		field: keyof FormEventProduct,
		value: string | number | undefined,
	) => {
		setFormData((prev) => ({
			...prev,
			eventProducts: prev.eventProducts.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
		}));
	};

	const removeEventProduct = (index: number) => {
		setFormData((prev) => ({
			...prev,
			eventProducts: prev.eventProducts.filter((_, i) => i !== index),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Validate required fields
			if (!formData.name || !formData.slug || !formData.startDate || !formData.endDate) {
				toast.error("Please fill in all required fields");
				setLoading(false);
				return;
			}

			// Build checkout config
			const checkoutConfig: CheckoutConfig | null =
				formData.checkoutFields.length > 0 ||
				formData.checkoutHeaderMessage ||
				formData.checkoutTermsMessage
					? {
							headerMessage: formData.checkoutHeaderMessage || undefined,
							additionalFields: formData.checkoutFields.map((f) => ({
								id: f.id,
								label: f.label,
								type: f.type,
								required: f.required,
								placeholder: f.placeholder || undefined,
								options: f.type === "select" ? f.options : undefined,
								maxLength: f.maxLength,
							})),
							termsMessage: formData.checkoutTermsMessage || undefined,
							confirmationMessage: formData.checkoutConfirmationMessage || undefined,
						}
					: null;

			const eventData: EventFormData = {
				name: formData.name,
				slug: formData.slug,
				description: formData.description,
				heroImage: formData.heroImage,
				heroImageUrls: formData.heroImageUrls,
				isActive: formData.isActive,
				isPriority: formData.isPriority,
				tabOrder: formData.tabOrder,
				tabLabel: formData.tabLabel,
				startDate: formData.startDate,
				endDate: formData.endDate,
				componentPath: formData.componentPath,
				themeConfig: formData.themeConfig,
				checkoutConfig,
				products: formData.eventProducts.filter((p) => p.productId || p.packageId),
			};

			const result = editingEvent
				? await updateEvent(editingEvent.id, eventData)
				: await createEvent(eventData);

			if (result.success) {
				toast.success(editingEvent ? "Event updated" : "Event created");
				handleCloseDialog();
				window.location.reload();
			} else {
				toast.error(result.message || "Failed to save event");
			}
		} catch (error) {
			toast.error("An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!eventToDelete) return;

		const result = await deleteEvent(eventToDelete);
		if (result.success) {
			setEvents(events.filter((e) => e.id !== eventToDelete));
			toast.success("Event deleted");
			setShowDeleteDialog(false);
			setEventToDelete(null);
		} else {
			toast.error(result.message || "Failed to delete event");
		}
	};

	// Admin management functions
	const handleOpenAdminDialog = (eventId: string) => {
		setAdminEventId(eventId);
		setShowAdminDialog(true);
		setUserSearchQuery("");
		setSearchResults([]);
	};

	const handleSearchUsers = async () => {
		if (!userSearchQuery.trim()) return;

		setSearchingUsers(true);
		const result = await searchUsers(userSearchQuery.trim());
		setSearchingUsers(false);

		if (result.success && result.users) {
			setSearchResults(result.users);
		} else {
			toast.error(result.message || "Failed to search users");
		}
	};

	const handleAddAdmin = async (userId: string) => {
		if (!adminEventId) return;

		setAddingAdmin(true);
		const result = await addEventAdmin(adminEventId, userId);
		setAddingAdmin(false);

		if (result.success) {
			// Update local state
			const user = searchResults.find((u) => u.id === userId);
			if (user) {
				setEvents(
					events.map((e) =>
						e.id === adminEventId
							? { ...e, admins: [...e.admins, { id: `temp-${userId}`, user }] }
							: e,
					),
				);
			}
			toast.success("Admin added successfully");
			setSearchResults(searchResults.filter((u) => u.id !== userId));
		} else {
			toast.error(result.message || "Failed to add admin");
		}
	};

	const handleRemoveAdmin = async (userId: string) => {
		if (!adminEventId) return;

		const result = await removeEventAdmin(adminEventId, userId);

		if (result.success) {
			setEvents(
				events.map((e) =>
					e.id === adminEventId
						? { ...e, admins: e.admins.filter((a) => a.user.id !== userId) }
						: e,
				),
			);
			toast.success("Admin removed");
		} else {
			toast.error(result.message || "Failed to remove admin");
		}
	};

	const currentEventAdmins = adminEventId
		? events.find((e) => e.id === adminEventId)?.admins || []
		: [];

	const isEventActive = (event: ShopEvent) => {
		const now = new Date();
		return event.isActive && new Date(event.startDate) <= now && new Date(event.endDate) >= now;
	};

	const getEventStatus = (event: ShopEvent) => {
		const now = new Date();
		if (!event.isActive) return "inactive";
		if (new Date(event.startDate) > now) return "upcoming";
		if (new Date(event.endDate) < now) return "ended";
		return "active";
	};

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<p className="text-muted-foreground text-sm">Total Events: {events.length}</p>
				</div>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className="mr-2 h-4 w-4" />
					Create Event
				</Button>
			</div>

			{/* Events Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{events.length === 0 ? (
					<Card className="col-span-full">
						<CardContent className="py-12 text-center">
							<CalendarHeart className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
							<p className="text-muted-foreground">No events yet</p>
							<p className="text-muted-foreground mt-1 text-sm">
								Create special events with custom themes and checkout fields
							</p>
						</CardContent>
					</Card>
				) : (
					events.map((event) => {
						const status = getEventStatus(event);
						return (
							<Card
								key={event.id}
								className={`${status === "active" ? "border-primary border-2" : ""}`}
							>
								<CardHeader>
									<div className="bg-muted relative mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg">
										{event.heroImageUrls && event.heroImageUrls.length > 0 ? (
											<img
												src={event.heroImageUrls[0]}
												alt={event.name}
												className="h-full w-full object-cover"
											/>
										) : event.heroImage ? (
											<img
												src={event.heroImage}
												alt={event.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<CalendarHeart className="text-muted-foreground h-16 w-16" />
										)}
										<div className="absolute top-2 left-2 flex gap-1">
											{event.isPriority && (
												<Badge className="bg-yellow-500">
													<Star className="mr-1 h-3 w-3" />
													Priority
												</Badge>
											)}
											<Badge
												variant={
													status === "active"
														? "default"
														: status === "upcoming"
															? "secondary"
															: "outline"
												}
											>
												{status === "active"
													? "Live"
													: status === "upcoming"
														? "Upcoming"
														: status === "ended"
															? "Ended"
															: "Inactive"}
											</Badge>
										</div>
									</div>
									<div className="flex items-start justify-between">
										<CardTitle className="text-lg">{event.name}</CardTitle>
									</div>
									<p className="text-muted-foreground text-sm">{event.slug}</p>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-muted-foreground line-clamp-2 text-sm">{event.description}</p>

									{/* Event Stats */}
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div className="flex items-center gap-1">
											<Calendar className="text-muted-foreground h-4 w-4" />
											<span>{new Date(event.startDate).toLocaleDateString()}</span>
										</div>
										<div className="flex items-center gap-1">
											<Clock className="text-muted-foreground h-4 w-4" />
											<span>{new Date(event.endDate).toLocaleDateString()}</span>
										</div>
									</div>

									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">{event.products.length} products</span>
										<span className="text-muted-foreground">{event._count.orders} orders</span>
									</div>

									<div className="flex flex-wrap gap-2">
										{event.themeConfig?.animation && event.themeConfig.animation !== "none" && (
											<Badge variant="outline">
												<Sparkles className="mr-1 h-3 w-3" />
												{event.themeConfig.animation}
											</Badge>
										)}
										{event.admins && event.admins.length > 0 && (
											<Badge variant="secondary">
												<Users className="mr-1 h-3 w-3" />
												{event.admins.length} admin{event.admins.length !== 1 ? "s" : ""}
											</Badge>
										)}
									</div>

									<div className="flex gap-2 pt-2">
										<Button
											variant="outline"
											size="sm"
											className="flex-1"
											onClick={() => handleOpenDialog(event)}
										>
											<Edit2 className="mr-2 h-4 w-4" />
											Edit
										</Button>
										{isShopAdmin && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleOpenAdminDialog(event.id)}
											>
												<Users className="h-4 w-4" />
											</Button>
										)}
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setEventToDelete(event.id);
												setShowDeleteDialog(true);
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})
				)}
			</div>

			{/* Add/Edit Event Dialog */}
			<Dialog open={showDialog} onOpenChange={handleCloseDialog}>
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
						<DialogDescription>
							{editingEvent
								? "Update the event details below"
								: "Create a special shop event with custom theme and checkout options"}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit}>
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="basic">Basic Info</TabsTrigger>
								<TabsTrigger value="products">Products</TabsTrigger>
								<TabsTrigger value="theme">Theme</TabsTrigger>
								<TabsTrigger value="checkout">Checkout</TabsTrigger>
							</TabsList>

							{/* Basic Info Tab */}
							<TabsContent value="basic" className="space-y-4 pt-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="name">Event Name *</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) => handleNameChange(e.target.value)}
											placeholder="e.g., Flower Fest 2026"
											required
										/>
									</div>
									<div>
										<Label htmlFor="slug">URL Slug *</Label>
										<Input
											id="slug"
											value={formData.slug}
											onChange={(e) =>
												setFormData({ ...formData, slug: generateSlug(e.target.value) })
											}
											placeholder="e.g., flower-fest-2026"
											required
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="description">Description *</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
										rows={3}
										placeholder="Describe what this event is about..."
										required
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="startDate">Start Date & Time *</Label>
										<Input
											id="startDate"
											type="datetime-local"
											value={formData.startDate}
											onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
											required
										/>
									</div>
									<div>
										<Label htmlFor="endDate">End Date & Time *</Label>
										<Input
											id="endDate"
											type="datetime-local"
											value={formData.endDate}
											onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
											required
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="tabLabel">Tab Label (Optional)</Label>
										<Input
											id="tabLabel"
											value={formData.tabLabel}
											onChange={(e) => setFormData({ ...formData, tabLabel: e.target.value })}
											placeholder="Leave empty to use event name"
										/>
									</div>
									<div>
										<Label htmlFor="tabOrder">Tab Order</Label>
										<Input
											id="tabOrder"
											type="number"
											min="0"
											value={formData.tabOrder}
											onChange={(e) =>
												setFormData({
													...formData,
													tabOrder: parseInt(e.target.value) || 0,
												})
											}
										/>
										<p className="text-muted-foreground mt-1 text-xs">Lower numbers appear first</p>
									</div>
								</div>

								<div>
									<Label htmlFor="componentPath">Custom Component Path (Optional)</Label>
									<Input
										id="componentPath"
										value={formData.componentPath}
										onChange={(e) => setFormData({ ...formData, componentPath: e.target.value })}
										placeholder="e.g., flower-fest-2026 (loads from events folder)"
									/>
									<p className="text-muted-foreground mt-1 text-xs">
										If set, loads custom UI from src/app/shop/events/[year]/[componentPath]/
									</p>
								</div>

								{/* Images */}
								<div>
									<Label>Hero Images</Label>
									<div className="mt-2 flex items-center gap-2">
										<Input
											type="file"
											accept="image/*"
											multiple
											onChange={handleImageUpload}
											disabled={uploading}
											className="flex-1"
										/>
										{uploading && <p className="text-muted-foreground text-sm">Uploading...</p>}
									</div>
									{formData.heroImageUrls.length > 0 && (
										<div className="mt-3 flex flex-wrap gap-2">
											{formData.heroImageUrls.map((url, index) => (
												<div key={index} className="group relative">
													<img
														src={url}
														alt={`Event ${index + 1}`}
														className="h-20 w-32 rounded border object-cover"
													/>
													<button
														type="button"
														onClick={() => handleRemoveImage(index)}
														className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								<div className="flex flex-col gap-4 sm:flex-row">
									<div className="flex items-center space-x-2">
										<Switch
											id="isActive"
											checked={formData.isActive}
											onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
										/>
										<Label htmlFor="isActive">Event is active</Label>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											id="isPriority"
											checked={formData.isPriority}
											onCheckedChange={(checked) =>
												setFormData({ ...formData, isPriority: checked })
											}
										/>
										<Label htmlFor="isPriority">Priority (default landing tab)</Label>
									</div>
								</div>
							</TabsContent>

							{/* Products Tab */}
							<TabsContent value="products" className="space-y-4 pt-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-semibold">Event Products & Packages</h3>
										<p className="text-muted-foreground text-sm">
											Select products and packages for this event
										</p>
									</div>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => addEventProduct("product")}
										>
											<ShoppingBag className="mr-2 h-4 w-4" />
											Add Product
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => addEventProduct("package")}
										>
											<Package className="mr-2 h-4 w-4" />
											Add Package
										</Button>
									</div>
								</div>

								{formData.eventProducts.length === 0 ? (
									<p className="text-muted-foreground py-8 text-center text-sm">
										No products added yet. Add products or packages for this event.
									</p>
								) : (
									<div className="space-y-3">
										{formData.eventProducts.map((item, index) => (
											<div key={index} className="flex items-center gap-3 rounded border p-3">
												<div className="flex-1">
													{item.productId !== undefined ? (
														<Select
															value={item.productId}
															onValueChange={(value) =>
																updateEventProduct(index, "productId", value)
															}
														>
															<SelectTrigger>
																<SelectValue placeholder="Select product" />
															</SelectTrigger>
															<SelectContent>
																{availableProducts.map((product) => (
																	<SelectItem key={product.id} value={product.id}>
																		<div className="flex items-center gap-2">
																			<ShoppingBag className="h-4 w-4" />
																			{product.name} - ₱{product.price.toFixed(2)}
																		</div>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													) : (
														<Select
															value={item.packageId}
															onValueChange={(value) =>
																updateEventProduct(index, "packageId", value)
															}
														>
															<SelectTrigger>
																<SelectValue placeholder="Select package" />
															</SelectTrigger>
															<SelectContent>
																{availablePackages.map((pkg) => (
																	<SelectItem key={pkg.id} value={pkg.id}>
																		<div className="flex items-center gap-2">
																			<Package className="h-4 w-4" />
																			{pkg.name} - ₱{pkg.price.toFixed(2)}
																		</div>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													)}
												</div>
												<div className="flex items-center gap-2">
													<Label className="text-sm whitespace-nowrap">Event Price:</Label>
													<Input
														type="number"
														step="0.01"
														placeholder="Original"
														value={item.eventPrice || ""}
														onChange={(e) =>
															updateEventProduct(
																index,
																"eventPrice",
																e.target.value ? parseFloat(e.target.value) : undefined,
															)
														}
														className="w-28"
													/>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => removeEventProduct(index)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>
								)}
							</TabsContent>

							{/* Theme Tab */}
							<TabsContent value="theme" className="space-y-4 pt-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="primaryColor">Primary Color</Label>
										<div className="flex gap-2">
											<Input
												id="primaryColor"
												type="color"
												value={formData.themeConfig.primaryColor || "#ec4899"}
												onChange={(e) =>
													setFormData({
														...formData,
														themeConfig: {
															...formData.themeConfig,
															primaryColor: e.target.value,
														},
													})
												}
												className="h-10 w-16"
											/>
											<Input
												value={formData.themeConfig.primaryColor || "#ec4899"}
												onChange={(e) =>
													setFormData({
														...formData,
														themeConfig: {
															...formData.themeConfig,
															primaryColor: e.target.value,
														},
													})
												}
												placeholder="#ec4899"
											/>
										</div>
									</div>
									<div>
										<Label htmlFor="secondaryColor">Secondary Color</Label>
										<div className="flex gap-2">
											<Input
												id="secondaryColor"
												type="color"
												value={formData.themeConfig.secondaryColor || "#f472b6"}
												onChange={(e) =>
													setFormData({
														...formData,
														themeConfig: {
															...formData.themeConfig,
															secondaryColor: e.target.value,
														},
													})
												}
												className="h-10 w-16"
											/>
											<Input
												value={formData.themeConfig.secondaryColor || "#f472b6"}
												onChange={(e) =>
													setFormData({
														...formData,
														themeConfig: {
															...formData.themeConfig,
															secondaryColor: e.target.value,
														},
													})
												}
												placeholder="#f472b6"
											/>
										</div>
									</div>
								</div>

								<div>
									<Label htmlFor="animation">Animation Effect</Label>
									<Select
										value={formData.themeConfig.animation || "none"}
										onValueChange={(value: any) =>
											setFormData({
												...formData,
												themeConfig: {
													...formData.themeConfig,
													animation: value,
												},
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{animationOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor="headerText">Custom Header Text (Optional)</Label>
									<Input
										id="headerText"
										value={formData.themeConfig.headerText || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												themeConfig: {
													...formData.themeConfig,
													headerText: e.target.value,
												},
											})
										}
										placeholder="e.g., 🌸 Flower Fest Special 🌸"
									/>
								</div>

								<div className="flex items-center space-x-2">
									<Switch
										id="tabGlow"
										checked={formData.themeConfig.tabGlow || false}
										onCheckedChange={(checked) =>
											setFormData({
												...formData,
												themeConfig: {
													...formData.themeConfig,
													tabGlow: checked,
												},
											})
										}
									/>
									<Label htmlFor="tabGlow">Add glow effect to event tab</Label>
								</div>
							</TabsContent>

							{/* Checkout Tab */}
							<TabsContent value="checkout" className="space-y-4 pt-4">
								<div>
									<Label htmlFor="checkoutHeader">Checkout Header Message</Label>
									<Input
										id="checkoutHeader"
										value={formData.checkoutHeaderMessage}
										onChange={(e) =>
											setFormData({
												...formData,
												checkoutHeaderMessage: e.target.value,
											})
										}
										placeholder="e.g., 🌸 Flower Fest Order 🌸"
									/>
								</div>

								<div className="space-y-4 border-t pt-4">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="font-semibold">Additional Checkout Fields</h3>
											<p className="text-muted-foreground text-sm">
												Add custom fields for event-specific information
											</p>
										</div>
										<Button type="button" variant="outline" size="sm" onClick={addCheckoutField}>
											<Plus className="mr-2 h-4 w-4" />
											Add Field
										</Button>
									</div>

									{formData.checkoutFields.length === 0 ? (
										<p className="text-muted-foreground py-4 text-center text-sm">
											No additional checkout fields
										</p>
									) : (
										<div className="space-y-4">
											{formData.checkoutFields.map((field, index) => (
												<Card key={field.id}>
													<CardContent className="pt-4">
														<div className="flex items-start gap-4">
															<div className="flex-1 space-y-3">
																<div className="grid grid-cols-2 gap-3">
																	<div>
																		<Label>Field Label *</Label>
																		<Input
																			value={field.label}
																			onChange={(e) =>
																				updateCheckoutField(index, {
																					label: e.target.value,
																				})
																			}
																			placeholder="e.g., Recipient Name"
																		/>
																	</div>
																	<div>
																		<Label>Field Type</Label>
																		<Select
																			value={field.type}
																			onValueChange={(value: any) =>
																				updateCheckoutField(index, {
																					type: value,
																				})
																			}
																		>
																			<SelectTrigger>
																				<SelectValue />
																			</SelectTrigger>
																			<SelectContent>
																				<SelectItem value="text">Text</SelectItem>
																				<SelectItem value="textarea">Textarea</SelectItem>
																				<SelectItem value="select">Dropdown</SelectItem>
																				<SelectItem value="checkbox">Checkbox</SelectItem>
																				<SelectItem value="date">Date</SelectItem>
																			</SelectContent>
																		</Select>
																	</div>
																</div>
																<div>
																	<Label>Placeholder</Label>
																	<Input
																		value={field.placeholder}
																		onChange={(e) =>
																			updateCheckoutField(index, {
																				placeholder: e.target.value,
																			})
																		}
																		placeholder="Enter placeholder text..."
																	/>
																</div>
																{field.type === "select" && (
																	<div>
																		<Label>Options (one per line)</Label>
																		<Textarea
																			value={field.options.join("\n")}
																			onChange={(e) =>
																				updateCheckoutField(index, {
																					options: e.target.value.split("\n").filter(Boolean),
																				})
																			}
																			rows={3}
																			placeholder="Option 1&#10;Option 2&#10;Option 3"
																		/>
																	</div>
																)}
																<div className="flex items-center space-x-2">
																	<Checkbox
																		id={`required-${index}`}
																		checked={field.required}
																		onCheckedChange={(checked) =>
																			updateCheckoutField(index, {
																				required: !!checked,
																			})
																		}
																	/>
																	<Label htmlFor={`required-${index}`}>Required field</Label>
																</div>
															</div>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																onClick={() => removeCheckoutField(index)}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									)}
								</div>

								<div className="space-y-4 border-t pt-4">
									<div>
										<Label htmlFor="termsMessage">Terms/Warning Message</Label>
										<Textarea
											id="termsMessage"
											value={formData.checkoutTermsMessage}
											onChange={(e) =>
												setFormData({
													...formData,
													checkoutTermsMessage: e.target.value,
												})
											}
											rows={2}
											placeholder="e.g., Orders placed after Feb 12 may not arrive on Valentine's Day."
										/>
									</div>
									<div>
										<Label htmlFor="confirmationMessage">Confirmation Message</Label>
										<Textarea
											id="confirmationMessage"
											value={formData.checkoutConfirmationMessage}
											onChange={(e) =>
												setFormData({
													...formData,
													checkoutConfirmationMessage: e.target.value,
												})
											}
											rows={2}
											placeholder="e.g., Your flowers will be delivered to {deliveryRoom} on {deliveryDate}!"
										/>
										<p className="text-muted-foreground mt-1 text-xs">
											Use {`{fieldId}`} to insert field values in the message
										</p>
									</div>
								</div>
							</TabsContent>
						</Tabs>

						<div className="mt-4 flex gap-2 border-t pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseDialog}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading || uploading} className="flex-1">
								{loading ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the event and unlink all
							associated orders.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Admin Management Dialog */}
			<Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Manage Event Admins</DialogTitle>
						<DialogDescription>Add or remove users who can manage this event</DialogDescription>
					</DialogHeader>

					{/* User Search */}
					<div className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Search by name or email..."
								value={userSearchQuery}
								onChange={(e) => setUserSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleSearchUsers();
									}
								}}
							/>
							<Button
								type="button"
								variant="secondary"
								onClick={handleSearchUsers}
								disabled={searchingUsers || !userSearchQuery.trim()}
							>
								{searchingUsers ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Search className="h-4 w-4" />
								)}
							</Button>
						</div>

						{/* Search Results */}
						{searchResults.length > 0 && (
							<div className="space-y-2">
								<Label className="text-sm font-medium">Search Results</Label>
								<div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
									{searchResults
										.filter((user) => !currentEventAdmins.some((a) => a.user.id === user.id))
										.map((user) => (
											<div
												key={user.id}
												className="hover:bg-muted flex items-center justify-between rounded-md p-2"
											>
												<div className="flex items-center gap-2">
													<Avatar className="h-8 w-8">
														<AvatarImage src={user.image || undefined} />
														<AvatarFallback>
															{user.name?.charAt(0) || user.email.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<div className="text-sm">
														<p className="font-medium">{user.name || "No name"}</p>
														<p className="text-muted-foreground text-xs">{user.email}</p>
													</div>
												</div>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => handleAddAdmin(user.id)}
													disabled={addingAdmin}
												>
													<UserPlus className="h-4 w-4" />
												</Button>
											</div>
										))}
									{searchResults.filter(
										(user) => !currentEventAdmins.some((a) => a.user.id === user.id),
									).length === 0 && (
										<p className="text-muted-foreground p-2 text-center text-sm">
											All found users are already admins
										</p>
									)}
								</div>
							</div>
						)}

						{/* Current Admins */}
						<div className="space-y-2">
							<Label className="text-sm font-medium">
								Current Admins ({currentEventAdmins.length})
							</Label>
							{currentEventAdmins.length === 0 ? (
								<p className="text-muted-foreground text-sm">No admins assigned to this event</p>
							) : (
								<div className="space-y-2 rounded-md border p-2">
									{currentEventAdmins.map((admin) => (
										<div
											key={admin.id}
											className="hover:bg-muted flex items-center justify-between rounded-md p-2"
										>
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarImage src={admin.user.image || undefined} />
													<AvatarFallback>
														{admin.user.name?.charAt(0) || admin.user.email.charAt(0)}
													</AvatarFallback>
												</Avatar>
												<div className="text-sm">
													<p className="font-medium">{admin.user.name || "No name"}</p>
													<p className="text-muted-foreground text-xs">{admin.user.email}</p>
												</div>
											</div>
											<Button
												size="sm"
												variant="ghost"
												className="text-destructive hover:text-destructive hover:bg-destructive/10"
												onClick={() => handleRemoveAdmin(admin.user.id)}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
