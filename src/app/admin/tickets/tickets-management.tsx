"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	createTicketEvent,
	updateTicketEvent,
	deleteTicketEvent,
	bulkGenerateTickets,
	getTicketsForEvent,
	deleteTickets,
	resetTicketScans,
	exportTicketsForMailMerge,
	searchUsers,
	addTicketVerifier,
	removeTicketVerifier,
	getTicketGSheetSettings,
	saveTicketGSheetSettings,
	syncTicketsToSheet,
} from "./actions";
import { toast } from "sonner";
import {
	Plus,
	Edit2,
	Trash2,
	Ticket,
	Users,
	Download,
	Search,
	Loader2,
	CheckCircle2,
	XCircle,
	Copy,
	Settings,
	RefreshCw,
	RotateCcw,
	Sheet,
} from "lucide-react";

type TicketEventWithStats = {
	id: string;
	name: string;
	description: string | null;
	isActive: boolean;
	date: Date | null;
	createdAt: Date;
	updatedAt: Date;
	ticketCount: number;
	scannedCount: number;
	verifiers: {
		userId: string;
		email: string;
		name: string | null;
		image: string | null;
	}[];
};

type TicketData = {
	id: string;
	shortCode: string;
	email: string;
	scanned: boolean;
	scannedAt: Date | null;
	createdAt: Date;
	scannedBy: { name: string | null; email: string } | null;
};

type UserResult = {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
};

export function TicketsManagement({ initialEvents }: { initialEvents: TicketEventWithStats[] }) {
	const [events, setEvents] = useState(initialEvents);
	const [selectedEventId, setSelectedEventId] = useState<string | null>(
		initialEvents.length > 0 ? initialEvents[0].id : null,
	);

	// Event form state
	const [showEventDialog, setShowEventDialog] = useState(false);
	const [editingEvent, setEditingEvent] = useState<TicketEventWithStats | null>(null);
	const [eventForm, setEventForm] = useState({
		name: "",
		description: "",
		isActive: true,
		date: "",
	});
	const [savingEvent, setSavingEvent] = useState(false);

	// Delete dialog
	const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
	const [deletingEvent, setDeletingEvent] = useState(false);

	// Tickets state
	const [tickets, setTickets] = useState<TicketData[]>([]);
	const [loadingTickets, setLoadingTickets] = useState(false);
	const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());

	// Generate state
	const [csvText, setCsvText] = useState("");
	const [generating, setGenerating] = useState(false);

	// Verifier state
	const [userSearch, setUserSearch] = useState("");
	const [userResults, setUserResults] = useState<UserResult[]>([]);
	const [searchingUsers, setSearchingUsers] = useState(false);

	// Export state
	const [exporting, setExporting] = useState(false);

	// Google Sheets settings state
	const [sheetSettings, setSheetSettings] = useState({ spreadsheetId: "", sheetName: "Tickets" });
	const [loadingSettings, setLoadingSettings] = useState(true);
	const [savingSettings, setSavingSettings] = useState(false);
	const [syncing, setSyncing] = useState(false);

	// Load GSheet settings on mount
	useEffect(() => {
		(async () => {
			const result = await getTicketGSheetSettings();
			if (result.success && result.settings) {
				setSheetSettings({
					spreadsheetId: result.settings.spreadsheetId,
					sheetName: result.settings.sheetName,
				});
			}
			setLoadingSettings(false);
		})();
	}, []);

	const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

	// ── Event CRUD ───────────────────────────────────────────
	const openCreateEvent = () => {
		setEditingEvent(null);
		setEventForm({ name: "", description: "", isActive: true, date: "" });
		setShowEventDialog(true);
	};

	const openEditEvent = (event: TicketEventWithStats) => {
		setEditingEvent(event);
		setEventForm({
			name: event.name,
			description: event.description || "",
			isActive: event.isActive,
			date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
		});
		setShowEventDialog(true);
	};

	const handleSaveEvent = async () => {
		if (!eventForm.name.trim()) {
			toast.error("Event name is required");
			return;
		}
		setSavingEvent(true);
		try {
			if (editingEvent) {
				const result = await updateTicketEvent(editingEvent.id, eventForm);
				if (result.success) {
					toast.success("Event updated");
					setEvents((prev) =>
						prev.map((e) =>
							e.id === editingEvent.id
								? {
										...e,
										name: eventForm.name,
										description: eventForm.description || null,
										isActive: eventForm.isActive,
										date: eventForm.date ? new Date(eventForm.date) : null,
									}
								: e,
						),
					);
				} else {
					toast.error(result.message);
				}
			} else {
				const result = await createTicketEvent(eventForm);
				if (result.success && result.event) {
					toast.success("Event created");
					const newEvent: TicketEventWithStats = {
						...result.event,
						ticketCount: 0,
						scannedCount: 0,
						verifiers: [],
					};
					setEvents((prev) => [newEvent, ...prev]);
					setSelectedEventId(result.event.id);
				} else {
					toast.error(result.message);
				}
			}
			setShowEventDialog(false);
		} finally {
			setSavingEvent(false);
		}
	};

	const handleDeleteEvent = async () => {
		if (!deleteEventId) return;
		setDeletingEvent(true);
		try {
			const result = await deleteTicketEvent(deleteEventId);
			if (result.success) {
				toast.success("Event deleted");
				setEvents((prev) => prev.filter((e) => e.id !== deleteEventId));
				if (selectedEventId === deleteEventId) {
					setSelectedEventId(events.find((e) => e.id !== deleteEventId)?.id || null);
				}
			} else {
				toast.error(result.message);
			}
		} finally {
			setDeletingEvent(false);
			setDeleteEventId(null);
		}
	};

	// ── Load Tickets ─────────────────────────────────────────
	const loadTickets = useCallback(async (eventId: string) => {
		setLoadingTickets(true);
		setSelectedTicketIds(new Set());
		try {
			const result = await getTicketsForEvent(eventId);
			if (result.success) {
				setTickets(result.tickets as TicketData[]);
			} else {
				toast.error(result.message);
			}
		} finally {
			setLoadingTickets(false);
		}
	}, []);

	const handleSelectEvent = (eventId: string) => {
		setSelectedEventId(eventId);
		setTickets([]);
		loadTickets(eventId);
	};

	// ── Generate Tickets ─────────────────────────────────────
	const handleGenerate = async () => {
		if (!selectedEventId || !csvText.trim()) {
			toast.error("Please enter email addresses");
			return;
		}
		setGenerating(true);
		try {
			const result = await bulkGenerateTickets(selectedEventId, csvText);
			if (result.success) {
				toast.success(result.message);
				setCsvText("");
				loadTickets(selectedEventId);
				// Update event ticket count
				setEvents((prev) =>
					prev.map((e) =>
						e.id === selectedEventId
							? { ...e, ticketCount: e.ticketCount + (result.count || 0) }
							: e,
					),
				);
			} else {
				toast.error(result.message);
			}
		} finally {
			setGenerating(false);
		}
	};

	// ── Delete Tickets ───────────────────────────────────────
	const handleDeleteTickets = async () => {
		if (selectedTicketIds.size === 0) return;
		const ids = Array.from(selectedTicketIds);
		const result = await deleteTickets(ids);
		if (result.success) {
			toast.success(result.message);
			setTickets((prev) => prev.filter((t) => !selectedTicketIds.has(t.id)));
			setSelectedTicketIds(new Set());
			if (selectedEventId) {
				setEvents((prev) =>
					prev.map((e) =>
						e.id === selectedEventId
							? { ...e, ticketCount: e.ticketCount - ids.length }
							: e,
					),
				);
			}
		} else {
			toast.error(result.message);
		}
	};

	// ── Reset Ticket Scans ──────────────────────────────────
	const handleResetScans = async () => {
		const scannedSelected = Array.from(selectedTicketIds).filter((id) =>
			tickets.find((t) => t.id === id && t.scanned),
		);
		if (scannedSelected.length === 0) {
			toast.error("No scanned tickets selected");
			return;
		}
		const result = await resetTicketScans(scannedSelected);
		if (result.success) {
			toast.success(result.message);
			setTickets((prev) =>
				prev.map((t) =>
					scannedSelected.includes(t.id)
						? { ...t, scanned: false, scannedAt: null, scannedBy: null }
						: t,
				),
			);
			setSelectedTicketIds(new Set());
			if (selectedEventId) {
				setEvents((prev) =>
					prev.map((e) =>
						e.id === selectedEventId
							? { ...e, scannedCount: e.scannedCount - scannedSelected.length }
							: e,
					),
				);
			}
		} else {
			toast.error(result.message);
		}
	};

	// ── Export for Mail Merge ─────────────────────────────────
	const handleExport = async () => {
		if (!selectedEventId) return;
		setExporting(true);
		try {
			const result = await exportTicketsForMailMerge(selectedEventId);
			if (result.success && result.data) {
				// Build CSV
				const csvHeader = "email,shortCode,qrImageUrl,verifyUrl";
				const csvRows = result.data.map(
					(r) => `${r.email},${r.shortCode},${r.qrImageUrl},${r.verifyUrl}`,
				);
				const csvContent = [csvHeader, ...csvRows].join("\n");

				// Download
				const blob = new Blob([csvContent], { type: "text/csv" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `tickets-${selectedEvent?.name?.replace(/\s+/g, "-").toLowerCase() || "export"}.csv`;
				a.click();
				URL.revokeObjectURL(url);
				toast.success("CSV exported");
			} else {
				toast.error(result.message);
			}
		} finally {
			setExporting(false);
		}
	};

	// ── Verifier Management ──────────────────────────────────
	const handleSearchUsers = async (query: string) => {
		setUserSearch(query);
		if (query.length < 2) {
			setUserResults([]);
			return;
		}
		setSearchingUsers(true);
		try {
			const result = await searchUsers(query);
			if (result.success) {
				setUserResults(result.users);
			}
		} finally {
			setSearchingUsers(false);
		}
	};

	const handleAddVerifier = async (userId: string) => {
		if (!selectedEventId) return;
		const result = await addTicketVerifier(selectedEventId, userId);
		if (result.success) {
			toast.success("Verifier added");
			const addedUser = userResults.find((u) => u.id === userId);
			if (addedUser) {
				setEvents((prev) =>
					prev.map((e) =>
						e.id === selectedEventId
							? {
									...e,
									verifiers: [
										...e.verifiers,
										{
											userId: addedUser.id,
											email: addedUser.email,
											name: addedUser.name,
											image: addedUser.image,
										},
									],
								}
							: e,
					),
				);
			}
			setUserSearch("");
			setUserResults([]);
		} else {
			toast.error(result.message);
		}
	};

	const handleRemoveVerifier = async (userId: string) => {
		if (!selectedEventId) return;
		const result = await removeTicketVerifier(selectedEventId, userId);
		if (result.success) {
			toast.success("Verifier removed");
			setEvents((prev) =>
				prev.map((e) =>
					e.id === selectedEventId
						? { ...e, verifiers: e.verifiers.filter((v) => v.userId !== userId) }
						: e,
				),
			);
		} else {
			toast.error(result.message);
		}
	};

	// ── Toggle ticket selection ──────────────────────────────
	const toggleTicketSelection = (id: string) => {
		setSelectedTicketIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleAllTickets = () => {
		if (selectedTicketIds.size === tickets.length) {
			setSelectedTicketIds(new Set());
		} else {
			setSelectedTicketIds(new Set(tickets.map((t) => t.id)));
		}
	};

	// ── Google Sheets Settings ───────────────────────────────
	const handleSaveSettings = async () => {
		setSavingSettings(true);
		try {
			const result = await saveTicketGSheetSettings(sheetSettings);
			if (result.success) {
				toast.success("Google Sheets settings saved");
			} else {
				toast.error(result.message);
			}
		} finally {
			setSavingSettings(false);
		}
	};

	const handleSync = async () => {
		if (!selectedEventId) return;
		setSyncing(true);
		try {
			const result = await syncTicketsToSheet(selectedEventId);
			if (result.success) {
				toast.success(result.message);
			} else {
				toast.error(result.message);
			}
		} finally {
			setSyncing(false);
		}
	};

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{/* Left Panel - Event List */}
			<div className="lg:col-span-1">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-3">
						<CardTitle className="text-lg">Ticket Events</CardTitle>
						<Button size="sm" onClick={openCreateEvent}>
							<Plus className="mr-1 h-4 w-4" />
							New
						</Button>
					</CardHeader>
					<CardContent className="space-y-2">
						{events.length === 0 ? (
							<p className="text-muted-foreground py-4 text-center text-sm">
								No ticket events yet. Create one to get started.
							</p>
						) : (
							events.map((event) => (
								<div
									key={event.id}
									className={`cursor-pointer rounded-lg border p-3 transition-colors ${
										selectedEventId === event.id
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50"
									}`}
									onClick={() => handleSelectEvent(event.id)}
								>
									<div className="flex items-start justify-between">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="truncate font-medium">{event.name}</span>
												<Badge variant={event.isActive ? "default" : "secondary"} className="text-xs">
													{event.isActive ? "Active" : "Inactive"}
												</Badge>
											</div>
											{event.date && (
												<p className="text-muted-foreground mt-0.5 text-xs">
													{new Date(event.date).toLocaleDateString()}
												</p>
											)}
											<div className="text-muted-foreground mt-1 flex gap-3 text-xs">
												<span>{event.ticketCount} tickets</span>
												<span>{event.scannedCount} scanned</span>
												<span>{event.verifiers.length} verifiers</span>
											</div>
										</div>
										<div className="flex gap-1">
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7"
												onClick={(e) => {
													e.stopPropagation();
													openEditEvent(event);
												}}
											>
												<Edit2 className="h-3.5 w-3.5" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 text-red-500 hover:text-red-600"
												onClick={(e) => {
													e.stopPropagation();
													setDeleteEventId(event.id);
												}}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			{/* Right Panel - Event Details */}
			<div className="lg:col-span-2">
				{selectedEvent ? (
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg">{selectedEvent.name}</CardTitle>
								<Badge variant={selectedEvent.isActive ? "default" : "secondary"}>
									{selectedEvent.isActive ? "Active" : "Inactive"}
								</Badge>
							</div>
							{selectedEvent.description && (
								<p className="text-muted-foreground text-sm">{selectedEvent.description}</p>
							)}
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="tickets">
								<TabsList className="mb-4">
									<TabsTrigger value="tickets">
										<Ticket className="mr-1.5 h-4 w-4" />
										Tickets ({selectedEvent.ticketCount})
									</TabsTrigger>
									<TabsTrigger value="generate">
										<Plus className="mr-1.5 h-4 w-4" />
										Generate
									</TabsTrigger>
									<TabsTrigger value="verifiers">
										<Users className="mr-1.5 h-4 w-4" />
										Verifiers ({selectedEvent.verifiers.length})
									</TabsTrigger>
									<TabsTrigger value="settings">
										<Settings className="mr-1.5 h-4 w-4" />
										Settings
									</TabsTrigger>
								</TabsList>

								{/* Tickets Tab */}
								<TabsContent value="tickets">
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => loadTickets(selectedEvent.id)}
													disabled={loadingTickets}
												>
													{loadingTickets ? (
														<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
													) : (
														<Search className="mr-1.5 h-4 w-4" />
													)}
													Load Tickets
												</Button>
												{selectedTicketIds.size > 0 && (
													<>
														<Button
															size="sm"
															variant="outline"
															onClick={handleResetScans}
														>
															<RotateCcw className="mr-1.5 h-4 w-4" />
															Reset Scan
														</Button>
														<Button
															size="sm"
															variant="destructive"
															onClick={handleDeleteTickets}
														>
															<Trash2 className="mr-1.5 h-4 w-4" />
															Delete ({selectedTicketIds.size})
														</Button>
													</>
												)}
											</div>
											<Button
												size="sm"
												variant="outline"
												onClick={handleExport}
												disabled={exporting}
											>
												{exporting ? (
													<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
												) : (
													<Download className="mr-1.5 h-4 w-4" />
												)}
												Export for Mail Merge
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={handleSync}
												disabled={syncing || !sheetSettings.spreadsheetId}
												title={!sheetSettings.spreadsheetId ? "Configure Google Sheets in Settings tab first" : "Sync tickets to Google Sheets (append-only)"}
											>
												{syncing ? (
													<Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
												) : (
													<Sheet className="mr-1.5 h-4 w-4" />
												)}
												Sync to GSheet
											</Button>
										</div>

										{tickets.length > 0 ? (
											<div className="max-h-[500px] overflow-auto rounded-md border">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className="w-10">
																<input
																	type="checkbox"
																	checked={selectedTicketIds.size === tickets.length && tickets.length > 0}
																	onChange={toggleAllTickets}
																	className="rounded"
																/>
															</TableHead>
															<TableHead>Code</TableHead>
															<TableHead>Email</TableHead>
															<TableHead>Status</TableHead>
															<TableHead>Scanned</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{tickets.map((ticket) => (
															<TableRow key={ticket.id}>
																<TableCell>
																	<input
																		type="checkbox"
																		checked={selectedTicketIds.has(ticket.id)}
																		onChange={() => toggleTicketSelection(ticket.id)}
																		className="rounded"
																	/>
																</TableCell>
																<TableCell>
																	<code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
																		{ticket.shortCode}
																	</code>
																</TableCell>
																<TableCell className="max-w-[200px] truncate text-sm">
																	{ticket.email}
																</TableCell>
																<TableCell>
																	{ticket.scanned ? (
																		<Badge variant="secondary" className="bg-green-100 text-green-800">
																			<CheckCircle2 className="mr-1 h-3 w-3" />
																			Scanned
																		</Badge>
																	) : (
																		<Badge variant="outline">Unused</Badge>
																	)}
																</TableCell>
																<TableCell className="text-muted-foreground text-xs">
																	{ticket.scanned && ticket.scannedAt ? (
																		<div>
																			<div>{new Date(ticket.scannedAt).toLocaleString()}</div>
																			{ticket.scannedBy && (
																				<div className="text-muted-foreground">
																					by {ticket.scannedBy.name || ticket.scannedBy.email}
																				</div>
																			)}
																		</div>
																	) : (
																		"—"
																	)}
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										) : loadingTickets ? (
											<div className="text-muted-foreground flex items-center justify-center py-8">
												<Loader2 className="mr-2 h-5 w-5 animate-spin" />
												Loading tickets...
											</div>
										) : (
											<p className="text-muted-foreground py-8 text-center text-sm">
												Click &quot;Load Tickets&quot; to view tickets, or switch to the Generate
												tab to create new ones.
											</p>
										)}
									</div>
								</TabsContent>

								{/* Generate Tab */}
								<TabsContent value="generate">
									<div className="space-y-4">
										<div>
											<Label htmlFor="csv-input" className="mb-1.5 block">
												Email List
											</Label>
											<p className="text-muted-foreground mb-2 text-xs">
												Enter one entry per line: <code>email, count</code>. Count defaults to 1
												if omitted.
											</p>
											<Textarea
												id="csv-input"
												placeholder={`alice@example.com, 2\nbob@example.com, 1\ncarol@example.com, 3`}
												value={csvText}
												onChange={(e) => setCsvText(e.target.value)}
												rows={8}
												className="font-mono text-sm"
											/>
										</div>
										<Button onClick={handleGenerate} disabled={generating || !csvText.trim()}>
											{generating ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Ticket className="mr-2 h-4 w-4" />
											)}
											Generate Tickets
										</Button>
									</div>
								</TabsContent>

								{/* Verifiers Tab */}
								<TabsContent value="verifiers">
									<div className="space-y-4">
										{/* Search & Add */}
										<div>
											<Label className="mb-1.5 block">Add Verifier</Label>
											<div className="relative">
												<Input
													placeholder="Search by name or email..."
													value={userSearch}
													onChange={(e) => handleSearchUsers(e.target.value)}
												/>
												{searchingUsers && (
													<Loader2 className="text-muted-foreground absolute top-2.5 right-3 h-4 w-4 animate-spin" />
												)}
											</div>
											{userResults.length > 0 && (
												<div className="mt-1 max-h-40 overflow-auto rounded-md border">
													{userResults
														.filter(
															(u) =>
																!selectedEvent.verifiers.some((v) => v.userId === u.id),
														)
														.map((user) => (
															<div
																key={user.id}
																className="hover:bg-muted/50 flex cursor-pointer items-center justify-between px-3 py-2 text-sm"
																onClick={() => handleAddVerifier(user.id)}
															>
																<div>
																	<span className="font-medium">{user.name || "—"}</span>
																	<span className="text-muted-foreground ml-2 text-xs">
																		{user.email}
																	</span>
																</div>
																<Plus className="h-4 w-4" />
															</div>
														))}
												</div>
											)}
										</div>

										{/* Current Verifiers */}
										<div>
											<Label className="mb-1.5 block">
												Current Verifiers ({selectedEvent.verifiers.length})
											</Label>
											{selectedEvent.verifiers.length === 0 ? (
												<p className="text-muted-foreground text-sm">
													No verifiers assigned yet. Search above to add one.
												</p>
											) : (
												<div className="space-y-1">
													{selectedEvent.verifiers.map((v) => (
														<div
															key={v.userId}
															className="flex items-center justify-between rounded-md border px-3 py-2"
														>
															<div className="text-sm">
																<span className="font-medium">{v.name || "—"}</span>
																<span className="text-muted-foreground ml-2 text-xs">
																	{v.email}
																</span>
															</div>
															<Button
																size="icon"
																variant="ghost"
																className="h-7 w-7 text-red-500"
																onClick={() => handleRemoveVerifier(v.userId)}
															>
																<Trash2 className="h-3.5 w-3.5" />
															</Button>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								</TabsContent>

								{/* Settings Tab */}
								<TabsContent value="settings">
									<div className="space-y-4">
										<div>
											<h3 className="mb-1 text-sm font-medium">Google Sheets Sync</h3>
											<p className="text-muted-foreground mb-3 text-xs">
												Sync tickets to a Google Sheet. Uses append-only mode — new tickets are added without clearing existing data, so no flickering.
											</p>
										</div>
										<div>
											<Label htmlFor="sheet-id">Spreadsheet ID *</Label>
											<Input
												id="sheet-id"
												placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
												value={sheetSettings.spreadsheetId}
												onChange={(e) =>
													setSheetSettings((s) => ({ ...s, spreadsheetId: e.target.value }))
												}
											/>
											<p className="text-muted-foreground mt-1 text-xs">
												The ID from the spreadsheet URL: docs.google.com/spreadsheets/d/<strong>THIS_PART</strong>/edit
											</p>
										</div>
										<div>
											<Label htmlFor="sheet-name">Sheet Name</Label>
											<Input
												id="sheet-name"
												placeholder="Tickets"
												value={sheetSettings.sheetName}
												onChange={(e) =>
													setSheetSettings((s) => ({ ...s, sheetName: e.target.value }))
												}
											/>
											<p className="text-muted-foreground mt-1 text-xs">
												The tab name at the bottom of the spreadsheet. Defaults to &quot;Tickets&quot;.
											</p>
										</div>
										<div className="flex gap-2">
											<Button onClick={handleSaveSettings} disabled={savingSettings || !sheetSettings.spreadsheetId.trim()}>
												{savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
												Save Settings
											</Button>
											<Button
												variant="outline"
												onClick={handleSync}
												disabled={syncing || !sheetSettings.spreadsheetId.trim()}
											>
												{syncing ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<RefreshCw className="mr-2 h-4 w-4" />
												)}
												Sync Now
											</Button>
										</div>
										<div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
											<strong>Setup:</strong> Make sure you share the spreadsheet with the Google service account email (Editor access). The service account credentials must be set in the <code>GOOGLE_SHEETS_CREDENTIALS</code> environment variable.
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-16">
							<Ticket className="text-muted-foreground mb-3 h-12 w-12" />
							<p className="text-muted-foreground text-sm">
								{events.length === 0
									? "Create a ticket event to get started"
									: "Select an event from the left"}
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Create/Edit Event Dialog */}
			<Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingEvent ? "Edit Event" : "Create Ticket Event"}</DialogTitle>
						<DialogDescription>
							{editingEvent
								? "Update the ticket event details."
								: "Create a new event for ticket generation."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="event-name">Name *</Label>
							<Input
								id="event-name"
								value={eventForm.name}
								onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))}
								placeholder="e.g., ARSA Night 2026"
							/>
						</div>
						<div>
							<Label htmlFor="event-desc">Description</Label>
							<Textarea
								id="event-desc"
								value={eventForm.description}
								onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
								placeholder="Optional description"
								rows={3}
							/>
						</div>
						<div>
							<Label htmlFor="event-date">Event Date</Label>
							<Input
								id="event-date"
								type="date"
								value={eventForm.date}
								onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								checked={eventForm.isActive}
								onCheckedChange={(checked) => setEventForm((f) => ({ ...f, isActive: checked }))}
							/>
							<Label>Active</Label>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setShowEventDialog(false)}>
								Cancel
							</Button>
							<Button onClick={handleSaveEvent} disabled={savingEvent}>
								{savingEvent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{editingEvent ? "Update" : "Create"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Ticket Event?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the event and all its tickets. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteEvent}
							disabled={deletingEvent}
							className="bg-red-500 hover:bg-red-600"
						>
							{deletingEvent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
