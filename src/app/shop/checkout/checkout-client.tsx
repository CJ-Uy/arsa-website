"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createOrder } from "../actions";
import { toast } from "sonner";

type CartItem = {
	id: string;
	quantity: number;
	product: {
		id: string;
		name: string;
		price: number;
	};
};

type User = {
	id: string;
	name: string | null;
	firstName: string | null;
	lastName: string | null;
	studentId: string | null;
	email: string;
};

type CheckoutClientProps = {
	cart: CartItem[];
	user: User;
};

export function CheckoutClient({ cart, user }: CheckoutClientProps) {
	const router = useRouter();
	const [firstName, setFirstName] = useState(user.firstName || "");
	const [lastName, setLastName] = useState(user.lastName || "");
	const [studentId, setStudentId] = useState(user.studentId || "");
	const [receiptFile, setReceiptFile] = useState<File | null>(null);
	const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(false);

	const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				toast.error("Please upload an image file");
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				toast.error("File size must be less than 5MB");
				return;
			}
			setReceiptFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setReceiptPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
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

		if (!receiptFile || !receiptPreview) {
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

			// Create order with the MinIO URL and user info
			const result = await createOrder(
				receiptUrl,
				notes || undefined,
				firstName.trim(),
				lastName.trim(),
				studentId.trim() || undefined,
			);

			if (result.success) {
				toast.success("Order placed successfully!");
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
											<strong>0912-345-6789</strong>
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
									<div className="relative h-64 w-64">
										<Image
											src="/images/gcash_qr.jpg"
											alt="GCash QR Code"
											fill
											className="object-contain"
											priority
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
										accept="image/*"
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
													<div className="flex items-center justify-center text-green-600">
														<Check className="mr-2 h-5 w-5" />
														<span className="font-medium">Receipt uploaded</span>
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
											) : (
												<div className="space-y-2">
													<Upload className="text-muted-foreground mx-auto h-12 w-12" />
													<p className="text-sm font-medium">Click to upload receipt</p>
													<p className="text-muted-foreground text-xs">
														PNG, JPG or JPEG (max 5MB)
													</p>
												</div>
											)}
										</div>
									</label>
								</div>
							</div>

							<div>
								<Label htmlFor="notes">Special Instructions (Optional)</Label>
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
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								{cart.map((item) => (
									<div key={item.id} className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											{item.product.name} × {item.quantity}
										</span>
										<span>₱{(item.product.price * item.quantity).toFixed(2)}</span>
									</div>
								))}
							</div>

							<div className="border-t pt-4">
								<div className="flex justify-between text-lg font-bold">
									<span>Total</span>
									<span>₱{total.toFixed(2)}</span>
								</div>
							</div>

							<Button type="submit" className="w-full" size="lg" disabled={loading || !receiptFile}>
								{loading ? "Processing..." : "Place Order"}
							</Button>

							<p className="text-muted-foreground text-center text-xs">
								By placing an order, you agree to our terms and conditions
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
