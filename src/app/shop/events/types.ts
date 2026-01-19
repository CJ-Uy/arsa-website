// Types for custom event components

export type ThemeConfig = {
	primaryColor?: string;
	secondaryColor?: string;
	animation?: "confetti" | "hearts" | "snow" | "sparkles" | "petals" | "none";
	backgroundPattern?: string;
	tabGlow?: boolean;
	headerText?: string;
};

export type CheckoutField = {
	id: string;
	label: string;
	type: "text" | "textarea" | "select" | "checkbox" | "date";
	required: boolean;
	placeholder?: string;
	options?: string[];
	maxLength?: number;
};

export type CheckoutConfig = {
	headerMessage?: string;
	additionalFields: CheckoutField[];
	termsMessage?: string;
	confirmationMessage?: string;
};

export type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string | null;
	imageUrls: string[];
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
