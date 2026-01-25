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
import { Input } from "@/components/ui/input";
import {
	RefreshCw,
	Loader2,
	ExternalLink,
	Settings,
	Save,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { getEventsForExport } from "./actions";
import { getGoogleSheetsSettings, saveGoogleSheetsSettings } from "./settingsActions";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Event = {
	id: string;
	name: string;
	slug: string;
};

type SyncDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<string>("all");
	const [loading, setLoading] = useState(false);
	const [loadingEvents, setLoadingEvents] = useState(true);
	const [syncStatus, setSyncStatus] = useState<{
		configured: boolean;
		lastSync?: string;
		orderCount?: number;
	} | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [spreadsheetId, setSpreadsheetId] = useState("");
	const [sheetName, setSheetName] = useState("Orders");
	const [savingSettings, setSavingSettings] = useState(false);

	useEffect(() => {
		if (open) {
			loadEvents();
			checkSyncStatus();
			loadSettings();
		}
	}, [open]);

	const loadSettings = async () => {
		const result = await getGoogleSheetsSettings();
		if (result.success && result.data) {
			setSpreadsheetId(result.data.spreadsheetId);
			setSheetName(result.data.sheetName);
		}
	};

	const loadEvents = async () => {
		setLoadingEvents(true);
		const result = await getEventsForExport();
		if (result.success && result.data) {
			setEvents(result.data);
		}
		setLoadingEvents(false);
	};

	const checkSyncStatus = async () => {
		try {
			const response = await fetch("/api/shop/sync-orders");
			const data = await response.json();
			setSyncStatus(data);
		} catch (error) {
			console.error("Failed to check sync status:", error);
		}
	};

	const handleSaveSettings = async () => {
		if (!spreadsheetId.trim()) {
			toast.error("Please enter a spreadsheet ID");
			return;
		}

		setSavingSettings(true);
		try {
			const result = await saveGoogleSheetsSettings({
				spreadsheetId: spreadsheetId.trim(),
				sheetName: sheetName.trim() || "Orders",
			});

			if (result.success) {
				toast.success("Settings saved successfully");
				await checkSyncStatus(); // Refresh status
			} else {
				toast.error(result.message || "Failed to save settings");
			}
		} catch (error) {
			toast.error("Failed to save settings");
		} finally {
			setSavingSettings(false);
		}
	};

	const handleSync = async () => {
		setLoading(true);
		try {
			const toastId = toast.loading("Syncing to Google Sheets...");

			// Call the sync endpoint with parameters
			const params = new URLSearchParams();
			if (selectedEvent !== "all") {
				params.append("eventId", selectedEvent);
			}

			const response = await fetch(`/api/shop/sync-orders?${params.toString()}`, {
				method: "POST",
			});

			const result = await response.json();

			toast.dismiss(toastId);

			if (result.success) {
				toast.success(result.message || "Successfully synced to Google Sheets");
				await checkSyncStatus(); // Refresh status
			} else {
				toast.error(result.message || "Failed to sync to Google Sheets");
			}
		} catch (error) {
			console.error("Sync error:", error);
			toast.error("Failed to sync to Google Sheets");
		} finally {
			setLoading(false);
		}
	};

	if (!syncStatus?.configured) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Configure Google Sheets Sync</DialogTitle>
						<DialogDescription>
							Set up Google Sheets to automatically sync order data
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						{/* Configuration Form */}
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="spreadsheet-id">Google Spreadsheet ID *</Label>
								<Input
									id="spreadsheet-id"
									value={spreadsheetId}
									onChange={(e) => setSpreadsheetId(e.target.value)}
									placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
								/>
								<p className="text-muted-foreground text-xs">
									Found in the spreadsheet URL: docs.google.com/spreadsheets/d/
									<strong>YOUR_ID</strong>/edit
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="sheet-name">Sheet Name (Tab Name)</Label>
								<Input
									id="sheet-name"
									value={sheetName}
									onChange={(e) => setSheetName(e.target.value)}
									placeholder="Orders"
								/>
								<p className="text-muted-foreground text-xs">
									The name of the tab/sheet within your spreadsheet (default: "Orders")
								</p>
							</div>

							<Button
								onClick={handleSaveSettings}
								disabled={savingSettings || !spreadsheetId.trim()}
								className="w-full"
							>
								{savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								<Save className="mr-2 h-4 w-4" />
								Save Configuration
							</Button>
						</div>

						{/* Setup Instructions */}
						<Collapsible>
							<CollapsibleTrigger asChild>
								<Button variant="outline" className="w-full">
									<Settings className="mr-2 h-4 w-4" />
									Setup Instructions
									<ChevronDown className="ml-auto h-4 w-4" />
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="space-y-4 pt-4">
								<Alert>
									<Settings className="h-4 w-4" />
									<AlertDescription className="text-sm">
										<strong>Setup Steps:</strong>
										<ol className="mt-2 list-inside list-decimal space-y-1">
											<li>Create a Google Cloud service account</li>
											<li>Enable Google Sheets API and Drive API</li>
											<li>Download the credentials JSON file</li>
											<li>
												Add credentials to{" "}
												<code className="bg-muted rounded px-1">GOOGLE_SHEETS_CREDENTIALS</code> in
												.env
											</li>
											<li>Create a Google Spreadsheet</li>
											<li>
												<strong>
													Share the spreadsheet with{" "}
													<code className="bg-muted rounded px-1">charlesjoshuauy@gmail.com</code>{" "}
													(Editor access)
												</strong>
											</li>
											<li>Enter the Spreadsheet ID and Sheet Name above</li>
										</ol>
									</AlertDescription>
								</Alert>

								<div className="space-y-2">
									<Label className="text-sm font-medium">Required Environment Variable:</Label>
									<div className="bg-muted rounded-lg p-3 font-mono text-xs">
										<div>GOOGLE_SHEETS_CREDENTIALS='{"{...JSON...}"}'</div>
									</div>
									<p className="text-muted-foreground text-xs">
										Spreadsheet ID and Sheet Name are now configured via this UI instead of
										environment variables
									</p>
								</div>

								<Alert>
									<AlertDescription className="text-xs">
										See{" "}
										<a
											href="/docs/GOOGLE_SHEETS_SYNC.md"
											target="_blank"
											className="text-primary underline"
										>
											documentation
										</a>{" "}
										for detailed instructions.
									</AlertDescription>
								</Alert>
							</CollapsibleContent>
						</Collapsible>
					</div>

					<div className="flex justify-end">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Sync to Google Sheets</DialogTitle>
					<DialogDescription>
						Export all order data to your configured Google Spreadsheet
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Settings Panel */}
					<Collapsible open={showSettings} onOpenChange={setShowSettings}>
						<CollapsibleTrigger asChild>
							<Button variant="outline" className="w-full">
								<Settings className="mr-2 h-4 w-4" />
								Google Sheets Settings
								{showSettings ? (
									<ChevronUp className="ml-auto h-4 w-4" />
								) : (
									<ChevronDown className="ml-auto h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="space-y-4 pt-4">
							<div className="space-y-4 rounded-lg border p-4">
								<div className="space-y-2">
									<Label htmlFor="edit-spreadsheet-id">Google Spreadsheet ID</Label>
									<Input
										id="edit-spreadsheet-id"
										value={spreadsheetId}
										onChange={(e) => setSpreadsheetId(e.target.value)}
										placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
									/>
									<p className="text-muted-foreground text-xs">
										Found in the spreadsheet URL after /d/
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="edit-sheet-name">Sheet Name (Tab Name)</Label>
									<Input
										id="edit-sheet-name"
										value={sheetName}
										onChange={(e) => setSheetName(e.target.value)}
										placeholder="Orders"
									/>
									<p className="text-muted-foreground text-xs">
										The name of the tab/sheet within your spreadsheet
									</p>
								</div>

								<Alert>
									<AlertDescription className="text-xs">
										<strong>Important:</strong> Make sure to share your Google Spreadsheet with{" "}
										<code className="bg-muted rounded px-1">charlesjoshuauy@gmail.com</code> (Editor
										access)
									</AlertDescription>
								</Alert>

								<Button
									onClick={handleSaveSettings}
									disabled={savingSettings || !spreadsheetId.trim()}
									className="w-full"
									size="sm"
								>
									{savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									<Save className="mr-2 h-4 w-4" />
									Save Settings
								</Button>
							</div>
						</CollapsibleContent>
					</Collapsible>

					{/* Sync Status */}
					{syncStatus.lastSync && (
						<div className="bg-muted rounded-lg p-3 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Last Synced:</span>
								<span className="font-medium">
									{new Date(syncStatus.lastSync).toLocaleString()}
								</span>
							</div>
							{syncStatus.orderCount !== undefined && (
								<div className="mt-1 flex items-center justify-between">
									<span className="text-muted-foreground">Total Orders:</span>
									<span className="font-medium">{syncStatus.orderCount}</span>
								</div>
							)}
						</div>
					)}

					{/* Event Filter */}
					<div className="space-y-2">
						<Label htmlFor="sync-event">Filter by Event</Label>
						{loadingEvents ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin" />
							</div>
						) : (
							<Select value={selectedEvent} onValueChange={setSelectedEvent}>
								<SelectTrigger id="sync-event">
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
							Sync all orders or only orders from a specific event
						</p>
					</div>

					{/* Info */}
					<div className="bg-muted rounded-lg p-4 text-sm">
						<p className="font-medium">Sync includes:</p>
						<ul className="text-muted-foreground mt-2 space-y-1 text-xs">
							<li>• All customer details and contact info</li>
							<li>• Complete product/package information</li>
							<li>• Payment details and order status</li>
							<li>• Delivery scheduling</li>
							<li>• All event-specific custom fields (formatted for readability)</li>
							<li>• Receipt URLs (clickable links)</li>
						</ul>
						<p className="text-muted-foreground mt-3 text-xs">
							⚠️ This will replace all data in the spreadsheet with the current database data.
						</p>
					</div>

					{/* Spreadsheet Link */}
					{spreadsheetId && (
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={() => {
								window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, "_blank");
							}}
						>
							<ExternalLink className="mr-2 h-4 w-4" />
							Open Spreadsheet
						</Button>
					)}
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
						Cancel
					</Button>
					<Button onClick={handleSync} disabled={loading || loadingEvents}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{loading ? "Syncing..." : "Sync Now"}
						{!loading && <RefreshCw className="ml-2 h-4 w-4" />}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
