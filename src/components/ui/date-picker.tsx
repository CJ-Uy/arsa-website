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
	className,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);

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
						if (minDate && date < minDate) return true;
						if (maxDate && date > maxDate) return true;
						return false;
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
