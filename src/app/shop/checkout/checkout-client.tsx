"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	Upload,
	Check,
	AlertCircle,
	Loader2,
	Gift,
	FileText,
	Calendar,
	Plus,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createOrder } from "../actions";
import { extractRefNumberFromPdf } from "../gcashActions";
import { toast } from "sonner";
import { parseGcashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

// Type for repeater row data
type RepeaterRowData = Record<string, string>;

type Product = {
	id: string;
	name: string;
	price: number;
	specialNote: string | null;
	sizePricing: Record<string, number> | null;
};

type Package = {
	id: string;
	name: string;
	price: number;
};

type CartItem = {
	id: string;
	quantity: number;
	size: string | null;
	productId: string | null;
	packageId: string | null;
	product: Product | null;
	package: Package | null;
};

type User = {
	id: string;
	name: string | null;
	firstName: string | null;
	lastName: string | null;
	studentId: string | null;
	email: string;
};

type RepeaterColumn = {
	id: string;
	label: string;
	type: "text" | "textarea" | "number" | "date" | "time" | "select" | "checkbox";
	placeholder?: string;
	options?: string[];
	width?: "sm" | "md" | "lg";
	// Number constraints
	min?: number;
	max?: number;
	step?: number;
	// Date/Time constraints for date and time columns
	minDate?: string;
	maxDate?: string;
	disabledDates?: string[];
	minDateOffset?: number; // Days from today
	maxDateOffset?: number; // Days from today
	minTime?: string;
	maxTime?: string;
	blockedTimes?: string[];
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
	| "message"
	| "toggle";

type CheckoutField = {
	id: string;
	label: string;
	type: CheckoutFieldType;
	required: boolean;
	placeholder?: string;
	options?: string[];
	maxLength?: number;
	// Number field constraints
	min?: number;
	max?: number;
	step?: number;
	// Date/Time field constraints
	minDate?: string;
	maxDate?: string;
	disabledDates?: string[];
	minDateOffset?: number; // Days from today
	maxDateOffset?: number; // Days from today
	disabledTimeSlots?: { date: string; times: string[] }[];
	// Conditional display
	showWhen?: FieldCondition;
	// Message content (for type: "message")
	messageContent?: string;
	// Toggle field properties
	toggleOffMessage?: string; // Message shown when toggle is off
	toggleOnMessage?: string; // Message shown when toggle is on
	// Description for any field type
	description?: string; // Help text shown below the field
	// Repeater-specific fields
	columns?: RepeaterColumn[];
	minRows?: number;
	maxRows?: number;
	defaultRows?: number;
	rowLabel?: string; // Custom row label prefix (e.g., "Attempt" for "Attempt #1")
	autoSortByDateTime?: boolean; // Auto-sort rows by date and time columns
};

type PaymentOption = {
	id: string;
	title: string;
	instructions: string;
	imageUrl?: string;
};

type CheckoutConfig = {
	headerMessage?: string;
	additionalFields: CheckoutField[];
	termsMessage?: string;
	confirmationMessage?: string;
	cutoffTime?: string;
	cutoffMessage?: string;
	cutoffDaysOffset?: number;
	paymentOptions?: PaymentOption[];
};

type EventInfo = {
	id: string;
	name: string;
	checkoutConfig: CheckoutConfig | null;
} | null;

type CheckoutClientProps = {
	cart: CartItem[];
	user: User;
	event?: EventInfo;
};

export function CheckoutClient({ cart, user, event }: CheckoutClientProps) {
	const router = useRouter();
	const [firstName, setFirstName] = useState(user.firstName || "");
	const [lastName, setLastName] = useState(user.lastName || "");
	const [studentId, setStudentId] = useState(user.studentId || "");
	const [receiptFile, setReceiptFile] = useState<File | null>(null);
	const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(false);
	const [gcashRefNumber, setGcashRefNumber] = useState<string | null>(null);
	const [extractingRefNumber, setExtractingRefNumber] = useState(false);
	const [selectedPaymentOption, setSelectedPaymentOption] = useState<string | null>(null);

	// Helper to get correct product price based on size
	const getProductPrice = (item: CartItem) => {
		if (!item.product) return 0;

		// Check for size-specific pricing
		if (item.size && item.product.sizePricing) {
			const sizePrice = item.product.sizePricing[item.size];
			if (sizePrice) {
				return sizePrice;
			}
		}

		// Fall back to base price
		return item.product.price;
	};

	// Check if past delivery cutoff time
	const checkCutoffWarning = () => {
		const cutoffConfig = event?.checkoutConfig;
		if (!cutoffConfig?.cutoffTime || !cutoffConfig?.cutoffMessage) return null;

		const now = new Date();
		const [hours, minutes] = cutoffConfig.cutoffTime.split(":").map(Number);
		const cutoffToday = new Date(now);
		cutoffToday.setHours(hours, minutes, 0, 0);

		if (now > cutoffToday) {
			// Past cutoff - calculate delivery date
			const daysOffset = cutoffConfig.cutoffDaysOffset || 2;
			const deliveryDate = new Date(now);
			deliveryDate.setDate(deliveryDate.getDate() + daysOffset);

			const formattedDate = deliveryDate.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			});

			// Replace {deliveryDate} placeholder in message
			const message = cutoffConfig.cutoffMessage.replace("{deliveryDate}", formattedDate);
			return message;
		}

		return null;
	};

	const cutoffWarning = checkCutoffWarning();

	// Event-specific field values
	const [eventFieldValues, setEventFieldValues] = useState<Record<string, string | boolean>>({});

	// Repeater field values (stored separately as arrays of row objects)
	const [repeaterValues, setRepeaterValues] = useState<Record<string, RepeaterRowData[]>>(() => {
		// Initialize with default rows for each repeater field
		const initial: Record<string, RepeaterRowData[]> = {};
		const fields = event?.checkoutConfig?.additionalFields || [];
		fields.forEach((field) => {
			if (field.type === "repeater") {
				const defaultRows = field.defaultRows || field.minRows || 1;
				initial[field.id] = Array(defaultRows)
					.fill(null)
					.map(() => ({}));
			}
		});
		return initial;
	});

	// Track if we've loaded from localStorage
	const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

	// localStorage key based on event ID
	const storageKey = `checkout-form-${event?.id || "default"}`;

	// Load saved form data from localStorage on mount
	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				const data = JSON.parse(saved);

				// Only restore if saved within last 24 hours
				if (data.savedAt && Date.now() - data.savedAt < 24 * 60 * 60 * 1000) {
					// Restore form fields (prefer user data from server if it exists)
					if (data.firstName && !user.firstName) setFirstName(data.firstName);
					if (data.lastName && !user.lastName) setLastName(data.lastName);
					if (data.studentId && !user.studentId) setStudentId(data.studentId);
					if (data.notes) setNotes(data.notes);
					if (data.selectedPaymentOption) setSelectedPaymentOption(data.selectedPaymentOption);

					// Restore event-specific fields
					if (data.eventFieldValues) {
						setEventFieldValues(data.eventFieldValues);
					}

					// Restore repeater values (merge with defaults to handle new columns)
					if (data.repeaterValues) {
						setRepeaterValues((prev) => {
							const merged = { ...prev };
							for (const fieldId of Object.keys(data.repeaterValues)) {
								if (merged[fieldId] !== undefined) {
									merged[fieldId] = data.repeaterValues[fieldId];
								}
							}
							return merged;
						});
					}

					toast.info("Form data restored from your previous session");
				} else {
					// Data is too old, clear it
					localStorage.removeItem(storageKey);
				}
			}
		} catch (error) {
			console.error("Error loading checkout form data:", error);
		}

		setHasLoadedFromStorage(true);
	}, [storageKey, user.firstName, user.lastName, user.studentId]);

	// Save form data to localStorage whenever it changes
	const saveToLocalStorage = useCallback(() => {
		if (typeof window === "undefined" || !hasLoadedFromStorage) return;

		try {
			const data = {
				firstName,
				lastName,
				studentId,
				notes,
				selectedPaymentOption,
				eventFieldValues,
				repeaterValues,
				savedAt: Date.now(),
			};
			localStorage.setItem(storageKey, JSON.stringify(data));
		} catch (error) {
			console.error("Error saving checkout form data:", error);
		}
	}, [
		firstName,
		lastName,
		studentId,
		notes,
		selectedPaymentOption,
		eventFieldValues,
		repeaterValues,
		storageKey,
		hasLoadedFromStorage,
	]);

	// Debounce saving to localStorage
	useEffect(() => {
		const timer = setTimeout(saveToLocalStorage, 500);
		return () => clearTimeout(timer);
	}, [saveToLocalStorage]);

	// Clear localStorage on successful order
	const clearSavedFormData = useCallback(() => {
		if (typeof window === "undefined") return;
		localStorage.removeItem(storageKey);
	}, [storageKey]);

	// Calculate total including both products and packages
	const total = cart.reduce((sum, item) => {
		if (item.product) {
			return sum + getProductPrice(item) * item.quantity;
		} else if (item.package) {
			return sum + item.package.price * item.quantity;
		}
		return sum;
	}, 0);

	// Get checkout config from event
	const checkoutConfig = event?.checkoutConfig;
	const additionalFields = checkoutConfig?.additionalFields || [];

	// Update event field value
	const updateEventField = (fieldId: string, value: string | boolean) => {
		setEventFieldValues((prev) => ({ ...prev, [fieldId]: value }));
	};

	// Repeater helper functions
	const addRepeaterRow = (fieldId: string, maxRows?: number) => {
		setRepeaterValues((prev) => {
			const currentRows = prev[fieldId] || [];
			if (maxRows && currentRows.length >= maxRows) {
				toast.error(`Maximum ${maxRows} rows allowed`);
				return prev;
			}
			return { ...prev, [fieldId]: [...currentRows, {}] };
		});
	};

	const removeRepeaterRow = (fieldId: string, rowIndex: number, minRows?: number) => {
		setRepeaterValues((prev) => {
			const currentRows = prev[fieldId] || [];
			if (minRows && currentRows.length <= minRows) {
				toast.error(`Minimum ${minRows} rows required`);
				return prev;
			}
			return { ...prev, [fieldId]: currentRows.filter((_, i) => i !== rowIndex) };
		});
	};

	// Helper function to compute effective date with offset
	const computeEffectiveDate = (
		baseDate: string | undefined,
		offset: number | undefined,
		mode: "min" | "max",
	): Date | undefined => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let effectiveDate: Date | undefined;

		// Calculate offset date if offset is defined
		const offsetDate =
			offset !== undefined ? new Date(today.getTime() + offset * 24 * 60 * 60 * 1000) : undefined;

		// Parse base date if defined
		const baseDateParsed = baseDate ? new Date(baseDate) : undefined;

		if (mode === "min") {
			// For min: take the later of base date and offset date
			if (baseDateParsed && offsetDate) {
				effectiveDate = baseDateParsed > offsetDate ? baseDateParsed : offsetDate;
			} else {
				effectiveDate = baseDateParsed || offsetDate;
			}
		} else {
			// For max: take the earlier of base date and offset date
			if (baseDateParsed && offsetDate) {
				effectiveDate = baseDateParsed < offsetDate ? baseDateParsed : offsetDate;
			} else {
				effectiveDate = baseDateParsed || offsetDate;
			}
		}

		return effectiveDate;
	};

	// Helper function to sort repeater rows by date and time columns
	const sortRepeaterRows = (
		rows: RepeaterRowData[],
		columns: RepeaterColumn[],
	): RepeaterRowData[] => {
		// Find date and time columns
		const dateColumn = columns.find((col) => col.type === "date");
		const timeColumn = columns.find((col) => col.type === "time");

		if (!dateColumn && !timeColumn) return rows;

		return [...rows].sort((a, b) => {
			// First compare by date if available
			if (dateColumn) {
				const dateA = a[dateColumn.id] || "";
				const dateB = b[dateColumn.id] || "";
				if (dateA !== dateB) {
					return dateA.localeCompare(dateB);
				}
			}
			// Then compare by time if available
			if (timeColumn) {
				const timeA = a[timeColumn.id] || "";
				const timeB = b[timeColumn.id] || "";
				return timeA.localeCompare(timeB);
			}
			return 0;
		});
	};

	const updateRepeaterCell = (
		fieldId: string,
		rowIndex: number,
		columnId: string,
		value: string,
		autoSort?: boolean,
		columns?: RepeaterColumn[],
	) => {
		setRepeaterValues((prev) => {
			const currentRows = [...(prev[fieldId] || [])];
			currentRows[rowIndex] = { ...currentRows[rowIndex], [columnId]: value };

			// Auto-sort if enabled and columns are provided
			if (autoSort && columns) {
				const sortedRows = sortRepeaterRows(currentRows, columns);
				return { ...prev, [fieldId]: sortedRows };
			}

			return { ...prev, [fieldId]: currentRows };
		});
	};

	// Check if a field should be visible based on conditional logic
	const isFieldVisible = (field: CheckoutField): boolean => {
		if (!field.showWhen) return true;

		const { fieldId, value } = field.showWhen;
		const currentValue = eventFieldValues[fieldId];

		if (Array.isArray(value)) {
			return value.includes(currentValue as string);
		}
		return currentValue === value;
	};

	// Parse markdown links [text](url) and newlines into JSX elements
	const parseMarkdownLinks = (text: string) => {
		const parts: (string | JSX.Element)[] = [];
		let keyCounter = 0;

		// Split only by actual newline characters (from pressing Enter in textarea)
		const lines = text.split(/\n/);

		lines.forEach((line, lineIndex) => {
			// Parse markdown links in this line
			const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
			let lastIndex = 0;
			let match;

			while ((match = linkRegex.exec(line)) !== null) {
				// Add text before the link
				if (match.index > lastIndex) {
					parts.push(line.slice(lastIndex, match.index));
				}
				// Add the link
				parts.push(
					<a
						key={`link-${keyCounter++}`}
						href={match[2]}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:text-primary/80 inline underline"
					>
						{match[1]}
					</a>,
				);
				lastIndex = match.index + match[0].length;
			}

			// Add remaining text after last link in this line
			if (lastIndex < line.length) {
				parts.push(line.slice(lastIndex));
			}

			// Add line break between lines (but not after the last line)
			if (lineIndex < lines.length - 1) {
				parts.push(<br key={`br-${keyCounter++}`} />);
			}
		});

		return parts.length > 0 ? <span className="inline">{parts}</span> : text;
	};

	// Collect all unique special notes from cart items (only from products)
	const specialNotes = Array.from(
		new Set(
			cart.filter((item) => item.product?.specialNote).map((item) => item.product!.specialNote!),
		),
	);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Accept both images and PDFs
			const isPDF = file.type === "application/pdf";
			const isImage = file.type.startsWith("image/");

			if (!isImage && !isPDF) {
				toast.error("Please upload an image or PDF file");
				return;
			}
			if (file.size > 20 * 1024 * 1024) {
				toast.error("File size must be less than 20MB");
				return;
			}

			setReceiptFile(file);

			// Only show preview for images
			if (isImage) {
				const reader = new FileReader();
				reader.onloadend = () => {
					setReceiptPreview(reader.result as string);
				};
				reader.readAsDataURL(file);
			} else {
				setReceiptPreview(null); // No preview for PDFs
			}

			// Auto-extract GCash reference number
			setExtractingRefNumber(true);
			toast.loading("Extracting GCash reference number...");
			try {
				if (isImage) {
					// OCR for images
					const receiptData = await parseGcashReceiptClient(file);
					if (receiptData.referenceNumber) {
						setGcashRefNumber(receiptData.referenceNumber);
						toast.dismiss();
						toast.success(`Reference number extracted: ${receiptData.referenceNumber}`);
					} else {
						toast.dismiss();
						toast.warning(
							"Could not extract reference number. You may still place the order but please ensure receipt is clear.",
						);
					}
				} else if (isPDF) {
					// For PDFs, extract server-side
					const pdfFormData = new FormData();
					pdfFormData.append("pdfFile", file);
					pdfFormData.append("password", "");

					const result = await extractRefNumberFromPdf(pdfFormData);
					if (result.success && result.referenceNumber) {
						setGcashRefNumber(result.referenceNumber);
						toast.dismiss();
						toast.success(
							`Reference number extracted from PDF: ${result.referenceNumber} (${result.transactionCount} transactions found)`,
						);
					} else {
						toast.dismiss();
						if (result.message?.includes("password")) {
							toast.error(
								"PDF is password protected. Please use an image receipt or contact support.",
							);
						} else {
							toast.warning(result.message || "Could not extract reference number from PDF.");
						}
					}
				}
			} catch (error) {
				console.error("OCR error:", error);
				toast.dismiss();
				toast.warning("Could not extract reference number automatically.");
			} finally {
				setExtractingRefNumber(false);
			}
		}
	};

	const isFormValid = useCallback(() => {
		if (!firstName.trim() || !lastName.trim()) {
			return false;
		}

		if (!receiptFile) {
			return false;
		}

		for (const field of additionalFields) {
			if (isFieldVisible(field) && field.required) {
				if (field.type === "repeater") {
					const rows = repeaterValues[field.id] || [];
					const minRows = field.minRows || 1;
					if (rows.length < minRows) {
						return false;
					}
					for (const row of rows) {
						for (const col of field.columns || []) {
							if (!row[col.id] || String(row[col.id]).trim() === "") {
								return false;
							}
						}
					}
				} else if (field.type === "checkbox") {
					if (!eventFieldValues[field.id]) {
						return false;
					}
				} else {
					const value = eventFieldValues[field.id];
					if (!value || (typeof value === "string" && !value.trim())) {
						return false;
					}
				}
			}
		}

		return true;
	}, [
		firstName,
		lastName,
		receiptFile,
		additionalFields,
		eventFieldValues,
		repeaterValues,
		isFieldVisible,
	]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!firstName.trim() || !lastName.trim()) {
			toast.error("Please provide your first and last name for delivery");
			return;
		}

		// Student ID validation removed - accepting any format

		// Validate required event fields (only if visible and not a message)
		for (const field of additionalFields) {
			// Skip validation for message fields (display only) or hidden fields
			if (field.type === "message" || !isFieldVisible(field)) {
				continue;
			}

			if (field.required) {
				if (field.type === "repeater") {
					// Validate repeater fields
					const rows = repeaterValues[field.id] || [];
					const minRows = field.minRows || 1;
					if (rows.length < minRows) {
						toast.error(`"${field.label}" requires at least ${minRows} row(s)`);
						return;
					}
					// Check if all required columns are filled
					for (let i = 0; i < rows.length; i++) {
						for (const col of field.columns || []) {
							if (!rows[i][col.id] || !rows[i][col.id].trim()) {
								toast.error(`Please fill in all fields in "${field.label}" row ${i + 1}`);
								return;
							}
						}
					}
				} else if (field.type === "checkbox") {
					const value = eventFieldValues[field.id];
					if (value !== true) {
						toast.error(`Please check "${field.label}"`);
						return;
					}
				} else {
					const value = eventFieldValues[field.id];
					if (!value || (typeof value === "string" && !value.trim())) {
						toast.error(`Please fill in "${field.label}"`);
						return;
					}
				}
			}
		}

		// For PDF receipts, we allow submission without preview
		const hasPdfReceipt = receiptFile && receiptFile.type === "application/pdf";
		if (!receiptFile || (!receiptPreview && !hasPdfReceipt)) {
			toast.error("Please upload a receipt");
			return;
		}

		setLoading(true);

		try {
			// Upload receipt to MinIO
			const formData = new FormData();
			formData.append("file", receiptFile);
			formData.append("type", "receipt");

			const uploadResponse = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!uploadResponse.ok) {
				toast.error("Failed to upload receipt");
				setLoading(false);
				return;
			}

			const { url: receiptUrl } = await uploadResponse.json();

			// Build event data if present (only include visible fields, skip message fields)
			const eventData = event
				? {
						eventName: event.name,
						fields: additionalFields.reduce(
							(acc, field) => {
								// Skip message fields and hidden fields
								if (field.type === "message" || !isFieldVisible(field)) {
									return acc;
								}
								if (field.type === "repeater") {
									// For repeaters, include the array of row data
									acc[field.label] = repeaterValues[field.id] || [];
								} else {
									acc[field.label] = eventFieldValues[field.id] ?? "";
								}
								return acc;
							},
							{} as Record<string, string | boolean | RepeaterRowData[]>,
						),
					}
				: undefined;

			// Create order with the MinIO URL, user info, GCash reference number, and event data
			const result = await createOrder(
				receiptUrl,
				notes || undefined,
				firstName.trim(),
				lastName.trim(),
				studentId.trim() || undefined,
				gcashRefNumber || undefined,
				event?.id,
				eventData,
			);

			if (result.success) {
				// Notify cart counter that cart is now empty
				window.dispatchEvent(new Event("cartUpdated"));

				// Clear saved form data from localStorage
				clearSavedFormData();

				const successMessage = checkoutConfig?.confirmationMessage || "Order placed successfully!";
				toast.success(successMessage);
				router.push(`/shop/orders/${result.orderId}`);
			} else {
				toast.error(result.message || "Failed to create order");
			}
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error("An error occurred during checkout");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Customer Information</CardTitle>
							<CardDescription>Please provide your information</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<Label htmlFor="firstName">First Name *</Label>
									<Input
										id="firstName"
										type="text"
										placeholder="Juan"
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										required
										className="mt-2"
									/>
								</div>
								<div>
									<Label htmlFor="lastName">Last Name *</Label>
									<Input
										id="lastName"
										type="text"
										placeholder="Dela Cruz"
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										required
										className="mt-2"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="studentId">Student ID (Optional)</Label>
								<Input
									id="studentId"
									type="text"
									placeholder="e.g., 212345, 2012-12345"
									value={studentId}
									onChange={(e) => setStudentId(e.target.value)}
									className="mt-2"
								/>
							</div>
							<div>
								<Label>Email</Label>
								<p className="mt-1 text-sm font-medium">{user.email}</p>
							</div>
						</CardContent>
					</Card>

					{/* Event-specific fields */}
					{event && additionalFields.length > 0 && (
						<Card className="border-primary/20 border-2">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Gift className="h-5 w-5" />
									{event.name} Details
								</CardTitle>
								{checkoutConfig?.headerMessage && (
									<CardDescription>
										{parseMarkdownLinks(checkoutConfig.headerMessage)}
									</CardDescription>
								)}
								{checkoutConfig?.termsMessage && (
									<Alert className="mt-3 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
										<AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
										<AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
											{parseMarkdownLinks(checkoutConfig.termsMessage)}
										</AlertDescription>
									</Alert>
								)}
								{cutoffWarning && (
									<Alert className="mt-3 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
										<AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
										<AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
											{cutoffWarning}
										</AlertDescription>
									</Alert>
								)}
							</CardHeader>
							<CardContent className="space-y-4">
								{additionalFields.map((field) => {
									// Check if field should be visible
									if (!isFieldVisible(field)) return null;

									return (
										<div key={field.id}>
											{field.type !== "message" && (
												<Label htmlFor={field.id}>
													{field.label}
													{field.required && " *"}
												</Label>
											)}

											{field.type === "message" && field.messageContent && (
												<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
													<p className="text-sm text-blue-800 dark:text-blue-200">
														{parseMarkdownLinks(field.messageContent)}
													</p>
												</div>
											)}

											{field.type === "text" && (
												<div className="space-y-1">
													<Input
														id={field.id}
														type="text"
														placeholder={field.placeholder}
														value={(eventFieldValues[field.id] as string) || ""}
														onChange={(e) => updateEventField(field.id, e.target.value)}
														maxLength={field.maxLength}
														required={field.required}
														className="mt-2"
													/>
													{field.description && (
														<p className="text-muted-foreground mt-1 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
													{field.maxLength && (
														<p className="text-muted-foreground text-right text-xs">
															{((eventFieldValues[field.id] as string) || "").length} /{" "}
															{field.maxLength} characters
														</p>
													)}
												</div>
											)}

											{field.type === "textarea" && (
												<div className="space-y-1">
													<Textarea
														id={field.id}
														placeholder={field.placeholder}
														value={(eventFieldValues[field.id] as string) || ""}
														onChange={(e) => updateEventField(field.id, e.target.value)}
														maxLength={field.maxLength}
														required={field.required}
														rows={3}
														className="mt-2"
													/>
													{field.description && (
														<p className="text-muted-foreground mt-1 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
													{field.maxLength && (
														<p className="text-muted-foreground text-right text-xs">
															{((eventFieldValues[field.id] as string) || "").length} /{" "}
															{field.maxLength} characters
														</p>
													)}
												</div>
											)}

											{field.type === "select" && field.options && (
												<div className="space-y-1">
													<Select
														value={(eventFieldValues[field.id] as string) || ""}
														onValueChange={(value) => updateEventField(field.id, value)}
													>
														<SelectTrigger className="mt-2">
															<SelectValue placeholder={field.placeholder || "Select an option"} />
														</SelectTrigger>
														<SelectContent>
															{field.options.map((option) => (
																<SelectItem key={option} value={option}>
																	{option}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													{field.description && (
														<p className="text-muted-foreground mt-1 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "checkbox" && (
												<div className="mt-2 space-y-1">
													<div className="flex items-center gap-2">
														<Checkbox
															id={field.id}
															checked={(eventFieldValues[field.id] as boolean) || false}
															onCheckedChange={(checked) => updateEventField(field.id, !!checked)}
														/>
														<Label htmlFor={field.id} className="cursor-pointer font-normal">
															{field.placeholder || field.label}
														</Label>
													</div>
													{field.description && (
														<p className="text-muted-foreground ml-6 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "toggle" && (
												<div className="mt-2 space-y-1">
													<div className="flex items-center gap-3">
														<button
															type="button"
															role="switch"
															aria-checked={(eventFieldValues[field.id] as boolean) || false}
															onClick={() =>
																updateEventField(field.id, !eventFieldValues[field.id])
															}
															className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
																eventFieldValues[field.id]
																	? "bg-primary"
																	: "bg-gray-200 dark:bg-gray-700"
															}`}
														>
															<span
																className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
																	eventFieldValues[field.id] ? "translate-x-5" : "translate-x-0"
																}`}
															/>
														</button>
														<span
															className={`text-sm ${
																eventFieldValues[field.id]
																	? "text-primary font-medium"
																	: "text-muted-foreground"
															}`}
														>
															{eventFieldValues[field.id]
																? field.toggleOnMessage || "Enabled"
																: field.toggleOffMessage || "Disabled"}
														</span>
													</div>
													{field.description && (
														<p className="text-muted-foreground text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "date" && (
												<div className="mt-2 space-y-1">
													<DatePicker
														value={
															eventFieldValues[field.id]
																? new Date(eventFieldValues[field.id] as string)
																: undefined
														}
														onChange={(date) =>
															updateEventField(
																field.id,
																date
																	? date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
																	: "",
															)
														}
														placeholder={field.placeholder || "Select date"}
														minDate={computeEffectiveDate(
															field.minDate,
															field.minDateOffset,
															"min",
														)}
														maxDate={computeEffectiveDate(
															field.maxDate,
															field.maxDateOffset,
															"max",
														)}
														disabledDates={
															field.disabledDates
																? field.disabledDates.map((d) => new Date(d))
																: undefined
														}
													/>
													{field.description && (
														<p className="text-muted-foreground text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "time" && (
												<div className="mt-2 space-y-1">
													<TimePicker
														value={
															eventFieldValues[field.id]
																? (eventFieldValues[field.id] as string)
																: ""
														}
														onChange={(time) => updateEventField(field.id, time)}
													/>
													{field.description && (
														<p className="text-muted-foreground text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "number" && (
												<div className="space-y-1">
													<Input
														id={field.id}
														type="number"
														placeholder={field.placeholder}
														value={(eventFieldValues[field.id] as string) || ""}
														onChange={(e) => updateEventField(field.id, e.target.value)}
														min={field.min}
														max={field.max}
														step={field.step}
														required={field.required}
														className="mt-2"
													/>
													{field.description && (
														<p className="text-muted-foreground mt-1 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "email" && (
												<div className="space-y-1">
													<Input
														id={field.id}
														type="email"
														placeholder={field.placeholder || "email@example.com"}
														value={(eventFieldValues[field.id] as string) || ""}
														onChange={(e) => updateEventField(field.id, e.target.value)}
														required={field.required}
														className="mt-2"
													/>
													{field.description && (
														<p className="text-muted-foreground mt-1 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "phone" && (
												<div className="space-y-1">
													<Input
														id={field.id}
														type="tel"
														placeholder={field.placeholder || "+63 XXX XXX XXXX"}
														value={(eventFieldValues[field.id] as string) || ""}
														onChange={(e) => updateEventField(field.id, e.target.value)}
														required={field.required}
														className="mt-2"
													/>
													{field.description && (
														<p className="text-muted-foreground mt-1 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "radio" && field.options && (
												<div className="space-y-1">
													<RadioGroup
														value={(eventFieldValues[field.id] as string) || ""}
														onValueChange={(value) => updateEventField(field.id, value)}
														className="mt-2 space-y-2"
													>
														{field.options.map((option) => (
															<div key={option} className="flex items-center space-x-2">
																<RadioGroupItem value={option} id={`${field.id}-${option}`} />
																<Label
																	htmlFor={`${field.id}-${option}`}
																	className="cursor-pointer font-normal"
																>
																	{option}
																</Label>
															</div>
														))}
													</RadioGroup>
													{field.description && (
														<p className="text-muted-foreground mt-1 text-xs">
															{parseMarkdownLinks(field.description)}
														</p>
													)}
												</div>
											)}

											{field.type === "repeater" && field.columns && (
												<div className="mt-3 space-y-3">
													{/* Description */}
													{field.description && (
														<p className="text-muted-foreground text-sm">
															{parseMarkdownLinks(field.description)}
														</p>
													)}

													{/* Auto-sort indicator */}
													{field.autoSortByDateTime && (
														<p className="text-muted-foreground text-xs italic">
															Entries will be automatically sorted chronologically
														</p>
													)}

													{/* Column headers for desktop */}
													<div className="hidden gap-2 md:flex">
														{field.columns.map((col) => (
															<div key={col.id} className="flex-1 text-sm font-medium">
																{col.label}
															</div>
														))}
														<div className="w-10"></div>
													</div>

													{/* Rows */}
													{(repeaterValues[field.id] || []).map((row, rowIndex) => (
														<div
															key={rowIndex}
															className="rounded-lg border bg-slate-50 p-3 md:flex md:items-center md:gap-2 md:bg-transparent md:p-0 dark:bg-slate-900 dark:md:bg-transparent"
														>
															{/* Mobile: Show row number with custom label */}
															<div className="mb-2 flex items-center justify-between md:hidden">
																<span className="text-muted-foreground text-sm font-medium">
																	{field.rowLabel || "Entry"} #{rowIndex + 1}
																</span>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		removeRepeaterRow(field.id, rowIndex, field.minRows)
																	}
																	disabled={
																		(repeaterValues[field.id]?.length || 0) <= (field.minRows || 1)
																	}
																	className="text-destructive hover:text-destructive h-8 w-8 p-0"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>

															{field.columns?.map((col) => (
																<div key={col.id} className="mb-2 md:mb-0 md:flex-1">
																	{/* Mobile label */}
																	<label className="text-muted-foreground mb-1 block text-xs md:hidden">
																		{col.label}
																	</label>

																	{col.type === "text" && (
																		<Input
																			value={row[col.id] || ""}
																			onChange={(e) =>
																				updateRepeaterCell(
																					field.id,
																					rowIndex,
																					col.id,
																					e.target.value,
																					field.autoSortByDateTime,
																					field.columns,
																				)
																			}
																			placeholder={col.placeholder || col.label}
																		/>
																	)}

																	{col.type === "date" && (
																		<DatePicker
																			value={row[col.id] ? new Date(row[col.id]) : undefined}
																			onChange={(date) =>
																				updateRepeaterCell(
																					field.id,
																					rowIndex,
																					col.id,
																					date
																						? date.toLocaleDateString("en-CA", {
																								timeZone: "Asia/Manila",
																							})
																						: "",
																					field.autoSortByDateTime,
																					field.columns,
																				)
																			}
																			placeholder={col.placeholder || "Select date"}
																			minDate={computeEffectiveDate(
																				col.minDate,
																				col.minDateOffset,
																				"min",
																			)}
																			maxDate={computeEffectiveDate(
																				col.maxDate,
																				col.maxDateOffset,
																				"max",
																			)}
																			disabledDates={
																				col.disabledDates?.map((d) => new Date(d)) || undefined
																			}
																		/>
																	)}

																	{col.type === "time" && (
																		<TimePicker
																			value={row[col.id] || ""}
																			onChange={(time) =>
																				updateRepeaterCell(
																					field.id,
																					rowIndex,
																					col.id,
																					time,
																					false, // Don't sort on partial selection
																					field.columns,
																				)
																			}
																			onComplete={(time) => {
																				// Only sort when full time is selected
																				if (field.autoSortByDateTime) {
																					updateRepeaterCell(
																						field.id,
																						rowIndex,
																						col.id,
																						time,
																						true,
																						field.columns,
																					);
																				}
																			}}
																			placeholder={col.placeholder || "Select time"}
																			minTime={col.minTime}
																			maxTime={col.maxTime}
																		/>
																	)}

																	{col.type === "select" && col.options && (
																		<Select
																			value={row[col.id] || ""}
																			onValueChange={(value) =>
																				updateRepeaterCell(
																					field.id,
																					rowIndex,
																					col.id,
																					value,
																					field.autoSortByDateTime,
																					field.columns,
																				)
																			}
																		>
																			<SelectTrigger>
																				<SelectValue placeholder={col.placeholder || "Select..."} />
																			</SelectTrigger>
																			<SelectContent>
																				{col.options.map((opt) => (
																					<SelectItem key={opt} value={opt}>
																						{opt}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																	)}
																</div>
															))}

															{/* Desktop delete button */}
															<Button
																type="button"
																variant="ghost"
																size="icon"
																onClick={() => removeRepeaterRow(field.id, rowIndex, field.minRows)}
																disabled={
																	(repeaterValues[field.id]?.length || 0) <= (field.minRows || 1)
																}
																className="text-destructive hover:text-destructive hidden h-10 w-10 md:flex"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													))}

													{/* Add row button */}
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => addRepeaterRow(field.id, field.maxRows)}
														disabled={
															(repeaterValues[field.id]?.length || 0) >= (field.maxRows || 50)
														}
														className="w-full"
													>
														<Plus className="mr-2 h-4 w-4" />
														Add {field.rowLabel || "Entry"}
														{field.minRows && (
															<span className="text-muted-foreground ml-2 text-xs">
																(min: {field.minRows})
															</span>
														)}
													</Button>
												</div>
											)}
										</div>
									);
								})}
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle>Payment Instructions</CardTitle>
							<CardDescription>
								{event?.checkoutConfig?.paymentOptions &&
								event.checkoutConfig.paymentOptions.length > 0
									? "Choose a payment method and complete your payment"
									: "Please follow these steps to complete your payment"}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{event?.checkoutConfig?.paymentOptions &&
							event.checkoutConfig.paymentOptions.length > 0 ? (
								<>
									{/* Custom Payment Options - Radio buttons */}
									<div className="space-y-2">
										<p className="text-sm font-medium">Select Payment Method</p>
										<RadioGroup
											value={selectedPaymentOption || ""}
											onValueChange={setSelectedPaymentOption}
											className="space-y-2"
										>
											{event.checkoutConfig.paymentOptions.map((option) => (
												<div
													key={option.id}
													className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
														selectedPaymentOption === option.id
															? "border-primary bg-primary/5"
															: "hover:border-primary/50"
													}`}
												>
													<RadioGroupItem value={option.id} id={option.id} />
													<Label htmlFor={option.id} className="flex-1 cursor-pointer font-medium">
														{option.title}
													</Label>
												</div>
											))}
										</RadioGroup>
									</div>

									{/* Selected Payment Option Details */}
									{selectedPaymentOption &&
										(() => {
											const selectedOption = event.checkoutConfig?.paymentOptions?.find(
												(o) => o.id === selectedPaymentOption,
											);
											if (!selectedOption) return null;
											return (
												<div className="space-y-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
													<p className="font-medium">{selectedOption.title}</p>
													<p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
														{selectedOption.instructions}
													</p>
													{selectedOption.imageUrl && (
														<div className="rounded-lg border-2 bg-white p-3">
															{/* eslint-disable-next-line @next/next/no-img-element */}
															<img
																src={selectedOption.imageUrl}
																alt={`${selectedOption.title} QR Code`}
																className="w-full object-contain"
															/>
														</div>
													)}
												</div>
											);
										})()}

									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											<ol className="mt-2 list-inside list-decimal space-y-2">
												<li>Select a payment method above</li>
												<li>Send ₱{total.toFixed(2)} using the selected method</li>
												<li>Take a screenshot of the receipt</li>
												<li>Upload the screenshot below</li>
												<li>Click "Place Order"</li>
											</ol>
										</AlertDescription>
									</Alert>
								</>
							) : (
								<>
									{/* Default GCash Payment Instructions */}
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											<ol className="mt-2 list-inside list-decimal space-y-2">
												<li>
													Send ₱{total.toFixed(2)} via GCash using the QR code below or to:{" "}
													<strong>0916 361 1002</strong>
												</li>
												<li>Take a screenshot of the receipt</li>
												<li>Upload the screenshot below</li>
												<li>Add any special instructions (optional)</li>
												<li>Click "Place Order"</li>
											</ol>
										</AlertDescription>
									</Alert>

									{/* Default GCash QR Code */}
									<div className="rounded-lg border-2 bg-white p-3">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src="/images/gcash_qr.jpg"
											alt="GCash QR Code"
											className="w-full object-contain"
										/>
									</div>
								</>
							)}

							<div>
								<Label htmlFor="receipt">GCash Receipt Screenshot *</Label>
								<div className="mt-2">
									<input
										type="file"
										id="receipt"
										accept="image/*,application/pdf"
										onChange={handleFileChange}
										className="hidden"
									/>
									<label htmlFor="receipt">
										<div className="hover:border-primary cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors">
											{receiptPreview ? (
												<div className="space-y-4">
													<img
														src={receiptPreview}
														alt="Receipt preview"
														className="mx-auto max-h-64 rounded-lg"
													/>
													<div className="space-y-2">
														<div className="flex items-center justify-center text-green-600">
															<Check className="mr-2 h-5 w-5" />
															<span className="font-medium">Receipt uploaded</span>
														</div>
														{extractingRefNumber && (
															<div className="flex items-center justify-center text-blue-600">
																<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																<span className="text-sm">Extracting reference number...</span>
															</div>
														)}
														{gcashRefNumber && (
															<Badge variant="outline" className="flex items-center gap-2">
																<span className="text-xs">Ref No:</span>
																<span className="font-mono font-semibold">{gcashRefNumber}</span>
															</Badge>
														)}
													</div>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => {
															setReceiptFile(null);
															setReceiptPreview(null);
														}}
													>
														Change Receipt
													</Button>
												</div>
											) : receiptFile && receiptFile.type === "application/pdf" ? (
												<div className="space-y-4">
													<div className="text-muted-foreground flex items-center justify-center">
														<FileText className="mr-2 h-12 w-12" />
													</div>
													<div className="space-y-2">
														<div className="flex items-center justify-center text-green-600">
															<Check className="mr-2 h-5 w-5" />
															<span className="font-medium">PDF uploaded: {receiptFile.name}</span>
														</div>
														{gcashRefNumber && (
															<Badge variant="outline" className="flex items-center gap-2">
																<span className="text-xs">Ref No:</span>
																<span className="font-mono font-semibold">{gcashRefNumber}</span>
															</Badge>
														)}
													</div>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => {
															setReceiptFile(null);
															setReceiptPreview(null);
															setGcashRefNumber(null);
														}}
													>
														Change Receipt
													</Button>
												</div>
											) : (
												<div className="space-y-2">
													<Upload className="text-muted-foreground mx-auto h-12 w-12" />
													<p className="text-sm font-medium">Click to upload receipt</p>
													<p className="text-muted-foreground text-xs">
														Image (PNG, JPG) or PDF (max 20MB)
													</p>
													<p className="text-muted-foreground text-xs">
														PDF support: GCash transaction history exports
													</p>
												</div>
											)}
										</div>
									</label>
								</div>
							</div>

							<div>
								<Label htmlFor="notes">Special Instructions (Optional)</Label>
								{specialNotes.length > 0 && (
									<div className="mt-2 space-y-2">
										{specialNotes.map((note, index) => (
											<Alert
												key={index}
												className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/50"
											>
												<AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
												<AlertDescription className="text-sm font-medium text-red-800 dark:text-red-200">
													{note}
												</AlertDescription>
											</Alert>
										))}
									</div>
								)}
								<Textarea
									id="notes"
									placeholder="Add any special instructions or notes for your order..."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={4}
									className="mt-2"
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="lg:col-span-1">
					<Card className="sticky top-4">
						<CardHeader>
							<CardTitle>Order Summary</CardTitle>
							{event && (
								<Badge variant="secondary" className="w-fit">
									<Gift className="mr-1 h-3 w-3" />
									{event.name}
								</Badge>
							)}
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								{cart.map((item) => {
									const name = item.product?.name || item.package?.name || "Unknown";
									const price = item.product?.price || item.package?.price || 0;
									const isPackage = !!item.package;

									return (
										<div key={item.id} className="flex justify-between text-sm">
											<span className="text-muted-foreground flex items-center gap-1">
												{isPackage && <Gift className="h-3 w-3" />}
												{name}
												{item.size && <span className="text-xs">({item.size})</span>}
												{" × "}
												{item.quantity}
											</span>
											<span>₱{(price * item.quantity).toFixed(2)}</span>
										</div>
									);
								})}
							</div>

							<div className="border-t pt-4">
								<div className="flex justify-between text-lg font-bold">
									<span>Total</span>
									<span>₱{total.toFixed(2)}</span>
								</div>
							</div>

							<Button
								type="submit"
								className="w-full"
								size="lg"
								disabled={loading || !isFormValid()}
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Processing...
									</>
								) : (
									"Place Order"
								)}
							</Button>

							<p className="text-muted-foreground text-center text-xs">
								{checkoutConfig?.termsMessage
									? parseMarkdownLinks(checkoutConfig.termsMessage)
									: "By placing an order, you agree to our terms and conditions"}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
