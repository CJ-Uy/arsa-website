"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
	value?: string; // "HH:mm" format
	onChange?: (time: string) => void;
	onComplete?: (time: string) => void; // Called when full time is selected (minute picked)
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	minuteStep?: number; // 5, 15, 30, etc.
	minTime?: string; // "HH:mm" format - minimum allowed time
	maxTime?: string; // "HH:mm" format - maximum allowed time
}

export function TimePicker({
	value,
	onChange,
	onComplete,
	placeholder = "Pick a time",
	disabled = false,
	className,
	minuteStep = 5,
	minTime,
	maxTime,
}: TimePickerProps) {
	const [open, setOpen] = React.useState(false);
	const firstValidHourRef = React.useRef<HTMLButtonElement>(null);

	// Parse current value
	const [selectedHour, selectedMinute] = React.useMemo(() => {
		if (!value) return [null, null];
		const [h, m] = value.split(":").map(Number);
		return [h, m];
	}, [value]);

	// Parse min and max times
	const [minHour, minMinute] = React.useMemo(() => {
		if (!minTime) return [null, null];
		const [h, m] = minTime.split(":").map(Number);
		return [h, m];
	}, [minTime]);

	const [maxHour, maxMinute] = React.useMemo(() => {
		if (!maxTime) return [null, null];
		const [h, m] = maxTime.split(":").map(Number);
		return [h, m];
	}, [maxTime]);

	// Helper to check if a time is disabled
	const isTimeDisabled = React.useCallback(
		(hour: number, minute: number) => {
			// Convert to total minutes for comparison
			const timeInMinutes = hour * 60 + minute;
			const minTimeInMinutes =
				minHour !== null && minMinute !== null ? minHour * 60 + minMinute : null;
			const maxTimeInMinutes =
				maxHour !== null && maxMinute !== null ? maxHour * 60 + maxMinute : null;

			if (minTimeInMinutes !== null && timeInMinutes < minTimeInMinutes) return true;
			if (maxTimeInMinutes !== null && timeInMinutes > maxTimeInMinutes) return true;
			return false;
		},
		[minHour, minMinute, maxHour, maxMinute],
	);

	// Generate hours (0-23)
	const hours = Array.from({ length: 24 }, (_, i) => i);

	// Generate minutes based on step
	const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);

	// Format time for display
	const formatTimeDisplay = (time: string | undefined) => {
		if (!time) return null;
		const [h, m] = time.split(":").map(Number);
		const hour12 = h % 12 || 12;
		const ampm = h < 12 ? "AM" : "PM";
		return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
	};

	const handleHourSelect = (hour: number) => {
		const minute = selectedMinute ?? 0;
		onChange?.(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
	};

	const handleMinuteSelect = (minute: number) => {
		const hour = selectedHour ?? 9; // Default to 9 AM
		const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
		onChange?.(time);
		onComplete?.(time); // Notify that full time is selected
		setOpen(false);
	};

	// Find first valid hour for auto-scrolling
	const firstValidHour = React.useMemo(() => {
		for (const hour of hours) {
			const hasValidMinutes = minutes.some((minute) => !isTimeDisabled(hour, minute));
			if (hasValidMinutes) return hour;
		}
		return 0;
	}, [hours, minutes, isTimeDisabled]);

	// Auto-scroll to first valid hour when popover opens
	React.useEffect(() => {
		if (open && firstValidHourRef.current) {
			// Small delay to ensure popover is fully rendered
			setTimeout(() => {
				firstValidHourRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
			}, 0);
		}
	}, [open]);

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
					<Clock className="mr-2 h-4 w-4" />
					{value ? formatTimeDisplay(value) : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="flex">
					{/* Hours column */}
					<div className="w-20 border-r">
						<div className="bg-muted/50 border-b px-3 py-2 text-center text-xs font-medium">
							Hour
						</div>
						<ScrollArea className="h-[200px]">
							<div className="p-1">
								{hours.map((hour) => {
									const hour12 = hour % 12 || 12;
									const ampm = hour < 12 ? "AM" : "PM";
									// Check if this hour has any valid minutes
									const hasValidMinutes = minutes.some((minute) => !isTimeDisabled(hour, minute));
									const isFirstValid = hour === firstValidHour;
									return (
										<Button
											key={hour}
											ref={isFirstValid ? firstValidHourRef : undefined}
											variant={selectedHour === hour ? "default" : "ghost"}
											size="sm"
											className="w-full justify-center text-xs"
											onClick={() => handleHourSelect(hour)}
											disabled={!hasValidMinutes}
										>
											{hour12} {ampm}
										</Button>
									);
								})}
							</div>
						</ScrollArea>
					</div>

					{/* Minutes column */}
					<div className="w-16">
						<div className="bg-muted/50 border-b px-3 py-2 text-center text-xs font-medium">
							Min
						</div>
						<ScrollArea className="h-[200px]">
							<div className="p-1">
								{minutes.map((minute) => {
									const hour = selectedHour ?? 9; // Use selected hour or default
									const disabled = isTimeDisabled(hour, minute);
									return (
										<Button
											key={minute}
											variant={selectedMinute === minute ? "default" : "ghost"}
											size="sm"
											className="w-full justify-center text-xs"
											onClick={() => handleMinuteSelect(minute)}
											disabled={disabled}
										>
											:{minute.toString().padStart(2, "0")}
										</Button>
									);
								})}
							</div>
						</ScrollArea>
					</div>
				</div>

				{/* Quick select buttons */}
				<div className="border-t p-2">
					<div className="flex flex-wrap gap-1">
						{[
							{ label: "9 AM", value: "09:00" },
							{ label: "12 PM", value: "12:00" },
							{ label: "3 PM", value: "15:00" },
							{ label: "6 PM", value: "18:00" },
						]
							.filter((preset) => {
								const [h, m] = preset.value.split(":").map(Number);
								return !isTimeDisabled(h, m);
							})
							.map((preset) => (
								<Button
									key={preset.value}
									variant="outline"
									size="sm"
									className="flex-1 text-xs"
									onClick={() => {
										onChange?.(preset.value);
										onComplete?.(preset.value);
										setOpen(false);
									}}
								>
									{preset.label}
								</Button>
							))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
