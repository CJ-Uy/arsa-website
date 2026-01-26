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
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
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
	Rows3,
	GripVertical,
	Type,
	AlignLeft,
	List,
	CheckSquare,
	Hash,
	Mail,
	Phone,
	CircleDot,
	Info,
	Eye,
	EyeOff,
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

type RepeaterColumn = {
	id: string;
	label: string;
	type: "text" | "date" | "time" | "select";
	placeholder?: string;
	options?: string[];
	width?: "sm" | "md" | "lg";
};

type FieldCondition = {
	fieldId: string;
	value: string | string[];
};

type CheckoutFieldType =
	| "text"
	| "textarea"
	| "select"
	| "checkbox"
	| "date"
	| "time"
	| "number"
	| "email"
	| "phone"
	| "radio"
	| "repeater"
	| "message";

type FormCheckoutField = {
	id: string;
	label: string;
	type: CheckoutFieldType;
	required: boolean;
	placeholder: string;
	options: string[];
	maxLength?: number;
	// Number field constraints
	min?: number;
	max?: number;
	step?: number;
	// Conditional display
	showWhen?: FieldCondition;
	// Message content (for type: "message")
	messageContent?: string;
	// Repeater-specific fields
	columns?: RepeaterColumn[];
	minRows?: number;
	maxRows?: number;
	defaultRows?: number;
};

// Field type definitions with icons and descriptions
const FIELD_TYPE_OPTIONS: {
	value: CheckoutFieldType;
	label: string;
	description: string;
	icon: React.ReactNode;
	category: "input" | "selection" | "advanced" | "display";
}[] = [
	// Input types
	{
		value: "text",
		label: "Text",
		description: "Single line text input",
		icon: <Type className="h-4 w-4" />,
		category: "input",
	},
	{
		value: "textarea",
		label: "Text Area",
		description: "Multi-line text for longer responses",
		icon: <AlignLeft className="h-4 w-4" />,
		category: "input",
	},
	{
		value: "number",
		label: "Number",
		description: "Numeric input with optional min/max",
		icon: <Hash className="h-4 w-4" />,
		category: "input",
	},
	{
		value: "email",
		label: "Email",
		description: "Email address with validation",
		icon: <Mail className="h-4 w-4" />,
		category: "input",
	},
	{
		value: "phone",
		label: "Phone",
		description: "Phone number input",
		icon: <Phone className="h-4 w-4" />,
		category: "input",
	},
	// Selection types
	{
		value: "select",
		label: "Dropdown",
		description: "Select one option from a list",
		icon: <List className="h-4 w-4" />,
		category: "selection",
	},
	{
		value: "radio",
		label: "Radio Buttons",
		description: "Select one option with visible choices",
		icon: <CircleDot className="h-4 w-4" />,
		category: "selection",
	},
	{
		value: "checkbox",
		label: "Checkbox",
		description: "Yes/No toggle or agreement",
		icon: <CheckSquare className="h-4 w-4" />,
		category: "selection",
	},
	// Date/Time types
	{
		value: "date",
		label: "Date",
		description: "Date picker",
		icon: <Calendar className="h-4 w-4" />,
		category: "input",
	},
	{
		value: "time",
		label: "Time",
		description: "Time picker",
		icon: <Clock className="h-4 w-4" />,
		category: "input",
	},
	// Advanced types
	{
		value: "repeater",
		label: "Repeater Table",
		description: "Multiple rows with custom columns",
		icon: <Rows3 className="h-4 w-4" />,
		category: "advanced",
	},
	// Display types
	{
		value: "message",
		label: "Info Message",
		description: "Display-only informational text",
		icon: <Info className="h-4 w-4" />,
		category: "display",
	},
];

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
	checkoutCutoffTime: string;
	checkoutCutoffMessage: string;
	checkoutCutoffDaysOffset: number;
	checkoutPaymentOptions: { id: string; title: string; instructions: string; imageUrl?: string }[];
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
		checkoutCutoffTime: "",
		checkoutCutoffMessage: "",
		checkoutCutoffDaysOffset: 2,
		checkoutPaymentOptions: [],
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
			checkoutCutoffTime: "",
			checkoutCutoffMessage: "",
			checkoutCutoffDaysOffset: 2,
			checkoutPaymentOptions: [],
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
					checkoutConfig?.additionalFields?.map((f: any) => ({
						...f,
						placeholder: f.placeholder || "",
						options: f.options || [],
						// Number field constraints
						min: f.min,
						max: f.max,
						step: f.step,
						// Conditional display
						showWhen: f.showWhen || undefined,
						// Message content
						messageContent: f.messageContent || "",
						// Repeater fields
						columns: f.columns || [],
						minRows: f.minRows || 1,
						maxRows: f.maxRows || 10,
						defaultRows: f.defaultRows || 1,
					})) || [],
				checkoutHeaderMessage: checkoutConfig?.headerMessage || "",
				checkoutTermsMessage: checkoutConfig?.termsMessage || "",
				checkoutConfirmationMessage: checkoutConfig?.confirmationMessage || "",
				checkoutCutoffTime: checkoutConfig?.cutoffTime || "",
				checkoutCutoffMessage: checkoutConfig?.cutoffMessage || "",
				checkoutCutoffDaysOffset: checkoutConfig?.cutoffDaysOffset || 2,
				checkoutPaymentOptions: checkoutConfig?.paymentOptions || [],
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
								required: f.type === "message" ? false : f.required, // Messages are never required
								placeholder: f.placeholder || undefined,
								options: f.type === "select" || f.type === "radio" ? f.options : undefined,
								maxLength: f.maxLength,
								// Number field constraints
								min: f.type === "number" ? f.min : undefined,
								max: f.type === "number" ? f.max : undefined,
								step: f.type === "number" ? f.step : undefined,
								// Conditional display
								showWhen: f.showWhen || undefined,
								// Message content
								messageContent: f.type === "message" ? f.messageContent : undefined,
								// Repeater-specific fields
								columns: f.type === "repeater" ? f.columns : undefined,
								minRows: f.type === "repeater" ? f.minRows : undefined,
								maxRows: f.type === "repeater" ? f.maxRows : undefined,
								defaultRows: f.type === "repeater" ? f.defaultRows : undefined,
							})),
							termsMessage: formData.checkoutTermsMessage || undefined,
							confirmationMessage: formData.checkoutConfirmationMessage || undefined,
							cutoffTime: formData.checkoutCutoffTime || undefined,
							cutoffMessage: formData.checkoutCutoffMessage || undefined,
							cutoffDaysOffset: formData.checkoutCutoffDaysOffset || undefined,
							paymentOptions:
								formData.checkoutPaymentOptions.length > 0
									? formData.checkoutPaymentOptions
									: undefined,
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
				<DialogContent className="max-h-[90vh] w-[95vw] max-w-[1600px] overflow-y-auto sm:max-w-[1600px]">
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
											{formData.checkoutFields.map((field, index) => {
												const fieldTypeInfo = FIELD_TYPE_OPTIONS.find(
													(o) => o.value === field.type,
												);
												return (
													<Card
														key={field.id}
														className={`transition-all ${
															field.showWhen ? "border-purple-200 dark:border-purple-800" : ""
														}`}
													>
														<CardHeader className="bg-muted/30 px-4 py-3">
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-3">
																	<div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
																		{fieldTypeInfo?.icon}
																	</div>
																	<div>
																		<span className="font-medium">
																			{field.label || "Untitled Field"}
																		</span>
																		<div className="text-muted-foreground flex items-center gap-2 text-xs">
																			<span>{fieldTypeInfo?.label}</span>
																			{field.required && (
																				<Badge variant="secondary" className="px-1 text-[10px]">
																					Required
																				</Badge>
																			)}
																			{field.showWhen && (
																				<Badge
																					variant="outline"
																					className="border-purple-300 px-1 text-[10px] text-purple-600"
																				>
																					<Eye className="mr-1 h-2.5 w-2.5" />
																					Conditional
																				</Badge>
																			)}
																		</div>
																	</div>
																</div>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="text-destructive hover:text-destructive h-8 w-8"
																	onClick={() => removeCheckoutField(index)}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>
														</CardHeader>
														<CardContent className="pt-4">
															<div className="space-y-3">
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
																			onValueChange={(value: CheckoutFieldType) =>
																				updateCheckoutField(index, {
																					type: value,
																					// Initialize repeater defaults
																					...(value === "repeater" && !field.columns
																						? {
																								columns: [
																									{
																										id: `col-${Date.now()}`,
																										label: "Column 1",
																										type: "text",
																									},
																								],
																								minRows: 1,
																								maxRows: 10,
																								defaultRows: 1,
																							}
																						: {}),
																					// Initialize options for selection types
																					...(["select", "radio"].includes(value) &&
																					field.options.length === 0
																						? { options: ["Option 1", "Option 2"] }
																						: {}),
																				})
																			}
																		>
																			<SelectTrigger>
																				<SelectValue>
																					{(() => {
																						const opt = FIELD_TYPE_OPTIONS.find(
																							(o) => o.value === field.type,
																						);
																						if (opt) {
																							return (
																								<div className="flex items-center gap-2">
																									{opt.icon}
																									<span>{opt.label}</span>
																								</div>
																							);
																						}
																						return field.type;
																					})()}
																				</SelectValue>
																			</SelectTrigger>
																			<SelectContent className="w-[320px]">
																				<div className="text-muted-foreground p-1 text-xs font-semibold">
																					Input Fields
																				</div>
																				{FIELD_TYPE_OPTIONS.filter(
																					(o) => o.category === "input",
																				).map((opt) => (
																					<SelectItem key={opt.value} value={opt.value}>
																						<div className="flex items-center gap-3">
																							<span className="text-muted-foreground">
																								{opt.icon}
																							</span>
																							<div>
																								<div className="font-medium">{opt.label}</div>
																								<div className="text-muted-foreground text-xs">
																									{opt.description}
																								</div>
																							</div>
																						</div>
																					</SelectItem>
																				))}
																				<div className="text-muted-foreground mt-2 p-1 text-xs font-semibold">
																					Selection Fields
																				</div>
																				{FIELD_TYPE_OPTIONS.filter(
																					(o) => o.category === "selection",
																				).map((opt) => (
																					<SelectItem key={opt.value} value={opt.value}>
																						<div className="flex items-center gap-3">
																							<span className="text-muted-foreground">
																								{opt.icon}
																							</span>
																							<div>
																								<div className="font-medium">{opt.label}</div>
																								<div className="text-muted-foreground text-xs">
																									{opt.description}
																								</div>
																							</div>
																						</div>
																					</SelectItem>
																				))}
																				<div className="text-muted-foreground mt-2 p-1 text-xs font-semibold">
																					Advanced
																				</div>
																				{FIELD_TYPE_OPTIONS.filter(
																					(o) => o.category === "advanced",
																				).map((opt) => (
																					<SelectItem key={opt.value} value={opt.value}>
																						<div className="flex items-center gap-3">
																							<span className="text-muted-foreground">
																								{opt.icon}
																							</span>
																							<div>
																								<div className="font-medium">{opt.label}</div>
																								<div className="text-muted-foreground text-xs">
																									{opt.description}
																								</div>
																							</div>
																						</div>
																					</SelectItem>
																				))}
																				<div className="text-muted-foreground mt-2 p-1 text-xs font-semibold">
																					Display Only
																				</div>
																				{FIELD_TYPE_OPTIONS.filter(
																					(o) => o.category === "display",
																				).map((opt) => (
																					<SelectItem key={opt.value} value={opt.value}>
																						<div className="flex items-center gap-3">
																							<span className="text-muted-foreground">
																								{opt.icon}
																							</span>
																							<div>
																								<div className="font-medium">{opt.label}</div>
																								<div className="text-muted-foreground text-xs">
																									{opt.description}
																								</div>
																							</div>
																						</div>
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																	</div>
																</div>

																{/* Conditional Display */}
																{index > 0 && (
																	<div
																		className={`rounded-lg border-2 p-4 transition-colors ${
																			field.showWhen
																				? "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950"
																				: "border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
																		}`}
																	>
																		<div className="flex items-center justify-between">
																			<div className="flex items-center gap-3">
																				{field.showWhen ? (
																					<Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
																				) : (
																					<EyeOff className="h-5 w-5 text-gray-400" />
																				)}
																				<div>
																					<Label
																						htmlFor={`conditional-${index}`}
																						className="cursor-pointer text-sm font-semibold"
																					>
																						Conditional Visibility
																					</Label>
																					<p className="text-muted-foreground text-xs">
																						{field.showWhen
																							? "This field is conditionally shown"
																							: "Always visible to customers"}
																					</p>
																				</div>
																			</div>
																			<Switch
																				id={`conditional-${index}`}
																				checked={!!field.showWhen}
																				onCheckedChange={(checked) => {
																					if (checked) {
																						// Find a select or radio field to use as condition
																						const selectField = formData.checkoutFields
																							.slice(0, index)
																							.find(
																								(f) => f.type === "select" || f.type === "radio",
																							);
																						updateCheckoutField(index, {
																							showWhen: selectField
																								? {
																										fieldId: selectField.id,
																										value: selectField.options[0] || "",
																									}
																								: {
																										fieldId: formData.checkoutFields[0]?.id || "",
																										value: "",
																									},
																						});
																					} else {
																						updateCheckoutField(index, {
																							showWhen: undefined,
																						});
																					}
																				}}
																			/>
																		</div>
																		{field.showWhen && (
																			<div className="mt-4 rounded-md border border-purple-200 bg-white p-3 dark:border-purple-800 dark:bg-gray-900">
																				<div className="mb-3 flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
																					<span className="font-medium">Show this field when:</span>
																				</div>
																				<div className="flex items-center gap-2">
																					<Select
																						value={field.showWhen.fieldId}
																						onValueChange={(value) =>
																							updateCheckoutField(index, {
																								showWhen: {
																									...field.showWhen!,
																									fieldId: value,
																								},
																							})
																						}
																					>
																						<SelectTrigger>
																							<SelectValue placeholder="Select field" />
																						</SelectTrigger>
																						<SelectContent>
																							{formData.checkoutFields
																								.slice(0, index)
																								.filter(
																									(f) => f.type === "select" || f.type === "radio",
																								)
																								.map((f) => (
																									<SelectItem key={f.id} value={f.id}>
																										{f.label || "Unnamed field"}
																									</SelectItem>
																								))}
																						</SelectContent>
																					</Select>
																					<span className="text-muted-foreground text-sm font-medium">
																						=
																					</span>
																					{(() => {
																						const targetField = formData.checkoutFields.find(
																							(f) => f.id === field.showWhen?.fieldId,
																						);
																						if (
																							targetField?.type === "select" ||
																							targetField?.type === "radio"
																						) {
																							return (
																								<Select
																									value={
																										Array.isArray(field.showWhen.value)
																											? field.showWhen.value[0]
																											: field.showWhen.value
																									}
																									onValueChange={(value) =>
																										updateCheckoutField(index, {
																											showWhen: {
																												...field.showWhen!,
																												value: value,
																											},
																										})
																									}
																								>
																									<SelectTrigger>
																										<SelectValue placeholder="Select value" />
																									</SelectTrigger>
																									<SelectContent>
																										{targetField.options.map((opt) => (
																											<SelectItem key={opt} value={opt}>
																												{opt}
																											</SelectItem>
																										))}
																									</SelectContent>
																								</Select>
																							);
																						}
																						return (
																							<Input
																								value={
																									Array.isArray(field.showWhen?.value)
																										? field.showWhen.value[0]
																										: field.showWhen?.value || ""
																								}
																								onChange={(e) =>
																									updateCheckoutField(index, {
																										showWhen: {
																											...field.showWhen!,
																											value: e.target.value,
																										},
																									})
																								}
																								placeholder="Value to match"
																							/>
																						);
																					})()}
																				</div>
																				{formData.checkoutFields
																					.slice(0, index)
																					.filter((f) => f.type === "select" || f.type === "radio")
																					.length === 0 && (
																					<p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
																						Tip: Add a Dropdown or Radio field before this one to
																						enable conditional logic
																					</p>
																				)}
																			</div>
																		)}
																	</div>
																)}

																{field.type !== "message" && field.type !== "checkbox" && (
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
																)}

																{field.type === "message" && (
																	<div>
																		<Label>Message Content</Label>
																		<Textarea
																			value={field.messageContent || ""}
																			onChange={(e) =>
																				updateCheckoutField(index, {
																					messageContent: e.target.value,
																				})
																			}
																			rows={3}
																			placeholder="Enter the message to display to customers..."
																		/>
																		<p className="text-muted-foreground mt-1 text-xs">
																			This message will be displayed to customers (no input
																			required)
																		</p>
																	</div>
																)}
																{(field.type === "select" || field.type === "radio") && (
																	<div>
																		<div className="mb-2 flex items-center justify-between">
																			<Label className="text-sm">
																				Options{" "}
																				<span className="text-muted-foreground font-normal">
																					{field.type === "radio"
																						? "- shown as radio buttons"
																						: "- shown as dropdown"}
																				</span>
																			</Label>
																			<Button
																				type="button"
																				variant="outline"
																				size="sm"
																				onClick={() => {
																					updateCheckoutField(index, {
																						options: [
																							...field.options,
																							`Option ${field.options.length + 1}`,
																						],
																					});
																				}}
																			>
																				<Plus className="mr-1 h-3 w-3" />
																				Add Option
																			</Button>
																		</div>
																		<div className="space-y-2">
																			{field.options.map((option, optIndex) => (
																				<div key={optIndex} className="flex items-center gap-2">
																					<Input
																						value={option}
																						onChange={(e) => {
																							const newOptions = [...field.options];
																							newOptions[optIndex] = e.target.value;
																							updateCheckoutField(index, {
																								options: newOptions,
																							});
																						}}
																						placeholder={`Option ${optIndex + 1}`}
																					/>
																					<Button
																						type="button"
																						variant="ghost"
																						size="icon"
																						onClick={() => {
																							updateCheckoutField(index, {
																								options: field.options.filter(
																									(_, i) => i !== optIndex,
																								),
																							});
																						}}
																						disabled={field.options.length <= 1}
																					>
																						<X className="h-4 w-4" />
																					</Button>
																				</div>
																			))}
																			{field.options.length === 0 && (
																				<p className="text-muted-foreground text-sm">
																					No options yet. Click "Add Option" to add choices.
																				</p>
																			)}
																		</div>
																	</div>
																)}
																{field.type === "number" && (
																	<div className="grid grid-cols-3 gap-3">
																		<div>
																			<Label className="text-xs">Min Value</Label>
																			<Input
																				type="number"
																				value={field.min ?? ""}
																				onChange={(e) =>
																					updateCheckoutField(index, {
																						min: e.target.value
																							? parseFloat(e.target.value)
																							: undefined,
																					})
																				}
																				placeholder="No min"
																			/>
																		</div>
																		<div>
																			<Label className="text-xs">Max Value</Label>
																			<Input
																				type="number"
																				value={field.max ?? ""}
																				onChange={(e) =>
																					updateCheckoutField(index, {
																						max: e.target.value
																							? parseFloat(e.target.value)
																							: undefined,
																					})
																				}
																				placeholder="No max"
																			/>
																		</div>
																		<div>
																			<Label className="text-xs">Step</Label>
																			<Input
																				type="number"
																				value={field.step ?? ""}
																				onChange={(e) =>
																					updateCheckoutField(index, {
																						step: e.target.value
																							? parseFloat(e.target.value)
																							: undefined,
																					})
																				}
																				placeholder="1"
																			/>
																		</div>
																	</div>
																)}
																{field.type === "repeater" && (
																	<div className="space-y-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
																		<div className="flex items-center gap-2">
																			<Rows3 className="h-5 w-5" />
																			<Label className="text-base font-semibold">
																				Repeater Configuration
																			</Label>
																		</div>

																		{/* Row Limits */}
																		<div className="grid grid-cols-3 gap-3">
																			<div>
																				<Label className="text-xs">Min Rows *</Label>
																				<Input
																					type="number"
																					min="1"
																					max="20"
																					value={field.minRows || 1}
																					onChange={(e) =>
																						updateCheckoutField(index, {
																							minRows: parseInt(e.target.value) || 1,
																						})
																					}
																				/>
																			</div>
																			<div>
																				<Label className="text-xs">Max Rows</Label>
																				<Input
																					type="number"
																					min="1"
																					max="50"
																					value={field.maxRows || 10}
																					onChange={(e) =>
																						updateCheckoutField(index, {
																							maxRows: parseInt(e.target.value) || 10,
																						})
																					}
																				/>
																			</div>
																			<div>
																				<Label className="text-xs">Default Rows</Label>
																				<Input
																					type="number"
																					min="0"
																					value={field.defaultRows || 1}
																					onChange={(e) =>
																						updateCheckoutField(index, {
																							defaultRows: parseInt(e.target.value) || 1,
																						})
																					}
																				/>
																			</div>
																		</div>

																		{/* Columns */}
																		<div className="space-y-3">
																			<div className="flex items-center justify-between">
																				<Label className="text-sm">Columns</Label>
																				<Button
																					type="button"
																					variant="outline"
																					size="sm"
																					onClick={() => {
																						const newCol: RepeaterColumn = {
																							id: `col-${Date.now()}`,
																							label: `Column ${(field.columns?.length || 0) + 1}`,
																							type: "text",
																						};
																						updateCheckoutField(index, {
																							columns: [...(field.columns || []), newCol],
																						});
																					}}
																				>
																					<Plus className="mr-1 h-3 w-3" />
																					Add Column
																				</Button>
																			</div>

																			{field.columns?.map((col, colIndex) => (
																				<div
																					key={col.id}
																					className="flex items-start gap-2 rounded border bg-white p-3 dark:bg-slate-800"
																				>
																					<GripVertical className="text-muted-foreground mt-2 h-4 w-4" />
																					<div className="flex-1 space-y-2">
																						<div className="grid grid-cols-2 gap-2">
																							<div>
																								<Label className="text-xs">Column Label</Label>
																								<Input
																									value={col.label}
																									onChange={(e) => {
																										const newCols = [...(field.columns || [])];
																										newCols[colIndex] = {
																											...newCols[colIndex],
																											label: e.target.value,
																										};
																										updateCheckoutField(index, {
																											columns: newCols,
																										});
																									}}
																									placeholder="e.g., Date"
																								/>
																							</div>
																							<div>
																								<Label className="text-xs">Column Type</Label>
																								<Select
																									value={col.type}
																									onValueChange={(value: any) => {
																										const newCols = [...(field.columns || [])];
																										newCols[colIndex] = {
																											...newCols[colIndex],
																											type: value,
																										};
																										updateCheckoutField(index, {
																											columns: newCols,
																										});
																									}}
																								>
																									<SelectTrigger>
																										<SelectValue />
																									</SelectTrigger>
																									<SelectContent>
																										<SelectItem value="text">Text</SelectItem>
																										<SelectItem value="date">Date</SelectItem>
																										<SelectItem value="time">Time</SelectItem>
																										<SelectItem value="select">Dropdown</SelectItem>
																									</SelectContent>
																								</Select>
																							</div>
																						</div>
																						<div>
																							<Label className="text-xs">Placeholder</Label>
																							<Input
																								value={col.placeholder || ""}
																								onChange={(e) => {
																									const newCols = [...(field.columns || [])];
																									newCols[colIndex] = {
																										...newCols[colIndex],
																										placeholder: e.target.value,
																									};
																									updateCheckoutField(index, {
																										columns: newCols,
																									});
																								}}
																								placeholder="Optional placeholder"
																							/>
																							<p className="text-muted-foreground mt-1 text-xs">
																								Columns auto-fit to available width
																							</p>
																						</div>
																						{col.type === "select" && (
																							<div>
																								<Label className="text-xs">
																									Options (one per line)
																								</Label>
																								<Textarea
																									value={col.options?.join("\n") || ""}
																									onChange={(e) => {
																										const newCols = [...(field.columns || [])];
																										newCols[colIndex] = {
																											...newCols[colIndex],
																											options: e.target.value
																												.split("\n")
																												.filter(Boolean),
																										};
																										updateCheckoutField(index, {
																											columns: newCols,
																										});
																									}}
																									rows={2}
																									placeholder="Option 1&#10;Option 2"
																								/>
																							</div>
																						)}
																					</div>
																					<Button
																						type="button"
																						variant="ghost"
																						size="icon"
																						className="h-8 w-8"
																						onClick={() => {
																							const newCols = (field.columns || []).filter(
																								(_, i) => i !== colIndex,
																							);
																							updateCheckoutField(index, {
																								columns: newCols,
																							});
																						}}
																						disabled={(field.columns?.length || 0) <= 1}
																					>
																						<X className="h-4 w-4" />
																					</Button>
																				</div>
																			))}
																		</div>
																	</div>
																)}
																<div className="flex items-center space-x-2">
																	<Checkbox
																		id={`required-${index}`}
																		checked={field.required}
																		disabled={field.type === "message"}
																		onCheckedChange={(checked) =>
																			updateCheckoutField(index, {
																				required: !!checked,
																			})
																		}
																	/>
																	<Label htmlFor={`required-${index}`}>
																		Required field
																		{field.type === "message" && (
																			<span className="text-muted-foreground ml-1">
																				(messages cannot be required)
																			</span>
																		)}
																	</Label>
																</div>
															</div>
														</CardContent>
													</Card>
												);
											})}
											{/* Add Field Button at Bottom */}
											<Button
												type="button"
												variant="outline"
												className="hover:border-primary hover:bg-primary/5 h-12 w-full border-2 border-dashed"
												onClick={addCheckoutField}
											>
												<Plus className="mr-2 h-4 w-4" />
												Add Another Field
											</Button>
										</div>
									)}
								</div>

								<div className="space-y-4 border-t pt-4">
									{/* Delivery Cutoff Configuration */}
									<div className="space-y-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
										<div>
											<h3 className="font-semibold">Delivery Cutoff Time (Optional)</h3>
											<p className="text-muted-foreground text-sm">
												Display a warning when orders are placed after a specific time
											</p>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="cutoffTime">Cutoff Time</Label>
												<TimePicker
													value={formData.checkoutCutoffTime}
													onChange={(time) =>
														setFormData({
															...formData,
															checkoutCutoffTime: time,
														})
													}
													placeholder="e.g., 16:00 for 4PM"
													minuteStep={5}
												/>
												<p className="text-muted-foreground mt-1 text-xs">
													Orders after this time show a warning (e.g., 16:00 for 4PM)
												</p>
											</div>
											<div>
												<Label htmlFor="cutoffDaysOffset">Delivery Days Offset</Label>
												<Input
													id="cutoffDaysOffset"
													type="number"
													min="1"
													max="10"
													value={formData.checkoutCutoffDaysOffset}
													onChange={(e) =>
														setFormData({
															...formData,
															checkoutCutoffDaysOffset: parseInt(e.target.value) || 2,
														})
													}
												/>
												<p className="text-muted-foreground mt-1 text-xs">
													Days to add for late orders (default: 2)
												</p>
											</div>
										</div>
										<div>
											<Label htmlFor="cutoffMessage">Cutoff Warning Message</Label>
											<Textarea
												id="cutoffMessage"
												value={formData.checkoutCutoffMessage}
												onChange={(e) =>
													setFormData({
														...formData,
														checkoutCutoffMessage: e.target.value,
													})
												}
												rows={2}
												placeholder="e.g., Orders placed after 4PM will be processed tomorrow and delivered on {deliveryDate}"
											/>
											<p className="text-muted-foreground mt-1 text-xs">
												Use {`{deliveryDate}`} to show the calculated delivery date
											</p>
										</div>
									</div>

									{/* Custom Payment Options */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div>
												<Label>Custom Payment Options (Optional)</Label>
												<p className="text-muted-foreground text-sm">
													Add multiple payment methods for customers to choose from
												</p>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													setFormData({
														...formData,
														checkoutPaymentOptions: [
															...formData.checkoutPaymentOptions,
															{
																id: `payment-${Date.now()}`,
																title: `Payment Option ${formData.checkoutPaymentOptions.length + 1}`,
																instructions: "",
															},
														],
													});
												}}
											>
												<Plus className="mr-1 h-3 w-3" />
												Add Payment Option
											</Button>
										</div>
										{formData.checkoutPaymentOptions.length === 0 ? (
											<p className="text-muted-foreground text-sm">
												No payment options yet. Add options like different GCash numbers or bank
												accounts.
											</p>
										) : (
											<div className="space-y-3">
												{formData.checkoutPaymentOptions.map((option, index) => (
													<Card key={option.id}>
														<CardHeader className="pb-3">
															<div className="flex items-center justify-between">
																<Input
																	value={option.title}
																	onChange={(e) => {
																		const newOptions = [...formData.checkoutPaymentOptions];
																		newOptions[index] = {
																			...newOptions[index],
																			title: e.target.value,
																		};
																		setFormData({
																			...formData,
																			checkoutPaymentOptions: newOptions,
																		});
																	}}
																	placeholder="e.g., GCash - Juan Dela Cruz"
																	className="font-medium"
																/>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() => {
																		setFormData({
																			...formData,
																			checkoutPaymentOptions:
																				formData.checkoutPaymentOptions.filter(
																					(_, i) => i !== index,
																				),
																		});
																	}}
																	className="ml-2"
																>
																	<X className="h-4 w-4" />
																</Button>
															</div>
														</CardHeader>
														<CardContent className="space-y-3">
															<div>
																<Label className="text-xs">Payment Instructions</Label>
																<Textarea
																	value={option.instructions}
																	onChange={(e) => {
																		const newOptions = [...formData.checkoutPaymentOptions];
																		newOptions[index] = {
																			...newOptions[index],
																			instructions: e.target.value,
																		};
																		setFormData({
																			...formData,
																			checkoutPaymentOptions: newOptions,
																		});
																	}}
																	rows={2}
																	placeholder="e.g., Send payment to 09XX-XXX-XXXX"
																/>
															</div>
															<div>
																<Label className="text-xs">
																	QR Code / Payment Image (Optional)
																</Label>
																<div className="mt-2 flex items-start gap-3">
																	{option.imageUrl && (
																		<div className="relative">
																			{/* eslint-disable-next-line @next/next/no-img-element */}
																			<img
																				src={option.imageUrl}
																				alt="Payment QR"
																				className="h-32 w-32 rounded border object-contain"
																			/>
																			<button
																				type="button"
																				onClick={() => {
																					const newOptions = [...formData.checkoutPaymentOptions];
																					newOptions[index] = {
																						...newOptions[index],
																						imageUrl: undefined,
																					};
																					setFormData({
																						...formData,
																						checkoutPaymentOptions: newOptions,
																					});
																				}}
																				className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 rounded-full p-1"
																			>
																				<X className="h-3 w-3" />
																			</button>
																		</div>
																	)}
																	<div>
																		<Input
																			type="file"
																			accept="image/*"
																			onChange={async (e) => {
																				const file = e.target.files?.[0];
																				if (!file) return;

																				setUploading(true);
																				try {
																					const formDataUpload = new FormData();
																					formDataUpload.append("file", file);
																					formDataUpload.append("type", "payment");

																					const response = await fetch("/api/upload", {
																						method: "POST",
																						body: formDataUpload,
																					});

																					if (!response.ok) {
																						throw new Error("Upload failed");
																					}

																					const { url } = await response.json();

																					const newOptions = [...formData.checkoutPaymentOptions];
																					newOptions[index] = {
																						...newOptions[index],
																						imageUrl: url,
																					};
																					setFormData({
																						...formData,
																						checkoutPaymentOptions: newOptions,
																					});

																					toast.success("Image uploaded");
																				} catch {
																					toast.error("Failed to upload image");
																				} finally {
																					setUploading(false);
																					e.target.value = "";
																				}
																			}}
																			disabled={uploading}
																		/>
																		<p className="text-muted-foreground mt-1 text-xs">
																			Upload a QR code or payment instruction image
																		</p>
																	</div>
																</div>
															</div>
														</CardContent>
													</Card>
												))}
											</div>
										)}
									</div>

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
