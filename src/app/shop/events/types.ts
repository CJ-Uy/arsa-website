// Types for custom event components

export type ThemeConfig = {
	primaryColor?: string;
	secondaryColor?: string;
	animation?: "confetti" | "hearts" | "snow" | "sparkles" | "petals" | "none";
	backgroundPattern?: string;
	tabGlow?: boolean;
	headerText?: string;
};

// Column definition for repeater fields
export type RepeaterColumn = {
	id: string;
	label: string;
	type: "text" | "date" | "time" | "select";
	placeholder?: string;
	options?: string[]; // For select type
	width?: "sm" | "md" | "lg"; // Column width hint
};

// Conditional visibility - show field only when another field has specific value(s)
export type FieldCondition = {
	fieldId: string; // ID of the field to check
	value: string | string[]; // Value(s) that trigger showing this field
};

// All supported checkout field types
export type CheckoutFieldType =
	| "text" // Single line text input
	| "textarea" // Multi-line text area
	| "select" // Dropdown selection
	| "checkbox" // Single checkbox (yes/no)
	| "date" // Date picker
	| "time" // Time picker
	| "number" // Numeric input
	| "email" // Email with validation
	| "phone" // Phone number
	| "radio" // Radio button group
	| "repeater" // Multiple rows table
	| "message"; // Display-only informational message

export type CheckoutField = {
	id: string;
	label: string;
	type: CheckoutFieldType;
	required: boolean;
	placeholder?: string;
	options?: string[]; // For select, radio types
	maxLength?: number;
	// Number field constraints
	min?: number;
	max?: number;
	step?: number;
	// Conditional display
	showWhen?: FieldCondition; // Only show when condition is met
	// Message field content (for type: "message")
	messageContent?: string; // Rich text/markdown content to display
	// Repeater-specific fields
	columns?: RepeaterColumn[]; // Column definitions for repeater
	minRows?: number; // Minimum required rows (e.g., 3)
	maxRows?: number; // Optional maximum rows
	defaultRows?: number; // Initial row count
};

export type PaymentOption = {
	id: string;
	title: string; // e.g., "GCash - Juan Dela Cruz", "Bank Transfer - BDO"
	instructions: string; // Payment details
	imageUrl?: string; // QR code or payment instruction image
};

export type CheckoutConfig = {
	headerMessage?: string;
	additionalFields: CheckoutField[];
	termsMessage?: string;
	confirmationMessage?: string;
	// Delivery cutoff settings
	cutoffTime?: string; // Time in HH:MM format (24-hour), e.g., "16:00" for 4PM
	cutoffMessage?: string; // Message to show when past cutoff
	cutoffDaysOffset?: number; // Number of days to add to delivery (default: 2)
	// Custom payment instructions
	paymentOptions?: PaymentOption[]; // Multiple payment methods
};

export type CropPosition = {
	x: number;
	y: number;
};

export type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
	imageCropPositions: Record<string, CropPosition> | null;
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	availableSizes: string[];
};

export type PackageItem = {
	id: string;
	productId: string;
	quantity: number;
	product: Product;
};

export type PackagePoolOption = {
	id: string;
	productId: string;
	product: Product;
};

export type PackagePool = {
	id: string;
	name: string;
	selectCount: number;
	options: PackagePoolOption[];
};

export type Package = {
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

export type EventProduct = {
	id: string;
	productId: string | null;
	packageId: string | null;
	sortOrder: number;
	eventPrice: number | null;
	product: Product | null;
	package: Package | null;
};

export type ShopEvent = {
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
	checkoutConfig: CheckoutConfig | null;
	products: EventProduct[];
};

// Props passed to custom event components
export type EventComponentProps = {
	event: ShopEvent;
	products: Product[];
	packages: Package[];
	onAddToCart: (productId: string, size?: string) => Promise<void>;
	onOpenPackageModal: (pkg: Package) => void;
	session: any;
};

export type EventAnimationProps = {
	config: ThemeConfig;
	isActive: boolean;
};
