"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Ticket, Users, Loader2 } from "lucide-react";
import { saveTicketConfig, toggleModule } from "../actions";

type TicketsRow = {
	enabled: boolean;
	sheetSyncEnabled: boolean;
};

type TicketsOverviewProps = {
	eventId: string;
	eventSlug: string;
	ticketsRow: TicketsRow;
	ticketCount: number;
};

export function TicketsOverview({
	eventId,
	eventSlug,
	ticketsRow,
	ticketCount,
}: TicketsOverviewProps) {
	const [sheetSyncEnabled, setSheetSyncEnabled] = useState(ticketsRow.sheetSyncEnabled);
	const [savingSheet, setSavingSheet] = useState(false);
	const [togglingModule, setTogglingModule] = useState(false);
	const [enabled, setEnabled] = useState(ticketsRow.enabled);

	async function handleToggleModule(next: boolean) {
		setTogglingModule(true);
		try {
			await toggleModule(eventId, "tickets", next);
			setEnabled(next);
			toast.success(next ? "Tickets module enabled" : "Tickets module paused");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to toggle module");
		} finally {
			setTogglingModule(false);
		}
	}

	async function handleSheetSyncToggle(next: boolean) {
		setSavingSheet(true);
		try {
			await saveTicketConfig(eventId, { sheetSyncEnabled: next });
			setSheetSyncEnabled(next);
			toast.success(next ? "Sheet sync enabled" : "Sheet sync disabled");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save config");
		} finally {
			setSavingSheet(false);
		}
	}

	return (
		<div className="space-y-6">
			{/* Module status */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Module Status</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{enabled ? (
								<Badge className="bg-[#f7bc37] text-[#0e3663]">LIVE</Badge>
							) : (
								<Badge variant="secondary">PAUSED</Badge>
							)}
							<span className="text-sm text-muted-foreground">
								{enabled
									? "Tickets module is live."
									: "Tickets module is paused. Toggle to make it live."}
							</span>
						</div>
						<div className="flex items-center gap-2">
							{togglingModule && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
							<Switch
								checked={enabled}
								onCheckedChange={handleToggleModule}
								disabled={togglingModule}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Link href={`/admin/events/${eventSlug}/tickets/generate`} className="block">
					<Card className="hover:shadow-md transition cursor-pointer">
						<CardHeader className="flex flex-row items-center gap-2 pb-2">
							<Ticket className="h-4 w-4 text-[#a2250f]" />
							<CardTitle className="text-sm uppercase tracking-wider">Tickets</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">{ticketCount}</p>
							<p className="text-xs text-muted-foreground mt-0.5">generated — click to manage</p>
						</CardContent>
					</Card>
				</Link>

				<Link href={`/admin/events/${eventSlug}/tickets/verifiers`} className="block">
					<Card className="hover:shadow-md transition cursor-pointer">
						<CardHeader className="flex flex-row items-center gap-2 pb-2">
							<Users className="h-4 w-4 text-[#a2250f]" />
							<CardTitle className="text-sm uppercase tracking-wider">Verifiers</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">Manage who can scan tickets</p>
							<Button variant="link" className="p-0 h-auto text-xs mt-1" asChild>
								<span>Go to verifiers →</span>
							</Button>
						</CardContent>
					</Card>
				</Link>
			</div>

			{/* Sheet sync */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Google Sheets Sync</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="sheetSync">Enable sheet sync</Label>
							<p className="text-xs text-muted-foreground">
								Automatically sync tickets and scan status to Google Sheets.
							</p>
						</div>
						<div className="flex items-center gap-2">
							{savingSheet && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
							<Switch
								id="sheetSync"
								checked={sheetSyncEnabled}
								onCheckedChange={handleSheetSyncToggle}
								disabled={savingSheet}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
