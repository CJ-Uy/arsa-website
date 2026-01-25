"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { getEventsForExport, exportOrdersData } from "./actions";
import { toast } from "sonner";
import ExcelJS from "exceljs";

type Event = {
	id: string;
	name: string;
	slug: string;
};

type ExportDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<string>("all");
	const [includePhotos, setIncludePhotos] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingEvents, setLoadingEvents] = useState(true);

	useEffect(() => {
		if (open) {
			loadEvents();
		}
	}, [open]);

	const loadEvents = async () => {
		setLoadingEvents(true);
		const result = await getEventsForExport();
		if (result.success && result.data) {
			setEvents(result.data);
		}
		setLoadingEvents(false);
	};

	const handleExport = async () => {
		setLoading(true);
		try {
			const toastId = toast.loading(
				includePhotos
					? "Preparing export with photos (this may take a while)..."
					: "Preparing export...",
			);

			const result = await exportOrdersData(selectedEvent === "all" ? undefined : selectedEvent);

			if (!result.success || !result.data) {
				toast.dismiss(toastId);
				toast.error(result.message || "Failed to export data");
				return;
			}

			// Create workbook with exceljs
			const workbook = new ExcelJS.Workbook();
			workbook.creator = "ARSA Shop";
			workbook.created = new Date();

			const worksheet = workbook.addWorksheet("Orders");

			// Get all unique column keys from the data
			const allKeys = new Set<string>();
			result.data.forEach((row) => {
				Object.keys(row).forEach((key) => allKeys.add(key));
			});

			// Define columns dynamically based on available data
			const columns = Array.from(allKeys).map((key) => ({
				header: key,
				key: key,
				width:
					key === "Product Description" || key === "Notes"
						? 40
						: key.includes("Date") || key.includes("Time")
							? 20
							: 15,
			}));

			worksheet.columns = columns;

			// Style header row
			worksheet.getRow(1).font = { bold: true };
			worksheet.getRow(1).fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFE0E0E0" },
			};

			// Add data rows
			const imagePromises: Promise<void>[] = [];
			let currentRow = 2;

			for (const item of result.data) {
				const rowData: Record<string, any> = {};
				columns.forEach((col) => {
					rowData[col.key] = item[col.key] || "";
				});

				const row = worksheet.addRow(rowData);

				// If including photos and there's a receipt URL
				if (includePhotos && item["Receipt URL"]) {
					const rowIndex = currentRow;
					const receiptUrl = item["Receipt URL"];

					// Find the Receipt URL column index
					const receiptColIndex = columns.findIndex((col) => col.key === "Receipt URL");

					if (receiptColIndex !== -1) {
						// Set row height for images
						row.height = 80;

						// Fetch and embed image
						imagePromises.push(
							(async () => {
								try {
									const response = await fetch(receiptUrl);
									if (!response.ok) return;

									const arrayBuffer = await response.arrayBuffer();
									const imageBuffer = new Uint8Array(arrayBuffer);

									// Determine image type
									let extension: "jpeg" | "png" | "gif" = "jpeg";
									if (
										receiptUrl.includes(".png") ||
										response.headers.get("content-type")?.includes("png")
									) {
										extension = "png";
									} else if (receiptUrl.includes(".gif")) {
										extension = "gif";
									}

									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									const imageId = workbook.addImage({
										buffer: imageBuffer as any,
										extension,
									});

									// Add image to cell
									worksheet.addImage(imageId, {
										tl: { col: receiptColIndex, row: rowIndex - 1 },
										ext: { width: 100, height: 75 },
									});
								} catch (err) {
									// If image fetch fails, keep URL as fallback
									console.error("Failed to fetch image:", err);
								}
							})(),
						);
					}
				}

				currentRow++;
			}

			// Wait for all images to be fetched and embedded
			if (includePhotos && imagePromises.length > 0) {
				toast.loading(`Fetching ${imagePromises.length} receipt images...`, { id: toastId });
				await Promise.all(imagePromises);
			}

			// Generate filename
			const date = new Date().toISOString().split("T")[0];
			const eventName =
				selectedEvent === "all"
					? "All"
					: events.find((e) => e.id === selectedEvent)?.name || "Unknown";
			const filename = `ARSA_Orders_${eventName}_${date}${includePhotos ? "_with_photos" : ""}.xlsx`;

			// Write to buffer and download
			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = filename;
			link.click();
			URL.revokeObjectURL(url);

			toast.dismiss(toastId);
			toast.success(`Exported ${result.data.length} order items to Excel`);
			onOpenChange(false);
		} catch (error) {
			console.error("Export error:", error);
			toast.error("Failed to export orders");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Export Orders to Excel</DialogTitle>
					<DialogDescription>
						Choose export options. All event-specific data will be included in the export.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Event Filter */}
					<div className="space-y-2">
						<Label htmlFor="event">Filter by Event</Label>
						{loadingEvents ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin" />
							</div>
						) : (
							<Select value={selectedEvent} onValueChange={setSelectedEvent}>
								<SelectTrigger id="event">
									<SelectValue placeholder="Select event" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Events</SelectItem>
									{events.map((event) => (
										<SelectItem key={event.id} value={event.id}>
											{event.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<p className="text-muted-foreground text-xs">
							Export all orders or filter by a specific event
						</p>
					</div>

					{/* Include Photos Toggle */}
					<div className="flex items-center justify-between space-x-2">
						<div className="space-y-0.5">
							<Label htmlFor="photos">Include Receipt Photos</Label>
							<p className="text-muted-foreground text-xs">
								Embed receipt images in the Excel file (slower)
							</p>
						</div>
						<Switch id="photos" checked={includePhotos} onCheckedChange={setIncludePhotos} />
					</div>

					{/* Export Info */}
					<div className="bg-muted rounded-lg p-4 text-sm">
						<p className="font-medium">Export includes:</p>
						<ul className="text-muted-foreground mt-2 space-y-1 text-xs">
							<li>• Customer details (name, email, student ID)</li>
							<li>• Order items with sizes and quantities</li>
							<li>• Payment information (GCash ref, status)</li>
							<li>• Delivery scheduling (date, time)</li>
							<li>• Event-specific custom fields</li>
							<li>• Receipt URLs {includePhotos && "and images"}</li>
						</ul>
					</div>
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleExport} disabled={loading || loadingEvents}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{loading ? "Exporting..." : "Export to Excel"}
						{!loading && <FileSpreadsheet className="ml-2 h-4 w-4" />}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
