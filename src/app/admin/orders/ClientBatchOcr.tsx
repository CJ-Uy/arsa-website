"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { parseGcashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";
import {
	getOrdersForClientOcr,
	getAllOrdersWithReceipts,
	saveExtractedReferenceNumber,
	markOrderOcrFailed,
} from "./clientBatchOcrActions";

interface OrderForOcr {
	id: string;
	receiptImageUrl: string;
	totalAmount: number;
	status: string;
	createdAt: Date;
	gcashReferenceNumber?: string | null;
	user: {
		name: string | null;
		email: string;
	} | null;
}

export function ClientBatchOcr() {
	const [isOpen, setIsOpen] = useState(false);
	const [orders, setOrders] = useState<OrderForOcr[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentOrder, setCurrentOrder] = useState("");
	const [results, setResults] = useState({
		processed: 0,
		failed: 0,
		skipped: 0,
		overwritten: 0,
		total: 0,
	});

	async function loadOrders(includeProcessed: boolean = false) {
		setIsLoading(true);
		try {
			const response = includeProcessed
				? await getAllOrdersWithReceipts()
				: await getOrdersForClientOcr();

			if (response.success) {
				setOrders(response.orders as OrderForOcr[]);
				const alreadyProcessed = (response.orders as OrderForOcr[]).filter(
					(o) => o.gcashReferenceNumber,
				).length;
				const needsProcessing = response.count - alreadyProcessed;

				if (includeProcessed) {
					toast.success(
						`Found ${response.count} orders (${alreadyProcessed} already processed, ${needsProcessing} need processing)`,
					);
				} else {
					toast.success(`Found ${response.count} orders needing OCR processing`);
				}
			} else {
				toast.error(response.message || "Failed to load orders");
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to load orders");
		} finally {
			setIsLoading(false);
		}
	}

	async function processOrders(allowOverwrite: boolean = false) {
		if (orders.length === 0) {
			toast.error("No orders to process");
			return;
		}

		setIsProcessing(true);
		setProgress(0);
		setResults({ processed: 0, failed: 0, skipped: 0, overwritten: 0, total: orders.length });

		let processed = 0;
		let failed = 0;
		let skipped = 0;
		let overwritten = 0;

		for (let i = 0; i < orders.length; i++) {
			const order = orders[i];
			setCurrentOrder(`Processing ${i + 1}/${orders.length}: Order ${order.id.slice(0, 8)}...`);
			setProgress(((i + 1) / orders.length) * 100);

			try {
				// Fetch the image from URL
				console.log(`[Batch OCR] Fetching image for order ${order.id}...`);
				const imageResponse = await fetch(order.receiptImageUrl);
				if (!imageResponse.ok) {
					throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
				}

				// Convert to File object
				const blob = await imageResponse.blob();
				const file = new File([blob], "receipt.jpg", { type: blob.type });

				// Process with client-side OCR
				console.log(`[Batch OCR] Processing image with OCR...`);
				const ocrResult = await parseGcashReceiptClient(file);

				if (!ocrResult.referenceNumber) {
					throw new Error("No reference number extracted");
				}

				// Save to database
				console.log(`[Batch OCR] Saving reference number: ${ocrResult.referenceNumber}`);
				const saveResult = await saveExtractedReferenceNumber(
					order.id,
					ocrResult.referenceNumber,
					allowOverwrite,
				);

				if (saveResult.success) {
					processed++;
					if (saveResult.wasOverwritten) {
						overwritten++;
						toast.success(`Order ${order.id.slice(0, 8)}: Updated to ${ocrResult.referenceNumber}`);
					} else {
						toast.success(`Order ${order.id.slice(0, 8)}: ${ocrResult.referenceNumber}`);
					}
				} else if ((saveResult as any).skipped) {
					skipped++;
					console.log(`[Batch OCR] Skipped order ${order.id} (already has ref number)`);
				} else {
					throw new Error(saveResult.message);
				}
			} catch (error: any) {
				console.error(`[Batch OCR] Failed to process order ${order.id}:`, error);
				failed++;
				await markOrderOcrFailed(order.id, error.message || "Unknown error");
				toast.error(`Order ${order.id.slice(0, 8)}: ${error.message}`);
			}

			setResults({ processed, failed, skipped, overwritten, total: orders.length });
		}

		setIsProcessing(false);
		setCurrentOrder("");

		let summary = `Processed: ${processed}, Failed: ${failed}`;
		if (skipped > 0) summary += `, Skipped: ${skipped}`;
		if (overwritten > 0) summary += ` (${overwritten} updated)`;

		toast.success(`Batch processing complete! ${summary}`);

		// Reload orders to refresh the list
		await loadOrders(allowOverwrite);
	}

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card>
				<CollapsibleTrigger asChild>
					<CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									Client-Side Batch OCR Processing
									{orders.length > 0 && (
										<span className="text-muted-foreground text-sm font-normal">
											({orders.length} orders loaded)
										</span>
									)}
								</CardTitle>
								<CardDescription>
									Process receipt images in your browser. Click to {isOpen ? "collapse" : "expand"}.
								</CardDescription>
							</div>
							{isOpen ? (
								<ChevronUp className="text-muted-foreground h-5 w-5" />
							) : (
								<ChevronDown className="text-muted-foreground h-5 w-5" />
							)}
						</div>
					</CardHeader>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Button
								onClick={() => loadOrders(false)}
								disabled={isLoading || isProcessing}
								variant="outline"
							>
								{isLoading ? "Loading..." : "Load New Orders"}
							</Button>
							<Button
								onClick={() => loadOrders(true)}
								disabled={isLoading || isProcessing}
								variant="outline"
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								{isLoading ? "Loading..." : "Load All Orders"}
							</Button>
							<Button
								onClick={() => processOrders(false)}
								disabled={isProcessing || orders.length === 0}
								variant="default"
							>
								{isProcessing
									? "Processing..."
									: `Process New (${orders.filter((o) => !o.gcashReferenceNumber).length})`}
							</Button>
							<Button
								onClick={() => processOrders(true)}
								disabled={isProcessing || orders.length === 0}
								variant="destructive"
							>
								{isProcessing ? "Processing..." : `Reprocess All (${orders.length})`}
							</Button>
						</div>

						{orders.length > 0 && !isProcessing && (
							<div className="text-muted-foreground text-sm">
								Loaded {orders.length} order{orders.length !== 1 ? "s" : ""} with image receipts
								{orders.some((o) => o.gcashReferenceNumber) && (
									<> ({orders.filter((o) => o.gcashReferenceNumber).length} already processed)</>
								)}
							</div>
						)}

						{isProcessing && (
							<div className="space-y-2">
								<Progress value={progress} />
								<div className="text-muted-foreground text-sm">{currentOrder}</div>
								<div className="text-sm">
									<span className="text-green-600">Processed: {results.processed}</span>
									{results.overwritten > 0 && (
										<>
											{" "}
											<span className="text-blue-600">(Updated: {results.overwritten})</span>
										</>
									)}{" "}
									| <span className="text-red-600">Failed: {results.failed}</span> |{" "}
									<span className="text-gray-600">Skipped: {results.skipped}</span> | Total:{" "}
									{results.total}
								</div>
							</div>
						)}

						{!isProcessing && results.total > 0 && (
							<div className="rounded-lg border p-4">
								<h3 className="mb-2 font-semibold">Last Run Results</h3>
								<div className="space-y-1 text-sm">
									<div>Total: {results.total}</div>
									<div className="text-green-600">
										Processed: {results.processed}
										{results.overwritten > 0 && (
											<span className="text-blue-600"> (Updated: {results.overwritten})</span>
										)}
									</div>
									<div className="text-red-600">Failed: {results.failed}</div>
									<div className="text-gray-600">Skipped: {results.skipped}</div>
									<div className="text-muted-foreground">
										Success Rate:{" "}
										{((results.processed / (results.total - results.skipped)) * 100).toFixed(1)}%
									</div>
								</div>
							</div>
						)}

						<div className="text-muted-foreground space-y-1 text-xs">
							<p>
								<strong>How it works:</strong>
							</p>
							<ul className="ml-2 list-inside list-disc space-y-1">
								<li>
									<strong>Load New Orders:</strong> Only orders without reference numbers
								</li>
								<li>
									<strong>Load All Orders:</strong> All orders with receipts (for reprocessing)
								</li>
								<li>
									<strong>Process New:</strong> Only process orders without ref numbers
								</li>
								<li>
									<strong>Reprocess All:</strong> Overwrite all reference numbers (fixes false
									positives)
								</li>
								<li>Processing time: ~8-12 seconds per receipt</li>
								<li>
									<strong>Updated regex:</strong> Now handles ref numbers with spaces (e.g., "1234
									567 890")
								</li>
							</ul>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
}
