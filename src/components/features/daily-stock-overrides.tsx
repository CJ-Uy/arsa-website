"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Info, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";

type DailyStockOverride = {
	date: string; // YYYY-MM-DD
	maxOrders: number | null; // null = blocked
};

type DailyStockOverridesProps = {
	overrides: Record<string, number | null>;
	onChange: (overrides: Record<string, number | null>) => void;
};

export function DailyStockOverrides({ overrides, onChange }: DailyStockOverridesProps) {
	const [newDate, setNewDate] = useState<Date | undefined>(undefined);
	const [newMaxOrders, setNewMaxOrders] = useState("");
	const [isBlocked, setIsBlocked] = useState(false);

	// Convert overrides object to array for display
	const overridesList: DailyStockOverride[] = Object.entries(overrides || {})
		.map(([date, maxOrders]) => ({ date, maxOrders }))
		.sort((a, b) => a.date.localeCompare(b.date));

	const handleAdd = () => {
		if (!newDate) {
			return;
		}

		// Convert Date to YYYY-MM-DD string
		const dateString = newDate.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

		const newOverrides = { ...overrides };
		newOverrides[dateString] = isBlocked ? null : parseInt(newMaxOrders) || 0;

		onChange(newOverrides);
		setNewDate(undefined);
		setNewMaxOrders("");
		setIsBlocked(false);
	};

	const handleDelete = (date: string) => {
		const newOverrides = { ...overrides };
		delete newOverrides[date];
		onChange(newOverrides);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString + "T00:00:00");
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="space-y-4">
			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription>
					<strong>Date Overrides:</strong> Set custom limits or block specific dates. If no override
					is set, the default max orders per day will apply. Set a date to "Blocked" to prevent any
					orders on that date.
				</AlertDescription>
			</Alert>

			{/* Add Override Form */}
			<div className="bg-muted rounded-lg p-4">
				<h4 className="mb-3 text-sm font-medium">Add Date Override</h4>
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="space-y-2">
						<Label htmlFor="override-date" className="text-xs">
							Date
						</Label>
						<DatePicker
							value={newDate}
							onChange={(date) => setNewDate(date)}
							placeholder="Select date"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="override-max" className="text-xs">
							Max Orders
						</Label>
						<Input
							id="override-max"
							type="number"
							min="0"
							placeholder="e.g., 100"
							value={newMaxOrders}
							onChange={(e) => setNewMaxOrders(e.target.value)}
							disabled={isBlocked}
						/>
					</div>

					<div className="flex items-end gap-2">
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="override-blocked"
								checked={isBlocked}
								onChange={(e) => {
									setIsBlocked(e.target.checked);
									if (e.target.checked) {
										setNewMaxOrders("");
									}
								}}
								className="h-4 w-4 rounded border-gray-300"
							/>
							<Label htmlFor="override-blocked" className="text-xs">
								Block Date
							</Label>
						</div>
						<Button onClick={handleAdd} disabled={!newDate} size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Add
						</Button>
					</div>
				</div>
			</div>

			{/* Overrides Table */}
			{overridesList.length > 0 ? (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Max Orders</TableHead>
								<TableHead className="w-20">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{overridesList.map((override) => (
								<TableRow key={override.date}>
									<TableCell className="font-medium">{formatDate(override.date)}</TableCell>
									<TableCell>
										{override.maxOrders === null ? (
											<Badge variant="destructive" className="gap-1">
												<Ban className="h-3 w-3" />
												Blocked
											</Badge>
										) : (
											<Badge variant="secondary">{override.maxOrders} orders</Badge>
										)}
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" onClick={() => handleDelete(override.date)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			) : (
				<div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
					No date overrides set. The default max orders per day will apply to all dates.
				</div>
			)}
		</div>
	);
}
