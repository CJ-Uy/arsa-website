"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { updateEventData } from "./actions";

type KeyValueEntry = {
	key: string;
	value: string;
};

type EditEventDataDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: string;
	initialEventData: Record<string, any> | null;
	onSave?: (updatedEventData: Record<string, any> | null) => void;
};

function serializeValue(value: any): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function parseValue(value: string): any {
	if (value === "") return "";
	try {
		const parsed = JSON.parse(value);
		if (typeof parsed === "object" || String(parsed) === value) {
			return parsed;
		}
	} catch {
		// Not valid JSON, keep as string
	}
	return value;
}

export function EditEventDataDialog({
	open,
	onOpenChange,
	orderId,
	initialEventData,
	onSave,
}: EditEventDataDialogProps) {
	const [entries, setEntries] = useState<KeyValueEntry[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open) {
			if (initialEventData && typeof initialEventData === "object") {
				setEntries(
					Object.entries(initialEventData).map(([key, value]) => ({
						key,
						value: serializeValue(value),
					})),
				);
			} else {
				setEntries([]);
			}
		}
	}, [open, initialEventData]);

	const addEntry = () => {
		setEntries([...entries, { key: "", value: "" }]);
	};

	const removeEntry = (index: number) => {
		setEntries(entries.filter((_, i) => i !== index));
	};

	const updateEntry = (index: number, field: "key" | "value", newValue: string) => {
		setEntries(entries.map((entry, i) => (i === index ? { ...entry, [field]: newValue } : entry)));
	};

	const duplicateKeys = (() => {
		const seen = new Set<string>();
		const dupes = new Set<string>();
		entries.forEach(({ key }) => {
			const trimmed = key.trim();
			if (trimmed === "") return;
			if (seen.has(trimmed)) dupes.add(trimmed);
			seen.add(trimmed);
		});
		return dupes;
	})();

	const hasEmptyKeys = entries.some((e) => e.key.trim() === "");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);

		const eventDataObj: Record<string, any> = {};
		entries.forEach(({ key, value }) => {
			eventDataObj[key.trim()] = parseValue(value);
		});

		const formData = new FormData();
		formData.append("orderId", orderId);
		formData.append("eventData", entries.length === 0 ? "" : JSON.stringify(eventDataObj));

		const result = await updateEventData(formData);

		if (result.success) {
			toast.success("Event data updated successfully!");
			onSave?.(entries.length === 0 ? null : eventDataObj);
			onOpenChange(false);
		} else {
			toast.error(result.message || "Failed to update event data.");
		}
		setIsSaving(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Event Data</DialogTitle>
					<DialogDescription>
						View, edit, and add key-value pairs for this order's event data.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4 py-4">
					{entries.length > 0 && (
						<div className="grid grid-cols-[1fr_2fr_auto] gap-2">
							<Label className="text-muted-foreground text-xs font-medium">Key</Label>
							<Label className="text-muted-foreground text-xs font-medium">Value</Label>
							<span />
						</div>
					)}

					<div className="grid gap-2">
						{entries.map((entry, index) => (
							<div key={index} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
								<Input
									value={entry.key}
									onChange={(e) => updateEntry(index, "key", e.target.value)}
									placeholder="key"
									className={`font-mono text-sm ${duplicateKeys.has(entry.key.trim()) ? "border-destructive" : ""}`}
								/>
								<Input
									value={entry.value}
									onChange={(e) => updateEntry(index, "value", e.target.value)}
									placeholder="value"
									className="font-mono text-sm"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeEntry(index)}
									className="text-destructive hover:text-destructive"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>

					<Button
						type="button"
						variant="outline"
						onClick={addEntry}
						className="w-full border-dashed"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Entry
					</Button>

					{duplicateKeys.size > 0 && (
						<p className="text-destructive text-sm">
							Duplicate keys detected. Each key must be unique.
						</p>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSaving || duplicateKeys.size > 0 || hasEmptyKeys}>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
