"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
	value?: Date;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	minDate?: Date;
	maxDate?: Date;
	disabledDates?: Date[]; // Array of specific dates to disable
	className?: string;
}

// Format date in Philippine timezone
function formatDatePH(date: Date): string {
	return date.toLocaleDateString("en-PH", {
		timeZone: "Asia/Manila",
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Pick a date",
	disabled = false,
	minDate,
	maxDate,
	disabledDates,
	className,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);

	// Helper to normalize date to start of day for comparison
	const normalizeDate = React.useCallback((date: Date) => {
		const normalized = new Date(date);
		normalized.setHours(0, 0, 0, 0);
		return normalized;
	}, []);

	// Normalize min and max dates once
	const normalizedMinDate = React.useMemo(
		() => (minDate ? normalizeDate(minDate) : undefined),
		[minDate, normalizeDate],
	);

	const normalizedMaxDate = React.useMemo(
		() => (maxDate ? normalizeDate(maxDate) : undefined),
		[maxDate, normalizeDate],
	);

	// Helper to check if a date is in the disabled dates array
	const isDateDisabled = React.useCallback(
		(date: Date) => {
			if (!disabledDates || disabledDates.length === 0) return false;

			// Compare dates without time component
			const dateStr = date.toISOString().split("T")[0];
			return disabledDates.some(
				(disabledDate) => disabledDate.toISOString().split("T")[0] === dateStr,
			);
		},
		[disabledDates],
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						"w-full justify-start text-left font-normal",
						!value && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{value ? formatDatePH(value) : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={(date) => {
						onChange?.(date);
						setOpen(false);
					}}
					disabled={(date) => {
						// Normalize the date being checked
						const normalizedDate = normalizeDate(date);

						// Compare normalized dates (date-only comparison)
						if (normalizedMinDate && normalizedDate < normalizedMinDate) return true;
						if (normalizedMaxDate && normalizedDate > normalizedMaxDate) return true;
						if (isDateDisabled(date)) return true;
						return false;
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
