"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, AlertCircle, Loader2, Gift, FileText, Calendar } from "lucide-react";
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
import { createOrder } from "../actions";
import { extractRefNumberFromPdf } from "../gcashActions";
import { toast } from "sonner";
import { parseGcashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";

type Product = {
	id: string;
	name: string;
	price: number;
	specialNote: string | null;
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

type CheckoutField = {
	id: string;
	label: string;
	type: "text" | "textarea" | "select" | "checkbox" | "date";
	required: boolean;
	placeholder?: string;
	options?: string[];
	maxLength?: number;
};

type CheckoutConfig = {
	headerMessage?: string;
	additionalFields: CheckoutField[];
	termsMessage?: string;
	confirmationMessage?: string;
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

	// Event-specific field values
	const [eventFieldValues, setEventFieldValues] = useState<Record<string, string | boolean>>({});

	// Calculate total including both products and packages
	const total = cart.reduce((sum, item) => {
		if (item.product) {
			return sum + item.product.price * item.quantity;
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
						toast.warning("Could not extract reference number. Please ensure receipt is clear.");
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!firstName.trim() || !lastName.trim()) {
			toast.error("Please provide your first and last name for delivery");
			return;
		}

		// Validate student ID format if provided
		if (studentId.trim() && !/^2\d{5}$/.test(studentId.trim())) {
			toast.error("Student ID must be in format 2XXXXX (e.g., 212345)");
			return;
		}

		// Validate required event fields
		for (const field of additionalFields) {
			if (field.required) {
				const value = eventFieldValues[field.id];
				if (field.type === "checkbox") {
					if (value !== true) {
						toast.error(`Please check "${field.label}"`);
						return;
					}
				} else if (!value || (typeof value === "string" && !value.trim())) {
					toast.error(`Please fill in "${field.label}"`);
					return;
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

			// Build event data if present
			const eventData = event
				? {
						eventName: event.name,
						fields: additionalFields.reduce(
							(acc, field) => {
								acc[field.label] = eventFieldValues[field.id] ?? "";
								return acc;
							},
							{} as Record<string, string | boolean>,
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
							<CardDescription>Please provide your delivery information</CardDescription>
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
									placeholder="212345"
									value={studentId}
									onChange={(e) => setStudentId(e.target.value)}
									maxLength={6}
									className="mt-2"
								/>
								<p className="text-muted-foreground mt-1 text-xs">
									Format: 2XXXXX (e.g., 212345) - Helps us verify your identity for pickup
								</p>
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
									<CardDescription>{checkoutConfig.headerMessage}</CardDescription>
								)}
							</CardHeader>
							<CardContent className="space-y-4">
								{additionalFields.map((field) => (
									<div key={field.id}>
										<Label htmlFor={field.id}>
											{field.label}
											{field.required && " *"}
										</Label>

										{field.type === "text" && (
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
										)}

										{field.type === "textarea" && (
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
										)}

										{field.type === "select" && field.options && (
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
										)}

										{field.type === "checkbox" && (
											<div className="mt-2 flex items-center gap-2">
												<Checkbox
													id={field.id}
													checked={(eventFieldValues[field.id] as boolean) || false}
													onCheckedChange={(checked) => updateEventField(field.id, !!checked)}
												/>
												<Label htmlFor={field.id} className="cursor-pointer font-normal">
													{field.placeholder || field.label}
												</Label>
											</div>
										)}

										{field.type === "date" && (
											<Input
												id={field.id}
												type="date"
												value={(eventFieldValues[field.id] as string) || ""}
												onChange={(e) => updateEventField(field.id, e.target.value)}
												required={field.required}
												className="mt-2"
											/>
										)}
									</div>
								))}
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle>Payment Instructions</CardTitle>
							<CardDescription>Please follow these steps to complete your payment</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
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

							{/* GCash QR Code */}
							<div className="flex justify-center">
								<div className="rounded-lg border bg-white p-4">
									<div className="h-64 w-64">
										<img
											src="/images/gcash_qr.jpg"
											alt="GCash QR Code"
											className="h-full w-full object-contain"
										/>
									</div>
									<p className="text-muted-foreground mt-2 text-center text-sm">
										Scan with GCash app
									</p>
								</div>
							</div>

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

							<Button type="submit" className="w-full" size="lg" disabled={loading || !receiptFile}>
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
								{checkoutConfig?.termsMessage ||
									"By placing an order, you agree to our terms and conditions"}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
