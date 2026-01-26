"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
	Heart,
	Package,
	CreditCard,
	Loader2,
	MapPin,
	Truck,
	Clock,
	User,
	Phone,
	MessageSquare,
	CheckCircle,
	AlertCircle,
	Info,
} from "lucide-react";
import { parseGcashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";
import { createFlowerFestOrder } from "../actions";
import {
	type FulfillmentType,
	type DeliveryOption,
	validatePhoneNumber,
	validateGCashReference,
	validateDeliveryOptions,
	MESSAGE_MAX_LENGTH,
	DELIVERY_TIME_SLOTS,
	PICKUP_LOCATION,
	PICKUP_DATE,
	PICKUP_HOURS,
} from "../types";

type FlowerFestCheckoutProps = {
	event: any;
	cartItems: any[];
	user: any;
};

const emptyDeliveryOption: DeliveryOption = {
	location: "",
	timeSlot: "",
	notes: "",
};

export function FlowerFestCheckout({ event, cartItems, user }: FlowerFestCheckoutProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [processingReceipt, setProcessingReceipt] = useState(false);

	// Form state
	const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | null>(null);
	const [senderName, setSenderName] = useState(user.name || "");
	const [senderContact, setSenderContact] = useState("");
	const [recipientName, setRecipientName] = useState("");
	const [recipientContact, setRecipientContact] = useState("");

	// Delivery options (3 required)
	const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([
		{ ...emptyDeliveryOption },
		{ ...emptyDeliveryOption },
		{ ...emptyDeliveryOption },
	]);
	const [preferredOption, setPreferredOption] = useState<1 | 2 | 3>(1);

	// Message card
	const [message, setMessage] = useState("");
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [includeSenderName, setIncludeSenderName] = useState(true);

	// Payment
	const [receiptFile, setReceiptFile] = useState<File | null>(null);
	const [receiptUrl, setReceiptUrl] = useState("");
	const [gcashRef, setGcashRef] = useState("");
	const [ocrSuccess, setOcrSuccess] = useState(false);

	// Additional notes
	const [specialInstructions, setSpecialInstructions] = useState("");

	// Calculate total
	const total = cartItems.reduce((sum, item) => {
		const price = item.product?.price || item.package?.price || 0;
		return sum + price * item.quantity;
	}, 0);

	// Handle receipt upload and OCR
	async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		setReceiptFile(file);
		setProcessingReceipt(true);
		setOcrSuccess(false);

		try {
			// Upload to storage
			const formData = new FormData();
			formData.append("file", file);
			formData.append("type", "receipt");

			const uploadRes = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!uploadRes.ok) {
				throw new Error("Failed to upload receipt");
			}

			const { url } = await uploadRes.json();
			setReceiptUrl(url);

			// Process with OCR
			try {
				const ocrResult = await parseGcashReceiptClient(file);

				if (ocrResult.referenceNumber) {
					setGcashRef(ocrResult.referenceNumber);
					setOcrSuccess(true);
					toast.success("Reference number extracted successfully!");
				} else {
					toast.warning("Could not extract reference number. Please enter it manually.");
				}
			} catch {
				toast.warning("Could not extract reference number. Please enter it manually.");
			}
		} catch (error) {
			console.error("Receipt processing error:", error);
			toast.error("Failed to process receipt. Please try again.");
		} finally {
			setProcessingReceipt(false);
		}
	}

	// Update delivery option
	function updateDeliveryOption(index: number, field: keyof DeliveryOption, value: string) {
		const newOptions = [...deliveryOptions];
		newOptions[index] = { ...newOptions[index], [field]: value };
		setDeliveryOptions(newOptions);
	}

	// Submit order
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		// Client-side validation
		const errors: string[] = [];

		if (!senderName?.trim()) {
			errors.push("Please enter your name");
		}
		if (!validatePhoneNumber(senderContact)) {
			errors.push("Please enter a valid Philippine mobile number (09XX XXX XXXX)");
		}
		if (!recipientName?.trim()) {
			errors.push("Please enter recipient name");
		}
		if (!fulfillmentType) {
			errors.push("Please select pickup or delivery");
		}
		if (fulfillmentType === "delivery") {
			const deliveryValidation = validateDeliveryOptions(deliveryOptions);
			if (!deliveryValidation.valid) {
				errors.push(deliveryValidation.error!);
			}
		}
		if (!receiptUrl) {
			errors.push("Please upload your GCash receipt");
		}
		if (!validateGCashReference(gcashRef)) {
			errors.push("Please enter a valid 13-digit GCash reference number");
		}

		if (errors.length > 0) {
			errors.forEach((error) => toast.error(error));
			return;
		}

		setLoading(true);

		try {
			const result = await createFlowerFestOrder({
				eventId: event.id,
				sender: {
					name: senderName,
					contactNumber: senderContact,
				},
				recipient: {
					name: recipientName,
					contactNumber: recipientContact || undefined,
				},
				fulfillment: {
					type: fulfillmentType!,
					deliveryOptions: fulfillmentType === "delivery" ? deliveryOptions : undefined,
					preferredOption: fulfillmentType === "delivery" ? preferredOption : undefined,
				},
				messageCard: {
					message,
					isAnonymous,
					includeSenderName: !isAnonymous && includeSenderName,
				},
				payment: {
					receiptUrl,
					gcashReferenceNumber: gcashRef,
					amount: total,
				},
				specialInstructions: specialInstructions || undefined,
			});

			if (result.success) {
				toast.success("Order placed successfully! 🌸");
				router.push(`/shop/orders/${result.orderId}`);
			} else {
				toast.error(result.message || "Failed to create order");
			}
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error("An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
			{/* ===== ORDER SUMMARY ===== */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						Order Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{cartItems.map((item) => (
							<div key={item.id} className="flex justify-between">
								<span>
									{item.product?.name || item.package?.name} x {item.quantity}
									{item.size && <span className="text-muted-foreground"> ({item.size})</span>}
								</span>
								<span className="font-medium">
									₱{((item.product?.price || item.package?.price || 0) * item.quantity).toFixed(2)}
								</span>
							</div>
						))}
						<Separator className="my-2" />
						<div className="flex justify-between text-lg font-bold">
							<span>Total:</span>
							<span>₱{total.toFixed(2)}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* ===== YOUR INFORMATION ===== */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Your Information
					</CardTitle>
					<CardDescription>We need this to contact you about your order</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="sender-name">
							Your Name <span className="text-destructive">*</span>
						</Label>
						<Input
							id="sender-name"
							value={senderName}
							onChange={(e) => setSenderName(e.target.value)}
							placeholder="Your full name"
							required
						/>
					</div>

					<div>
						<Label htmlFor="sender-contact">
							Your Contact Number <span className="text-destructive">*</span>
						</Label>
						<Input
							id="sender-contact"
							value={senderContact}
							onChange={(e) => setSenderContact(e.target.value)}
							placeholder="09XX XXX XXXX"
							maxLength={11}
							required
						/>
						{senderContact && !validatePhoneNumber(senderContact) && (
							<p className="text-destructive mt-1 text-sm">
								Please enter a valid Philippine mobile number
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* ===== RECIPIENT INFORMATION ===== */}
			<Card className="border-pink-200 bg-pink-50/50 dark:border-pink-900 dark:bg-pink-950/10">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Heart className="h-5 w-5 text-pink-500" />
						Recipient Information
					</CardTitle>
					<CardDescription>Who will receive the flowers?</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="recipient-name">
							Recipient Name <span className="text-destructive">*</span>
						</Label>
						<Input
							id="recipient-name"
							value={recipientName}
							onChange={(e) => setRecipientName(e.target.value)}
							placeholder="Recipient's full name"
							required
						/>
					</div>

					<div>
						<Label htmlFor="recipient-contact">Recipient Contact Number (Optional)</Label>
						<Input
							id="recipient-contact"
							value={recipientContact}
							onChange={(e) => setRecipientContact(e.target.value)}
							placeholder="09XX XXX XXXX"
							maxLength={11}
						/>
						<p className="text-muted-foreground mt-1 text-sm">Helpful for delivery coordination</p>
					</div>
				</CardContent>
			</Card>

			{/* ===== PICKUP OR DELIVERY ===== */}
			<Card className="border-primary/50 bg-primary/5">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Truck className="h-5 w-5" />
						Pickup or Delivery <span className="text-destructive">*</span>
					</CardTitle>
					<CardDescription>How would you like to receive your order?</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<RadioGroup
						value={fulfillmentType || ""}
						onValueChange={(value) => setFulfillmentType(value as FulfillmentType)}
					>
						{/* Pickup Option */}
						<div className="flex items-start space-x-3">
							<RadioGroupItem value="pickup" id="pickup" className="mt-1" />
							<div className="flex-1">
								<Label htmlFor="pickup" className="cursor-pointer text-base font-medium">
									<MapPin className="mr-1 inline h-4 w-4" />
									Pickup
								</Label>
								<p className="text-muted-foreground text-sm">Pick up at {PICKUP_LOCATION}</p>
							</div>
						</div>

						{/* Delivery Option */}
						<div className="flex items-start space-x-3">
							<RadioGroupItem value="delivery" id="delivery" className="mt-1" />
							<div className="flex-1">
								<Label htmlFor="delivery" className="cursor-pointer text-base font-medium">
									<Truck className="mr-1 inline h-4 w-4" />
									Delivery
								</Label>
								<p className="text-muted-foreground text-sm">
									Our runner will deliver to your specified location
								</p>
							</div>
						</div>
					</RadioGroup>

					{/* Pickup Instructions */}
					{fulfillmentType === "pickup" && (
						<Alert>
							<Info className="h-4 w-4" />
							<AlertDescription>
								<strong>Pickup Details:</strong>
								<br />
								<strong>Location:</strong> {PICKUP_LOCATION}
								<br />
								<strong>Date:</strong> {PICKUP_DATE}
								<br />
								<strong>Hours:</strong> {PICKUP_HOURS}
								<br />
								<br />
								<em>Please bring a valid ID and your order confirmation.</em>
							</AlertDescription>
						</Alert>
					)}

					{/* Delivery Options (3 required) */}
					{fulfillmentType === "delivery" && (
						<div className="mt-4 space-y-6">
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									Please provide <strong>3 possible delivery options</strong>. Our runner will try
									your preferred option first, then fall back to alternatives if needed.
								</AlertDescription>
							</Alert>

							{[0, 1, 2].map((index) => (
								<Card key={index} className="p-4">
									<div className="mb-3 flex items-center justify-between">
										<Label className="text-base font-medium">
											Option {index + 1}
											{index === 0 && (
												<Badge variant="secondary" className="ml-2">
													Preferred
												</Badge>
											)}
										</Label>
										<RadioGroup
											value={preferredOption.toString()}
											onValueChange={(v) => setPreferredOption(parseInt(v) as 1 | 2 | 3)}
											className="flex gap-2"
										>
											<div className="flex items-center space-x-1">
												<RadioGroupItem value={(index + 1).toString()} id={`preferred-${index}`} />
												<Label htmlFor={`preferred-${index}`} className="cursor-pointer text-xs">
													Preferred
												</Label>
											</div>
										</RadioGroup>
									</div>

									<div className="space-y-3">
										<div>
											<Label>
												Location <span className="text-destructive">*</span>
											</Label>
											<Input
												value={deliveryOptions[index].location}
												onChange={(e) => updateDeliveryOption(index, "location", e.target.value)}
												placeholder="e.g., Room 301, Main Building"
												required={fulfillmentType === "delivery"}
											/>
										</div>

										<div>
											<Label>
												Time Slot <span className="text-destructive">*</span>
											</Label>
											<Select
												value={deliveryOptions[index].timeSlot}
												onValueChange={(v) => updateDeliveryOption(index, "timeSlot", v)}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select time slot" />
												</SelectTrigger>
												<SelectContent>
													{DELIVERY_TIME_SLOTS.map((slot) => (
														<SelectItem key={slot} value={slot}>
															{slot}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label>Notes for this option (optional)</Label>
											<Input
												value={deliveryOptions[index].notes || ""}
												onChange={(e) => updateDeliveryOption(index, "notes", e.target.value)}
												placeholder="e.g., Call when outside"
											/>
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* ===== MESSAGE CARD ===== */}
			<Card className="border-pink-200 bg-pink-50/50 dark:border-pink-900 dark:bg-pink-950/10">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5" />
						Message Card
					</CardTitle>
					<CardDescription>Optional message to include with the flowers</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="message">Your Message</Label>
						<Textarea
							id="message"
							value={message}
							onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
							placeholder="Write your heartfelt message here..."
							rows={4}
							maxLength={MESSAGE_MAX_LENGTH}
						/>
						<p className="text-muted-foreground mt-1 text-right text-sm">
							{message.length}/{MESSAGE_MAX_LENGTH} characters
						</p>
					</div>

					<div className="space-y-3">
						<div className="flex items-center space-x-2">
							<Checkbox
								id="anonymous"
								checked={isAnonymous}
								onCheckedChange={(checked) => setIsAnonymous(!!checked)}
							/>
							<Label htmlFor="anonymous" className="cursor-pointer">
								Send anonymously (recipient won't know who sent it)
							</Label>
						</div>

						{!isAnonymous && (
							<div className="flex items-center space-x-2">
								<Checkbox
									id="include-name"
									checked={includeSenderName}
									onCheckedChange={(checked) => setIncludeSenderName(!!checked)}
								/>
								<Label htmlFor="include-name" className="cursor-pointer">
									Include my name on the card: "{senderName || "Your name"}"
								</Label>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* ===== PAYMENT ===== */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Payment (GCash)
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription>
							<strong>Payment Instructions:</strong>
							<ol className="mt-2 list-inside list-decimal space-y-1">
								<li>
									Send <strong>₱{total.toFixed(2)}</strong> to GCash: <strong>09XX XXX XXXX</strong>
								</li>
								<li>Take a screenshot of your payment receipt</li>
								<li>Upload the screenshot below</li>
								<li>Verify the reference number is correct</li>
							</ol>
						</AlertDescription>
					</Alert>

					<div>
						<Label htmlFor="receipt">
							Upload GCash Receipt <span className="text-destructive">*</span>
						</Label>
						<Input
							id="receipt"
							type="file"
							accept="image/*"
							onChange={handleReceiptUpload}
							disabled={processingReceipt}
							required
						/>
						{processingReceipt && (
							<p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
								<Loader2 className="h-4 w-4 animate-spin" />
								Processing receipt... This may take a few seconds.
							</p>
						)}
						{receiptUrl && !processingReceipt && (
							<p className="mt-1 flex items-center gap-2 text-sm text-green-600">
								<CheckCircle className="h-4 w-4" />
								Receipt uploaded successfully
							</p>
						)}
					</div>

					<div>
						<Label htmlFor="gcash-ref">
							GCash Reference Number <span className="text-destructive">*</span>
						</Label>
						<Input
							id="gcash-ref"
							value={gcashRef}
							onChange={(e) => {
								setGcashRef(e.target.value.replace(/\D/g, "").slice(0, 13));
								setOcrSuccess(false); // Mark as manually edited
							}}
							placeholder="13-digit reference number"
							maxLength={13}
							required
						/>
						{ocrSuccess && (
							<p className="mt-1 flex items-center gap-2 text-sm text-green-600">
								<CheckCircle className="h-4 w-4" />
								Auto-extracted from receipt
							</p>
						)}
						{gcashRef && !ocrSuccess && (
							<p className="text-muted-foreground mt-1 text-sm">Manually entered</p>
						)}
						{gcashRef && !validateGCashReference(gcashRef) && (
							<p className="text-destructive mt-1 text-sm">Reference number must be 13 digits</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* ===== SPECIAL INSTRUCTIONS ===== */}
			<Card>
				<CardHeader>
					<CardTitle>Special Instructions (Optional)</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={specialInstructions}
						onChange={(e) => setSpecialInstructions(e.target.value)}
						placeholder="Any additional notes or special requests..."
						rows={3}
						maxLength={300}
					/>
					<p className="text-muted-foreground mt-1 text-right text-sm">
						{specialInstructions.length}/300 characters
					</p>
				</CardContent>
			</Card>

			{/* ===== SUBMIT ===== */}
			<Button
				type="submit"
				className="w-full"
				size="lg"
				disabled={loading || processingReceipt || !fulfillmentType}
			>
				{loading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Processing Order...
					</>
				) : (
					<>
						<Heart className="mr-2 h-4 w-4" />
						Place Order - ₱{total.toFixed(2)}
					</>
				)}
			</Button>
		</form>
	);
}
