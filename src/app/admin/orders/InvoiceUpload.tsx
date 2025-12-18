"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";
import { parseGcashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";
import { parseInvoiceTable, GCashTransaction } from "@/lib/gcashReaders/parseInvoiceTable";
import { processInvoiceTransactions } from "./invoiceActions";

export function InvoiceUpload() {
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentFile, setCurrentFile] = useState("");
	const [transactions, setTransactions] = useState<GCashTransaction[]>([]);
	const [results, setResults] = useState({
		matched: 0,
		unmatched: 0,
		total: 0,
	});

	async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setIsProcessing(true);
		setProgress(0);
		setTransactions([]);

		const allTransactions: GCashTransaction[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			setCurrentFile(`Processing ${i + 1}/${files.length}: ${file.name}`);
			setProgress(((i + 1) / files.length) * 100);

			try {
				if (file.type === "application/pdf") {
					// Handle PDF
					toast.info("PDF support coming soon. Please upload images for now.");
					continue;
				}

				// Process image with OCR
				console.log(`[Invoice OCR] Processing ${file.name}...`);
				const ocrResult = await parseGcashReceiptClient(file);

				// Note: parseGcashReceiptClient returns receipt data, we need to parse it as table
				// For now, we'll use a workaround - create a worker manually
				const { createWorker } = await import("tesseract.js");
				const worker = await createWorker("eng");

				try {
					const {
						data: { text },
					} = await worker.recognize(file);
					console.log("[Invoice OCR] Raw text:", text);

					const parsedTransactions = parseInvoiceTable(text);
					allTransactions.push(...parsedTransactions);
					toast.success(`Extracted ${parsedTransactions.length} transactions from ${file.name}`);
				} finally {
					await worker.terminate();
				}
			} catch (error: any) {
				console.error(`[Invoice OCR] Failed to process ${file.name}:`, error);
				toast.error(`Failed to process ${file.name}: ${error.message}`);
			}
		}

		setTransactions(allTransactions);
		setIsProcessing(false);
		setCurrentFile("");

		if (allTransactions.length > 0) {
			toast.success(`Extracted ${allTransactions.length} total transactions`);
			// Now match with orders
			await matchTransactions(allTransactions);
		}
	}

	async function matchTransactions(trans: GCashTransaction[]) {
		toast.loading("Matching transactions with orders...");

		const result = await processInvoiceTransactions(trans);

		if (result.success) {
			setResults({
				matched: result.matched || 0,
				unmatched: result.unmatched || 0,
				total: trans.length,
			});
			toast.success(
				`Matched ${result.matched} orders. ${result.unmatched} transactions not found in orders.`,
			);
		} else {
			toast.error(result.message || "Failed to process transactions");
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileText className="h-5 w-5" />
					Upload GCash Invoice
				</CardTitle>
				<CardDescription>
					Upload invoice images or PDF to automatically verify reference numbers
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="invoice-upload">Select Invoice Files (Images or PDF)</Label>
					<Input
						id="invoice-upload"
						type="file"
						accept="image/*,.pdf"
						multiple
						onChange={handleFileUpload}
						disabled={isProcessing}
					/>
					<p className="text-muted-foreground text-xs">
						Supported: Images (JPG, PNG) or PDF. Can select multiple files.
					</p>
				</div>

				{isProcessing && (
					<div className="space-y-2">
						<Progress value={progress} />
						<div className="text-muted-foreground text-sm">{currentFile}</div>
					</div>
				)}

				{transactions.length > 0 && !isProcessing && (
					<div className="space-y-2 rounded-lg border p-4">
						<h3 className="font-semibold">Extracted Transactions</h3>
						<div className="text-sm">
							<div>Total: {transactions.length}</div>
							{results.total > 0 && (
								<>
									<div className="text-green-600">Matched Orders: {results.matched}</div>
									<div className="text-yellow-600">Not in Orders: {results.unmatched}</div>
								</>
							)}
						</div>
						<div className="max-h-48 space-y-1 overflow-y-auto text-xs">
							{transactions.slice(0, 10).map((t, i) => (
								<div key={i} className="border-b pb-1">
									<div>
										<strong>Ref:</strong> {t.referenceNumber}
									</div>
									<div className="text-muted-foreground">
										{t.dateTime} - {t.description} - {t.debit ? `₱${t.debit}` : `₱${t.credit}`}
									</div>
								</div>
							))}
							{transactions.length > 10 && (
								<div className="text-muted-foreground italic">
									...and {transactions.length - 10} more
								</div>
							)}
						</div>
					</div>
				)}

				<div className="text-muted-foreground space-y-1 text-xs">
					<p>
						<strong>Expected format:</strong>
					</p>
					<p>Table with columns: Date and Time | Description | Reference No. | Debit | Credit</p>
					<p>Reference numbers should be 13 digits</p>
				</div>
			</CardContent>
		</Card>
	);
}
