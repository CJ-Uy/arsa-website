"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Scan, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { getOrdersNeedingOcr, processOrderReceipt, batchProcessOrders } from "./batchOcrActions";

type OrderNeedingOcr = {
	id: string;
	receiptImageUrl: string | null;
	totalAmount: number;
	status: string;
	createdAt: Date;
	user: {
		name: string | null;
		email: string;
	};
};

export function BatchOcrProcessor() {
	const [showDialog, setShowDialog] = useState(false);
	const [orders, setOrders] = useState<OrderNeedingOcr[]>([]);
	const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [results, setResults] = useState<{
		processed: number;
		failed: number;
		skipped: number;
		extracted: Array<{ orderId: string; refNumber: string }>;
		errors: Array<{ orderId: string; error: string }>;
	} | null>(null);

	const loadOrdersNeedingOcr = async () => {
		const result = await getOrdersNeedingOcr();
		if (result.success) {
			setOrders(result.orders);
			setShowDialog(true);
			if (result.count === 0) {
				toast.info("No orders need OCR processing");
			} else {
				toast.success(`Found ${result.count} orders needing OCR processing`);
			}
		} else {
			toast.error(result.message || "Failed to load orders");
		}
	};

	const toggleOrder = (orderId: string) => {
		const newSelected = new Set(selectedOrders);
		if (newSelected.has(orderId)) {
			newSelected.delete(orderId);
		} else {
			newSelected.add(orderId);
		}
		setSelectedOrders(newSelected);
	};

	const selectAll = () => {
		setSelectedOrders(new Set(orders.map((o) => o.id)));
	};

	const deselectAll = () => {
		setSelectedOrders(new Set());
	};

	const processBatch = async () => {
		if (selectedOrders.size === 0) {
			toast.error("Please select at least one order");
			return;
		}

		setProcessing(true);
		setProgress(0);
		setResults(null);

		const orderIds = Array.from(selectedOrders);
		let completed = 0;

		// Process orders one by one for progress tracking
		const processResults = {
			processed: 0,
			failed: 0,
			skipped: 0,
			extracted: [] as Array<{ orderId: string; refNumber: string }>,
			errors: [] as Array<{ orderId: string; error: string }>,
		};

		for (const orderId of orderIds) {
			const result = await processOrderReceipt(orderId);

			if (result.success && result.referenceNumber) {
				processResults.processed++;
				processResults.extracted.push({
					orderId,
					refNumber: result.referenceNumber,
				});
			} else if (result.skipped) {
				processResults.skipped++;
			} else {
				processResults.failed++;
				processResults.errors.push({
					orderId,
					error: result.message || "Unknown error",
				});
			}

			completed++;
			setProgress((completed / orderIds.length) * 100);
		}

		setResults(processResults);
		setProcessing(false);

		toast.success(
			`Batch processing complete: ${processResults.processed} extracted, ${processResults.failed} failed, ${processResults.skipped} skipped`,
		);

		// Reload orders list
		await loadOrdersNeedingOcr();
	};

	return (
		<>
			<Button onClick={loadOrdersNeedingOcr} variant="outline" className="gap-2">
				<Scan className="h-4 w-4" />
				Batch OCR Processing
			</Button>

			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Batch OCR Processing</DialogTitle>
						<DialogDescription>
							Extract GCash reference numbers from existing orders' receipt images
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6">
						{/* Selection Controls */}
						<div className="flex items-center justify-between">
							<div className="text-muted-foreground text-sm">
								{selectedOrders.size} of {orders.length} orders selected
							</div>
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={selectAll}>
									Select All
								</Button>
								<Button size="sm" variant="outline" onClick={deselectAll}>
									Deselect All
								</Button>
							</div>
						</div>

						{/* Orders List */}
						{orders.length === 0 ? (
							<Card>
								<CardContent className="py-12 text-center">
									<CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
									<p className="text-muted-foreground">
										All orders with receipts have reference numbers!
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-2">
								{orders.map((order) => (
									<Card key={order.id}>
										<CardContent className="flex items-center gap-4 p-4">
											<Checkbox
												checked={selectedOrders.has(order.id)}
												onCheckedChange={() => toggleOrder(order.id)}
											/>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
													<Badge variant="secondary">{order.status}</Badge>
													{order.receiptImageUrl?.endsWith(".pdf") && (
														<Badge variant="outline">PDF</Badge>
													)}
												</div>
												<div className="text-muted-foreground mt-1 text-sm">
													<p>Customer: {order.user.name || order.user.email}</p>
													<p>Amount: ₱{order.totalAmount.toFixed(2)}</p>
													<p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}

						{/* Processing Progress */}
						{processing && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Loader2 className="h-5 w-5 animate-spin" />
										Processing...
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Progress value={progress} className="mb-2" />
									<p className="text-muted-foreground text-sm">{Math.round(progress)}% complete</p>
								</CardContent>
							</Card>
						)}

						{/* Results Summary */}
						{results && !processing && (
							<Card>
								<CardHeader>
									<CardTitle>Processing Results</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-3 gap-4">
										<div className="text-center">
											<CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
											<div className="text-2xl font-bold">{results.processed}</div>
											<div className="text-muted-foreground text-sm">Processed</div>
										</div>
										<div className="text-center">
											<XCircle className="mx-auto mb-2 h-8 w-8 text-red-600" />
											<div className="text-2xl font-bold">{results.failed}</div>
											<div className="text-muted-foreground text-sm">Failed</div>
										</div>
										<div className="text-center">
											<AlertCircle className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
											<div className="text-2xl font-bold">{results.skipped}</div>
											<div className="text-muted-foreground text-sm">Skipped</div>
										</div>
									</div>

									{/* Extracted Reference Numbers */}
									{results.extracted.length > 0 && (
										<div>
											<h4 className="mb-2 font-semibold">Successfully Extracted:</h4>
											<div className="space-y-1">
												{results.extracted.map((item) => (
													<div
														key={item.orderId}
														className="flex items-center justify-between rounded border p-2 text-sm"
													>
														<span className="font-mono">#{item.orderId.slice(0, 8)}</span>
														<Badge variant="outline" className="font-mono">
															{item.refNumber}
														</Badge>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Errors */}
									{results.errors.length > 0 && (
										<div>
											<h4 className="mb-2 font-semibold text-red-600">Errors:</h4>
											<div className="space-y-1">
												{results.errors.map((item) => (
													<div
														key={item.orderId}
														className="rounded border border-red-200 bg-red-50 p-2 text-sm dark:border-red-900/50 dark:bg-red-950/50"
													>
														<span className="font-mono font-semibold">
															#{item.orderId.slice(0, 8)}:
														</span>{" "}
														{item.error}
													</div>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Action Buttons */}
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setShowDialog(false)}>
								Close
							</Button>
							{orders.length > 0 && (
								<Button onClick={processBatch} disabled={processing || selectedOrders.size === 0}>
									{processing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Processing...
										</>
									) : (
										<>
											<Scan className="mr-2 h-4 w-4" />
											Process {selectedOrders.size} Order
											{selectedOrders.size !== 1 ? "s" : ""}
										</>
									)}
								</Button>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
