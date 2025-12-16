"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { parseGcashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";
import {
	getOrdersForClientOcr,
	saveExtractedReferenceNumber,
	markOrderOcrFailed,
} from "./clientBatchOcrActions";

interface OrderForOcr {
	id: string;
	receiptImageUrl: string;
	totalAmount: number;
	status: string;
	createdAt: Date;
	user: {
		name: string | null;
		email: string;
	} | null;
}

export function ClientBatchOcr() {
	const [orders, setOrders] = useState<OrderForOcr[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentOrder, setCurrentOrder] = useState("");
	const [results, setResults] = useState({
		processed: 0,
		failed: 0,
		total: 0,
	});

	async function loadOrders() {
		setIsLoading(true);
		try {
			const response = await getOrdersForClientOcr();
			if (response.success) {
				setOrders(response.orders as OrderForOcr[]);
				toast.success(`Found ${response.count} orders needing OCR processing`);
			} else {
				toast.error(response.message || "Failed to load orders");
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to load orders");
		} finally {
			setIsLoading(false);
		}
	}

	async function processAllOrders() {
		if (orders.length === 0) {
			toast.error("No orders to process");
			return;
		}

		setIsProcessing(true);
		setProgress(0);
		setResults({ processed: 0, failed: 0, total: orders.length });

		let processed = 0;
		let failed = 0;

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
				const saveResult = await saveExtractedReferenceNumber(order.id, ocrResult.referenceNumber);

				if (saveResult.success) {
					processed++;
					toast.success(`Order ${order.id.slice(0, 8)}: ${ocrResult.referenceNumber}`);
				} else {
					throw new Error(saveResult.message);
				}
			} catch (error: any) {
				console.error(`[Batch OCR] Failed to process order ${order.id}:`, error);
				failed++;
				await markOrderOcrFailed(order.id, error.message || "Unknown error");
				toast.error(`Order ${order.id.slice(0, 8)}: ${error.message}`);
			}

			setResults({ processed, failed, total: orders.length });
		}

		setIsProcessing(false);
		setCurrentOrder("");
		toast.success(`Batch processing complete! Processed: ${processed}, Failed: ${failed}`);

		// Reload orders to refresh the list
		await loadOrders();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Client-Side Batch OCR Processing</CardTitle>
				<CardDescription>
					Process receipt images in your browser. OCR runs on your computer, not the server.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Button onClick={loadOrders} disabled={isLoading || isProcessing}>
						{isLoading ? "Loading..." : "Load Orders Needing OCR"}
					</Button>
					<Button
						onClick={processAllOrders}
						disabled={isProcessing || orders.length === 0}
						variant="default"
					>
						{isProcessing ? "Processing..." : `Process All (${orders.length})`}
					</Button>
				</div>

				{orders.length > 0 && !isProcessing && (
					<div className="text-muted-foreground text-sm">
						Ready to process {orders.length} order{orders.length !== 1 ? "s" : ""} with image
						receipts
					</div>
				)}

				{isProcessing && (
					<div className="space-y-2">
						<Progress value={progress} />
						<div className="text-muted-foreground text-sm">{currentOrder}</div>
						<div className="text-sm">
							<span className="text-green-600">Processed: {results.processed}</span> |{" "}
							<span className="text-red-600">Failed: {results.failed}</span> | Total:{" "}
							{results.total}
						</div>
					</div>
				)}

				{!isProcessing && results.total > 0 && (
					<div className="rounded-lg border p-4">
						<h3 className="mb-2 font-semibold">Last Run Results</h3>
						<div className="space-y-1 text-sm">
							<div>Total: {results.total}</div>
							<div className="text-green-600">Processed: {results.processed}</div>
							<div className="text-red-600">Failed: {results.failed}</div>
							<div className="text-muted-foreground">
								Success Rate: {((results.processed / results.total) * 100).toFixed(1)}%
							</div>
						</div>
					</div>
				)}

				<div className="text-muted-foreground space-y-1 text-xs">
					<p>
						<strong>How it works:</strong>
					</p>
					<ul className="ml-2 list-inside list-disc space-y-1">
						<li>Images are downloaded to your browser</li>
						<li>OCR processing happens on your computer using Tesseract.js</li>
						<li>Extracted reference numbers are saved to the database</li>
						<li>Processing time: ~8-12 seconds per receipt</li>
						<li>Only works with image receipts (JPG, PNG) - not PDFs</li>
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
