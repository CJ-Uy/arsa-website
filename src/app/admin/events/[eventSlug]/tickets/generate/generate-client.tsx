"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Loader2, Download, RefreshCw, Trash2 } from "lucide-react";
import {
	generateTickets,
	exportTicketsCsv,
	syncEventTicketsToSheet,
	deleteEventTickets,
	resetEventTicketScans,
} from "../../actions";

type Ticket = {
	id: string;
	shortCode: string;
	email: string;
	scanned: boolean;
	scannedAt: Date | null;
	createdAt: Date | null;
	scannedBy?: { name: string | null; email: string } | null;
};

type GenerateClientProps = {
	eventId: string;
	eventSlug: string;
	tickets: Ticket[];
};

export function GenerateClient({ eventId, eventSlug, tickets: initialTickets }: GenerateClientProps) {
	const router = useRouter();
	const [csvText, setCsvText] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isSyncing, startSyncTransition] = useTransition();
	const [isExporting, setIsExporting] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	function toggleSelect(id: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function toggleAll() {
		if (selectedIds.size === initialTickets.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(initialTickets.map((t) => t.id)));
		}
	}

	function handleGenerate() {
		if (!csvText.trim()) {
			toast.error("Please enter at least one email address");
			return;
		}
		startTransition(async () => {
			try {
				const result = await generateTickets(eventId, csvText);
				if (result.success) {
					toast.success(result.message);
					setCsvText("");
					router.refresh();
				} else {
					toast.error(result.message ?? "Failed to generate tickets");
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Failed to generate tickets");
			}
		});
	}

	async function handleExport() {
		setIsExporting(true);
		try {
			const result = await exportTicketsCsv(eventId);
			if (!result.success || !result.data || result.data.length === 0) {
				toast.error(result.message ?? "No tickets to export");
				return;
			}
			const headers = ["email", "shortCode", "qrImageUrl", "verifyUrl"];
			const rows = result.data.map((r) =>
				[r.email, r.shortCode, r.qrImageUrl, r.verifyUrl]
					.map((v) => `"${v.replace(/"/g, '""')}"`)
					.join(","),
			);
			const csv = [headers.join(","), ...rows].join("\n");
			const blob = new Blob([csv], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `tickets-${eventId}.csv`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success(`Exported ${result.data.length} tickets`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Export failed");
		} finally {
			setIsExporting(false);
		}
	}

	function handleSyncSheet() {
		startSyncTransition(async () => {
			try {
				const result = await syncEventTicketsToSheet(eventId);
				if (result.success) {
					toast.success("Synced to Google Sheets");
				} else {
					toast.error(result.message ?? "Sync failed");
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Sync failed");
			}
		});
	}

	async function handleDelete() {
		if (selectedIds.size === 0) return;
		try {
			const result = await deleteEventTickets(eventId, Array.from(selectedIds));
			if (result.success) {
				toast.success(result.message);
				setSelectedIds(new Set());
				router.refresh();
			} else {
				toast.error(result.message ?? "Failed to delete tickets");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to delete tickets");
		}
	}

	async function handleResetScans() {
		if (selectedIds.size === 0) return;
		try {
			const result = await resetEventTicketScans(eventId, Array.from(selectedIds));
			if (result.success) {
				toast.success(result.message);
				setSelectedIds(new Set());
				router.refresh();
			} else {
				toast.error(result.message ?? "Failed to reset scans");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to reset scans");
		}
	}

	return (
		<div className="space-y-6">
			{/* Bulk generate */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Bulk Generate</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="csvInput">Email list</Label>
						<Textarea
							id="csvInput"
							value={csvText}
							onChange={(e) => setCsvText(e.target.value)}
							placeholder={"juan@example.com, 2\nmaria@example.com\nanna@example.com, 3"}
							rows={6}
							className="font-mono text-sm"
						/>
						<p className="text-xs text-muted-foreground">
							One entry per line: <code>email, count</code>. Count defaults to 1 if omitted.
							Max 50 per email.
						</p>
					</div>
					<Button onClick={handleGenerate} disabled={isPending}>
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Generate tickets
					</Button>
				</CardContent>
			</Card>

			{/* Ticket list */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm uppercase tracking-wider">
							Tickets{" "}
							<span className="text-muted-foreground font-normal normal-case tracking-normal">
								({initialTickets.length})
							</span>
						</CardTitle>
						<div className="flex items-center gap-2">
							{selectedIds.size > 0 && (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={handleResetScans}
									>
										<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
										Reset scans ({selectedIds.size})
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={handleDelete}
									>
										<Trash2 className="mr-1.5 h-3.5 w-3.5" />
										Delete ({selectedIds.size})
									</Button>
								</>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={handleExport}
								disabled={isExporting || initialTickets.length === 0}
							>
								{isExporting ? (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								) : (
									<Download className="mr-1.5 h-3.5 w-3.5" />
								)}
								Export for Mail Merge
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleSyncSheet}
								disabled={isSyncing || initialTickets.length === 0}
							>
								{isSyncing ? (
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								) : (
									<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
								)}
								Sync to Sheet
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{initialTickets.length === 0 ? (
						<p className="text-sm text-muted-foreground px-6 py-8 text-center">
							No tickets generated yet. Use the form above to create tickets.
						</p>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-10">
											<input
												type="checkbox"
												checked={selectedIds.size === initialTickets.length && initialTickets.length > 0}
												onChange={toggleAll}
												className="h-4 w-4 rounded border-border"
											/>
										</TableHead>
										<TableHead>Code</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Created</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{initialTickets.map((t) => (
										<TableRow key={t.id}>
											<TableCell>
												<input
													type="checkbox"
													checked={selectedIds.has(t.id)}
													onChange={() => toggleSelect(t.id)}
													className="h-4 w-4 rounded border-border"
												/>
											</TableCell>
											<TableCell>
												<code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
													{t.shortCode}
												</code>
											</TableCell>
											<TableCell className="text-sm">{t.email}</TableCell>
											<TableCell>
												{t.scanned ? (
													<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
														Scanned
													</Badge>
												) : (
													<Badge variant="secondary">Unscanned</Badge>
												)}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{t.createdAt
													? new Date(t.createdAt).toLocaleDateString()
													: "—"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
